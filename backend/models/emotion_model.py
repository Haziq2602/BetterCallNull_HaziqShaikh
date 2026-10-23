"""
Pillar 1: Speech Emotion Recognition using emotion2vec+ (FunASR).
"""

from typing import Dict
import numpy as np

class SpeechEmotionModel:
    def __init__(self, model_id: str = "iic/emotion2vec_plus_seed"):
        self.model_id = model_id
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from funasr import AutoModel
            self.model = AutoModel(model=self.model_id, hub="hf")
            print(f"[INFO] emotion2vec+ loaded successfully: {self.model_id}")
        except Exception as e:
            print(f"[WARN] Failed to load emotion2vec+ ({e}). Using mock heuristic analyzer for development.")
            self.model = None

    def predict(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> Dict[str, float]:
        """
        Receives 16 kHz numpy audio array and returns emotion probabilities.
        """
        if self.model is not None:
            try:
                res = self.model.generate(audio_chunk, granularity="utterance", extract_embedding=False)
                # Map outputs to normalized dict
                if res and isinstance(res, list) and len(res) > 0:
                    labels = res[0].get("labels", [])
                    scores = res[0].get("scores", [])
                    return dict(zip(labels, scores))
            except Exception as e:
                print(f"[ERROR] Inference error in emotion2vec+: {e}")

        # Fallback heuristic simulation if model is downloading or running on basic environment
        rms = float(np.sqrt(np.mean(audio_chunk**2))) if len(audio_chunk) > 0 else 0.0
        if rms > 0.15:
            return {"fearful": 0.78, "sad": 0.45, "angry": 0.20, "neutral": 0.10}
        return {"neutral": 0.85, "fearful": 0.08, "sad": 0.04, "angry": 0.03}
