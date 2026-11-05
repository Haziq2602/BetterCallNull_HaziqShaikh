"""
Combined Test for Pillar 1 (Speech Emotion) and Pillar 2 (Acoustic DSP Pitch Volatility).
"""

import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.emotion_model import SpeechEmotionModel
from backend.models.acoustic_dsp import AcousticAnalyzer
from backend.core.urgency_engine import calculate_multimodal_urgency

def test_combined_pillars():
    print("=" * 70)
    print("TEST: COMBINED PILLAR 1 (SER) & PILLAR 2 (ACOUSTIC DSP)")
    print("=" * 70)

    sample_rate = 16000
    duration_sec = 2.0  # standard 2-second audio window
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)

    emotion_model = SpeechEmotionModel()
    acoustic_analyzer = AcousticAnalyzer(sample_rate=sample_rate)

    # -------------------------------------------------------------
    # CASE 1: PANICKED SCAM VICTIM (High Vocal Tremor + High Fear)
    # -------------------------------------------------------------
    print("\n[TEST CASE 1: VICTIM UNDER ACUTE DURESS / DIGITAL ARREST]")
    # Shaking voice modulating rapidly between 180Hz and 320Hz (vocal cord spasms)
    instantaneous_freq = 250.0 + 70.0 * np.sin(2 * np.pi * 5.0 * t)
    phase = 2 * np.pi * np.cumsum(instantaneous_freq) / sample_rate
    panic_audio = 0.35 * np.sin(phase) + 0.05 * np.random.randn(len(t))

    # Run Pillar 1 & Pillar 2
    ser_output = emotion_model.predict(panic_audio)
    acoustic_output = acoustic_analyzer.analyze(panic_audio)
    ser_emotions = ser_output.get("emotions", {})
    ser_status = ser_output.get("status", "SUCCESS")
    triage = calculate_multimodal_urgency(ser_emotions, acoustic_output["pitch_std"], "", ser_status=ser_status)

    print(f"  Pillar 1 (SER Status):{ser_status} (Source: {ser_output.get('source')})")
    print(f"  Pillar 1 (SER Emo):   Fear: {ser_emotions.get('fearful', 0)*100:.0f}% | Sadness: {ser_emotions.get('sad', 0)*100:.0f}%")
    print(f"  Pillar 2 (Acoustics): Pitch Std Dev: {acoustic_output['pitch_std']} Hz | Tremors: {acoustic_output['voice_tremor']}")
    print(f"  Combined Urgency:     {triage['urgency_score']} / 100")
    print(f"  Assigned Priority:    {triage['priority_level']}")
    print(f"  Generated Tags:       {triage['tags']}")

    assert triage['priority_level'] in ["CRITICAL", "ELEVATED"], "Panic call should be high priority!"

    # -------------------------------------------------------------
    # CASE 2: CALM ROUTINE CALLER (Steady Voice, No Tremors)
    # -------------------------------------------------------------
    print("\n[TEST CASE 2: CALM ROUTINE INQUIRY]")
    # Steady 140Hz monotone voice
    calm_audio = 0.20 * np.sin(2 * np.pi * 140.0 * t)

    ser_calm = emotion_model.predict(calm_audio)
    acoustic_calm = acoustic_analyzer.analyze(calm_audio)
    ser_calm_emotions = ser_calm.get("emotions", {})
    ser_calm_status = ser_calm.get("status", "SUCCESS")
    calm_text = "Hello officer, good afternoon. I am checking the status of my passport verification file."
    triage_calm = calculate_multimodal_urgency(ser_calm_emotions, acoustic_calm["pitch_std"], calm_text, ser_status=ser_calm_status)

    print(f"  Pillar 1 (SER Status):{ser_calm_status} (Source: {ser_calm.get('source')})")
    print(f"  Pillar 1 (SER Emo):   Neutral: {ser_calm_emotions.get('neutral', 0)*100:.0f}% | Fear: {ser_calm_emotions.get('fearful', 0)*100:.0f}%")
    print(f"  Pillar 2 (Acoustics): Pitch Std Dev: {acoustic_calm['pitch_std']} Hz | Tremors: {acoustic_calm['voice_tremor']}")
    print(f"  Combined Urgency:     {triage_calm['urgency_score']} / 100")
    print(f"  Assigned Priority:    {triage_calm['priority_level']}")

    assert triage_calm['priority_level'] in ["ROUTINE", "INSUFFICIENT_EVIDENCE"], "Calm call should be ROUTINE priority!"

    # -------------------------------------------------------------
    # CASE 3: SILENT OR INSUFFICIENT AUDIO (Edge Case Handling)
    # -------------------------------------------------------------
    print("\n[TEST CASE 3: SILENCE & INSUFFICIENT AUDIO HANDLING]")
    silent_audio = np.zeros(int(sample_rate * 1.0), dtype=np.float32)
    ser_silent = emotion_model.predict(silent_audio)
    print(f"  Silence Status:       {ser_silent['status']} (No fabricated neutral)")
    assert ser_silent['status'] == "NO_SPEECH", "Zero signal must return NO_SPEECH!"

    short_audio = np.zeros(int(sample_rate * 0.2), dtype=np.float32)
    ser_short = emotion_model.predict(short_audio)
    print(f"  Short Audio Status:   {ser_short['status']} (No fabricated prediction)")
    assert ser_short['status'] == "INSUFFICIENT_AUDIO", "Audio <0.4s must return INSUFFICIENT_AUDIO!"

    print("\n" + "=" * 70)
    print("SUCCESS: BOTH PILLAR 1 AND PILLAR 2 INTEGRATED AND VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_combined_pillars()
