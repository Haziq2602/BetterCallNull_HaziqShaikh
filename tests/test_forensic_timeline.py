"""
Test forensic analyzer timeline segmentation and alignment.
"""

import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.acoustic_dsp import AcousticAnalyzer
from backend.core.forensic_analyzer import analyze_forensic_recording

class MockEmotionModel:
    def predict(self, audio_chunk):
        return {
            "status": "SUCCESS",
            "source": "model",
            "emotions": {"fearful": 0.85, "sad": 0.60, "angry": 0.10, "neutral": 0.05, "surprised": 0.10},
            "dominant_emotion": "FEARFUL",
            "error": None
        }

class MockSTT:
    def transcribe_with_segments(self, audio_chunk):
        return {
            "text": "Hello officer, CBI Mumbai says I am under digital arrest via Skype.",
            "segments": [
                {"start": 0.0, "end": 2.0, "text": "Hello officer,"},
                {"start": 2.5, "end": 6.0, "text": "CBI Mumbai says I am under digital arrest via Skype."}
            ]
        }
    def extract_threat_keywords(self, text):
        from backend.models.stt_groq import SpeechToTextTranscriber
        return SpeechToTextTranscriber().extract_threat_keywords(text)

def test_timeline_alignment():
    print("=" * 70)
    print("TEST: FORENSIC TIMELINE ALIGNMENT & CONSISTENCY")
    print("=" * 70)

    sr = 16000
    duration_sec = 6.0
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    # 250Hz tone with slight tremor
    audio = 0.25 * np.sin(2 * np.pi * 250.0 * t)

    res = analyze_forensic_recording(
        source=audio,
        filename="mock_case.wav",
        emotion_model=MockEmotionModel(),
        acoustic_analyzer=AcousticAnalyzer(sample_rate=sr),
        stt_model=MockSTT()
    )

    print(f"Overall Score: {res['overall_urgency_score']} | Priority: {res['priority_level']}")
    print(f"Peak Emotions: {res['peak_emotions']}")
    print(f"Dominant Emotion: {res['dominant_emotion']}")
    print("-" * 50)

    for row in res["timeline"]:
        print(f"  [{row['time_label']}] Urgency: {row['urgency_score']} ({row['priority_level']}) | Emo: {row['dominant_emotion']} | Text: '{row['transcript']}' | Tags: {row['detected_tags']}")

    # 1. Verify chunk text is populated
    has_text = any(len(row["transcript"]) > 0 for row in res["timeline"])
    assert has_text, "At least one chunk must have populated transcript text!"

    # 2. Verify threat chunk has high urgency matching report
    threat_chunks = [r for r in res["timeline"] if "#DIGITAL_ARREST_SCAM" in r["detected_tags"]]
    assert len(threat_chunks) > 0, "Threat tag must appear in the timeline chunk where spoken!"
    assert threat_chunks[0]["priority_level"] == "CRITICAL", "Threat chunk must be CRITICAL!"

    # 3. Verify peak emotions match the high fear
    assert res["peak_emotions"].get("fearful", 0) >= 0.80, "Peak fear must be >= 80%!"
    assert res["dominant_emotion"] == "FEARFUL", "Dominant emotion must be FEARFUL!"

    print("\n" + "=" * 70)
    print("SUCCESS: TIMELINE ALIGNMENT & MONITOR METRICS VERIFIED!")
    print("=" * 70)

class MockUnavailableEmotionModel:
    def predict(self, audio_chunk):
        return {
            "status": "MODEL_UNAVAILABLE",
            "source": "none",
            "emotions": {},
            "dominant_emotion": "UNAVAILABLE",
            "error": "HF Space ZeroGPU is waking up"
        }

def test_forensic_two_pillar_fallback():
    """
    Verifies that when Speech Emotion Recognition (SER) is UNAVAILABLE,
    forensic analysis falls back to the Two Pillar method (Acoustic DSP + Threat Keywords).
    """
    sr = 16000
    duration_sec = 6.0
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    audio = 0.25 * np.sin(2 * np.pi * 250.0 * t)

    res = analyze_forensic_recording(
        source=audio,
        filename="mock_case_fallback.wav",
        emotion_model=MockUnavailableEmotionModel(),
        acoustic_analyzer=AcousticAnalyzer(sample_rate=sr),
        stt_model=MockSTT()
    )

    assert res["overall_urgency_score"] > 0
    assert len(res["timeline"]) > 0
    assert all(row["emotion_status"] == "MODEL_UNAVAILABLE" for row in res["timeline"])
    assert res["dominant_emotion"] == "UNAVAILABLE"
    # Even without SER, threat keywords in transcript ensure detection
    assert "#DIGITAL_ARREST_SCAM" in res["primary_threat_tags"]
    assert res["priority_level"] == "CRITICAL"

if __name__ == "__main__":
    test_timeline_alignment()
    test_forensic_two_pillar_fallback()

