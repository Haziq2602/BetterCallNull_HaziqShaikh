"""
Multimodal Fusion Engine v2: Calibrated 3-Pillar Urgency Scoring with Corroboration.

Architecture:
    Pillar 1 (SER emotion2vec+)  →  0-40 pts  (40% weight — main witness)
    Pillar 2 (Acoustic DSP)      →  0-20 pts  (20% weight — forensic expert)
    Pillar 3 (STT Keywords)      →  0-25 pts  (25% weight — written evidence)
    Corroboration Multiplier     →  x1.0 – x1.30 (convergent evidence boost)
    Calm Anchor                  →  smooth damping when all pillars show calm

Design Principles:
    - Each pillar can independently reach its stated maximum with realistic inputs.
    - No neutral penalty — replaced by a calm anchor that only activates when ALL
      pillars agree the caller is calm, preventing false suppression of distressed callers.
    - Corroboration multiplier rewards convergent evidence: when 2+ independent signal
      sources agree there is distress, the score is boosted. This is the primary mechanism
      for suppressing single-pillar hallucination (e.g. emotion2vec says 'sad' on a sine wave)
      while amplifying genuine multi-signal distress.
"""

from typing import Dict, List
import re
from backend.config import KEYWORD_TAXONOMY, CRITICAL_THRESHOLD, ELEVATED_THRESHOLD


def _compute_pillar1_ser(ser_emotions: Dict[str, float]) -> tuple:
    """
    Pillar 1: Speech Emotion Recognition → 0-40 pts.

    Maps distress emotions (fear, sad, angry) to a composite distress intensity.
    Uses a weighted blend where fear is the primary distress indicator (it directly
    signals danger/coercion), sadness is secondary (grief, loss, victim crying),
    and anger is tertiary (hostility, frustration, confrontation).

    No neutral penalty. Instead, the calm anchor handles calm callers holistically.
    """
    p_fear = max(0.0, float(ser_emotions.get("fearful", 0.0)))
    p_sad = max(0.0, float(ser_emotions.get("sad", 0.0)))
    p_angry = max(0.0, float(ser_emotions.get("angry", 0.0)))

    # Weighted distress composite: fear is strongest, sadness is next, anger follows.
    # These coefficients are chosen so that:
    #   80% fear alone → ~32 pts (strong ELEVATED signal)
    #   75% fear + 50% sad → ~38 pts (near max)
    #   65% sad alone → ~19.5 pts (meaningful ELEVATED signal)
    #   100% fear → 40 pts (theoretical max, rare in practice)
    distress_raw = (p_fear * 40.0) + (p_sad * 30.0) + (p_angry * 20.0)

    # Soft ceiling at 40 using a saturation curve: prevents a single extreme emotion
    # from overshooting, while still allowing strong combined distress to reach 40.
    MAX_SER = 40.0
    if distress_raw <= 0:
        score = 0.0
    elif distress_raw >= MAX_SER:
        score = MAX_SER
    else:
        score = distress_raw

    score = min(MAX_SER, max(0.0, score))

    # Determine if this pillar is "active" (contributing meaningful distress signal)
    # Threshold: any single distress emotion >= 30% OR combined distress score >= 12
    pillar_active = (p_fear >= 0.30 or p_sad >= 0.30 or p_angry >= 0.30 or score >= 12.0)

    # Generate contextual tags
    tags = []
    if p_fear >= 0.55:
        tags.append("#ACUTE_FEAR")
    if p_sad >= 0.50:
        tags.append("#SOBBING_DISTRESS")
    if p_angry >= 0.60:
        tags.append("#HOSTILE_AGGRESSION")

    return score, pillar_active, tags


def _compute_pillar2_acoustic(pitch_std: float) -> tuple:
    """
    Pillar 2: Acoustic Biomarkers & Pitch Volatility → 0-20 pts.

    Uses a continuous mapping instead of binary thresholds. Pitch standard deviation
    is a physiological signal that the caller cannot consciously fake — vocal fold
    tremors under stress are involuntary.

    Mapping (calibrated against tested cases):
        0-15 Hz  → 0 pts  (stable, calm conversation)
        15-25 Hz → 0-5 pts (slight agitation)
        25-40 Hz → 5-12 pts (moderate stress, elevated pitch variation)
        40-55 Hz → 12-17 pts (high stress, vocal tremors)
        55+ Hz   → 17-20 pts (extreme jitter, acute panic)
    """
    pitch_std = max(0.0, float(pitch_std))

    if pitch_std <= 15.0:
        score = 0.0
    elif pitch_std <= 25.0:
        # Linear ramp: 15→0, 25→5
        score = ((pitch_std - 15.0) / 10.0) * 5.0
    elif pitch_std <= 40.0:
        # Linear ramp: 25→5, 40→12
        score = 5.0 + ((pitch_std - 25.0) / 15.0) * 7.0
    elif pitch_std <= 55.0:
        # Linear ramp: 40→12, 55→17
        score = 12.0 + ((pitch_std - 40.0) / 15.0) * 5.0
    else:
        # Linear ramp: 55→17, 80→20 (capped)
        score = 17.0 + min(3.0, ((pitch_std - 55.0) / 25.0) * 3.0)

    MAX_ACOUSTIC = 20.0
    score = min(MAX_ACOUSTIC, max(0.0, score))

    # Active when pitch_std shows meaningful agitation (>20 Hz)
    pillar_active = pitch_std > 20.0

    tags = []
    if pitch_std > 35.0:
        tags.append("#VOCAL_TREMORS")
    if pitch_std > 60.0:
        tags.append("#EXTREME_PITCH_JITTER")

    return score, pillar_active, tags


