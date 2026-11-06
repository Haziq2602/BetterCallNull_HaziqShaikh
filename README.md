# CyberGuard: Multimodal Speech Emotion & Triage Console for Cybercrime Investigations

> 🌐 **Live Cloud Deployment:** [CyberGuard - Real-Time Speech Emotion & Call Triage Console](https://cyberguard-5jw9.onrender.com/)

An AI-powered decision-support and dispatch prioritization console designed for cybercrime emergency helplines (**1930 / 112**), specialized cyber police stations, and digital forensic investigation units. The platform analyzes live incoming distress calls and recorded wiretaps to detect vocal panic biomarkers, quantify physiological terror under 15ms, extract cyber extortion tactics, enforce investigator authentication with Station Commander RBAC, and generate official 2-page statutory forensic dossiers complying with **Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)**.

---

## 1. Problem Statement & Operational Alignment

* **Target Users:** Cybercrime Police Dispatchers, Emergency Response 112/1930 Operators, Station Commanders, and Forensic Audio Analysts.
* **Core Pain Point:** In high-volume emergency call queues (such as national cybercrime reporting centers), operators experience acute cognitive fatigue. Distinguishing genuine, high-coercion scams (e.g., active **"Digital Arrest"** or violent extortion) from routine FIR status inquiries often leads to critical delays during ongoing financial drain or extortion.
* **Our Solution:** A synchronized **3-Pillar Multimodal Architecture** that simultaneously evaluates:
  1. **How they sound emotionally (Acoustic SER):** Deep speech emotion recognition tracking vocal terror, acute panic, grief/crying, anger, and baseline calm.
  2. **How their vocal cords physically behave (DSP Biomarkers):** Autocorrelation pitch volatility ($F_0$ jitter), involuntary vocal fold tremor spasms, and suppressed whispering dynamics under duress.
  3. **What they are saying (Threat Intelligence):** Multilingual speech-to-text combined with cloud situation analysis and local Indic regex taxonomy matching cybercrime extortion tactics (*"digital arrest"*, *"CBI"*, *"money laundering"*, *"customs parcel"*, *"OTP"*, *"सीबीआई"*, *"डिजिटल अरेस्ट"*, *"खंडणी"*).
* **Responsible AI & Decision-Support Framing:** Predictions serve strictly as assistive dispatch triage indicators to rank emergency queues and focus investigator attention—they do **not** constitute automated legal evidence of guilt, innocence, or judicial truthfulness.

---

## 2. End-to-End User Experience & Navigation Flow

```
                                      [ VISITOR ARRIVAL ]
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     SHOWCASE LANDING PAGE        │
                              │       (landing.html / `/`)       │
                              │  - Ambient Horizon Glow Arc      │
                              │  - Live Distress Telemetry Pill  │
                              │  - Floating Consensus Chips      │
                              │  - "Launch Command Console"      │
                              └────────────────┬─────────────────┘
                                               │ Click
                                               ▼
                              ┌──────────────────────────────────┐
                              │   INVESTIGATOR AUTHENTICATION    │
                              │      (login.html / `/login`)     │
                              │  - SHA-256 Salted Authentication │
                              │  - One-Time Magic Link Dispatch  │
                              │  - Animated Radar Backdrop       │
                              │  - Quick Demo Credentials Fill   │
                              └────────────────┬─────────────────┘
                                               │ Authenticated
                                               ▼
                       ┌────────────────────────────────────────────────┐
                       │           CYBERGUARD TRIAGE HUD                │
                       │          (index.html / `/console`)             │
                       │  - Prioritized Incoming Call Queue (3 Chans)   │
                       │  - Live Multimodal Telemetry Stream            │
                       │  - Real-time Waveform Canvas + DPR Scaling     │
                       │  - SER Emotion Bars (Fear, Sad, Angry, Neutral)│
                       │  - Live Transcript + Threat Extraction Tags    │
                       │  - Wiretap File Upload & Forensic Analysis     │
                       │  - 🖨️ Official 2-Page Police PDF Export        │
                       └───────────────────────┬────────────────────────┘
                                               │ Commander RBAC Only
                                               ▼
                       ┌────────────────────────────────────────────────┐
                       │       STATION COMMANDER CONSOLE                │
                       │          (admin.html / `/admin`)               │
                       │  - Active Investigator Duty Roster (2-Col)     │
                       │  - Interactive Officer Dossier Modal           │
                       │  - One-Click Badge Suspension / Reactivation   │
                       │  - New Officer Provisioning Dialog             │
                       │  - Tamper-Evident SHA-256 Audit Trail          │
                       └────────────────────────────────────────────────┘
```

