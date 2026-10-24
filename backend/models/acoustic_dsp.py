"""
Pillar 2: Acoustic Biomarkers & Pitch Volatility using SciPy & NumPy DSP.
Zero heavy neural network weights: Pure high-speed CPU signal processing (< 15ms).
"""

from typing import Dict, Any, List
import numpy as np
from scipy import signal

class AcousticAnalyzer:
    def __init__(
        self, 
        sample_rate: int = 16000,
        min_pitch_hz: float = 75.0,    # Lower human voice limit (deep male voice)
        max_pitch_hz: float = 500.0,   # Upper human voice limit (female scream / panic)
        frame_size_ms: float = 40.0,   # 40ms analysis frame
        hop_size_ms: float = 20.0      # 20ms frame step
    ):
        self.sample_rate = sample_rate
        self.frame_size = int((frame_size_ms / 1000.0) * sample_rate)  # 640 samples
        self.hop_size = int((hop_size_ms / 1000.0) * sample_rate)      # 320 samples
        
        # Lag ranges for autocorrelation corresponding to min/max pitch
        self.min_lag = int(sample_rate / max_pitch_hz)  # ~32 samples
        self.max_lag = int(sample_rate / min_pitch_hz)  # ~213 samples

    def extract_f0_frame(self, frame: np.ndarray) -> float:
        """
        Calculates the fundamental frequency (F0) of a single frame via autocorrelation.
        Returns 0.0 if unvoiced (whisper, breathing, or silence).
        """
        # Remove DC bias and apply Hanning window
        frame = frame - np.mean(frame)
        if np.max(np.abs(frame)) < 1e-4:
            return 0.0

        windowed = frame * np.hanning(len(frame))

        # Compute normalized autocorrelation
        autocorr = signal.correlate(windowed, windowed, mode="full")
        autocorr = autocorr[len(windowed) - 1 :]  # Keep non-negative lags

        if autocorr[0] <= 0:
            return 0.0

        norm_autocorr = autocorr / autocorr[0]

        # Search for highest peak within human vocal pitch lag bounds
        search_region = norm_autocorr[self.min_lag : self.max_lag]
        if len(search_region) == 0:
            return 0.0

        peak_idx = np.argmax(search_region) + self.min_lag
        peak_val = norm_autocorr[peak_idx]

        # Voiced threshold: Periodic vocal fold vibrations have autocorrelation peak > 0.35
        if peak_val > 0.35:
            # Parabolic interpolation for sub-sample precision
            if 0 < peak_idx < len(norm_autocorr) - 1:
                alpha = norm_autocorr[peak_idx - 1]
                beta = norm_autocorr[peak_idx]
                gamma = norm_autocorr[peak_idx + 1]
                delta = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma + 1e-12)
                refined_lag = peak_idx + delta
            else:
                refined_lag = float(peak_idx)

            if refined_lag > 0:
                f0 = self.sample_rate / refined_lag
                return float(f0)

        return 0.0

    def analyze(self, audio_chunk: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes a 2.0-second audio window and extracts:
        - Pitch Standard Deviation (Volatility / Jitter in Hz)
        - Mean Vocal Pitch (Hz)
        - Voice Tremor Flag
        - RMS Energy Dynamics & Classification
        - Zero-Crossing Rate (Breathiness)
        """
        if len(audio_chunk) < self.frame_size:
            return {
                "pitch_std": 0.0,
                "mean_pitch": 0.0,
                "rms": 0.0,
                "voice_tremor": False,
                "energy_level": "SILENT",
                "zcr": 0.0
            }

        audio_float = audio_chunk.astype(np.float32)

        # 1. RMS Energy & Dynamics
        rms = float(np.sqrt(np.mean(audio_float ** 2)))
        if rms < 0.015:
            energy_level = "SUPPRESSED_WHISPER"
        elif rms > 0.22:
            energy_level = "ELEVATED_SHOUT"
        else:
            energy_level = "NORMAL_CONVERSATION"

        # 2. Zero-Crossing Rate (Breathiness / Shivering voice)
        signs = np.sign(audio_float)
        signs[signs == 0] = 1
        zcr = float(np.mean(np.abs(np.diff(signs))) / 2)

        # 3. Short-Time Pitch Tracking across overlapping frames
        f0_track: List[float] = []
        for start_idx in range(0, len(audio_float) - self.frame_size + 1, self.hop_size):
            frame = audio_float[start_idx : start_idx + self.frame_size]
            f0 = self.extract_f0_frame(frame)
            if f0 > 0:
                f0_track.append(f0)

        # 4. Volatility & Tremor Statistics over voiced frames
        if len(f0_track) >= 3:
            mean_f0 = float(np.mean(f0_track))
            pitch_std = float(np.std(f0_track))
            # Vocal tremor flagged if pitch fluctuates erratically (> 35 Hz standard deviation)
            voice_tremor = bool(pitch_std > 35.0)
        else:
            mean_f0 = 0.0
            pitch_std = 0.0
            voice_tremor = False

        return {
            "pitch_std": round(pitch_std, 1),
            "mean_pitch": round(mean_f0, 1),
            "rms": round(rms, 4),
            "voice_tremor": voice_tremor,
            "energy_level": energy_level,
            "zcr": round(zcr, 4),
            "voiced_ratio": round(len(f0_track) / (len(audio_float) / self.hop_size), 2)
        }
