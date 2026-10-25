# CyberGuard: Multimodal Speech Emotion & Triage Console for Cybercrime Investigations

> 🌐 **Live Cloud Deployment:** [CyberGuard - Real-Time Speech Emotion & Call Triage Console](https://cyberguard-5jw9.onrender.com/)

An AI-powered decision-support and dispatch prioritization console designed for cybercrime helplines (**1930 / 112**) and forensic investigation units. The system analyzes live incoming distress calls and recorded wiretaps to detect vocal panic biomarkers, assess caller urgency in real time, extract extortion context, and prioritize high-risk incidents for immediate police intervention.

---

## 1. Problem Statement & Operational Alignment

* **Target Users:** Cybercrime Police Dispatchers, Emergency Response Officers, and Forensic Audio Analysts.
* **Core Pain Point:** In high-volume emergency queues (e.g., National Cyber Crime Reporting Portal helplines), dispatchers face severe cognitive fatigue. Distinguishing genuine life-threatening duress from routine status inquiries often causes critical response delays during ongoing financial drain or extortion.
* **Our Solution:** A synchronized **3-Pillar Multimodal Architecture** that simultaneously evaluates:
  1. **How they sound emotionally (Acoustic SER):** Vocal signatures of terror, grief/crying, rage, and baseline calm.
  2. **How their vocal cords physically behave (DSP Biomarkers):** Pitch instability ($F_0$ jitter), vocal fold tremor spasms, and whispering dynamics under duress.
  3. **What they are saying (Threat Intelligence):** Multilingual speech-to-text combined with cloud situation analysis and local regex taxonomy matching cybercrime extortion tactics (*"digital arrest"*, *"CBI"*, *"ransom"*, *"OTP"*, *"पार्सल"*, *"खंडणी"*).
* **Responsible AI & Decision-Support Framing:** Predictions serve as assistive triage indicators to rank emergency queues and focus investigator attention—they do **not** constitute definitive legal evidence of guilt, innocence, or judicial truthfulness.

---

## 2. System Architecture & Dual-Mode Workflow

```
                                  [ AUDIO INPUT STREAM ]
                     (Live WebRTC/WebSocket PCM OR Forensic Case Audio)
                                             │
                                             ▼
                        [ AUDIO INGESTION & BUFFER PIPELINE ]
                             - Resample to 16 kHz Mono (zero-loss)
                             - Energy & ZCR Noise Gate
                             - 2.0s Sliding Window Buffer (1.0s hop)
                                             │
          ┌──────────────────────────────────┼──────────────────────────────────┐
          ▼                                  ▼                                  ▼
    [ PILLAR 1: SER ]              [ PILLAR 2: ACOUSTICS ]            [ PILLAR 3: THREAT INTEL ]
     emotion2vec+                   SciPy & NumPy DSP                  Groq LPU Whisper + Qwen
    (Vocal Emotion)                (Physical Vocal Tremor)            (Multilingual Threat Extraction)
          │                                  │                                  │
    • Fear / Panic: 86%            • Pitch Jitter: 52 Hz              • Language: EN / HI / MR
    • Sadness / Crying: 64%        • Tremor Spikes: Detected          • Cloud LLM: Extortion Detected
    • Neutral: 04%                 • Volume: Suppressed Whisper       • Fallback: Local Regex Taxonomy
          │                                  │                                  │
          └──────────────────────────────────┼──────────────────────────────────┘
                                             ▼
                        [ MULTIMODAL FUSION & CONSENSUS ENGINE ]
                                             │
                                  Linear Evidence (w_e, w_a, w_t)
                                             +
                                  Geometric Synergy Resonance
                                             +
                               Richards' Non-Linear S-Curve (0-100)
                                             │
              ┌──────────────────────────────┴──────────────────────────────┐
              ▼                                                             ▼
     [ DYNAMIC URGENCY SCORE ]                                     [ ACTIONABLE INTELLIGENCE ]
      Score: 94/100                                                 Category: Digital Arrest
      Priority: 🔴 CRITICAL                                         Tags: #DIGITAL_ARREST, #ACUTE_PANIC
      Escalation: Immediate Intervention                            Advisory: "Issue immediate bank freeze."
                                             │
                                             ▼
                       [ REAL-TIME OFFICER COMMAND DASHBOARD ]
                   (Frosted Glass Dark Console, Live Waveform, Queue)
```

---

## 3. The 3 Analytical Pillars

### Pillar 1: Speech Emotion Recognition (SER)
* **Foundation Model:** `emotion2vec+` (Seed variant) by Alibaba / FunASR (ACL 2024 SOTA).
* **Hosting:** Deployed on an authenticated Hugging Face ZeroGPU Space (`rikazike/cybercrime-ser-engine`) accessed via `gradio_client` with low-latency streaming and local acoustic fallback.
* **Emotions Tracked:** `fearful`, `sad` (crying/grief), `angry`, `surprised`, `neutral`.
* **Output:** Normalized probability distribution across frames: `{"fearful": 0.86, "sad": 0.64, "neutral": 0.04, ...}`.

### Pillar 2: Acoustic Biomarkers & Physical Voice Tremors (DSP)
* **Signal Engine:** Pure `scipy.signal` and `numpy` autocorrelation signal processing (< 15ms CPU execution, zero heavy neural network latency).
* **Biomarkers Extracted:**
  * **Fundamental Frequency ($F_0$) Tracking:** Normalized autocorrelation with parabolic interpolation across the human vocal range (75 Hz – 500 Hz).
  * **Pitch Volatility ($\sigma_{F_0}$):** Measures involuntary vocal fold spasms. A pitch standard deviation $> 40\text{ Hz}$ indicates physiological panic.
  * **Zero-Crossing Rate (ZCR):** Detects breathiness, sobbing, and hyperventilation.
  * **RMS Energy Dynamics:** Identifies callers whispering under direct intimidation by an extortionist.

### Pillar 3: Speech-to-Text & Threat Intelligence
* **Primary STT Engine:** Groq LPU Whisper (`whisper-large-v3-turbo`) with in-memory 16kHz PCM WAV encoding (< 250ms latency, zero disk I/O).
* **Language Boundary:** Strictly restricted to **English, Hindi, and Marathi** (including code-switched Hinglish and Marathi-English) to eliminate foreign language hallucinations.
* **Hybrid Situation Evaluation:**
  * **Primary (Cloud LLM):** Evaluates psychological duress, extortion mechanisms, red flags, and tailored officer advisories via `qwen/qwen3.8-27b` on Groq.
  * **Instant Fallback (0ms Local Taxonomy):** If offline or on API timeout, evaluates against a multilingual regex taxonomy covering 4 core categories:
    1. *Digital Arrest / Impersonation:* `"CBI"`, `"customs"`, `"illegal package"`, `"digital arrest"`, `"सीबीआई"`, `"डिजिटल अरेस्ट"`.
    2. *Violent Kidnapping & Extortion:* `"kidnap"`, `"ransom"`, `"kill"`, `"weapon"`, `"फिरौती"`, `"खंडणी"`, `"मारून टाकेन"`.
    3. *Sextortion & Private Photo Blackmail:* `"leak video"`, `"photos"`, `"delete video"`, `"वायरल"`.
    4. *Banking & OTP Phishing:* `"OTP"`, `"AnyDesk"`, `"CVV"`, `"account blocked"`, `"रिमोट एक्सेस"`.

---

## 4. Multimodal Urgency Scoring Engine

Rather than a simple arithmetic average, CyberGuard uses a **Three Specialists Agreement Model** calibrated via non-linear resonance:

### Phase 1: Normalized Component Assessment $[0.0, 1.0]$
* **Pillar 1 Emotion ($s_{\text{emo}}$):** Dampened Valence-Arousal Projection:
  $$s_{\text{emo}} = \min\left(1.0, \frac{0.55 \cdot P_{\text{fear}} + 0.30 \cdot P_{\text{sad}} + 0.15 \cdot P_{\text{angry}}}{1.0 + 0.8 \cdot P_{\text{neutral}}}\right)$$
* **Pillar 2 Acoustics ($s_{\text{acoust}}$):** Richards' Generalized Sigmoid inflection around 32 Hz tremor threshold:
  $$s_{\text{acoust}} = \frac{1.0}{1.0 + e^{-0.14 \cdot (\sigma_{F_0} - 32.0)}} + b_{\text{whisper}}$$
* **Pillar 3 Threat Severity ($s_{\text{threat}}$):** Normalized semantic threat points:
  $$s_{\text{threat}} = \min\left(1.0, \frac{\text{points}}{25.0}\right)$$

### Phase 2: Evidence Integration & Geometric Resonance
Calculates the linear weighted evidence ($w_{\text{emo}} = 0.35$, $w_{\text{acoust}} = 0.25$, $w_{\text{threat}} = 0.40$) plus a **Geometric Synergy Bonus** that activates when multiple independent pillars agree:
$$\text{Synergy} = 0.20 \cdot (s_{\text{emo}} \cdot s_{\text{acoust}} \cdot s_{\text{threat}})^{1/3} + 0.05 \cdot c_{\text{pair}}$$

### Phase 3: Speedometer Logistic S-Curve (0 to 100)
Maps the fused evidence $u_{\text{fused}}$ to a human-calibrated emergency triage scale:
$$\text{Urgency Score} = \frac{100}{1.0 + e^{-6.5 \cdot (u_{\text{fused}} - 0.42)}}$$

### Priority Tiers for Dispatchers:
| Score Range | Priority Tier | Badge Color | Operational Action |
| :---: | :---: | :---: | :--- |
| **75 – 100** | 🔴 **CRITICAL** | Flashing Red | Active digital arrest, hostage duress, or acute terror. Immediate supervisor escalation. |
| **30 – 74** | 🟡 **ELEVATED** | Amber | Significant agitation, suspicious coercion, or reported financial scam. Elevated queue position. |
| **0 – 29** | 🟢 **ROUTINE** | Emerald Green | Monotone, calm inquiry, passport verification, or past FIR follow-up. Standard processing. |

---

## 5. Technology Stack

| Layer | Technology | Purpose & Advantages |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn | High-throughput asynchronous ASGI streaming server. |
| **Real-Time Pipe** | WebSockets (RFC 6455) | Bi-directional binary PCM audio chunk streaming (< 50ms transport latency). |
| **SER Foundation** | `emotion2vec+` (FunASR) via `gradio_client` | ZeroGPU cloud-accelerated Speech Emotion Recognition. |
| **Acoustic DSP** | `scipy.signal`, `numpy` | Autocorrelation pitch extraction, vocal jitter, and breathiness (< 15ms CPU). |
| **STT Engine** | Groq LPU Whisper (`whisper-large-v3-turbo`) | Ultra-fast speech recognition (< 250ms) in English, Hindi, and Marathi. |
| **Semantic Intelligence** | Groq LLM (`qwen/qwen3.8-27b`) | Threat categorization, coercion analysis, and officer advisories. |
| **Audio I/O** | `soundfile` | 16 kHz Mono WAV/FLAC/MP3 decoding with polyphase resampling. |
| **Frontend UI** | HTML5, Vanilla CSS, Modern JavaScript | Frosted-glass dark control-room console with zero external npm dependencies. |

---

## 6. Setup & Execution Guide (Any Machine)

CyberGuard runs seamlessly across **Windows**, **macOS (Intel & Apple Silicon M1/M2/M3/M4)**, and **Linux (Ubuntu / Debian / RHEL)**.

### Prerequisites
* **Python 3.10 to 3.12** installed.
* **Git** installed.
* *(Optional for Linux headless servers)*: `libsndfile1` and `ffmpeg` for system audio decoding:
  ```bash
  # Ubuntu / Debian
  sudo apt-get update && sudo apt-get install -y libsndfile1 ffmpeg
  ```

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Haziq2602/BetterCallNull_HaziqShaikh.git
cd BetterCallNull_HaziqShaikh
```

---

### Step 2: Create and Activate a Virtual Environment

* **On Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
  *(If script execution is restricted: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

* **On macOS / Linux (bash/zsh):**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

---

### Step 3: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 4: Configure Environment Variables (`.env`)
Create a `.env` file in the root project directory (or copy from [`.env.example`](file:///.env.example)):

```bash
# Copy template
cp .env.example .env     # Linux / macOS
copy .env.example .env   # Windows
```

Populate `.env` with your API keys:
```env
# Hugging Face Access Token (Free Read token for ZeroGPU SER engine)
# Get yours in 10 seconds at: https://huggingface.co/settings/tokens
HF_TOKEN=hf_your_free_read_token_here

# Groq API Key (Free 2,000 requests/day for Whisper Large V3 & Qwen)
# Get yours in 10 seconds at: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_STT_MODEL=whisper-large-v3-turbo

# Google Gemini API Key (Optional secondary fallback)
GEMINI_API_KEY=
GEMINI_STT_MODEL=gemini-2.5-flash
```

> [!NOTE]
> Even if cloud API keys are absent, CyberGuard features **offline fallback modes**: Pillar 2 (DSP) and local Indic regex keyword matching run 100% locally on your machine with zero cloud connectivity.

---

### Step 5: Launch the Server
Start the Uvicorn ASGI server:

* **Local Machine Access:**
  ```bash
  python -m uvicorn backend.main:app --reload --port 8000
  ```
* **Network / Docker / VM Access (Accessible across LAN):**
  ```bash
  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
  ```

---

### Step 6: Access the Web Console
Open your web browser and navigate to:
```
http://localhost:8000
```

#### Browser Microphone Permissions Note:
* When using **Live Mic Triage**, modern browsers require a secure origin (`http://localhost:8000` or `https://`). If accessing over a LAN IP (e.g., `http://192.168.1.5:8000`), enable Chrome flag `chrome://flags/#unsafely-treat-insecure-origin-as-secure` or use localhost.

---

## 7. Verification & Test Suite

Verify that all multimodal components function correctly by running the test suite:

```bash
# 1. Test Pillar 3: Speech-to-Text & Threat Taxonomy (English, Hindi, Marathi)
python tests/test_pillar3_keywords.py

# 2. Test Pillar 2: Acoustic Biomarkers & Pitch Volatility DSP
python tests/test_pillar2_dsp.py

# 3. Test Pillars 1 & 2 Integration: SER + DSP Consensus
python tests/test_pillars_1_and_2.py

# 4. Test WebSocket Stream Ingestion & Buffer Pipeline
python tests/test_websocket_stream.py
```

All tests should output:
```
ALL TESTS PASSED SUCCESSFULLY!
```

---

## 8. REST & WebSocket API Reference

### Health Check
* `GET /api/health`
  * Returns engine status and air-gap readiness.

### Call Queue Management
* `GET /api/call-queue`
  * Returns active prioritized calls in the emergency dispatch queue.
* `GET /api/call-details/{call_id}`
  * Fetches historical telemetry, emotion breakdown, and transcript for a specific call.

### Forensic Wiretap Investigation
* `POST /api/investigate-recording`
  * **Payload:** `multipart/form-data` with an audio file (`.wav` or `.mp3`).
  * **Returns:** Second-by-second timeline analysis, peak urgency score, emotion distribution, extracted keywords, and officer summary brief.

### Sample Pre-recorded Audio
* `GET /api/sample-recordings/{filename}`
  * Streams pre-recorded reference cases (`sample_digital_arrest.wav`, `sample_kidnap_threat.wav`, `sample_routine_bank.wav`).

### Live Telemetry Streaming
* `WebSocket /ws/live-call/{call_id}`
  * Accepts real-time binary audio chunks (PCM 16-bit 16kHz mono).
  * Emits streaming JSON telemetry every 1.0–2.0 seconds:
    ```json
    {
      "call_id": "CALL-LIVE-7563",
      "timestamp": "00:04",
      "dominant_emotion": "FEARFUL",
      "emotion_breakdown": { "fearful": 0.86, "sad": 0.64, "neutral": 0.04 },
      "acoustic_metrics": { "pitch_std": 48.6, "voice_tremor": true },
      "transcript": "They told me they are from CBI Mumbai and my bank account is under digital arrest...",
      "threat_analysis": {
        "threat_category": "DIGITAL_ARREST_SCAM",
        "red_flags": ["CBI Impersonation", "Digital Arrest Coercion"]
      },
      "urgency_score": 93.4,
      "priority_level": "CRITICAL",
      "officer_advisory": "High probability of active digital arrest coercion. Initiate bank account freeze advisory immediately."
    }
    ```

---

## 9. Project Directory Layout

```
BetterCallNull_HaziqShaikh/
├── .env.example                     # Environment template
├── README.md                        # Documentation & setup manual
├── requirements.txt                 # Optimized universal dependency manifest
│
├── backend/
│   ├── config.py                    # Taxonomy dictionary, thresholds & settings
│   ├── main.py                      # FastAPI server, REST routes & WebSocket stream
│   ├── core/
│   │   ├── audio_buffer.py          # Sliding window chunking & sample rate alignment
│   │   ├── forensic_analyzer.py     # Timeline forensic analyzer for wiretaps
│   │   └── urgency_engine.py        # Three Specialists Agreement & S-Curve model
│   ├── models/
│   │   ├── acoustic_dsp.py          # Pillar 2: Pure SciPy/NumPy pitch tracking
│   │   ├── emotion_model.py         # Pillar 1: emotion2vec+ SER ZeroGPU client
│   │   ├── situation_analyzer.py    # Pillar 3: Groq Qwen hybrid threat analyzer
│   │   ├── stt_groq.py              # Pillar 3: Groq LPU Whisper (EN, HI, MR)
│   │   └── stt_whisper.py           # Pillar 3: Offline local faster-whisper fallback
│   └── data/
│       └── sample_recordings/       # Pre-recorded reference wiretaps (.wav)
│
├── frontend/                        # Zero-build Control Room Dashboard
│   ├── index.html                   # Frosted-glass single-page console
│   ├── css/styles.css               # SOC terminal glassmorphism stylesheet
│   └── js/app.js                    # Waveform visualizer, WebSocket client & audio player
│
├── tests/                           # Unit and integration test suite
│   ├── test_audio_buffer.py
│   ├── test_pillar2_dsp.py
│   ├── test_pillar3_keywords.py
│   ├── test_pillars_1_and_2.py
│   └── test_websocket_stream.py
│
└── hf_space_ser/                    # Hugging Face Space source for emotion2vec+
    ├── app.py
    └── requirements.txt
```

---

## 10. Responsible AI, Data Privacy & Legal Compliance

1. **Law Enforcement Decision Support:** CyberGuard outputs are designed strictly for **dispatch prioritization and rapid cognitive assistance**. Under Indian criminal jurisprudence and international standards, voice biomarkers and emotion predictions do **not** constitute admissible forensic evidence of guilt, deception, or credibility.
2. **Data Minimization & Air-Gap Compatibility:** Audio buffers are processed ephemerally in RAM (zero disk persistence during live calls).
3. **Multilingual Inclusivity:** The taxonomy explicitly respects India's linguistic diversity by actively handling code-switched Hindi, Marathi, and Hinglish without English-only bias.