---

## 3. The 3 Analytical Pillars & Failsafe Architecture

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
    • Fear / Panic: 86%            • Pitch Jitter: 48.6 Hz            • Language: EN / HI / MR
    • Sadness / Crying: 64%        • Vocal Tremors: Detected          • Cloud LLM: Extortion Coercion
    • Baseline / Neutral: 04%      • Volume: Suppressed Whisper       • Fallback: Local Indic Regex
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
      Score: 93/100                                                 Category: Digital Arrest
      Priority: 🔴 CRITICAL                                         Tags: #DIGITAL_ARREST, #ACUTE_PANIC
      Advisory: Bank Freeze Recommended                             Directive: Immediate Supervisor Escalation
```

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

### Automatic 2-Pillar Failsafe Mode
If the ZeroGPU cloud model is warming up or sleeping, CyberGuard automatically activates its **2-Pillar Failsafe**. A tactical amber banner appears, and the urgency engine automatically recalibrates:
$$\text{Weight}_{\text{Pillar 2 (DSP)}} = 0.45, \quad \text{Weight}_{\text{Pillar 3 (Keywords)}} = 0.55$$
This ensures **zero interruption** in emergency dispatch triage even during complete external cloud disconnects.

---

## 4. Official Police Forensic Dossier (Section 63 BSA 2023 Compliant)

CyberGuard includes a built-in, statutory forensic report generator accessible directly from the live console and forensic case audio modal. The generated PDF strictly adheres to Government of India and Police Department standards across exactly **2 structured pages**:

* **Page 1: Confidential Police Record & Multimodal Telemetry Audit**
  * **Header Banner:** `CONFIDENTIAL POLICE RECORD` with case incident classification and emblem branding.
  * **Section 1: Incident & Electronic Evidence Metadata:** 4-column structured box (Incident ID, Timestamp, Stream Source, Audio Device) + verified SHA-256 Checksum strip.
  * **Section 2: Executive Telephony Triage Directive:** Peak urgency score badge, operational directive box, and categorized threat tags (`#DIGITAL_ARREST`, `#RBI_IMPERSONATION`).
  * **Section 3: 3-Pillar Multimodal Matrix:** SER emotion progress bars, DSP acoustic biometrics (pitch volatility, vocal tremors, energy level), and semantic keyword taxonomy.
  * **Section 4: Verbatim Phonetic Transcript:** Inverted black-background highlights for flagged threat tokens.
  * **Section 5: Second-by-Second Multi-Modal Audit Log Table:** High-contrast table with 5 columns: `TIME`, `URGENCY`, `PRIORITY`, `PITCH / TREMOR`, and `UTTERANCE CHUNK & KEYWORD TAGS`.
  * **Page 1 Footer:** System reference & `Page 1 of 2`.

* **Page 2: Statutory Certificate of Authenticity**
  * **Section 63 Certificate:** Formal statutory certificate under **Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)** for electronic records.
  * **Cryptographic System Signature:** Machine hash validation block with timestamp and SHA-256 file fingerprint.
  * **Investigator Endorsement:** Submitting Officer particulars (Name, Rank, Badge ID, Cyber Division).
  * **Official Seal Box:** High-contrast bordered stamp box (`OFFICIAL SEAL / CYBER POLICE / BKC MUMBAI`).
  * **Page 2 Footer:** `Page 2 of 2`.

---

## 5. Multi-Dimensional Responsive Architecture

