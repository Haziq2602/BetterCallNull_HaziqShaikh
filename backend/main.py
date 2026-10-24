"""
FastAPI Server: Real-Time WebSockets for Audio Streaming & REST APIs for Case File Investigation.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
import io
import json
import time

from backend.models.emotion_model import SpeechEmotionModel
from backend.models.acoustic_dsp import AcousticAnalyzer
from backend.models.stt_whisper import SpeechToTextTranscriber
from backend.core.urgency_engine import calculate_multimodal_urgency
from backend.core.audio_buffer import AudioStreamBuffer

app = FastAPI(title="Cybercrime Speech Emotion & Triage API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Pipeline
emotion_model = SpeechEmotionModel()
acoustic_analyzer = AcousticAnalyzer()
stt_model = SpeechToTextTranscriber()

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Cybercrime Speech Emotion Triage Engine",
        "compliance": "On-premise / Air-gapped Ready"
    }

import asyncio

@app.websocket("/ws/live-call/{call_id}")
async def websocket_call_stream(websocket: WebSocket, call_id: str):
    """
    Receives raw PCM / audio chunks from officer's console in real time and yields triage analytics.
    Uses asynchronous producer-consumer pattern to completely eliminate queue lag and drift.
    """
    await websocket.accept()
    print(f"[WS] Active connection for Call ID: {call_id}", flush=True)

    # Initialize a rolling buffer (2.0s window, 1.0s stride)
    call_buffer = AudioStreamBuffer(sample_rate=16000, window_duration_sec=2.0, stride_duration_sec=1.0)
    
    latest_window = None
    is_connected = True

    # Background analysis worker: always analyzes the freshest window and drops stale backlog
    async def analysis_worker():
        nonlocal latest_window, is_connected
        while is_connected:
            if latest_window is not None:
                # Atomically extract freshest window and clear slot
                current_window = latest_window
                latest_window = None

                # Silence gate
                if call_buffer.is_silent(current_window):
                    payload = {
                        "call_id": call_id,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "dominant_emotion": "NEUTRAL",
                        "emotion_breakdown": {"neutral": 0.95, "fearful": 0.01, "sad": 0.01, "angry": 0.01},
                        "acoustic_metrics": {"pitch_std": 0.0, "voice_tremor": False, "rms": 0.0},
                        "transcript": "...",
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
                    # Run Pillar 1 (SER), Pillar 2 (DSP), and Pillar 3 (STT) concurrently across worker threads
                    ser_task = asyncio.to_thread(emotion_model.predict, current_window)
                    dsp_task = asyncio.to_thread(acoustic_analyzer.analyze, current_window)
                    stt_task = asyncio.to_thread(stt_model.transcribe, current_window)

                    emotions, acoustics, transcript = await asyncio.gather(ser_task, dsp_task, stt_task)

                    # Multimodal Fusion
                    triage = calculate_multimodal_urgency(emotions, acoustics["pitch_std"], transcript)

                    payload = {
                        "call_id": call_id,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "dominant_emotion": max(emotions, key=emotions.get).upper() if emotions else "NEUTRAL",
                        "emotion_breakdown": emotions,
                        "acoustic_metrics": acoustics,
                        "transcript": transcript,
                        "detected_tags": triage["tags"],
                        "urgency_score": triage["urgency_score"],
                        "priority_level": triage["priority_level"],
                        "investigator_advisory": triage["investigator_advisory"],
                        "responsible_ai_disclaimer": "Indicative signal to assist officer triage; not legal proof of guilt, honesty, or intention."
                    }

                    await websocket.send_text(json.dumps(payload))
                    print(f"[WS SENT] Urgency: {payload['urgency_score']} | Emotion: {payload['dominant_emotion']} | Priority: {payload['priority_level']}", flush=True)

                except Exception as ex:
                    print(f"[ANALYSIS WORKER ERROR] {ex}", flush=True)

            else:
                await asyncio.sleep(0.04)

    # Launch background worker
    worker_task = asyncio.create_task(analysis_worker())

    try:
        # Non-blocking audio ingestion loop: continuously reads mic stream and keeps buffer up to date
        while True:
            data = await websocket.receive_bytes()
            window = call_buffer.add_chunk(data)
            if window is not None:
                # Update latest window (replaces any pending older window, eliminating latency drift)
                latest_window = window

    except WebSocketDisconnect:
        print(f"[WS] Disconnected Call ID: {call_id}", flush=True)
    except Exception as e:
        print(f"[WS ERROR] {e}", flush=True)
    finally:
        is_connected = False
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

# Persistent In-Memory Call Queue for Multi-Call Triage Console
ACTIVE_CALL_QUEUE: List[Dict[str, Any]] = [
    {
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
    }
]

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

@app.get("/api/call-queue")
def get_call_queue():
    """
    Returns active calls in dispatch queue sorted by Urgency Score descending.
    """
    sorted_queue = sorted(ACTIVE_CALL_QUEUE, key=lambda c: c.get("urgency_score", 0), reverse=True)
    return {
        "count": len(sorted_queue),
        "calls": sorted_queue
    }

class CallActionPayload(BaseModel):
    call_id: str
    action: str  # "escalate", "resolve", "monitor"

@app.post("/api/call-queue/action")
def update_call_action(payload: CallActionPayload):
    """
    Handles dispatcher actions on call cards (Escalate to Cyber Cell, Mark Resolved).
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
            return {"status": "success", "call": call}
    return {"status": "error", "message": "Call ID not found"}

