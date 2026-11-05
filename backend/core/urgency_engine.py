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


def _compute_pillar1_ser(ser_emotions: Optional[Dict[str, float]], ser_status: str = "SUCCESS") -> tuple:
    """
    Pillar 1: Speech Emotion Recognition → Normalized Score [0.0, 1.0].
    Models emotional distress via Valence-Arousal Projection with smooth calm damping.
    """
    if ser_status != "SUCCESS" or not ser_emotions:
        return 0.0, False, []

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
    Features contextual intelligence:
      - Negation handling: Detects phrases like "no ransom", "not a kidnapping", "never threatened".
      - Historical incident detection: Distinguishes ongoing threats from resolved/past cases
        ("threatened last year", "old FIR status") to prevent false emergencies.
    """
    if not transcript or not transcript.strip():
        return 0.0, False, [], [], "INSUFFICIENT_EVIDENCE"

    # Preserve alphanumeric, whitespace, and Devanagari Unicode (\u0900-\u097F)
    text_clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", transcript.lower())
    padded_text = f" {text_clean} "

    # Negation and Historical Context Regex Patterns
    negation_prefix = r"\b(no|not|never|without|didn't|did not|wasn't|was not|nahin?|fake|don't have|no one)\b\s+(?:\w+\s+){0,2}"
    historical_patterns = [
        r"\blast year\b", r"\blast month\b", r"\bmonths ago\b", r"\byears ago\b",
        r"\bपिछले साल\b", r"\bमागच्या वर्षी\b", r"\bin 202[0-4]\b", r"\bpast complaint\b",
        r"\balready resolved\b", r"\bprevious fir\b", r"\bold case\b", r"\bfir status\b",
        r"\bfollowing up\b", r"\bwas recorded\b"
    ]

    is_overall_historical = any(bool(re.search(pat, text_clean)) for pat in historical_patterns)

    detected_tags = []
    matched_words = []
    accumulated_points = 0.0
    has_active_threat = False

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
                # 1. Check for local negation (e.g., "no ransom", "not digital arrest")
                is_negated = bool(re.search(negation_prefix + re.escape(phrase_clean), text_clean))

                if is_negated:
                    if "#NEGATED_CONTEXT" not in detected_tags:
                        detected_tags.append("#NEGATED_CONTEXT")
                    matched_words.append(f"{phrase} (negated)")
                    continue  # Zero points for negated threats

                matched_words.append(phrase)

                # 2. Check for historical context ("threatened last year")
                if is_overall_historical:
                    if "#HISTORICAL_INCIDENT" not in detected_tags:
                        detected_tags.append("#HISTORICAL_INCIDENT")
                    # Heavily discount historical threats (75% discount)
                    if not cat_matched:
                        accumulated_points += float(data["points"]) * 0.25
                        detected_tags.append(data["tag"] + "_PAST")
                        cat_matched = True
                else:
                    # Active contemporary threat
                    has_active_threat = True
                    if not cat_matched:
                        detected_tags.append(data["tag"])
                        accumulated_points += float(data["points"])
                        cat_matched = True

    s_threat = min(1.0, max(0.0, accumulated_points / 25.0))
    pillar_active = s_threat > 0.0

    threat_status = "ACTIVE_THREAT" if has_active_threat else ("HISTORICAL_OR_NEGATED" if detected_tags else "NO_THREAT_KEYWORDS")

    return s_threat, pillar_active, detected_tags, matched_words, threat_status


def calculate_multimodal_urgency(
    ser_emotions: Optional[Dict[str, float]],
    pitch_std: float,
    transcript: str,
    situation_assessment: Optional[Dict[str, Any]] = None,
    ser_status: str = "SUCCESS"
) -> Dict:
    """
    Fuses the 3 Pillars using the "Three Specialists Agreement" mathematical model:
        1. Normalized Component Assessment (Emotion, Vocal Tremors, Threat Words)
        2. Synergistic Cross-Modal Resonance Bonus
        3. Smooth Speedometer Logistic Curve to [0, 100]
    Gracefully handles unavailable SER (falls back to 2-pillar DSP + STT fusion).
    """
    # ── Phase 1: Compute normalized score for each specialist [0.0, 1.0] ──
    s_emo, ser_active, ser_tags = _compute_pillar1_ser(ser_emotions, ser_status)
    s_acoust, acoustic_active, acoustic_tags = _compute_pillar2_acoustic(pitch_std)

    if situation_assessment:
        pts = float(situation_assessment.get("threat_points", 0.0))
        s_threat = min(1.0, max(0.0, pts / 25.0))
        stt_active = s_threat > 0.0
        stt_tags = situation_assessment.get("tags", [])
        matched_words = situation_assessment.get("matched_threats", [])
        threat_status = "ACTIVE_THREAT" if stt_active else "NO_THREAT_KEYWORDS"
    else:
        s_threat, stt_active, stt_tags, matched_words, threat_status = _compute_pillar3_stt(transcript)

    tags = ser_tags + acoustic_tags + stt_tags

    # ── Phase 2: Core Evidence & Teamwork Agreement Bonus ──────────────
    ser_available = (ser_status == "SUCCESS" and bool(ser_emotions))

    if ser_available:
        # Full 3-Pillar Fusion
        u_core = (0.35 * s_emo) + (0.25 * s_acoust) + (0.40 * s_threat)
        triple_consensus = (s_emo * s_acoust * s_threat) ** (1.0 / 3.0)
        pair_consensus = max(s_emo * s_acoust, s_emo * s_threat, s_acoust * s_threat) ** 0.5
        synergy = (0.20 * triple_consensus) + (0.05 * pair_consensus)

        active_count = sum([ser_active, acoustic_active, stt_active])
        if active_count >= 3:
            tags.append("#MULTI_SIGNAL_CORROBORATION")
    else:
        # 2-Pillar Fusion: Rescale weights across Acoustic and STT (0.40 + 0.60 = 1.0)
        u_core = (0.40 * s_acoust) + (0.60 * s_threat)
        pair_consensus = (s_acoust * s_threat) ** 0.5
        synergy = 0.15 * pair_consensus

        active_count = sum([acoustic_active, stt_active])
        if active_count >= 2:
            tags.append("#MULTI_SIGNAL_CORROBORATION")

    u_fused = min(1.0, u_core + synergy)

    # ── Phase 3: Speedometer Logistic Curve (0 to 100) ─────────────────
    raw_score = 100.0 / (1.0 + math.exp(-6.5 * (u_fused - 0.42)))
    total_score = round(min(100.0, max(5.0, raw_score)), 1)

    # ── Phase 4: Calibrated Evidence Triage & Priority Classification ──
    # Evidence Confidence Assessment
    clean_text = transcript.strip() if transcript else ""
    if not clean_text or clean_text in ["...", "(No distinct voice speech recognized)"]:
        if not ser_available and not acoustic_active:
            confidence_level = "INSUFFICIENT_EVIDENCE"
        else:
            confidence_level = "LOW_CONFIDENCE_AUDIO_ONLY"
    elif ser_available and (stt_active or acoustic_active):
        confidence_level = "HIGH_CONFIDENCE"
    else:
        confidence_level = "MODERATE_CONFIDENCE"

    # RULE 1: Emotion / Acoustic distress alone without cybercrime keywords CANNOT trigger CRITICAL
    if s_threat == 0.0:
        if total_score >= CRITICAL_THRESHOLD:
            total_score = 65.0  # Capped at Elevated ceiling
            tags.append("#UNVERIFIED_THREAT_DISTRESS")

    # RULE 2: Overwhelming cybercrime threat points (points >= 17.5 / s_threat >= 0.70)
    # triggers CRITICAL triage even if the citizen is speaking calmly (e.g. calm digital arrest report)
    if s_threat >= 0.70 and threat_status == "ACTIVE_THREAT":
        if total_score < CRITICAL_THRESHOLD:
            total_score = max(total_score, 78.0)

    # Final Priority Assignment & Actionable Evidence Justification
    if confidence_level == "INSUFFICIENT_EVIDENCE":
        priority = "INSUFFICIENT_EVIDENCE"
        total_score = 10.0
        advisory = "Channel active but insufficient speech or vocal evidence available for triage."
        evidence_justification = "Insufficient evidence: Audio stream has zero speech words or recognizable biometric signals."
    elif total_score >= CRITICAL_THRESHOLD:
        priority = "CRITICAL"
        if any("#KIDNAPPING_THREAT" in t for t in tags):
            advisory = "Active kidnapping or hostage situation detected. Deploy rapid response unit immediately."
        elif any("#DIGITAL_ARREST" in t for t in tags):
            advisory = "Digital arrest scam in progress. Instruct caller to disconnect from scammer and do NOT transfer funds."
        elif any("#SEXTORTION" in t for t in tags):
            advisory = "Sextortion/blackmail coercion detected. Escalate to cyber unit, preserve evidence."
        else:
            advisory = "Acute multi-signal cybercrime distress detected. Immediate intervention required."
        evidence_justification = f"Critical triage: Active cybercrime threat confirmed ({', '.join(stt_tags) if stt_tags else 'Severe Coercion'}) with corroborating distress biomarkers."
    elif total_score >= ELEVATED_THRESHOLD:
        priority = "ELEVATED"
        if stt_active:
            advisory = "Suspected cybercrime activity with threat keywords detected. Prioritize in queue and assign investigator."
            evidence_justification = f"Elevated triage: Cybercrime keywords identified ({', '.join(stt_tags)}). Secondary review required."
        else:
            advisory = "Elevated vocal agitation and stress detected without explicit cybercrime keywords. Monitor closely."
            evidence_justification = "Elevated triage: Vocal/acoustic distress noted, but zero extortion or crime keywords detected."
    else:
        priority = "ROUTINE"
        advisory = "Standard inquiry or past case report. Normal processing queue."
        evidence_justification = "Routine triage: No active cybercrime coercion or anomalous vocal biomarkers detected."

    # Use LLM-generated situational guidance if available
    if situation_assessment and situation_assessment.get("officer_advisory"):
        advisory = situation_assessment["officer_advisory"]

    return {
        "urgency_score": total_score,
        "priority_level": priority,
        "evidence_confidence": confidence_level,
        "evidence_justification": evidence_justification,
        "threat_status": threat_status,
        "tags": list(set(tags)),
        "investigator_advisory": advisory,
        "red_flags": situation_assessment.get("red_flags", []) if situation_assessment else [],
        "matched_keywords": matched_words if matched_words else [],
        "signals": {
            "threat_severity": round(s_threat * 100.0, 1),
            "emotional_distress": round(s_emo * 100.0, 1),
            "acoustic_biomarkers": round(s_acoust * 100.0, 1),
            "evidence_confidence": confidence_level
        },
        "components": {
            "ser_score": round(s_emo * 35.0, 1) if ser_available else 0.0,
            "ser_status": ser_status,
            "acoustic_score": round(s_acoust * (25.0 if ser_available else 35.0), 1),
            "stt_score": round(s_threat * (40.0 if ser_available else 65.0), 1),
            "synergy_bonus": round(synergy * 100.0, 1),
            "active_pillars": active_count
        }
    }
