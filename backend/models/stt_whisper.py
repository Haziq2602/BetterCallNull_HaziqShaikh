"""
Pillar 3: Speech-to-Text Transcription & Keyword Matching using faster-whisper.
"""

from typing import Tuple, List
import numpy as np

class SpeechToTextTranscriber:
    def __init__(self, model_size: str = "base.en"):
        self.model = None
        self._load_model(model_size)

    def _load_model(self, model_size: str):
        try:
            from faster_whisper import WhisperModel
            # Run on CPU with int8 quantization for ultra-fast response
            self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
            print(f"[INFO] faster-whisper loaded successfully: {model_size}")
        except Exception as e:
            print(f"[WARN] Failed to load faster-whisper ({e}). Using mock transcriber for development.")
            self.model = None

    def transcribe(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> str:
        """
        Transcribes 16kHz audio chunk into text.
        """
        if self.model is not None:
            try:
                segments, _ = self.model.transcribe(audio_chunk.astype(np.float32), beam_size=1)
                text = " ".join([seg.text for seg in segments]).strip()
                return text
            except Exception as e:
                print(f"[ERROR] Error during transcription: {e}")

        return "Please help me, they are saying I am under digital arrest and cannot hang up..."
