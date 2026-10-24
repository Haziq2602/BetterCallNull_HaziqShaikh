"""
Pillar 3: Speech-to-Text Transcription & Keyword Matching using faster-whisper.
Runs on CPU with int8 quantization for ultra-low latency (< 200ms).
"""

from typing import Dict, List, Any
import numpy as np
import re
from backend.config import KEYWORD_TAXONOMY

class SpeechToTextTranscriber:
    def __init__(self, model_size: str = "tiny.en"):
        # tiny.en (~75MB) is optimized for sub-second streaming on CPU
        self.model_size = model_size
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from faster_whisper import WhisperModel
            # Run on CPU with int8 quantization for ultra-fast response
            self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            print(f"[INFO] faster-whisper loaded successfully: {self.model_size}")
        except Exception as e:
            print(f"[WARN] Failed to load faster-whisper ({e}). Using mock transcriber for development.")
            self.model = None

    def transcribe(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> str:
        """
        Transcribes 16kHz float32 audio chunk into text.
        """
        if self.model is not None and len(audio_chunk) > 0:
            try:
                # Transcribe with beam_size=1 for maximum real-time speed
                segments, _ = self.model.transcribe(
                    audio_chunk.astype(np.float32), 
                    beam_size=1,
                    language="en",
                    vad_filter=True  # Built-in Whisper VAD to skip pure silence
                )
                text = " ".join([seg.text for seg in segments]).strip()
                if text:
                    return text
            except Exception as e:
                print(f"[ERROR] Error during transcription: {e}")

        return ""

    def extract_threat_keywords(self, transcript: str) -> Dict[str, Any]:
        """
        Scans transcript against Cybercrime Taxonomy:
        Extracts matched threat keywords, assigned tags, and threat score.
        """
        if not transcript:
            return {"tags": [], "matched_words": [], "threat_points": 0.0}

        # Normalize text: lowercase and strip special punctuation
        text_clean = re.sub(r"[^a-zA-Z0-9\s]", " ", transcript.lower())
        
        detected_tags: List[str] = []
        matched_words: List[str] = []
        max_points = 0.0

        for category, data in KEYWORD_TAXONOMY.items():
            for phrase in data["words"]:
                # Check for phrase or word boundary match
                pattern = r"\b" + re.escape(phrase.lower()) + r"\b"
                if re.search(pattern, text_clean):
                    detected_tags.append(data["tag"])
                    matched_words.append(phrase)
                    max_points = max(max_points, float(data["points"]))

        return {
            "tags": list(set(detected_tags)),
            "matched_words": list(set(matched_words)),
            "threat_points": max_points
        }
