"""
Multimodal Urgency Engine: Mathematically Calibrated 3-Pillar Fusion.
Combines:
  1. The Voice Tone (Pillar 1: Speech Emotion Recognition via emotion2vec+)
  2. The Physical Body (Pillar 2: Acoustic Vocal Fold Tremors via SciPy DSP)
  3. The Words Spoken (Pillar 3: Hybrid Groq LLM + Indic Keyword Taxonomy)

Mathematical Core:
  - Phase 1: Continuous Normalization into [0.0, 1.0] using Physiological Sigmoidal Curves
  - Phase 2: Synergistic Agreement Bonus (Consensus Resonance Tensor)
  - Phase 3: Smooth Speedometer Logistic Curve to [0.0, 100.0]
"""

from typing import Dict, List, Optional, Any
import math
import re
from backend.config import KEYWORD_TAXONOMY, CRITICAL_THRESHOLD, ELEVATED_THRESHOLD


def _compute_pillar1_ser(ser_emotions: Dict[str, float]) -> tuple:
    """
    Pillar 1: Speech Emotion Recognition → Normalized Score [0.0, 1.0].
    Models emotional distress via Valence-Arousal Projection with smooth calm damping.
    """
    p_fear = max(0.0, float(ser_emotions.get("fearful", 0.0)))
    p_sad = max(0.0, float(ser_emotions.get("sad", 0.0)))
    p_angry = max(0.0, float(ser_emotions.get("angry", 0.0)))
    p_neutral = max(0.0, float(ser_emotions.get("neutral", 0.0)))

    # Weighted distress composite: Fear tracks acute life threat, Sad tracks victim weeping, Anger tracks confrontation
    raw_distress = (p_fear * 1.0) + (p_sad * 0.75) + (p_angry * 0.50)

    # Calm damping: smooth denominator avoids false alarms on background crying or TV noise
    calm_damping = 1.0 + (0.8 * p_neutral)
    s_emo = min(1.0, max(0.0, raw_distress / calm_damping))

    pillar_active = s_emo >= 0.25

    tags = []
    if p_fear >= 0.50:
        tags.append("#ACUTE_FEAR")
    if p_sad >= 0.45:
        tags.append("#SOBBING_DISTRESS")
    if p_angry >= 0.55:
        tags.append("#HOSTILE_AGGRESSION")

    return s_emo, pillar_active, tags


def _compute_pillar2_acoustic(pitch_std: float) -> tuple:
    """
    Pillar 2: Acoustic Biomarkers & Pitch Volatility → Normalized Score [0.0, 1.0].
    Uses Richards' Physiological Vocal Fold Tremor Curve (involuntary adrenaline tremor).
    """
    pitch_std = max(0.0, float(pitch_std))

    if pitch_std <= 12.0:
        # Stable conversational voice: zero tremor
        s_acoust = 0.0
    else:
        # Generalized Richards growth curve inflection at 32 Hz
        raw_acoust = 1.0 / (1.0 + math.exp(-0.09 * (pitch_std - 32.0)))
        s_acoust = min(1.0, max(0.0, (raw_acoust - 0.14) / 0.86))

    pillar_active = s_acoust >= 0.25

    tags = []
    if pitch_std >= 35.0:
        tags.append("#VOCAL_TREMORS")
    if pitch_std >= 55.0:
        tags.append("#EXTREME_PITCH_JITTER")

    return s_acoust, pillar_active, tags


def _compute_pillar3_stt(transcript: str) -> tuple:
    """
    Pillar 3: Speech-to-Text Keyword Threat Taxonomy → Normalized Score [0.0, 1.0].
    Scans multilingual vocabulary (English, Hindi, Marathi, Hinglish).
    """
    if not transcript or not transcript.strip():
        return 0.0, False, [], []

    # Preserve alphanumeric, whitespace, and Devanagari Unicode (\u0900-\u097F)
    text_clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", transcript.lower())
    padded_text = f" {text_clean} "

    detected_tags = []
    matched_words = []
    accumulated_points = 0.0

    for _cat_name, data in KEYWORD_TAXONOMY.items():
        cat_matched = False
        for phrase in data["words"]:
            phrase_clean = phrase.lower().strip()
            if any(0x0900 <= ord(c) <= 0x097F for c in phrase_clean):
                is_match = f" {phrase_clean} " in padded_text
            else:
                pattern = r"\b" + re.escape(phrase_clean) + r"\b"
                is_match = bool(re.search(pattern, text_clean))

            if is_match:
                if not cat_matched:
                    detected_tags.append(data["tag"])
                    accumulated_points += float(data["points"])
                    cat_matched = True
                matched_words.append(phrase)

    s_threat = min(1.0, max(0.0, accumulated_points / 25.0))
    pillar_active = s_threat > 0.0

    return s_threat, pillar_active, detected_tags, matched_words


