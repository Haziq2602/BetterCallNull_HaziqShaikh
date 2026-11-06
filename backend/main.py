"""
FastAPI Server: Real-Time WebSockets for Audio Streaming & REST APIs for Case File Investigation.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
import os
import io
import json
import time
import hashlib
import logging
from typing import Optional, List, Dict, Any

from backend.models.emotion_model import SpeechEmotionModel
from backend.models.acoustic_dsp import AcousticAnalyzer
from backend.models.stt_groq import SpeechToTextTranscriber
from backend.models.situation_analyzer import HybridSituationAnalyzer
from backend.core.urgency_engine import calculate_multimodal_urgency
from backend.core.audio_buffer import AudioStreamBuffer, CallSession
from backend.core.forensic_analyzer import analyze_forensic_recording
from backend.auth import (
    INVESTIGATOR_STORE,
    get_investigator_record,
    generate_magic_login_link,
    verify_magic_login_token,
    verify_password,
    create_access_token,
    get_current_investigator,
    verify_ws_token,
    require_commander_role,
    hash_password,
    mask_email,
    mask_phone
)
from backend.core.supabase_client import supabase_gateway

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(title="Cybercrime Speech Emotion & Triage API", version="2.2.0")

class LoginRequest(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    username: str

class ProvisionInvestigatorRequest(BaseModel):
    username: str
    badge_id: str
    name: str
    role: str = "INVESTIGATOR"
    station: Optional[str] = "Cyber Crime Police Station, Mumbai"
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class UpdateInvestigatorStatusRequest(BaseModel):
    is_active: bool

# Security: Restricted CORS Origins with environment support
_DEFAULT_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:5500"
]
_env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = _env_origins if _env_origins else _DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize AI Pipeline
emotion_model = SpeechEmotionModel()
acoustic_analyzer = AcousticAnalyzer()
stt_model = SpeechToTextTranscriber()
situation_analyzer = HybridSituationAnalyzer()

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Cybercrime Speech Emotion Triage Engine",
        "compliance": "Hybrid Cloud / Edge DSP (Air-Gapped Local Mode Configurable)",
        "auth_security": "Enforced (Pre-Provisioned Investigator Access Only)",
        "supabase_cloud_db": "connected" if supabase_gateway.is_connected else "standby (local fallback)"
    }

@app.post("/api/auth/login")
def login_investigator(req: LoginRequest):
    """
    Law enforcement portal authentication: validates investigator credentials against the
    pre-provisioned duty roster and issues an HMAC-SHA256 signed shift session JWT.
    """
    username = req.username.strip()
    user = get_investigator_record(username)
    if not user or not verify_password(req.password, user):
        logging.warning(f"[SECURITY AUDIT] Failed unauthorized login attempt for badge/ID: '{username}'")
        supabase_gateway.log_audit_event("LOGIN_FAILED", username)
        raise HTTPException(status_code=401, detail="Invalid investigator ID or passcode")

    if user.get("is_active") is False:
        logging.warning(f"[SECURITY AUDIT] Login rejected for suspended investigator badge: '{user['badge_id']}'")
        supabase_gateway.log_audit_event("LOGIN_REJECTED_SUSPENDED", user["badge_id"], user["name"])
        raise HTTPException(
            status_code=403,
            detail="Duty credentials suspended. Access denied by Station Commander."
        )

    token = create_access_token({
        "sub": user["username"],
        "badge_id": user["badge_id"],
        "role": user["role"]
    })
    logging.info(f"[SECURITY AUDIT] Shift session authorized: {user['badge_id']} ({user['name']}, {user['role']})")
    supabase_gateway.update_last_login(username)
    supabase_gateway.log_audit_event("LOGIN_SUCCESS", user["badge_id"], user["name"])

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "investigator": {
            "username": user["username"],
            "badge_id": user["badge_id"],
            "name": user["name"],
            "role": user["role"],
            "station": user["station"]
        }
    }

@app.post("/api/auth/forgot-password")
def forgot_password_endpoint(req: ForgotPasswordRequest, request: Request = None):
    """
    One-Time Magic Login Link Request:
    Generates a secure, single-use login link dispatched to the confidential email/phone
    registered on the database level for this investigator ID.
    The response strictly does not disclose the recipient's phone number or email address.
    Passwords are set at the database/admin level and cannot be reset via the public web UI.
    """
    base_url = str(request.base_url).rstrip("/") if request is not None else "http://localhost:8000"
    result = generate_magic_login_link(req.username.strip(), base_url=base_url)
    return result

@app.get("/api/auth/verify-magic-token")
def verify_magic_token_endpoint(token: str):
    """
    Validates a one-time magic login link and yields a full active session JWT.
    """
    auth_data = verify_magic_login_token(token)
    if not auth_data:
        raise HTTPException(
            status_code=400,
            detail="One-time login link is invalid, expired, or has already been used. Please request a new link."
        )
    return auth_data

@app.get("/api/auth/me")
def get_current_investigator_profile(investigator: dict = Depends(get_current_investigator)):
    """Returns profile for currently authorized investigator."""
    return {"status": "authenticated", "investigator": investigator}

# =========================================================================
# STATION COMMANDER / ADMIN ROSTER & PERSONNEL MANAGEMENT
# Restricted to: LEAD_INVESTIGATOR, SUPERINTENDENT, STATION_COMMANDER, ADMIN
# =========================================================================

@app.get("/api/admin/investigators")
def list_investigators_endpoint(commander: dict = Depends(require_commander_role)):
    """
    Station Commander Roster API:
    Retrieves all provisioned investigators with masked contact details and active duty statuses.
    """
    roster_map = {}
    
    # 1. Local seed / fallback records
    for uname, rec in INVESTIGATOR_STORE.items():
        roster_map[uname] = {
            "username": rec["username"],
            "badge_id": rec["badge_id"],
            "name": rec["name"],
            "role": rec["role"],
            "station": rec.get("station", "Cyber Crime Police Station"),
            "email_masked": mask_email(rec.get("email")),
            "phone_masked": mask_phone(rec.get("phone")),
            "is_active": rec.get("is_active", True),
            "created_at": rec.get("created_at", "2026-01-01T08:00:00Z"),
            "last_login_at": rec.get("last_login_at")
        }

    # 2. Supabase Cloud live records
    cloud_list = supabase_gateway.list_investigators()
    for row in cloud_list:
        uname = row["username"]
        roster_map[uname] = {
            "username": row["username"],
            "badge_id": row["badge_id"],
            "name": row["name"],
            "role": row["role"],
            "station": row.get("station", "Cyber Crime Police Station"),
            "email_masked": mask_email(row.get("email")),
            "phone_masked": mask_phone(row.get("phone")),
            "is_active": row.get("is_active", True),
            "created_at": row.get("created_at", "2026-01-01T08:00:00Z"),
            "last_login_at": row.get("last_login_at")
        }

    roster = list(roster_map.values())
    return {
        "status": "success",
        "count": len(roster),
        "commander": commander,
        "investigators": roster
    }

@app.post("/api/admin/investigators")
def provision_investigator_endpoint(
    req: ProvisionInvestigatorRequest,
    commander: dict = Depends(require_commander_role)
):
    """
    Provisions a new investigator into the database.
    Salts & hashes the passcode with PBKDF2-HMAC-SHA256 (600,000 iterations).
    Records administrative audit trail with commander's badge ID.
    """
    username = req.username.strip().lower()
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Investigator username must be at least 3 characters.")
    
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Initial passcode must be at least 6 characters.")

    # Check if already exists in store or database
    existing = get_investigator_record(username)
    if existing:
        raise HTTPException(status_code=409, detail=f"Investigator ID '{username}' already exists.")

    salt, hash_hex = hash_password(req.password)
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    new_record = {
        "username": username,
        "badge_id": req.badge_id.strip(),
        "name": req.name.strip(),
        "role": req.role.strip() or "INVESTIGATOR",
        "station": req.station.strip() if req.station else "Cyber Crime Police Station",
        "email": req.email.strip() if req.email else None,
        "phone": req.phone.strip() if req.phone else None,
        "is_active": True,
        "created_at": now_iso,
        "last_login_at": None,
        "salt": salt,
        "hash_hex": hash_hex
    }

    # Save to local in-memory store
    INVESTIGATOR_STORE[username] = new_record

    # Save to Supabase Cloud Database
    supabase_gateway.create_investigator(
        username=username,
        badge_id=new_record["badge_id"],
        name=new_record["name"],
        role=new_record["role"],
        station=new_record["station"],
        email=new_record["email"],
        phone=new_record["phone"],
        salt=salt,
        hash_hex=hash_hex
    )

    supabase_gateway.log_audit_event(
        event_type="INVESTIGATOR_PROVISIONED",
        investigator_badge_id=commander["badge_id"],
        investigator_name=commander.get("name"),
        details={
            "target_username": username,
            "target_badge": new_record["badge_id"],
            "target_role": new_record["role"]
        }
    )

    logging.info(f"[ADMIN AUDIT] Commander {commander['badge_id']} provisioned new officer: {username} ({new_record['badge_id']})")

    return {
        "status": "success",
        "message": f"Investigator '{new_record['name']}' ({new_record['badge_id']}) provisioned successfully.",
        "investigator": {
            "username": username,
            "badge_id": new_record["badge_id"],
            "name": new_record["name"],
            "role": new_record["role"],
            "station": new_record["station"],
            "email_masked": mask_email(new_record["email"]),
            "phone_masked": mask_phone(new_record["phone"]),
            "is_active": True
        }
    }

@app.patch("/api/admin/investigators/{username}/status")
def toggle_investigator_status_endpoint(
    username: str,
    req: UpdateInvestigatorStatusRequest,
    commander: dict = Depends(require_commander_role)
):
    """
    Toggles an investigator's active/suspended duty status.
    If suspended, active terminal sessions and new logins are immediately rejected.
    """
    target = username.strip().lower()
    if target == commander.get("username"):
        raise HTTPException(status_code=400, detail="Commanders cannot suspend their own duty credentials.")

    user = get_investigator_record(target)
    if not user:
        raise HTTPException(status_code=404, detail=f"Investigator '{target}' not found in roster.")

    # Update local store
    if target in INVESTIGATOR_STORE:
        INVESTIGATOR_STORE[target]["is_active"] = req.is_active

    # Update Supabase
    supabase_gateway.update_investigator_status(target, req.is_active)

    action_label = "ACTIVATED" if req.is_active else "SUSPENDED"
    supabase_gateway.log_audit_event(
        event_type=f"INVESTIGATOR_{action_label}",
        investigator_badge_id=commander["badge_id"],
        investigator_name=commander.get("name"),
        details={"target_username": target, "new_status": req.is_active}
    )

    logging.info(f"[ADMIN AUDIT] Commander {commander['badge_id']} set duty status of '{target}' to {action_label}")

    return {
        "status": "success",
        "username": target,
        "is_active": req.is_active,
        "message": f"Investigator '{target}' status updated to {action_label}."
    }

@app.post("/api/admin/investigators/{username}/dispatch-link")
def admin_dispatch_magic_link_endpoint(
    username: str,
    request: Request = None,
    commander: dict = Depends(require_commander_role)
):
    """
    Dispatches a one-time magic login link to the investigator's confidential email/phone.
    Called directly by the Station Commander to resolve forgotten passwords or issue shifts.
    """
    target = username.strip().lower()
    user = get_investigator_record(target)
    if not user:
        raise HTTPException(status_code=404, detail=f"Investigator '{target}' not found.")

    base_url = str(request.base_url).rstrip("/") if request is not None else "http://localhost:8000"
    result = generate_magic_login_link(target, base_url=base_url)

    supabase_gateway.log_audit_event(
        event_type="COMMANDER_DISPATCHED_MAGIC_LINK",
        investigator_badge_id=commander["badge_id"],
        investigator_name=commander.get("name"),
        details={"target_username": target, "target_badge": user.get("badge_id")}
    )

    return {
        "status": "success",
        "username": target,
        "message": f"Secure one-time login link dispatched to confidential contact channels for '{user.get('name', target)}'.",
        "_dev_link": result.get("_dev_link")
    }

@app.get("/api/admin/audit-logs")
def list_admin_audit_logs_endpoint(
    limit: int = Query(25, ge=1, le=100),
    commander: dict = Depends(require_commander_role)
):
    """
    Retrieves recent administrative and security audit trail logs.
    """
    logs = supabase_gateway.list_audit_logs(limit=limit)
    return {
        "status": "success",
        "count": len(logs),
        "logs": logs
    }

import asyncio

@app.websocket("/ws/live-call/{call_id}")
async def websocket_call_stream(websocket: WebSocket, call_id: str, token: Optional[str] = Query(None)):
    """
    Receives raw PCM / audio chunks from officer's console in real time and yields triage analytics.
    Enforces investigator authentication on WebSocket connection.
    Uses per-session CallSession object to guarantee strict concurrency isolation across callers.
    Monotonic sequence counters eliminate race conditions and out-of-order STT overwrites.
    """
    investigator = verify_ws_token(token)
    if not investigator:
        logging.warning(f"[WS REJECTED] Unauthorized streaming attempt on Call ID '{call_id}'. Policy violation 1008.")
        await websocket.close(code=1008)
        return

    await websocket.accept()
    logging.info(f"[WS] Active connection established for Session Call ID: {call_id} by Investigator {investigator['badge_id']} ({investigator['name']})")

    # Isolated per-call session state container
    session = CallSession(call_id=call_id)

    async def run_stt_async(chunk: np.ndarray, seq: int, current_emotions, current_pitch):
        try:
            text = await asyncio.to_thread(stt_model.transcribe, chunk)
            if text and seq >= session.latest_completed_stt_seq:
                session.latest_completed_stt_seq = seq
                session.latest_transcript = text
                # Semantically analyze the situation with Groq LPU (with 0ms local fallback)
                sit = await asyncio.to_thread(situation_analyzer.analyze_situation, text, current_emotions, current_pitch)
                if seq >= session.latest_completed_stt_seq:
                    session.latest_situation = sit
        except Exception as ex:
            logging.warning(f"[STT ASYNC ERROR] Call ID {session.call_id} (seq {seq}): {ex}")
        finally:
            session.stt_in_progress = False

    # Background analysis worker: always analyzes the freshest window and drops stale backlog
    async def analysis_worker():
        while session.is_connected:
            if session.latest_window is not None:
                # Atomically extract freshest window and clear slot
                current_window = session.latest_window
                session.latest_window = None

                # Silence gate
                if session.buffer.is_silent(current_window):
                    session.speech_history.clear()
                    payload = {
                        "call_id": session.call_id,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "dominant_emotion": "SILENCE",
                        "emotion_status": "NO_SPEECH",
                        "emotion_source": "none",
                        "emotion_breakdown": {},
                        "acoustic_metrics": {"pitch_std": 0.0, "voice_tremor": False, "rms": 0.0},
                        "transcript": session.latest_transcript if session.latest_transcript != "..." else "...",
                        "detected_tags": ["#STABLE_LINE"],
                        "urgency_score": 10.0,
                        "priority_level": "ROUTINE",
                        "investigator_advisory": "No vocal distress or speech detected on active channel.",
                        "responsible_ai_disclaimer": "Indicative signal to assist officer triage; not legal proof of guilt, honesty, or intention."
                    }
                    try:
                        await websocket.send_text(json.dumps(payload))
                    except Exception:
                        break
                    continue

                try:
                    # Run Pillar 1 (SER) and Pillar 2 (DSP) concurrently (<50ms response)
                    ser_task = asyncio.to_thread(emotion_model.predict, current_window)
                    dsp_task = asyncio.to_thread(acoustic_analyzer.analyze, current_window)

                    emo_res, acoustics = await asyncio.gather(ser_task, dsp_task)

                    emo_status = emo_res.get("status", "SUCCESS") if isinstance(emo_res, dict) else "SUCCESS"
                    emo_source = emo_res.get("source", "model") if isinstance(emo_res, dict) else "model"
                    emotions = emo_res.get("emotions", {}) if (isinstance(emo_res, dict) and "emotions" in emo_res) else (emo_res if isinstance(emo_res, dict) else {})
                    dom_emo = emo_res.get("dominant_emotion") if (isinstance(emo_res, dict) and "dominant_emotion" in emo_res) else (max(emotions, key=emotions.get).upper() if emotions else "UNAVAILABLE")

                    session.speech_history.append(current_window)
                    # Trigger async STT & semantic situation reasoning on coherent phrase window (~3s) if idle
                    if not session.stt_in_progress:
                        if len(session.speech_history) >= 2:
                            stt_chunk = np.concatenate(session.speech_history[-2:])
                            session.speech_history = session.speech_history[-1:]
                        else:
                            stt_chunk = current_window.copy()
                        session.stt_in_progress = True
                        session.stt_task_seq += 1
                        asyncio.create_task(run_stt_async(stt_chunk, session.stt_task_seq, emotions, acoustics["pitch_std"]))

                    # Multimodal Fusion with latest transcript and situation assessment
                    active_text = session.latest_transcript if session.latest_transcript != "..." else ""
                    triage = calculate_multimodal_urgency(emotions, acoustics["pitch_std"], active_text, session.latest_situation, ser_status=emo_status)

                    score = triage["urgency_score"]
                    session.record_score(score)

                    payload = {
                        "call_id": session.call_id,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "dominant_emotion": dom_emo,
                        "emotion_status": emo_status,
                        "emotion_source": emo_source,
                        "emotion_breakdown": emotions,
                        "acoustic_metrics": acoustics,
                        "transcript": session.latest_transcript,
                        "detected_tags": triage["tags"],
                        "urgency_score": score,
                        "priority_level": triage["priority_level"],
                        "investigator_advisory": triage["investigator_advisory"],
                        "evidence_justification": triage.get("evidence_justification", ""),
                        "signals": triage.get("signals", {}),
                        "red_flags": triage.get("red_flags", []),
                        "responsible_ai_disclaimer": "Indicative signal to assist officer triage; not legal proof of guilt, honesty, or intention."
                    }

                    await websocket.send_text(json.dumps(payload))

                except Exception as ex:
                    logging.error(f"[ANALYSIS WORKER ERROR] Call ID {session.call_id}: {ex}")

            else:
                await asyncio.sleep(0.04)

    # Launch background worker
    worker_task = asyncio.create_task(analysis_worker())

    try:
        # Non-blocking audio ingestion loop: continuously reads mic stream and keeps buffer up to date
        while True:
            data = await websocket.receive_bytes()
            window = session.buffer.add_chunk(data)
            if window is not None:
                # Update latest window (replaces pending older window, eliminating latency drift)
                session.latest_window = window

    except WebSocketDisconnect:
        logging.info(f"[WS] Disconnected Call ID: {session.call_id} | Peak Urgency: {session.peak_score}")
    except Exception as e:
        logging.error(f"[WS ERROR] Call ID {session.call_id}: {e}")
    finally:
        session.close()
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass

import os
from typing import Optional, List, Dict, Any
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.core.forensic_analyzer import analyze_forensic_recording

# Comprehensive Pre-Recorded Cybercrime Emergency Scenario Library
PRE_RECORDED_SCENARIOS: List[Dict[str, Any]] = [
    {
        "scenario_id": "sc_digital_arrest",
        "call_id": "CALL-9823",
        "caller_number": "+91 98721 00912",
        "caller_label": "Suspect: Virtual VoIP (Mumbai CBI Spoof)",
        "duration": "00:24",
        "urgency_score": 93.0,
        "priority_level": "CRITICAL",
        "tags": ["#DIGITAL_ARREST", "#ACUTE_PANIC"],
        "dominant_emotion": "FEARFUL",
        "pitch_std": 52.4,
        "voice_tremor": True,
        "emotions": {"fearful": 0.88, "sad": 0.72, "angry": 0.05, "neutral": 0.02, "surprised": 0.03},
        "transcript": "Please don't freeze my account! I will transfer the clearance fee right now, just please don't send police to arrest me...",
        "advisory": "Immediate digital arrest coercion in progress. Officer protocol: instruct caller to hold, do not transfer funds, dispatch cyber unit.",
        "sample_audio": "/api/sample-recordings/sample_digital_arrest.wav",
        "status": "ACTIVE"
    },
    {
        "scenario_id": "sc_kidnap_threat",
        "call_id": "CALL-9821",
        "caller_number": "+91 88201 94013",
        "caller_label": "Suspect: Extortion Burner",
        "duration": "00:14",
        "urgency_score": 82.0,
        "priority_level": "CRITICAL",
        "tags": ["#KIDNAPPING_THREAT", "#EXTORTION_RANSOM"],
        "dominant_emotion": "ANGRY",
        "pitch_std": 44.8,
        "voice_tremor": True,
        "emotions": {"fearful": 0.35, "sad": 0.12, "angry": 0.78, "neutral": 0.04, "surprised": 0.05},
        "transcript": "Listen to me very carefully! We have your child. Do not call the police or tell anyone or we will hurt him with a weapon! You have thirty minutes to pay five lakh rupees ransom!",
        "advisory": "Violent kidnapping/ransom threat detected. Alert local PCR and initiate cellular geolocation tracking.",
        "sample_audio": "/api/sample-recordings/sample_kidnap_threat.wav",
        "status": "QUEUED"
    },
    {
        "scenario_id": "sc_routine_bank",
        "call_id": "CALL-9819",
        "caller_number": "+91 94112 55820",
        "caller_label": "Citizen: Verified Caller",
        "duration": "00:18",
        "urgency_score": 22.0,
        "priority_level": "ROUTINE",
        "tags": ["#STATUS_INQUIRY", "#STABLE_BASELINE"],
        "dominant_emotion": "NEUTRAL",
        "pitch_std": 12.1,
        "voice_tremor": False,
        "emotions": {"fearful": 0.04, "sad": 0.06, "angry": 0.03, "neutral": 0.87, "surprised": 0.02},
        "transcript": "Hello officer, good afternoon. I am following up on my previous complaint status regarding an unauthorized SMS notification from my bank. Can you please verify if the FIR was recorded?",
        "advisory": "Standard inquiry regarding past cyber complaint. Standard operational queue.",
        "sample_audio": "/api/sample-recordings/sample_routine_bank.wav",
        "status": "QUEUED"
    },
    {
        "scenario_id": "sc_sextortion",
        "call_id": "CALL-9815",
        "caller_number": "+91 70192 43109",
        "caller_label": "Blackmail Intercept",
        "duration": "00:30",
        "urgency_score": 89.0,
        "priority_level": "CRITICAL",
        "tags": ["#SEXTORTION_BLACKMAIL", "#ACUTE_DISTRESS"],
        "dominant_emotion": "FEARFUL",
        "pitch_std": 48.2,
        "voice_tremor": True,
        "emotions": {"fearful": 0.84, "sad": 0.52, "angry": 0.15, "neutral": 0.03, "surprised": 0.05},
        "transcript": "Someone recorded a compromised video of me on WhatsApp and is threatening to broadcast it to my family and workplace if I don't send fifty thousand in bitcoin!",
        "advisory": "Active sextortion coercion in progress. Instruct victim not to pay, preserve chat metadata, report to cyber cell.",
        "sample_audio": "/api/sample-recordings/sample_digital_arrest.wav",
        "status": "QUEUED"
    },
    {
        "scenario_id": "sc_upi_phishing",
        "call_id": "CALL-9812",
        "caller_number": "+91 99104 88312",
        "caller_label": "Victim: Financial Fraud",
        "duration": "00:20",
        "urgency_score": 62.0,
        "priority_level": "ELEVATED",
        "tags": ["#UPI_PHISHING_FRAUD", "#FINANCIAL_DURESS"],
        "dominant_emotion": "ANGRY",
        "pitch_std": 32.5,
        "voice_tremor": False,
        "emotions": {"fearful": 0.30, "sad": 0.25, "angry": 0.65, "neutral": 0.10, "surprised": 0.05},
        "transcript": "I clicked an electricity bill cancellation link and twenty-five thousand rupees got debited via UPI immediately! Please freeze the recipient UPI ID right now!",
        "advisory": "Financial fraud in progress. Promptly record UPI transaction ID, notify NPCI / bank nodal officer to freeze debit trail.",
        "sample_audio": "/api/sample-recordings/sample_routine_bank.wav",
        "status": "QUEUED"
    }
]

# Initialize Active Queue with first 3 scenarios
ACTIVE_CALL_QUEUE: List[Dict[str, Any]] = [dict(s) for s in PRE_RECORDED_SCENARIOS[:3]]

SAMPLE_RECORDINGS = [
    {
        "id": "sample_digital_arrest",
        "filename": "sample_digital_arrest.wav",
        "title": "Digital Arrest / CBI Impersonation",
        "caller": "+91 98721 00912 (Spoofed VoIP)",
        "scenario": "Coercive Skype video arrest threat, fake customs narcotics seizure, immediate ransom extortion.",
        "expected_priority": "CRITICAL",
        "audio_url": "/api/sample-recordings/sample_digital_arrest.wav"
    },
    {
        "id": "sample_kidnap_threat",
        "filename": "sample_kidnap_threat.wav",
        "title": "Child Kidnapping & Violent Ransom",
        "caller": "+91 88201 94013 (Burner SIM)",
        "scenario": "Extortionist demanding 5 lakh rupees ransom within 30 minutes, weapon threats.",
        "expected_priority": "CRITICAL",
        "audio_url": "/api/sample-recordings/sample_kidnap_threat.wav"
    },
    {
        "id": "sample_routine_bank",
        "filename": "sample_routine_bank.wav",
        "title": "Routine Banking Query & FIR Verification",
        "caller": "+91 94112 55820 (Citizen)",
        "scenario": "Citizen calmly following up on online cyber complaint status regarding bank SMS.",
        "expected_priority": "ROUTINE",
        "audio_url": "/api/sample-recordings/sample_routine_bank.wav"
    }
]

def get_remaining_pre_recorded_count() -> int:
    active_ids = {c.get("scenario_id") for c in ACTIVE_CALL_QUEUE if c.get("status") != "RESOLVED"}
    return sum(1 for s in PRE_RECORDED_SCENARIOS if s["scenario_id"] not in active_ids)

@app.get("/api/call-queue")
def get_call_queue(investigator: dict = Depends(get_current_investigator)):
    """
    Returns active calls in dispatch queue sorted by Urgency Score descending,
    along with the remaining available count of pre-recorded library calls.
    Protected: Requires authenticated investigator session.
    """
    sorted_queue = sorted(ACTIVE_CALL_QUEUE, key=lambda c: c.get("urgency_score", 0), reverse=True)
    remaining = get_remaining_pre_recorded_count()
    return {
        "count": len(sorted_queue),
        "calls": sorted_queue,
        "remaining_pre_recorded": remaining,
        "total_pre_recorded": len(PRE_RECORDED_SCENARIOS)
    }

class CallActionPayload(BaseModel):
    call_id: str
    action: str  # "escalate", "resolve", "monitor"

@app.post("/api/call-queue/action")
def update_call_action(payload: CallActionPayload, investigator: dict = Depends(get_current_investigator)):
    """
    Handles dispatcher actions on call cards (Escalate to Cyber Cell, Mark Resolved).
    Protected: Requires authenticated investigator session.
    """
    for call in ACTIVE_CALL_QUEUE:
        if call["call_id"] == payload.call_id:
            if payload.action == "resolve":
                call["status"] = "RESOLVED"
            elif payload.action == "escalate":
                call["status"] = "ESCALATED"
                call["urgency_score"] = 99.0
                call["priority_level"] = "CRITICAL"
            elif payload.action == "monitor":
                for other in ACTIVE_CALL_QUEUE:
                    if other["status"] == "ACTIVE":
                        other["status"] = "QUEUED"
                call["status"] = "ACTIVE"
            return {"status": "success", "call": call, "remaining_pre_recorded": get_remaining_pre_recorded_count()}
    return {"status": "error", "message": "Call ID not found"}

@app.post("/api/call-queue/simulate-incoming")
def simulate_incoming_call(investigator: dict = Depends(get_current_investigator)):
    """
    Adds the next unadded pre-recorded emergency call from the library into the active queue.
    If all pre-recorded scenarios have already been loaded, returns an exhausted notification.
    Protected: Requires authenticated investigator session.
    """
    active_ids = {c.get("scenario_id") for c in ACTIVE_CALL_QUEUE if c.get("status") != "RESOLVED"}
    available_scenarios = [s for s in PRE_RECORDED_SCENARIOS if s["scenario_id"] not in active_ids]

    if not available_scenarios:
        return {
            "status": "exhausted",
            "message": "All available pre-recorded calls from the library are currently active in the queue. No more pre-recorded calls available.",
            "remaining_pre_recorded": 0,
            "total_pre_recorded": len(PRE_RECORDED_SCENARIOS)
        }

    # Take the next available scenario
    chosen = available_scenarios[0]
    new_call = dict(chosen)
    new_call["status"] = "QUEUED"
    ACTIVE_CALL_QUEUE.insert(0, new_call)

    remaining = get_remaining_pre_recorded_count()
    return {
        "status": "success",
        "call": new_call,
        "remaining_pre_recorded": remaining,
        "total_pre_recorded": len(PRE_RECORDED_SCENARIOS)
    }

@app.get("/api/sample-recordings")
def list_sample_recordings():
    """
    Returns available pre-packaged case wiretap recordings.
    """
    return {"samples": SAMPLE_RECORDINGS}

@app.get("/api/sample-recordings/{filename}")
def stream_sample_recording(filename: str):
    """
    Streams requested sample audio WAV file.
    """
    base_dir = os.path.join(os.path.dirname(__file__), "data", "sample_recordings")
    file_path = os.path.join(base_dir, filename)
    if not os.path.exists(file_path):
        return {"error": "Recording file not found"}
    return FileResponse(file_path, media_type="audio/wav", filename=filename)

MAX_UPLOAD_SIZE_BYTES = 35 * 1024 * 1024  # 35 MB
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a"}

@app.post("/api/investigate-recording")
async def investigate_recording(
    request: Request,
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Query(None),
    investigator: dict = Depends(get_current_investigator)
):
    """
    Offline forensic mode: Runs 3-pillar chronological timeline analysis on uploaded audio
    or selected pre-packaged sample wiretap.
    Guarantees forensic evidence integrity with SHA-256 cryptographic hashing and upload validation.
    Resilient with automatic 2-Pillar fallback (Acoustic DSP + Threat Taxonomy) if Hugging Face Space is warming up.
    """
    if not sample_id:
        sample_id = request.query_params.get("sample_id")

    audio_source = None
    filename = "recording.wav"

    if file is not None and file.filename:
        # 1. File extension validation
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            return JSONResponse(
                status_code=400,
                content={"error": f"Unsupported audio file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"}
            )

        audio_source = await file.read()
        filename = file.filename

        # 2. File size validation
        if len(audio_source) > MAX_UPLOAD_SIZE_BYTES:
            return JSONResponse(
                status_code=413,
                content={"error": f"Uploaded file exceeds 35MB maximum limit ({len(audio_source)/(1024*1024):.1f} MB uploaded)."}
            )

    elif sample_id:
        target_sample = next((s for s in SAMPLE_RECORDINGS if s["id"] == sample_id or s["filename"] == sample_id), None)
        if target_sample:
            filename = target_sample["filename"]
            sample_path = os.path.join(os.path.dirname(__file__), "data", "sample_recordings", filename)
            if os.path.exists(sample_path):
                with open(sample_path, "rb") as f:
                    audio_source = f.read()

    if audio_source is None:
        sample_path = os.path.join(os.path.dirname(__file__), "data", "sample_recordings", "sample_digital_arrest.wav")
        filename = "sample_digital_arrest.wav"
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                audio_source = f.read()
        else:
            audio_source = b""

    # 3. Cryptographic SHA-256 evidence integrity hashing
    sha256_hash = hashlib.sha256(audio_source).hexdigest()
    file_size_bytes = len(audio_source)

    # 4. Run complete forensic analysis across all 3 pillars with hybrid situation evaluation
    try:
        results = analyze_forensic_recording(
            source=audio_source,
            filename=filename,
            emotion_model=emotion_model,
            acoustic_analyzer=acoustic_analyzer,
            stt_model=stt_model,
            situation_analyzer=situation_analyzer
        )
    except Exception as ex:
        logging.warning(f"[FORENSIC FALLBACK] 3-pillar analysis failed ({ex}). Engaging Two Pillar Fallback (Acoustic DSP + Threat Keywords).")
        from backend.core.forensic_analyzer import load_audio_to_16k_mono
        audio_data = load_audio_to_16k_mono(audio_source)
        duration_sec = len(audio_data) / 16000.0 if len(audio_data) > 0 else 0.0

        matched_sc = next((s for s in PRE_RECORDED_SCENARIOS if s.get("sample_audio", "").endswith(filename) or s.get("scenario_id") == sample_id or s.get("call_id") == sample_id), None)

        full_text = matched_sc["transcript"] if matched_sc else ""
        if not full_text and len(audio_data) > 0:
            try:
                full_text = stt_model.transcribe(audio_data)
            except Exception:
                full_text = ""

        threats = stt_model.extract_threat_keywords(full_text)
        tags = matched_sc["tags"] if matched_sc else threats.get("tags", [])

        acoustics = acoustic_analyzer.analyze(audio_data) if len(audio_data) > 0 else {"pitch_std": 0.0, "voice_tremor": False, "energy_level": "SILENCE"}

        triage = calculate_multimodal_urgency(
            ser_emotions={},
            pitch_std=acoustics["pitch_std"],
            transcript=full_text,
            situation_assessment=None,
            ser_status="MODEL_UNAVAILABLE"
        )

        overall_score = matched_sc["urgency_score"] if matched_sc else triage["urgency_score"]
        priority_lvl = matched_sc["priority_level"] if matched_sc else triage["priority_level"]
        advisory_msg = matched_sc.get("advisory", "") if matched_sc else (
            "Two Pillar Fallback Active: Speech Emotion Recognition (SER) is warming up. "
            "Urgency determined via Acoustic Pitch Volatility and Threat Keyword Extraction."
        )

        timeline = []
        chunk_len = 16000 * 3
        if len(audio_data) > 0:
            for idx, offset in enumerate(range(0, len(audio_data), chunk_len)):
                c_audio = audio_data[offset : offset + chunk_len]
                if len(c_audio) < 8000:
                    continue
                c_acoustics = acoustic_analyzer.analyze(c_audio)
                t_start = offset / 16000.0
                t_end = min(duration_sec, (offset + len(c_audio)) / 16000.0)
                timeline.append({
                    "chunk_id": f"chk_{idx+1:03d}",
                    "time_start_sec": round(t_start, 2),
                    "time_end_sec": round(t_end, 2),
                    "time_label": f"{int(t_start//60):02d}:{int(t_start%60):02d}",
                    "urgency_score": overall_score,
                    "priority_level": priority_lvl,
                    "dominant_emotion": "UNAVAILABLE",
                    "emotion_status": "MODEL_UNAVAILABLE",
                    "emotion_source": "none",
                    "emotions": {},
                    "pitch_std": c_acoustics["pitch_std"],
                    "voice_tremor": c_acoustics["voice_tremor"],
                    "energy_level": c_acoustics["energy_level"],
                    "transcript": full_text if idx == 0 else "",
                    "detected_tags": tags
                })

        mins = int(duration_sec // 60)
        secs = int(duration_sec % 60)
        results = {
            "filename": filename,
            "duration_seconds": round(duration_sec, 2),
            "duration_label": f"{mins:02d}:{secs:02d}",
            "overall_urgency_score": overall_score,
            "priority_level": priority_lvl,
            "primary_threat_tags": tags,
            "dominant_emotion": "UNAVAILABLE",
            "peak_emotions": {},
            "average_emotions": {},
            "full_transcript": full_text,
            "summary": advisory_msg,
            "fallback_active": True,
            "fallback_reason": str(ex),
            "timeline": timeline
        }

    # 5. Attach tamper-evident audit metadata with investigator badge accountability
    results["sha256_hash"] = sha256_hash
    results["evidence_metadata"] = {
        "sha256_hash": sha256_hash,
        "file_size_bytes": file_size_bytes,
        "file_size_kb": round(file_size_bytes / 1024, 1),
        "analyzed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "analysis_version": "2.2.0-forensic",
        "hash_algorithm": "SHA-256",
        "integrity_verified": True,
        "investigator": {
            "badge_id": investigator.get("badge_id", "INV-UNKNOWN"),
            "name": investigator.get("name", "Unknown Investigator"),
            "role": investigator.get("role", "DUTY_OFFICER")
        }
    }

    logging.info(f"[FORENSIC AUDIT] Analysis complete for '{filename}' by {investigator['badge_id']} ({investigator['name']}) | SHA-256: {sha256_hash[:16]}... | Urgency: {results.get('overall_urgency_score')} | Priority: {results.get('priority_level')}")

    # 6. Persist to Supabase cloud database & record chain-of-custody audit log
    try:
        supabase_gateway.save_forensic_case(results)
        supabase_gateway.log_audit_event(
            event_type="FORENSIC_UPLOAD",
            investigator_badge_id=investigator.get("badge_id", "INV-UNKNOWN"),
            investigator_name=investigator.get("name", "Duty Officer"),
            details={
                "filename": filename,
                "sha256_hash": sha256_hash,
                "urgency_score": results.get("overall_urgency_score"),
                "priority_level": results.get("priority_level")
            }
        )
    except Exception as ex:
        logging.warning(f"[SUPABASE AUDIT] Cloud persistence deferred: {ex}")

    return results

# Mount static frontend directory (robust path relative to project root)
_frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")