The entire frontend is engineered with pure CSS fluid grid and flex systems (`clamp()`, `minmax()`, `dvh`, and auto-fit columns) without gimmicky dimension switches:
* **Mobile Phones (320px – 480px):** Single-column vertical flow with full-width 44px tap targets, collapsible details, and fluid modal sheets.
* **Tablets & Phablets (768px – 1024px):** Proportional grid layout with capped internal queue scroll (`280px`), allowing simultaneous inspection of queue and active telemetry without horizontal squishing.
* **Laptops & Windows Scaling (125% / 150% scaling):** Smooth page scrolling with sticky bottom controls, eliminating the cut-off card trap.
* **Desktop & 4K Ultra-wide (&ge;1100px & &ge;880px height):** Automatically locks into a full-height, non-scrolling Command Center HUD with independent panel scrolling.

---

## 6. Technology Stack

| Layer | Technology | Purpose & Capabilities |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.10+, FastAPI, Uvicorn | High-throughput asynchronous ASGI streaming server with CORS security. |
| **Real-Time Pipe** | WebSockets (RFC 6455) | Bi-directional binary PCM audio chunk streaming (< 50ms transport latency). |
| **SER Foundation** | `emotion2vec+` (FunASR) via `gradio_client` | ZeroGPU cloud-accelerated Speech Emotion Recognition. |
| **Acoustic DSP** | `scipy.signal`, `numpy` | Autocorrelation pitch extraction, vocal jitter, and breathiness (< 15ms CPU). |
| **STT Engine** | Groq LPU Whisper (`whisper-large-v3-turbo`) | Ultra-fast speech recognition (< 250ms) in English, Hindi, and Marathi. |
| **Semantic Intelligence** | Groq LLM (`qwen/qwen3.8-27b`) | Threat categorization, coercion analysis, and officer advisories. |
| **Cloud Database** | Supabase PostgreSQL Gateway | Cloud persistence for forensic audits, duty roster sync, and chain-of-custody logs. |
| **Audio I/O** | `soundfile` | 16 kHz Mono WAV/FLAC/MP3 decoding with polyphase resampling. |
| **Frontend UI** | HTML5, Modern CSS, Vanilla JavaScript | Frosted-glass dark control-room console with zero external npm dependencies. |

---

## 7. Setup & Execution Guide

### Prerequisites
* **Python 3.10 to 3.13** installed.
* **Git** installed.
* *(Optional for Linux servers)*: `libsndfile1` and `ffmpeg` for system audio decoding:
  ```bash
  sudo apt-get update && sudo apt-get install -y libsndfile1 ffmpeg
  ```

---

### Step 1: Clone Repository & Enter Directory
```bash
git clone https://github.com/Haziq2602/BetterCallNull_HaziqShaikh.git
cd BetterCallNull_HaziqShaikh
```

---