def calculate_multimodal_urgency(
    ser_emotions: Dict[str, float],
    pitch_std: float,
    transcript: str,
    situation_assessment: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Fuses the 3 Pillars using the "Three Specialists Agreement" mathematical model:
        1. Normalized Component Assessment (Emotion, Vocal Tremors, Threat Words)
        2. Synergistic Cross-Modal Resonance Bonus
        3. Smooth Speedometer Logistic Curve to [0, 100]
    """
    # ── Phase 1: Compute normalized score for each specialist [0.0, 1.0] ──
    s_emo, ser_active, ser_tags = _compute_pillar1_ser(ser_emotions)
    s_acoust, acoustic_active, acoustic_tags = _compute_pillar2_acoustic(pitch_std)

    if situation_assessment:
        pts = float(situation_assessment.get("threat_points", 0.0))
        s_threat = min(1.0, max(0.0, pts / 25.0))
        stt_active = s_threat > 0.0
        stt_tags = situation_assessment.get("tags", [])
        matched_words = situation_assessment.get("matched_threats", [])
    else:
        s_threat, stt_active, stt_tags, matched_words = _compute_pillar3_stt(transcript)

    tags = ser_tags + acoustic_tags + stt_tags

    # ── Phase 2: Core Evidence & Teamwork Agreement Bonus ──────────────
    # Base weighted linear evidence
    u_core = (0.35 * s_emo) + (0.25 * s_acoust) + (0.40 * s_threat)

    # Three Specialists Agreement Bonus:
    # When all 3 specialists agree, geometric mean adds a potent synergy boost!
    triple_consensus = (s_emo * s_acoust * s_threat) ** (1.0 / 3.0)
    # When 2 specialists agree strongly:
    pair_consensus = max(s_emo * s_acoust, s_emo * s_threat, s_acoust * s_threat) ** 0.5

    synergy = (0.20 * triple_consensus) + (0.05 * pair_consensus)

    active_count = sum([ser_active, acoustic_active, stt_active])
    if active_count >= 3:
        tags.append("#MULTI_SIGNAL_CORROBORATION")

    u_fused = min(1.0, u_core + synergy)

    # ── Phase 3: Speedometer Logistic Curve (0 to 100) ─────────────────
    # Smooth S-curve with zero artificial cliffs or clipping distortion
    raw_score = 100.0 / (1.0 + math.exp(-6.5 * (u_fused - 0.42)))
    total_score = round(min(100.0, max(5.0, raw_score)), 1)

    # ── Priority Tier & Actionable Police Advisory ─────────────────────
    if total_score >= CRITICAL_THRESHOLD:
        priority = "CRITICAL"
        if any("#KIDNAPPING_THREAT" in t for t in tags):
            advisory = "Active kidnapping or hostage situation detected. Deploy rapid response unit immediately."
        elif any("#DIGITAL_ARREST" in t for t in tags):
            advisory = "Digital arrest scam in progress. Instruct caller to disconnect from scammer and do NOT transfer funds."
        elif any("#SEXTORTION" in t for t in tags):
            advisory = "Sextortion/blackmail coercion detected. Escalate to cyber unit, preserve evidence."
        else:
            advisory = "Acute multi-signal distress detected across voice tremors and emotional terror. Immediate intervention required."
    elif total_score >= ELEVATED_THRESHOLD:
        priority = "ELEVATED"
        if stt_active:
            advisory = "Suspected cybercrime activity with threat keywords detected. Prioritize in queue and assign investigator."
        else:
            advisory = "Elevated vocal agitation and stress detected. Monitor closely and prepare for potential escalation."
    else:
        priority = "ROUTINE"
        advisory = "Standard inquiry or past case report. Normal processing queue."

    # Use LLM-generated situational guidance if available
    if situation_assessment and situation_assessment.get("officer_advisory"):
        advisory = situation_assessment["officer_advisory"]

    return {
        "urgency_score": total_score,
        "priority_level": priority,
        "tags": list(set(tags)),
        "investigator_advisory": advisory,
        "red_flags": situation_assessment.get("red_flags", []) if situation_assessment else [],
        "matched_keywords": matched_words if matched_words else [],
        "components": {
            "ser_score": round(s_emo * 40.0, 1),
            "acoustic_score": round(s_acoust * 20.0, 1),
            "stt_score": round(s_threat * 25.0, 1),
            "synergy_bonus": round(synergy * 100.0, 1),
            "active_pillars": active_count
        }
    }
