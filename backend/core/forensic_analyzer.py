"""
Forensic Audio Analysis Module for Wiretaps and Case Recordings.
Performs chunked timeline analysis across all 3 pillars:
Pillar 1: Speech Emotion Recognition (emotion2vec+)
Pillar 2: Acoustic Biomarkers & Pitch Volatility (SciPy DSP)
Pillar 3: Speech-to-Text & Threat Taxonomy (faster-whisper)
"""

from typing import Dict, Any, List
import io
import math
import concurrent.futures
import numpy as np
import soundfile as sf
from scipy import signal

from backend.models.emotion_model import SpeechEmotionModel
from backend.models.acoustic_dsp import AcousticAnalyzer
from backend.models.stt_whisper import SpeechToTextTranscriber
from backend.core.urgency_engine import calculate_multimodal_urgency
from backend.config import SAMPLE_RATE, CRITICAL_THRESHOLD, ELEVATED_THRESHOLD

def load_audio_to_16k_mono(source) -> np.ndarray:
    """
    Reads an audio file or bytes buffer into a 16kHz float32 mono numpy array.
    """
    if isinstance(source, (bytes, bytearray)):
        source = io.BytesIO(source)

    data, sr = sf.read(source, dtype="float32")
    if data.ndim > 1:
        data = np.mean(data, axis=1)

    if sr != SAMPLE_RATE:
        gcd = math.gcd(sr, SAMPLE_RATE)
        up = SAMPLE_RATE // gcd
        down = sr // gcd
        data = signal.resample_poly(data, up, down).astype(np.float32)

    return data.astype(np.float32)

def analyze_forensic_recording(
    source,
    filename: str,
    emotion_model: SpeechEmotionModel,
    acoustic_analyzer: AcousticAnalyzer,
    stt_model: SpeechToTextTranscriber,
    window_sec: float = 3.0,
    stride_sec: float = 2.5
) -> Dict[str, Any]:
    """
    Full chronological forensic breakdown of a recorded scam call / wiretap.
    Uses concurrent processing for sub-5s response on complete call recordings.
    """
    audio = load_audio_to_16k_mono(source)
    duration_sec = len(audio) / SAMPLE_RATE

    if duration_sec == 0:
        return {
            "filename": filename,
            "duration_sec": 0,
            "overall_urgency_score": 0.0,
            "priority_level": "ROUTINE",
            "primary_threat_tags": [],
            "full_transcript": "",
            "summary": "Empty audio file received.",
            "timeline": []
        }

    # Transcribe entire file for complete clean text
    full_transcript = stt_model.transcribe(audio)
    overall_threats = stt_model.extract_threat_keywords(full_transcript)

    window_samples = int(window_sec * SAMPLE_RATE)
    stride_samples = int(stride_sec * SAMPLE_RATE)

    # Prepare chunks
    chunks_meta = []
    total_len = len(audio)
    for i in range(0, total_len, stride_samples):
        chunk = audio[i : i + window_samples]
        if len(chunk) < int(0.6 * SAMPLE_RATE):
            continue
        t_start = i / SAMPLE_RATE
        t_end = min(duration_sec, (i + len(chunk)) / SAMPLE_RATE)
        time_label = f"{int(t_start//60):02d}:{int(t_start%60):02d}"
        chunks_meta.append({
            "index": len(chunks_meta),
            "chunk": chunk,
            "t_start": t_start,
            "t_end": t_end,
            "time_label": time_label
        })

    # Limit to maximum 12 timeline sample points for balanced speed and detail
    if len(chunks_meta) > 12:
        step = math.ceil(len(chunks_meta) / 12)
        chunks_meta = chunks_meta[::step]

    # Pre-compute DSP and STT locally (very fast, <100ms total)
    for c in chunks_meta:
        c["acoustics"] = acoustic_analyzer.analyze(c["chunk"])
        c["chunk_text"] = stt_model.transcribe(c["chunk"])

    # Run emotion model in parallel thread pool (max 6 workers for Hugging Face Space)
    def fetch_emotion(chunk_data):
        try:
            emo = emotion_model.predict(chunk_data["chunk"])
            if not emo:
                emo = {"neutral": 0.90, "fearful": 0.03, "sad": 0.03, "angry": 0.02, "surprised": 0.02}
            return emo
        except Exception:
            return {"neutral": 0.90, "fearful": 0.03, "sad": 0.03, "angry": 0.02, "surprised": 0.02}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        emotions_results = list(executor.map(fetch_emotion, chunks_meta))

    timeline: List[Dict[str, Any]] = []
    all_scores: List[float] = []
    all_tags = set(overall_threats["tags"])

    for meta, emotions in zip(chunks_meta, emotions_results):
        t_start = meta["t_start"]
        t_end = meta["t_end"]
        time_label = meta["time_label"]
        acoustics = meta["acoustics"]
        chunk_text = meta["chunk_text"]

        triage = calculate_multimodal_urgency(emotions, acoustics["pitch_std"], chunk_text)

        score = triage["urgency_score"]
        priority = triage["priority_level"]
        tags = triage["tags"]

        all_scores.append(score)
        for t in tags:
            all_tags.add(t)

        dom_emo = max(emotions, key=emotions.get).upper() if emotions else "NEUTRAL"

        timeline.append({
            "time_start_sec": round(t_start, 2),
            "time_end_sec": round(t_end, 2),
            "time_label": time_label,
            "urgency_score": score,
            "priority_level": priority,
            "dominant_emotion": dom_emo,
            "emotions": {k: round(v, 3) for k, v in emotions.items()},
            "pitch_std": acoustics["pitch_std"],
            "voice_tremor": acoustics["voice_tremor"],
            "energy_level": acoustics["energy_level"],
            "transcript": chunk_text,
            "detected_tags": tags
        })

    # Overall urgency: use the highest peak distress detected during the call
    peak_score = max(all_scores) if all_scores else 10.0
    
    # If threat keywords were matched, ensure urgency reflects it
    if overall_threats["threat_points"] >= 20.0 and peak_score < 75.0:
        peak_score = max(peak_score, 75.0 + (overall_threats["threat_points"] - 20.0) * 0.5)
        peak_score = min(100.0, peak_score)

    if peak_score >= CRITICAL_THRESHOLD:
        overall_priority = "CRITICAL"
        summary = f"High-confidence threat event detected ({', '.join(all_tags) if all_tags else 'Severe Acoustic Distress'}). Immediate priority escalation warranted."
    elif peak_score >= ELEVATED_THRESHOLD:
        overall_priority = "ELEVATED"
        summary = f"Suspicious activity / moderate caller distress noted ({', '.join(all_tags) if all_tags else 'Elevated Stress'}). Secondary officer review recommended."
    else:
        overall_priority = "ROUTINE"
        summary = "No overt extortion, threat keywords, or severe panic patterns detected. Standard administrative queue."

    return {
        "filename": filename,
        "duration_sec": round(duration_sec, 2),
        "duration_label": f"{int(duration_sec//60):02d}:{int(duration_sec%60):02d}",
        "overall_urgency_score": round(peak_score, 1),
        "priority_level": overall_priority,
        "primary_threat_tags": sorted(list(all_tags)),
        "full_transcript": full_transcript if full_transcript else "(No distinct voice speech recognized)",
        "summary": summary,
        "timeline": timeline
    }