### Step 2: Set Up Virtual Environment
* **On Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
  *(If execution is restricted: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

* **On macOS / Linux (bash/zsh):**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

---

### Step 3: Install Requirements
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 4: Configure Environment Variables (`.env`)
Create a `.env` file in the root project directory:
```env
# Hugging Face Access Token (Free Read token for ZeroGPU SER engine)
HF_TOKEN=hf_your_free_read_token_here

# Groq API Key (Free 2,000 requests/day for Whisper Large V3 & Qwen)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_STT_MODEL=whisper-large-v3-turbo

# Supabase PostgreSQL (Optional for Cloud Roster Sync; defaults to local JSON store)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_key
```

> [!NOTE]
> Even if cloud API keys are absent, CyberGuard features **automatic offline fallback modes**: Pillar 2 (DSP), local Indic regex matching, and the local JSON investigator store run 100% locally with zero cloud connectivity.

---

### Step 5: Start the Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

---

### Step 6: Access the Application
Open your web browser:
* **Landing Page:** [`http://localhost:8000/`](http://localhost:8000/)
* **Investigator Sign In:** [`http://localhost:8000/login`](http://localhost:8000/login)
* **Live Triage Console:** [`http://localhost:8000/console`](http://localhost:8000/console)
* **Station Commander Admin:** [`http://localhost:8000/admin`](http://localhost:8000/admin)

#### Demo Login Credentials:
* **Lead Investigator (Commander Access):**
  * **Login ID:** `investigator_01`
  * **Password:** `CyberGuard@2026`
  * **Badge ID:** `INV-7842` (Insp. Haziq Shaikh)
* *(Or simply click the **"Quick Fill Demo Credentials"** box on the sign-in screen)*.

---

## 8. Verification & Test Suite

Run the complete test suite (27 unit and integration tests):

```bash
pytest tests/
```

All 27 tests validate:
```
tests/test_admin_portal.py ........                                      [ 29%]
tests/test_audio_buffer.py .                                             [ 33%]
tests/test_forensic_timeline.py ..                                       [ 40%]
tests/test_investigator_auth.py .......                                  [ 66%]
tests/test_phase2_urgency_and_security.py ....                           [ 81%]
tests/test_pillar2_dsp.py .                                              [ 85%]
tests/test_pillar3_keywords.py .                                         [ 88%]
tests/test_pillars_1_and_2.py .                                          [ 92%]
tests/test_provision_and_forensic.py ..                                  [100%]
======================= 27 passed, 2 warnings in 4.53s ========================
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
│   ├── auth.py                      # SHA-256 auth, JWT sessions, magic links & RBAC
│   ├── main.py                      # FastAPI server, REST routes & WebSocket stream
│   ├── core/
│   │   ├── audio_buffer.py          # Sliding window chunking & sample rate alignment
│   │   ├── forensic_analyzer.py     # Timeline forensic analyzer for wiretaps
│   │   ├── urgency_engine.py        # Three Specialists Agreement & S-Curve model
│   │   └── supabase_client.py       # Cloud DB gateway & chain-of-custody logging
│   ├── models/
│   │   ├── acoustic_dsp.py          # Pillar 2: Pure SciPy/NumPy pitch tracking
│   │   ├── emotion_model.py         # Pillar 1: emotion2vec+ SER ZeroGPU client
│   │   ├── situation_analyzer.py    # Pillar 3: Groq Qwen hybrid threat analyzer
│   │   ├── stt_groq.py              # Pillar 3: Groq LPU Whisper (EN, HI, MR)
│   │   └── stt_whisper.py           # Pillar 3: Offline local faster-whisper fallback
│   └── data/
│       ├── investigators_store.json # Local encrypted duty roster persistence
│       └── sample_recordings/       # Pre-recorded reference wiretaps (.wav)
│
├── frontend/                        # Zero-build Control Room Dashboard
│   ├── landing.html                 # Boutique showcase landing page with horizon glow
│   ├── login.html                   # Authenticated investigator sign-in portal
│   ├── index.html                   # Multi-modal real-time triage console
│   ├── admin.html                   # Station Commander duty roster & audit trail
│   ├── css/
│   │   ├── landing.css              # Landing page styling & ambient glow
│   │   ├── login-premium.css        # Premium sign-in radar & card styling
│   │   └── styles.css               # SOC terminal glassmorphism & responsive rules
│   ├── js/
│   │   ├── app.js                   # Telemetry client, canvas visualizer & PDF generator
│   │   └── login-bg.js              # Interactive radar canvas background
│   └── images/
│       └── logo.svg                 # Vector brand emblem
│
└── tests/                           # Pytest test suite (27 tests)
    ├── test_admin_portal.py
    ├── test_audio_buffer.py
    ├── test_forensic_timeline.py
    ├── test_investigator_auth.py
    ├── test_phase2_urgency_and_security.py
    ├── test_pillar2_dsp.py
    ├── test_pillar3_keywords.py
    ├── test_pillars_1_and_2.py
    └── test_provision_and_forensic.py
```

---

## 10. Responsible AI, Data Privacy & Statutory Compliance

1. **Law Enforcement Decision Support:** CyberGuard outputs are designed strictly for **dispatch prioritization and rapid cognitive assistance**. Voice biomarkers and emotion scores assist human dispatchers in rapidly identifying severe duress; they do not replace human judicial determination.
2. **Statutory Electronic Record Compliance:** Exported dossiers strictly comply with the evidentiary requirements of **Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)**, complete with machine digital signatures, SHA-256 cryptographic verification, and officer endorsements.
3. **Data Minimization & Air-Gap Compatibility:** Live audio buffers are processed ephemerally in RAM with zero disk persistence during active calls.
4. **Multilingual Inclusivity:** The taxonomy explicitly respects India's linguistic diversity by actively handling code-switched Hindi, Marathi, and Hinglish without English-only bias.
