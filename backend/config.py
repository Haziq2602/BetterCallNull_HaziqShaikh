"""
Configuration constants, threat keyword taxonomy, and model settings.
"""

# Audio Ingestion Settings
SAMPLE_RATE = 16000  # 16 kHz Mono required by emotion2vec+ and Whisper
CHUNK_DURATION_SEC = 2.0  # Sliding window size
STRIDE_DURATION_SEC = 1.0  # Hop size between successive analyses

import os

# Models Configuration
EMOTION_MODEL_ID = "emotion2vec/emotion2vec_plus_seed"
HF_SPACE_URL = os.getenv("HF_SPACE_URL", "rikazike/cybercrime-ser-engine")
HF_TOKEN = os.getenv("HF_TOKEN", "")  # Free Hugging Face Read Token for ZeroGPU quota
WHISPER_MODEL_SIZE = "tiny.en"  # Fast CPU transcription

# Urgency Thresholds
CRITICAL_THRESHOLD = 75.0
ELEVATED_THRESHOLD = 45.0

# Cybercrime Keyword Taxonomy mapped to Threat Tags and Risk Points
KEYWORD_TAXONOMY = {
    "VIOLENT_KIDNAP": {
        "words": ["kidnap", "ransom", "kill", "hostage", "weapon", "hurt him", "gun"],
        "tag": "#KIDNAPPING_THREAT",
        "points": 25
    },
    "DIGITAL_ARREST": {
        "words": ["digital arrest", "cbi", "customs", "narcotics", "skype", "illegal parcel", "mumbai police"],
        "tag": "#DIGITAL_ARREST_SCAM",
        "points": 20
    },
    "SEXTORTION_BLACKMAIL": {
        "words": ["blackmail", "leak video", "private photos", "send money now", "expose you"],
        "tag": "#SEXTORTION_BLACKMAIL",
        "points": 20
    },
    "FINANCIAL_FRAUD": {
        "words": ["otp", "cvv", "anydesk", "teamviewer", "account blocked", "urgent transfer"],
        "tag": "#BANKING_PHISHING",
        "points": 10
    }
}
