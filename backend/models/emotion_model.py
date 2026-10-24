"""
Pillar 1: Speech Emotion Recognition Client.
Connects to the dedicated Hugging Face Space running emotion2vec+ (Alibaba / FunASR).
Includes fallback heuristic for offline/local development without GPU.
"""

from typing import Dict
import os
import tempfile
import numpy as np
from backend.config import HF_SPACE_URL, HF_TOKEN

class SpeechEmotionModel:
    def __init__(self, space_url: str = HF_SPACE_URL, hf_token: str = HF_TOKEN):
        self.space_url = space_url
        self.hf_token = hf_token
        self.client = None
        self.last_emotions = {"neutral": 0.90, "fearful": 0.02, "sad": 0.03, "angry": 0.02, "surprised": 0.03}
        self._init_client()

    def _init_client(self):
        if self.space_url:
            try:
                from gradio_client import Client
                token = self.hf_token if self.hf_token else None
                self.client = Client(self.space_url, hf_token=token)
                auth_str = "authenticated" if token else "unauthenticated"
                print(f"[INFO] Connected to Hugging Face SER Space: {self.space_url} ({auth_str})")
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
                import wave
                from gradio_client import handle_file

                # Write audio chunk to a standard 16-bit PCM WAV file
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    temp_path = tmp.name

                with wave.open(temp_path, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(sample_rate)
                    pcm16 = (np.clip(audio_chunk, -1.0, 1.0) * 32767).astype(np.int16)
                    wf.writeframes(pcm16.tobytes())

                # Call Hugging Face Space /predict_emotion endpoint
                result = self.client.predict(
                    audio_path=handle_file(temp_path),
                    api_name="/predict_emotion"
                )

                if isinstance(result, str):
                    import json
                    result = json.loads(result)

                if isinstance(result, dict):
                    clean = {}
                    for k, v in result.items():
                        norm_k = str(k).split("/")[-1].strip().lower()
                        if norm_k in ["fearful", "sad", "angry", "neutral", "surprised", "disgusted", "happy"]:
                            clean[norm_k] = max(clean.get(norm_k, 0.0), round(float(v), 4))
                    for key in ["fearful", "sad", "angry", "neutral", "surprised"]:
                        if key not in clean:
                            clean[key] = 0.0
                    self.last_emotions = clean
                    return clean

            except Exception as e:
                print(f"[WARN] Error calling HF SER Space ({e}). Using smoothed state.")
            finally:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass

        # Fallback heuristic simulation if HF space is offline or initializing
        rms = float(np.sqrt(np.mean(audio_chunk**2))) if len(audio_chunk) > 0 else 0.0
        if rms > 0.15:
            self.last_emotions = {"fearful": 0.82, "sad": 0.55, "angry": 0.18, "neutral": 0.08, "surprised": 0.12}
            return self.last_emotions
        return self.last_emotions
