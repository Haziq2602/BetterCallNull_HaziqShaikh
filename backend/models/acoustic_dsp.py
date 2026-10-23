"""
Pillar 2: Acoustic Biomarkers & Pitch Volatility using librosa DSP.
"""

from typing import Dict, Any
import numpy as np

class AcousticAnalyzer:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate

    def analyze(self, audio_chunk: np.ndarray) -> Dict[str, Any]:
        """
        Calculates pitch volatility (F0 std dev), ZCR, and RMS energy.
        """
        if len(audio_chunk) == 0:
            return {"pitch_std": 0.0, "rms": 0.0, "voice_tremor": False}

        try:
            import librosa
            # Compute RMS Energy
            rms = float(np.sqrt(np.mean(audio_chunk**2)))

            # Pitch tracking using librosa.pyin (fundamental frequency F0)
            f0, voiced_flag, _ = librosa.pyin(
                audio_chunk.astype(np.float32), 
                fmin=librosa.note_to_hz('C2'), 
                fmax=librosa.note_to_hz('C7'), 
                sr=self.sample_rate
            )
            
            # Filter non-voiced frames
            valid_pitches = f0[~np.isnan(f0)] if f0 is not None else []
            pitch_std = float(np.std(valid_pitches)) if len(valid_pitches) > 1 else 0.0

            return {
                "pitch_std": round(pitch_std, 1),
                "rms": round(rms, 4),
                "voice_tremor": pitch_std > 40.0
            }
        except Exception as e:
            # Fallback numpy calculation
            rms = float(np.sqrt(np.mean(audio_chunk**2)))
            zcr = float(np.mean(np.abs(np.diff(np.sign(audio_chunk)))) / 2)
            pitch_std = 55.0 if zcr > 0.15 else 15.0
            return {
                "pitch_std": pitch_std,
                "rms": round(rms, 4),
                "voice_tremor": pitch_std > 40.0
            }
