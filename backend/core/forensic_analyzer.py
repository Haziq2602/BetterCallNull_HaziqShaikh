"""
Forensic Audio Analysis Module for Wiretaps and Case Recordings.
Performs chunked timeline analysis across all 3 pillars:
Pillar 1: Speech Emotion Recognition (emotion2vec+)
Pillar 2: Acoustic Biomarkers & Pitch Volatility (SciPy DSP)
Pillar 3: Speech-to-Text & Threat Taxonomy (faster-whisper)
"""

from typing import Dict, Any, List, Optional
import io
import math
import concurrent.futures
import numpy as np
import soundfile as sf
from scipy import signal

from backend.models.emotion_model import SpeechEmotionModel
from backend.models.acoustic_dsp import AcousticAnalyzer
from backend.models.stt_groq import SpeechToTextTranscriber
from backend.core.urgency_engine import calculate_multimodal_urgency
from backend.config import SAMPLE_RATE, CRITICAL_THRESHOLD, ELEVATED_THRESHOLD

def load_audio_to_16k_mono(source) -> np.ndarray:
    """
    Reads an audio file, bytes buffer, or numpy array into a 16kHz float32 mono numpy array.
    """
    if isinstance(source, np.ndarray):
        return source.astype(np.float32)

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
    situation_analyzer: Optional[Any] = None,
    window_sec: float = 3.0,
    stride_sec: float = 2.5
) -> Dict[str, Any]:
    """
    Full chronological forensic breakdown of a recorded scam call / wiretap.
    Uses concurrent processing for sub-5s response on complete call recordings.
    Supports hybrid Groq LLM situation evaluation with automatic local fallback.
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

    # Transcribe entire file for complete clean text and segment timestamps
    if hasattr(stt_model, "transcribe_with_segments"):
        stt_result = stt_model.transcribe_with_segments(audio)
        full_transcript = stt_result.get("text", "")
        segments = stt_result.get("segments", [])
    else:
        full_transcript = stt_model.transcribe(audio)
        segments = []

    # Hybrid situation assessment (LLM if available, local keyword regex fallback)
    if situation_analyzer:
        situation = situation_analyzer.analyze_situation(full_transcript)
        overall_threats = {
            "tags": situation.get("tags", []),
            "matched_words": situation.get("matched_threats", []),
            "threat_points": situation.get("threat_points", 0.0),
            "red_flags": situation.get("red_flags", []),
            "advisory": situation.get("officer_advisory", "")
        }
    else:
        overall_threats = stt_model.extract_threat_keywords(full_transcript)
        overall_threats["red_flags"] = []
        overall_threats["advisory"] = ""

    window_samples = int(window_sec * SAMPLE_RATE)
    stride_samples = int(stride_sec * SAMPLE_RATE)

    # Prepare chunks with deterministic identifiers
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
            "chunk_id": f"chk_{len(chunks_meta)+1:03d}",
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
        # Re-index chunk IDs cleanly
        for idx, c in enumerate(chunks_meta):
            c["chunk_id"] = f"chk_{idx+1:03d}"
            c["index"] = idx

    # Pre-compute DSP locally and map transcript segments to chunk intervals
    for c in chunks_meta:
        c["acoustics"] = acoustic_analyzer.analyze(c["chunk"])
        
        # Match transcript segments that overlap with this chunk interval [t_start, t_end]
        overlapping_texts = []
        c_start = c["t_start"]
        c_end = c["t_end"]
        for seg in segments:
            s_start = seg.get("start", 0.0)
            s_end = seg.get("end", 0.0)
            if max(s_start, c_start) < min(s_end, c_end) or (s_start >= c_start and s_start < c_end):
                txt = seg.get("text", "").strip()
                if txt and txt not in overlapping_texts:
                    overlapping_texts.append(txt)

        if overlapping_texts:
            c["chunk_text"] = " ".join(overlapping_texts)
        elif len(chunks_meta) == 1 and full_transcript:
            c["chunk_text"] = full_transcript
        else:
            c["chunk_text"] = ""

    # Run emotion model in parallel thread pool (max 6 workers for Hugging Face Space)
    def fetch_emotion(chunk_data):
        try:
            res = emotion_model.predict(chunk_data["chunk"])
            return res
        except Exception as ex:
            return {
                "status": "MODEL_UNAVAILABLE",
                "source": "none",
                "emotions": {},
                "dominant_emotion": "UNAVAILABLE",
                "error": str(ex)
            }

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        emotions_results = list(executor.map(fetch_emotion, chunks_meta))

    timeline: List[Dict[str, Any]] = []
    all_scores: List[float] = []
    all_tags = set(overall_threats["tags"])

    for meta, emo_res in zip(chunks_meta, emotions_results):
        t_start = meta["t_start"]
        t_end = meta["t_end"]
        time_label = meta["time_label"]
        acoustics = meta["acoustics"]
        chunk_text = meta["chunk_text"]
        chunk_id = meta.get("chunk_id", f"chk_{len(timeline)+1:03d}")

        emo_status = emo_res.get("status", "SUCCESS") if isinstance(emo_res, dict) else "SUCCESS"
        emo_source = emo_res.get("source", "model") if isinstance(emo_res, dict) else "model"
        emotions = emo_res.get("emotions", {}) if (isinstance(emo_res, dict) and "emotions" in emo_res) else (emo_res if isinstance(emo_res, dict) else {})
        dom_emo = emo_res.get("dominant_emotion") if (isinstance(emo_res, dict) and "dominant_emotion" in emo_res) else (max(emotions, key=emotions.get).upper() if emotions else "UNAVAILABLE")

        triage = calculate_multimodal_urgency(
            emotions,
            acoustics["pitch_std"],
            chunk_text,
            situation_assessment=None,
            ser_status=emo_status
        )

        score = triage["urgency_score"]
        priority = triage["priority_level"]
        tags = triage["tags"]

        all_scores.append(score)
        for t in tags:
            all_tags.add(t)

        timeline.append({
            "chunk_id": chunk_id,
            "time_start_sec": round(t_start, 2),
            "time_end_sec": round(t_end, 2),
            "time_label": time_label,
            "urgency_score": score,
            "priority_level": priority,
            "dominant_emotion": dom_emo,
            "emotion_status": emo_status,
            "emotion_source": emo_source,
            "emotions": {k: round(v, 3) for k, v in emotions.items()} if emotions else {},
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
        summary = "Standard caller baseline; no active coercion or distress patterns detected."

    if overall_threats.get("advisory"):
        summary = f"{overall_threats['advisory']}"

    # Calculate Call-Level Aggregate Emotion Metrics (for truthful monitor transfer)
    valid_emo_chunks = [t for t in timeline if t.get("emotions") and len(t["emotions"]) > 0]
    
    # Peak distress chunk (matches peak urgency)
    peak_chunk = max(timeline, key=lambda x: x["urgency_score"]) if timeline else None
    peak_emotions = peak_chunk["emotions"] if peak_chunk and peak_chunk.get("emotions") else {}
    
    # If peak chunk had no valid emotion (e.g. model offline), fallback to highest valid chunk
    if not peak_emotions and valid_emo_chunks:
        peak_emotions = max(valid_emo_chunks, key=lambda x: x["urgency_score"])["emotions"]

    # Average emotions across all valid chunks
    avg_emotions: Dict[str, float] = {}
    if valid_emo_chunks:
        for k in ["fearful", "sad", "angry", "neutral", "surprised"]:
            vals = [c["emotions"].get(k, 0.0) for c in valid_emo_chunks]
            if vals:
                avg_emotions[k] = round(sum(vals) / len(vals), 3)

    # Call-level dominant emotion
    if peak_chunk and peak_chunk.get("dominant_emotion") not in ["UNAVAILABLE", "SILENCE", None]:
        dominant_call_emotion = peak_chunk["dominant_emotion"]
    elif avg_emotions:
        dominant_call_emotion = max(avg_emotions, key=avg_emotions.get).upper()
    else:
        dominant_call_emotion = "UNAVAILABLE"

    return {
        "filename": filename,
        "duration_sec": round(duration_sec, 2),
        "duration_label": f"{int(duration_sec//60):02d}:{int(duration_sec%60):02d}",
        "overall_urgency_score": round(peak_score, 1),
        "priority_level": overall_priority,
        "primary_threat_tags": sorted(list(all_tags)),
        "dominant_emotion": dominant_call_emotion,
        "peak_emotions": peak_emotions,
        "average_emotions": avg_emotions,
        "full_transcript": full_transcript if full_transcript else "(No distinct voice speech recognized)",
        "summary": summary,
        "red_flags": overall_threats.get("red_flags", []),
        "timeline": timeline
    }
