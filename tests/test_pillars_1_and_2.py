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
    triage = calculate_multimodal_urgency(ser_output, acoustic_output["pitch_std"], "")

    print(f"  Pillar 1 (SER):       Fear: {ser_output.get('fearful', 0)*100:.0f}% | Sadness: {ser_output.get('sad', 0)*100:.0f}%")
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
    triage_calm = calculate_multimodal_urgency(ser_calm, acoustic_calm["pitch_std"], "")

    print(f"  Pillar 1 (SER):       Neutral: {ser_calm.get('neutral', 0)*100:.0f}% | Fear: {ser_calm.get('fearful', 0)*100:.0f}%")
    print(f"  Pillar 2 (Acoustics): Pitch Std Dev: {acoustic_calm['pitch_std']} Hz | Tremors: {acoustic_calm['voice_tremor']}")
    print(f"  Combined Urgency:     {triage_calm['urgency_score']} / 100")
    print(f"  Assigned Priority:    {triage_calm['priority_level']}")

    assert triage_calm['priority_level'] == "ROUTINE", "Calm call should be ROUTINE priority!"

    print("\n" + "=" * 70)
    print("SUCCESS: BOTH PILLAR 1 AND PILLAR 2 INTEGRATED AND VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_combined_pillars()
