"""
Multimodal Fusion Engine: Combines Speech Emotion, Pitch Volatility, and STT Keywords into a Unified Urgency Score.
"""

from typing import Dict, List, Tuple
from backend.config import KEYWORD_TAXONOMY, CRITICAL_THRESHOLD, ELEVATED_THRESHOLD

def calculate_multimodal_urgency(
    ser_emotions: Dict[str, float], 
    pitch_std: float, 
    transcript: str
) -> Dict:
    """
    Fuses the 3 Pillars into:
    - Urgency Score (0 - 100)
    - Priority Level (CRITICAL / ELEVATED / ROUTINE)
    - Contextual Threat Tags
    """
    tags: List[str] = []

    # 1. PILLAR 1: Speech Emotion Recognition (Max 60 pts)
    p_fear = ser_emotions.get("fearful", 0.0)
    p_sad = ser_emotions.get("sad", 0.0)
    p_angry = ser_emotions.get("angry", 0.0)
    p_neutral = ser_emotions.get("neutral", 0.0)

    score_ser = (p_fear * 40.0) + (p_sad * 20.0) + (p_angry * 15.0) - (p_neutral * 20.0)
    score_ser = max(0.0, score_ser)

    if p_fear >= 0.65:
        tags.append("#ACUTE_FEAR")
    if p_sad >= 0.60:
        tags.append("#SOBBING_DISTRESS")
    if p_angry >= 0.70:
        tags.append("#HOSTILE_AGGRESSION")

    # 2. PILLAR 2: Acoustic Biomarkers & Pitch Volatility (Max 15 pts)
    score_acoustic = 0.0
    if pitch_std > 40.0:
        score_acoustic += 10.0
        tags.append("#VOCAL_TREMORS")
    if pitch_std > 65.0:
        score_acoustic += 5.0
        tags.append("#EXTREME_PITCH_JITTER")

    # 3. PILLAR 3: Speech-to-Text Keyword Match (Max 25 pts)
    score_stt = 0.0
    text_lower = transcript.lower()
    for cat_name, data in KEYWORD_TAXONOMY.items():
        if any(w in text_lower for w in data["words"]):
            score_stt = max(score_stt, float(data["points"]))
            tags.append(data["tag"])

    # 4. ACUTE DISTRESS OVERRIDE
    # If caller has high fear and sobbing, ensure they hit CRITICAL regardless of keywords
    if p_fear >= 0.80 and score_acoustic >= 10.0:
        total_score = max(80.0, score_ser + score_acoustic + score_stt)
    else:
        total_score = score_ser + score_acoustic + score_stt

    total_score = min(100.0, max(0.0, round(total_score, 1)))

    # Priority Tier
    if total_score >= CRITICAL_THRESHOLD:
        priority = "CRITICAL"
        advisory = "Active extortion or acute panic detected. Immediate intervention required."
    elif total_score >= ELEVATED_THRESHOLD:
        priority = "ELEVATED"
        advisory = "High agitation or suspected fraud. Prioritize in queue."
    else:
        priority = "ROUTINE"
        advisory = "Standard inquiry or past case report. Normal processing."

    return {
        "urgency_score": total_score,
        "priority_level": priority,
        "tags": list(set(tags)),
        "investigator_advisory": advisory,
        "components": {
            "ser_score": round(score_ser, 1),
            "acoustic_score": round(score_acoustic, 1),
            "stt_score": round(score_stt, 1)
        }
    }