@app.post("/api/call-queue/simulate-incoming")
def simulate_incoming_call():
    """
    Simulates a new incoming 112 / 1930 Cyber Emergency call into the queue.
    """
    import random
    new_id = f"CALL-{random.randint(1000, 9999)}"
    scenarios = [
        {
            "tags": ["#SEXTORTION_BLACKMAIL", "#ACUTE_DISTRESS"],
            "score": 89.0,
            "priority": "CRITICAL",
            "emotion": "FEARFUL",
            "transcript": "Someone hacked my video call and is blackmailing me saying they will send it to my contacts if I don't pay immediately...",
            "advisory": "Sextortion blackmail coercion. Instruct victim not to delete chat logs or transfer money.",
            "audio": "/api/sample-recordings/sample_digital_arrest.wav"
        },
        {
            "tags": ["#UPI_PHISHING_FRAUD"],
            "score": 58.0,
            "priority": "ELEVATED",
            "emotion": "ANGRY",
            "transcript": "I clicked an electricity bill link and twenty-five thousand rupees got debited via UPI just now!",
            "advisory": "Financial fraud in progress. Promptly record UPI transaction ID and initiate bank freeze.",
            "audio": "/api/sample-recordings/sample_routine_bank.wav"
        }
    ]
    sc = random.choice(scenarios)
    new_call = {
        "call_id": new_id,
        "caller_number": f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
        "caller_label": "Incoming Emergency Dispatch",
        "duration": "00:05",
        "urgency_score": sc["score"],
        "priority_level": sc["priority"],
        "tags": sc["tags"],
        "dominant_emotion": sc["emotion"],
        "pitch_std": 38.5,
        "voice_tremor": True if sc["priority"] == "CRITICAL" else False,
        "emotions": {"fearful": 0.70, "sad": 0.40, "angry": 0.20, "neutral": 0.10, "surprised": 0.05},
        "transcript": sc["transcript"],
        "advisory": sc["advisory"],
        "sample_audio": sc["audio"],
        "status": "QUEUED"
    }
    ACTIVE_CALL_QUEUE.insert(0, new_call)
    return {"status": "success", "call": new_call}

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

@app.post("/api/investigate-recording")
async def investigate_recording(
    file: Optional[UploadFile] = None,
    sample_id: Optional[str] = None
):
    """
    Offline forensic mode: Runs 3-pillar chronological timeline analysis on uploaded audio
    or selected pre-packaged sample wiretap.
    """
    audio_source = None
    filename = "recording.wav"

    if file is not None and file.filename:
        audio_source = await file.read()
        filename = file.filename
    elif sample_id:
        target_sample = next((s for s in SAMPLE_RECORDINGS if s["id"] == sample_id or s["filename"] == sample_id), None)
        if target_sample:
            filename = target_sample["filename"]
            sample_path = os.path.join(os.path.dirname(__file__), "data", "sample_recordings", filename)
            if os.path.exists(sample_path):
                with open(sample_path, "rb") as f:
                    audio_source = f.read()

    if audio_source is None:
        # Default to sample_digital_arrest if nothing provided
        sample_path = os.path.join(os.path.dirname(__file__), "data", "sample_recordings", "sample_digital_arrest.wav")
        filename = "sample_digital_arrest.wav"
        with open(sample_path, "rb") as f:
            audio_source = f.read()

    # Run complete forensic analysis across all 3 pillars
    results = analyze_forensic_recording(
        source=audio_source,
        filename=filename,
        emotion_model=emotion_model,
        acoustic_analyzer=acoustic_analyzer,
        stt_model=stt_model
    )

    return results

# Mount static frontend directory
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

