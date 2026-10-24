"""
Pillar 1: Speech Emotion Recognition Client.
Connects to the dedicated Hugging Face Space running emotion2vec+ (Alibaba / FunASR).
Includes fallback heuristic for offline/local development without GPU.
"""

from typing import Dict
import os
import tempfile
import numpy as np
import soundfile as sf
from backend.config import HF_SPACE_URL

class SpeechEmotionModel:
    def __init__(self, space_url: str = HF_SPACE_URL):
        self.space_url = space_url
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.space_url:
            try:
                from gradio_client import Client
                self.client = Client(self.space_url)
                print(f"[INFO] Connected to Hugging Face SER Space: {self.space_url}")
            except Exception as e:
                print(f"[WARN] Could not connect to HF Space ({e}). Falling back to heuristic mode.")
                self.client = None
        else:
            print("[INFO] No HF_SPACE_URL configured. Running SER in local heuristic mode.")
            self.client = None

    def predict(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> Dict[str, float]:
        """
        Receives 16 kHz numpy audio array and returns emotion probabilities.
        """
        if self.client is not None and len(audio_chunk) > 0:
            temp_path = None
            try:
                from gradio_client import handle_file
                # Write audio chunk to a temporary WAV file for transfer
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    temp_path = tmp.name
                    sf.write(temp_path, audio_chunk.astype(np.float32), sample_rate)

                # Call Hugging Face Space /predict endpoint
                result = self.client.predict(
                    audio_path=handle_file(temp_path),
                    api_name="/predict"
                )

                # Result from Gradio is either a dict or confidences list
                if isinstance(result, dict) and "confidences" in result:
                    res_dict = {item["label"].lower(): item["confidence"] for item in result["confidences"]}
                    return res_dict
                elif isinstance(result, dict):
                    return result

            except Exception as e:
                print(f"[WARN] Error calling HF SER Space ({e}). Using heuristic fallback.")
            finally:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass

        # Fallback heuristic simulation if HF space is offline or initializing
        rms = float(np.sqrt(np.mean(audio_chunk**2))) if len(audio_chunk) > 0 else 0.0
        if rms > 0.15:
            return {"fearful": 0.82, "sad": 0.55, "angry": 0.18, "neutral": 0.08, "surprised": 0.12}
        return {"neutral": 0.88, "fearful": 0.05, "sad": 0.04, "angry": 0.02, "surprised": 0.01}
