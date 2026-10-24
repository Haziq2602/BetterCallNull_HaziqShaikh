"""
Diagnostic Inspector for Pillar 2:
Prints the actual frame-by-frame fundamental frequency (F0 in Hz)
to demonstrate how pitch volatility and tremors are calculated.
"""

import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.acoustic_dsp import AcousticAnalyzer

def inspect_pitch_frames():
    sample_rate = 16000
    analyzer = AcousticAnalyzer(sample_rate=sample_rate)

    # 1. Test a monotone steady voice (175 Hz - typical conversational pitch)
    t = np.linspace(0, 1.0, sample_rate, endpoint=False)
    calm_audio = 0.3 * np.sin(2 * np.pi * 175.0 * t)

    # Extract raw frames
    calm_frames = []
    for start in range(0, len(calm_audio) - analyzer.frame_size + 1, analyzer.hop_size):
        f0 = analyzer.extract_f0_frame(calm_audio[start : start + analyzer.frame_size])
        if f0 > 0:
            calm_frames.append(round(f0, 1))

    print("=" * 65)
    print("1. CALM MONOTONE VOICE (Target: 175 Hz)")
    print("=" * 65)
    print(f"Extracted F0 across first 10 frames (Hz): {calm_frames[:10]}")
    calm_std = np.std(calm_frames)
    print(f"Mean Pitch: {np.mean(calm_frames):.1f} Hz")
    print(f"Pitch Standard Deviation: {calm_std:.2f} Hz  --> Tremor Flag: {calm_std > 35.0}")

    # 2. Test an erratic distressed voice (pitch fluctuating wildly from 200Hz to 340Hz)
    panic_freq = 270.0 + 70.0 * np.sin(2 * np.pi * 6.0 * t)
    panic_audio = 0.3 * np.sin(2 * np.pi * np.cumsum(panic_freq) / sample_rate)

    panic_frames = []
    for start in range(0, len(panic_audio) - analyzer.frame_size + 1, analyzer.hop_size):
        f0 = analyzer.extract_f0_frame(panic_audio[start : start + analyzer.frame_size])
        if f0 > 0:
            panic_frames.append(round(f0, 1))

    print("\n" + "=" * 65)
    print("2. DISTRESSED SHIVERING VOICE (Jumping between 200 Hz & 340 Hz)")
    print("=" * 65)
    print(f"Extracted F0 across first 10 frames (Hz): {panic_frames[:10]}")
    panic_std = np.std(panic_frames)
    print(f"Mean Pitch: {np.mean(panic_frames):.1f} Hz")
    print(f"Pitch Standard Deviation: {panic_std:.2f} Hz  --> Tremor Flag: {panic_std > 35.0}")
    print("=" * 65)

if __name__ == "__main__":
    inspect_pitch_frames()
