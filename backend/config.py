"""
Configuration constants, threat keyword taxonomy, and model settings.
"""

# Audio Ingestion Settings
SAMPLE_RATE = 16000  # 16 kHz Mono required by emotion2vec+ and Whisper
CHUNK_DURATION_SEC = 2.0  # Sliding window size
STRIDE_DURATION_SEC = 1.0  # Hop size between successive analyses

import os

# Automatically load .env file if present in project root
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path, "r", encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip().strip("'\""))

# Models Configuration
EMOTION_MODEL_ID = "emotion2vec/emotion2vec_plus_seed"
HF_SPACE_URL = os.getenv("HF_SPACE_URL", "rikazike/cybercrime-ser-engine")
HF_TOKEN = os.getenv("HF_TOKEN", "")  # Free Hugging Face Read Token for ZeroGPU quota
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")  # Google Gemini API Key
GEMINI_STT_MODEL = os.getenv("GEMINI_STT_MODEL", "gemini-2.5-flash")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")  # Groq LPU API Key (2,000 free requests/day, <250ms latency)
GROQ_STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")

# Urgency Thresholds
CRITICAL_THRESHOLD = 75.0
ELEVATED_THRESHOLD = 30.0

# Multilingual Cybercrime Keyword Taxonomy (English, Hindi, Marathi, Hinglish)
KEYWORD_TAXONOMY = {
    "VIOLENT_KIDNAP": {
        "words": [
            "kidnap", "ransom", "kill", "hostage", "weapon", "hurt him", "gun",
            "अपहरण", "फिरौती", "जान से मार", "मार दूंगा", "कत्ल", "गोली", "बंधक",
            "खंडणी", "मारून टाकेन", "जीवे मारण्याची धमकी", "ओलीस", "बंदूक",
            "apharan", "firoti", "jaan se maar", "maar dunga", "khandani", "marun taken"
        ],
        "tag": "#KIDNAPPING_THREAT",
        "points": 25
    },
    "DIGITAL_ARREST": {
        "words": [
            "digital arrest", "cbi", "customs", "narcotics", "skype", "illegal parcel", "mumbai police",
            "डिजिटल अरेस्ट", "डिजिटल अटक", "सीबीआई", "कस्टम्स", "नारकोटिक्स", "स्काइप", "अवैध पार्सल", "मुंबई पुलिस",
            "cbi officer", "skype call", "customs department", "drugs parcel", "money laundering", "मनी लॉन्ड्रिंग"
        ],
        "tag": "#DIGITAL_ARREST_SCAM",
        "points": 20
    },
    "SEXTORTION_BLACKMAIL": {
        "words": [
            "blackmail", "leak video", "private photos", "send money now", "expose you", "nude",
            "ब्लैकमेल", "ब्लॅकमेल", "वीडियो लीक", "व्हिडिओ लीक", "प्राइवेट फोटो", "पैसे भेजो", "फोटो व्हायरल",
            "video leak", "photo viral", "paise bhejo", "badnaam karunga", "marathi", "nude call"
        ],
        "tag": "#SEXTORTION_BLACKMAIL",
        "points": 20
    },
    "FINANCIAL_FRAUD": {
        "words": [
            "otp", "cvv", "anydesk", "teamviewer", "account blocked", "urgent transfer", "electricity bill",
            "ओटीपी", "खाते ब्लॉक", "बैंक खाता", "पिन नंबर", "खाते बंद", "पैसे पाठवा", "ओटीपी सांगा",
            "khata block", "otp batao", "paisa transfer", "account freeze", "quicksupport"
        ],
        "tag": "#BANKING_PHISHING",
        "points": 10
    }
}
