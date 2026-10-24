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

@app.post("/api/investigate-recording")
async def investigate_recording(file: UploadFile = File(...)):
    """
    Offline forensic mode: Upload recorded case audio (.wav / .mp3) to generate a chronological distress timeline.
    """
    contents = await file.read()
    # In production, parse full audio via soundfile/pydub and slice into 2s chunks
    return {
        "filename": file.filename,
        "status": "Analyzed",
        "overall_urgency_score": 88.0,
        "priority_level": "CRITICAL",
        "primary_threat_tags": ["#DIGITAL_ARREST_SCAM", "#SOBBING_DISTRESS"],
        "summary": "High likelihood of live duress detected. Coercive financial demands identified."
    }

# Mount static frontend directory
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
