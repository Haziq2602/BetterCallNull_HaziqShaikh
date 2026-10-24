"""
Hybrid Situation Analyzer & Threat Intelligence Engine.
Combines:
  1. Primary: Groq Llama-3.3-70b-versatile semantic LLM reasoning (for deep context, extortion tactics, and Indic nuances).
  2. Fallback: Instant local regex KEYWORD_TAXONOMY scanner (0ms, 100% offline resilience on network drop or timeout).
Strictly analyzes English, Hindi, and Marathi citizen emergency calls.
"""

from typing import Dict, List, Any, Optional
import os
import json
import re

from backend.config import GROQ_API_KEY, KEYWORD_TAXONOMY

class HybridSituationAnalyzer:
    def __init__(self, api_key: str = GROQ_API_KEY, model_name: str = "qwen/qwen3.8-27b"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model_name = model_name
        self.fallback_model = "openai/gpt-oss-120b"
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"[WARN] Failed to initialize Groq Situation LLM Client ({e}). Using local fallback.")
                self.client = None
        else:
            self.client = None

    def _offline_keyword_fallback(self, transcript: str) -> Dict[str, Any]:
        """
        Instant local regex scanner across Multilingual KEYWORD_TAXONOMY (English, Hindi, Marathi, Hinglish).
        Executes in <1ms with zero network requirements.
        """
        if not transcript or not transcript.strip():
            return {
                "engine": "local_offline_taxonomy",
                "threat_category": "#GENERAL_INQUIRY",
                "threat_points": 0.0,
                "coercion_level": "ROUTINE",
                "tags": [],
                "matched_threats": [],
                "red_flags": [],
                "officer_advisory": "Standard administrative line; no overt cybercrime threat patterns detected."
            }

        text_clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", transcript.lower())
        padded_text = f" {text_clean} "

        detected_tags: List[str] = []
        matched_words: List[str] = []
        max_points = 0.0
        primary_category = "#GENERAL_INQUIRY"

        for category, data in KEYWORD_TAXONOMY.items():
            for phrase in data["words"]:
                phrase_clean = phrase.lower().strip()
                if any(0x0900 <= ord(c) <= 0x097F for c in phrase_clean):
                    is_match = f" {phrase_clean} " in padded_text
                else:
                    pattern = r"\b" + re.escape(phrase_clean) + r"\b"
                    is_match = bool(re.search(pattern, text_clean))

                if is_match:
                    detected_tags.append(data["tag"])
                    matched_words.append(phrase)
                    if float(data["points"]) > max_points:
                        max_points = float(data["points"])
                        primary_category = data["tag"]

        tags = list(set(detected_tags))
        matched = list(set(matched_words))

        if max_points >= 20.0:
            coercion = "CRITICAL"
            advisory = f"High-confidence threat event detected ({primary_category}). Initiate immediate emergency dispatch."
        elif max_points >= 10.0:
            coercion = "ELEVATED"
            advisory = "Suspicious financial phishing or duress indicators noted. Prioritize secondary review."
        else:
            coercion = "ROUTINE"
            advisory = "Routine caller inquiry. Standard triage queue."

        return {
            "engine": "local_offline_taxonomy",
            "threat_category": primary_category,
            "threat_points": max_points,
            "coercion_level": coercion,
            "tags": tags,
            "matched_threats": matched,
            "red_flags": [f"Matched indicator: {w}" for w in matched[:3]],
            "officer_advisory": advisory
        }

    def analyze_situation(
        self,
        transcript: str,
        ser_emotions: Optional[Dict[str, float]] = None,
        pitch_std: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Analyzes the call transcript and situation using Groq Llama-3.3-70b LLM.
        Automatically falls back to local regex taxonomy if offline, timed out, or unconfigured.
        """
        if not transcript or not transcript.strip():
            return self._offline_keyword_fallback("")

        if self.client is None and not self.api_key:
            self.api_key = os.getenv("GROQ_API_KEY", "")
            if self.api_key:
                self._init_client()

        if self.client is not None:
            try:
                system_instruction = (
                    "You are an expert Indian Cybercrime Police Triage Officer analyzing an emergency helpline call. "
                    "The caller is speaking in English, Hindi, Marathi, or code-mixed Hinglish/Marathi. "
                    "Evaluate the situation for psychological coercion, impersonation (CBI, Customs, Police), "
                    "digital arrest, extortion, kidnapping, blackmail, or banking fraud. "
                    "Output STRICT JSON matching this schema:\n"
                    "{\n"
                    '  "threat_category": "#DIGITAL_ARREST_SCAM" | "#KIDNAPPING_THREAT" | "#SEXTORTION_BLACKMAIL" | "#BANKING_PHISHING" | "#GENERAL_INQUIRY",\n'
                    '  "threat_points": float between 0.0 and 25.0,\n'
                    '  "coercion_level": "CRITICAL" | "ELEVATED" | "ROUTINE",\n'
                    '  "tags": ["list of hashtag tags"],\n'
                    '  "matched_threats": ["list of specific threat elements"],\n'
                    '  "red_flags": ["1-3 brief scam tactics detected"],\n'
                    '  "officer_advisory": "1-sentence direct guidance for the police officer"\n'
                    "}"
                )

                user_content = f"Caller Transcript:\n\"{transcript}\""
                if ser_emotions:
                    user_content += f"\nAcoustic Emotion Biomarkers: {ser_emotions}"
                if pitch_std is not None:
                    user_content += f"\nVoice Pitch Volatility (Jitter): {pitch_std:.1f} Hz"

                chat_completion = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=300,
                    timeout=1.5  # Strict 1.5s timeout to guarantee real-time performance
                )

                response_text = chat_completion.choices[0].message.content
                if response_text:
                    parsed = json.loads(response_text)
                    parsed["engine"] = "groq_llama_3.3_70b"
                    # Ensure numerical threat_points is bounded 0-25
                    parsed["threat_points"] = min(25.0, max(0.0, float(parsed.get("threat_points", 0.0))))
                    if "tags" not in parsed or not parsed["tags"]:
                        parsed["tags"] = [parsed.get("threat_category", "#GENERAL_INQUIRY")]
                    return parsed

            except Exception as e:
                # If primary 70b fails or times out, try 8b-instant fast fallback once
                if self.model_name != self.fallback_model:
                    try:
                        self.model_name = self.fallback_model
                        return self.analyze_situation(transcript, ser_emotions, pitch_std)
                    except Exception:
                        pass
                print(f"[INFO] Groq Situation LLM offline or timed out ({e}). Falling back to local regex taxonomy.")

        # Immediate local fallback
        return self._offline_keyword_fallback(transcript)
