"""
Unit Test for Pillar 2: Acoustic Biomarkers & Pitch Volatility.
Tests calm voice vs. erratic pitch tremors (panic state) vs. whisper under duress.
"""

import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.acoustic_dsp import AcousticAnalyzer

def test_pillar2_acoustic_dsp():
    print("=" * 65)
    print("TEST: Pillar 2 (Acoustic Biomarkers & Pitch Volatility)")
    print("=" * 65)

    sample_rate = 16000
    duration_sec = 2.0  # standard 2.0-second window
    analyzer = AcousticAnalyzer(sample_rate=sample_rate)

    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)

    # 1. SCENARIO A: Calm Caller (Steady 150 Hz pitch)
    calm_audio = 0.25 * np.sin(2 * np.pi * 150.0 * t)
    metrics_calm = analyzer.analyze(calm_audio)
    print(f"\n[SCENARIO A: CALM CALLER]")
    print(f"  Mean Pitch: {metrics_calm['mean_pitch']} Hz (Expected ~150 Hz)")
    print(f"  Pitch Volatility (Std Dev): {metrics_calm['pitch_std']} Hz (Expected < 10 Hz)")
    print(f"  Voice Tremor Flag: {metrics_calm['voice_tremor']} (Expected: False)")
    print(f"  Energy Level: {metrics_calm['energy_level']}")

    assert abs(metrics_calm['mean_pitch'] - 150.0) < 5.0, "Calm pitch tracking failed!"
    assert metrics_calm['pitch_std'] < 10.0, "Calm voice should have low pitch volatility!"
    assert metrics_calm['voice_tremor'] is False, "Calm voice should NOT flag voice tremor!"

    # 2. SCENARIO B: Panicked / Crying Caller with Erratic Vocal Cord Jitter
    # Involuntary constriction causes pitch to modulate rapidly between 160 Hz and 320 Hz
    instantaneous_freq = 240.0 + 80.0 * np.sin(2 * np.pi * 4.0 * t)  # 4 Hz tremor
    phase = 2 * np.pi * np.cumsum(instantaneous_freq) / sample_rate
    panic_audio = 0.3 * np.sin(phase) + 0.05 * np.random.randn(len(t))

    metrics_panic = analyzer.analyze(panic_audio)
    print(f"\n[SCENARIO B: PANICKED / SHAKING VOICE]")
    print(f"  Mean Pitch: {metrics_panic['mean_pitch']} Hz")
    print(f"  Pitch Volatility (Std Dev): {metrics_panic['pitch_std']} Hz (Expected > 40 Hz)")
    print(f"  Voice Tremor Flag: {metrics_panic['voice_tremor']} (Expected: True)")
    print(f"  Energy Level: {metrics_panic['energy_level']}")

    assert metrics_panic['pitch_std'] > 35.0, "Panic voice should show high pitch standard deviation!"
    assert metrics_panic['voice_tremor'] is True, "Panic voice must trigger voice_tremor flag!"

    # 3. SCENARIO C: Suppressed Whisper Under Duress (Hostage / Digital Arrest monitoring)
    whisper_audio = 0.005 * np.random.randn(len(t))  # unvoiced quiet breath
    metrics_whisper = analyzer.analyze(whisper_audio)
    print(f"\n[SCENARIO C: WHISPER UNDER DURESS]")
    print(f"  RMS Volume: {metrics_whisper['rms']}")
    print(f"  Energy Classification: {metrics_whisper['energy_level']} (Expected: SUPPRESSED_WHISPER)")

    assert metrics_whisper['energy_level'] == "SUPPRESSED_WHISPER", "Failed to detect whisper under duress!"

    print("\n" + "=" * 65)
    print("ALL PILLAR 2 ACOUSTIC TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_pillar2_acoustic_dsp()
