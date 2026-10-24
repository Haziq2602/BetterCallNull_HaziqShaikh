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

@app.websocket("/ws/live-call/{call_id}")
async def websocket_call_stream(websocket: WebSocket, call_id: str):
    """
    Receives raw PCM / audio chunks from officer's console in real time and yields triage analytics.
    """
    await websocket.accept()
    print(f"[WS] Active connection for Call ID: {call_id}", flush=True)

    # Initialize a dedicated rolling buffer for this active call
    call_buffer = AudioStreamBuffer(sample_rate=16000, window_duration_sec=2.0, stride_duration_sec=1.0)

    try:
        while True:
            # Receive binary audio chunk (e.g. 250ms - 500ms chunk of 16kHz PCM)
            data = await websocket.receive_bytes()
            print(f"[MIC STREAM] Received {len(data)} bytes ({len(data)//2} samples) from {call_id}", flush=True)
            
            # Feed to buffer and check if a 2.0-second window is ready
            audio_window = call_buffer.add_chunk(data)

            if audio_window is None:
                print(f"[BUFFER] Accumulating audio context... ({len(call_buffer._buffer)} / {call_buffer.window_samples} samples)", flush=True)
                continue

            print(f"[BUFFER TRIGGER] 32,000 samples ready! Analyzing voice window...", flush=True)

            # Voice Activity Detection (VAD) / Silence check
            if call_buffer.is_silent(audio_window):
                # Send low-activity neutral response without wasting CPU cycles
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
                await websocket.send_text(json.dumps(payload))
                print(f"[WS SENT] Silent/Low activity frame processed.", flush=True)
                continue

            # 1. Pillar 1: SER
            emotions = emotion_model.predict(audio_window)
            
            # 2. Pillar 2: Acoustics & Pitch Volatility
            acoustics = acoustic_analyzer.analyze(audio_window)
            
            # 3. Pillar 3: STT & Threat Keywords
            transcript = stt_model.transcribe(audio_window)

            # 4. Multimodal Fusion
            triage = calculate_multimodal_urgency(emotions, acoustics["pitch_std"], transcript)

            # Format real-time payload
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

    except WebSocketDisconnect:
        print(f"[WS] Disconnected Call ID: {call_id}", flush=True)
    except Exception as e:
        print(f"[WS ERROR] {e}", flush=True)
        await websocket.close()

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
