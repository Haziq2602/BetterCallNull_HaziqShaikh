"""
Pillar 3: High-Accuracy Speech-to-Text Transcription & Threat Taxonomy Extraction
Powered by Google Gemini Multimodal Audio (gemini-2.5-flash / gemini-1.5-flash).
Direct in-memory audio serialization with zero disk I/O.
"""

from typing import Dict, List, Any, Optional
import io
import os
import re
import wave
import numpy as np

from backend.config import GEMINI_API_KEY, GEMINI_STT_MODEL, KEYWORD_TAXONOMY, SAMPLE_RATE

class SpeechToTextTranscriber:
    def __init__(self, api_key: str = GEMINI_API_KEY, model_name: str = GEMINI_STT_MODEL):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name or "gemini-2.5-flash"
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                print(f"[INFO] Google Gemini STT Engine initialized successfully: model={self.model_name}")
            except Exception as e:
                print(f"[WARN] Failed to initialize Gemini STT Client ({e}). Running in offline fallback mode.")
                self.client = None
        else:
            print("[INFO] GEMINI_API_KEY not configured. Add it to .env for high-accuracy Gemini transcription.")
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
        Transcribes 16kHz float32 audio array into text using Gemini Multimodal Audio.
        """
        if len(audio_chunk) == 0:
            return ""

        # Silence Gate: skip pure silence / background microphone hum (< 0.012 RMS)
        rms = float(np.sqrt(np.mean(audio_chunk**2)))
        if rms < 0.012:
            return ""

        if self.client is None and not self.api_key:
            # Re-check if API key was added to environment
            self.api_key = os.getenv("GEMINI_API_KEY", "")
            if self.api_key:
                self._init_client()

        if self.client is not None:
            try:
                from google.genai import types

                wav_bytes = self.audio_to_wav_bytes(audio_chunk, sample_rate)

                # Dynamic token bound: ~20 words/tokens per second of audio
                duration_sec = len(audio_chunk) / sample_rate
                max_tokens = max(60, int(duration_sec * 25))

                system_prompt = (
                    "You are a specialized multilingual speech-to-text transcriber for Indian emergency cybercrime dispatch. "
                    "Transcribe the spoken audio verbatim in its original spoken language (English, Hindi, Marathi, or code-switched Hinglish/Marathi). "
                    "Preserve spoken words in standard Devanagari or Latin script as spoken. "
                    "Output ONLY the exact words spoken with standard punctuation. "
                    "Do NOT include timestamps, speaker labels, introductory phrases, or explanations. "
                    "If the audio contains silence, noise, or inaudible murmur, output strictly nothing."
                )

                config = types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.0,
                    max_output_tokens=max_tokens,
                    thinking_config=types.ThinkingConfig(thinking_budget=0)
                )

                # Audio Part ONLY in contents (prevents model from echoing prompt back)
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[
                        types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav")
                    ],
                    config=config
                )

                if response and response.text:
                    clean_text = response.text.strip().strip('"\'')
                    lower_text = clean_text.lower()

                    # Discard if model returned generic hallucination or echoed instructions
                    hallucinations = ["none", "no speech", "silence", "inaudible", "no speech detected", "mmm", "uh", "um", "..."]
                    if lower_text in hallucinations:
                        return ""

                    # Anti-echo safeguard: never return text that contains system prompt phrases
                    echo_phrases = ["transcribe", "spoken audio", "verbatim", "output only", "discernible speech", "speaker label"]
                    if any(phrase in lower_text for phrase in echo_phrases):
                        return ""

                    return clean_text

            except Exception as e:
                err_str = str(e)
                # If specific model is not found, fallback to gemini-1.5-flash
                if "404" in err_str and self.model_name != "gemini-1.5-flash":
                    try:
                        self.model_name = "gemini-1.5-flash"
                        return self.transcribe(audio_chunk, sample_rate)
                    except Exception:
                        pass
                print(f"[WARN] Gemini STT error ({e}).")

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