def _compute_pillar3_stt(transcript: str) -> tuple:
    """
    Pillar 3: Speech-to-Text Keyword Threat Taxonomy → 0-25 pts.

    Scans the transcript for cybercrime-specific vocabulary. Points accumulate
    across multiple matched categories (capped at 25), rewarding transcripts that
    mention multiple crime indicators.
    """
    if not transcript or not transcript.strip():
        return 0.0, False, [], []

    text_clean = re.sub(r"[^a-zA-Z0-9\s]", " ", transcript.lower())

    detected_tags = []
    matched_words = []
    accumulated_points = 0.0

    for _cat_name, data in KEYWORD_TAXONOMY.items():
        cat_matched = False
        for phrase in data["words"]:
            pattern = r"\b" + re.escape(phrase.lower()) + r"\b"
            if re.search(pattern, text_clean):
                if not cat_matched:
                    detected_tags.append(data["tag"])
                    accumulated_points += float(data["points"])
                    cat_matched = True
                matched_words.append(phrase)

    MAX_STT = 25.0
    score = min(MAX_STT, accumulated_points)

    pillar_active = score > 0.0

    return score, pillar_active, detected_tags, matched_words


def calculate_multimodal_urgency(
    ser_emotions: Dict[str, float],
    pitch_std: float,
    transcript: str
) -> Dict:
    """
    Fuses the 3 Pillars into:
        - Urgency Score (0 – 100)
        - Priority Level (CRITICAL / ELEVATED / ROUTINE)
        - Contextual Threat Tags
        - Investigator Advisory
        - Per-pillar component breakdown
    """

    # ── Compute each pillar independently ──────────────────────────────
    score_ser, ser_active, ser_tags = _compute_pillar1_ser(ser_emotions)
    score_acoustic, acoustic_active, acoustic_tags = _compute_pillar2_acoustic(pitch_std)
    score_stt, stt_active, stt_tags, matched_words = _compute_pillar3_stt(transcript)

    tags = ser_tags + acoustic_tags + stt_tags

    # ── Base score: sum of calibrated pillar scores (max 85) ───────────
    base_score = score_ser + score_acoustic + score_stt

    # ── Corroboration Multiplier ───────────────────────────────────────
    # When multiple independent signal sources agree there is distress,
    # we boost the score. This is the key anti-hallucination mechanism:
    # a single pillar firing alone (e.g. emotion2vec says "sad" on noise)
    # gets NO boost, while genuine distress that triggers 2-3 pillars
    # gets amplified to appropriate urgency levels.
    active_count = sum([ser_active, acoustic_active, stt_active])

    if active_count >= 3:
        # All 3 witnesses agree: strong corroboration
        corroboration = 1.30
        tags.append("#MULTI_SIGNAL_CORROBORATION")
    elif active_count == 2:
        # 2 witnesses agree: moderate corroboration
        corroboration = 1.15
    else:
        # Single pillar or none: no boost (suppresses hallucination)
        corroboration = 1.0

    boosted_score = base_score * corroboration

    # ── Calm Anchor ────────────────────────────────────────────────────
    # Instead of penalizing neutral emotion (which caused false suppression),
    # we apply a smooth damping ONLY when ALL pillars unanimously indicate calm:
    #   - Emotion is predominantly neutral/happy
    #   - Pitch is stable (low std dev)
    #   - No threat keywords detected
    # This prevents a genuinely calm inquiry from scoring artificially high
    # due to minor noise in any single pillar.
    p_neutral = float(ser_emotions.get("neutral", 0.0))
    p_happy = float(ser_emotions.get("happy", 0.0))
    calm_emotion = (p_neutral + p_happy) > 0.70
    calm_pitch = pitch_std < 18.0
    calm_words = not stt_active

    if calm_emotion and calm_pitch and calm_words:
        # All signals agree: caller is calm. Apply smooth damping.
        # This brings a noisy 15-pt score down to ~7-8, keeping it ROUTINE.
        calm_factor = 0.5
        boosted_score = boosted_score * calm_factor

    # ── Final score clamp ──────────────────────────────────────────────
    total_score = min(100.0, max(0.0, round(boosted_score, 1)))

    # ── Priority Tier & Advisory ───────────────────────────────────────
    if total_score >= CRITICAL_THRESHOLD:
        priority = "CRITICAL"
        # Generate context-specific advisory based on which crime tags are present
        if any("#KIDNAPPING_THREAT" in t for t in tags):
            advisory = "Active kidnapping or hostage situation detected. Deploy rapid response unit immediately."
        elif any("#DIGITAL_ARREST" in t for t in tags):
            advisory = "Digital arrest scam in progress. Instruct caller to disconnect from scammer and do NOT transfer funds."
        elif any("#SEXTORTION" in t for t in tags):
            advisory = "Sextortion/blackmail coercion detected. Escalate to cyber unit, preserve evidence."
        else:
            advisory = "Acute vocal distress with multi-signal corroboration. Immediate intervention required."
    elif total_score >= ELEVATED_THRESHOLD:
        priority = "ELEVATED"
        if stt_active:
            advisory = "Suspected cybercrime activity with threat keywords detected. Prioritize in queue and assign investigator."
        else:
            advisory = "Elevated vocal agitation detected. Monitor closely and prepare for potential escalation."
    else:
        priority = "ROUTINE"
        advisory = "Standard inquiry or past case report. Normal processing queue."

    return {
        "urgency_score": total_score,
        "priority_level": priority,
        "tags": list(set(tags)),
        "investigator_advisory": advisory,
        "matched_keywords": matched_words if matched_words else [],
        "components": {
            "ser_score": round(score_ser, 1),
            "acoustic_score": round(score_acoustic, 1),
            "stt_score": round(score_stt, 1),
            "corroboration": corroboration,
            "active_pillars": active_count
        }
    }

