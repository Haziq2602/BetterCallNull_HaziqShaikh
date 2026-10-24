"""
Pillar 3: High-Accuracy, Ultra-Low Latency Speech-to-Text Transcription
Powered by Groq LPU Hardware Inference (Whisper Large V3 / Whisper Large V3 Turbo).
Supports Multilingual Indic Recognition (English, Hindi, Marathi, Hinglish).
Direct in-memory audio serialization with zero disk I/O and ~200-400ms response time.
"""

from typing import Dict, List, Any, Optional
import io
import os
import re
import wave
import numpy as np

from backend.config import GROQ_API_KEY, GROQ_STT_MODEL, GEMINI_API_KEY, KEYWORD_TAXONOMY, SAMPLE_RATE

class SpeechToTextTranscriber:
    def __init__(self, api_key: str = GROQ_API_KEY, model_name: str = GROQ_STT_MODEL):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model_name = model_name or "whisper-large-v3-turbo"
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                print(f"[INFO] Groq LPU Whisper Engine initialized successfully: model={self.model_name}")
            except Exception as e:
                print(f"[WARN] Failed to initialize Groq Client ({e}).")
                self.client = None
        else:
            print("[INFO] GROQ_API_KEY not configured. Add it to .env for 2,000 free daily transcriptions with <300ms speed.")
            self.client = None

    def audio_to_wav_bytes(self, audio_chunk: np.ndarray, sample_rate: int = SAMPLE_RATE) -> bytes:
        """
        Encodes float32 numpy audio array directly into standard 16-bit PCM WAV bytes in memory.
        """
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            pcm16 = (np.clip(audio_chunk, -1.0, 1.0) * 32767).astype(np.int16)
            wf.writeframes(pcm16.tobytes())
        return buf.getvalue()

    def transcribe(self, audio_chunk: np.ndarray, sample_rate: int = SAMPLE_RATE) -> str:
        """
        Transcribes 16kHz float32 audio array into text using Groq LPU Whisper (<300ms latency).
        """
        if len(audio_chunk) == 0:
            return ""

        # Silence Gate: skip pure silence/background room noise (< 0.012 RMS) to conserve API calls
        rms = float(np.sqrt(np.mean(audio_chunk**2)))
        if rms < 0.012:
            return ""

        if self.client is None and not self.api_key:
            # Re-check if API key was added to environment
            self.api_key = os.getenv("GROQ_API_KEY", "")
            if self.api_key:
                self._init_client()

        if self.client is not None:
            try:
                wav_bytes = self.audio_to_wav_bytes(audio_chunk, sample_rate)

                # Context prompt strictly restricts Whisper to English, Hindi, and Marathi
                context_prompt = (
                    "Indian Cybercrime Police Emergency Dispatch. "
                    "Restricted strictly to English, Hindi, and Marathi languages only (including code-switched Hinglish/Marathi). "
                    "Keywords: CBI, digital arrest, skype call, narcotics parcel, mumbai police, "
                    "डिजिटल अरेस्ट, सीबीआई, मनी लॉन्ड्रिंग, खंडणी, मारून टाकेन, फिरौती, ब्लैकमेल, "
                    "OTP, AnyDesk, bank account blocked, paise transfer. "
                    "Output only English, Hindi, or Marathi speech."
                )

                response = self.client.audio.transcriptions.create(
                    file=("speech.wav", wav_bytes, "audio/wav"),
                    model=self.model_name,
                    prompt=context_prompt,
                    temperature=0.0,
                    response_format="text"
                )

                if response:
                    raw_text = str(response).strip().strip('"\'')
                    # Strip any generic Whisper silence hallucinations
                    lower_text = raw_text.lower()
                    hallucinations = ["you", "thank you", "thanks for watching", "subtitles by", "...", "silence"]
                    if lower_text in hallucinations:
                        return ""
                    return raw_text

            except Exception as e:
                err_str = str(e)
                # Fallback between turbo and regular v3 if needed
                if "whisper-large-v3-turbo" in self.model_name:
                    try:
                        self.model_name = "whisper-large-v3"
                        return self.transcribe(audio_chunk, sample_rate)
                    except Exception:
                        pass
                print(f"[WARN] Groq STT error: {e}")

        return ""

    def extract_threat_keywords(self, transcript: str) -> Dict[str, Any]:
        """
        Scans transcript against Multilingual Cybercrime Taxonomy (English, Hindi, Marathi, Hinglish).
        Extracts matched threat keywords, assigned tags, and threat score points.
        """
        if not transcript:
            return {"tags": [], "matched_words": [], "threat_points": 0.0}

        # Normalize text: preserve alphanumeric, whitespace, and Devanagari Unicode (\u0900-\u097F)
        text_clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", transcript.lower())
        padded_text = f" {text_clean} "

        detected_tags: List[str] = []
        matched_words: List[str] = []
        max_points = 0.0

        for category, data in KEYWORD_TAXONOMY.items():
            for phrase in data["words"]:
                phrase_clean = phrase.lower().strip()
                # If Indic script (Devanagari), check space-padded substring; otherwise use word boundary \b
                if any(0x0900 <= ord(c) <= 0x097F for c in phrase_clean):
                    is_match = f" {phrase_clean} " in padded_text
                else:
                    pattern = r"\b" + re.escape(phrase_clean) + r"\b"
                    is_match = bool(re.search(pattern, text_clean))

                if is_match:
                    detected_tags.append(data["tag"])
                    matched_words.append(phrase)
                    max_points = max(max_points, float(data["points"]))

        return {
            "tags": list(set(detected_tags)),
            "matched_words": list(set(matched_words)),
            "threat_points": max_points
        }
