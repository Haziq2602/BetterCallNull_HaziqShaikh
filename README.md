# Real-Time Speech Emotion Analysis & Triage System for Cybercrime Investigation

An AI-powered intelligence and decision-support triage console for cybercrime helplines (e.g., 1930 / 112) and forensic investigators. The system analyzes live incoming call streams and recorded case audio to detect vocal distress patterns, assess emergency urgency in real time, extract situational cybercrime context, and prioritize calls to assist law enforcement.

---

## 1. Problem Statement Alignment

* **Domain:** Cybersecurity & Law Enforcement Decision Support
* **Target Users:** Cybercrime Police Officers, Emergency Helpline Dispatchers, and Forensic Investigators.
* **Core Pain Point:** In high-volume emergency queues, officers face cognitive fatigue and multi-case multitasking, making it challenging to spot subtle indicators of acute duress or prioritize calls where immediate intervention is critical.
* **Our Solution:** A multimodal system that analyzes:
  1. **How they sound emotionally:** Vocal patterns of fear, sadness, crying, and anger.
  2. **How their vocal cords physically behave:** Pitch instability, vocal tremors, and acoustic volume dynamics.
  3. **What they are saying:** Real-time speech transcription matching cybercrime threat vocabularies (*"digital arrest"*, *"CBI"*, *"ransom"*, *"OTP"*).
* **Compliance & Responsible AI:** 100% on-premise/local execution (air-gapped; no external audio leakage). Predictions are strictly assistive triage indicators, not definitive proof of guilt, honesty, or intention.

---

## 2. End-to-End System Architecture

```
                                 [ CALL AUDIO INPUT ]
                       (Live WebSocket Stream OR Recorded Audio)
                                          │
                                          ▼
                      [ AUDIO INGESTION & STREAM BUFFER ]
                           - Resample to 16 kHz Mono
                           - Silero VAD (Filter dead air)
                           - 2.0s Sliding Window Buffer
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        ▼                                 ▼                                 ▼
  [ PILLAR 1: SER ]             [ PILLAR 2: ACOUSTICS ]             [ PILLAR 3: STT ]
   emotion2vec+                  librosa DSP Metrics                 faster-whisper
  (Vocal Emotion)               (Physical Voice Stress)             (Semantic Context)
        │                                 │                                 │
  • Fear: 86%                   • Pitch Jitter: 48 Hz (High)        • Words: "CBI", "parcel",
  • Sadness/Crying: 65%         • Energy Dynamics: Tremor             "digital arrest", "OTP"
  • Anger: 08%                  • Breathiness / ZCR                 • Crime Tags Generated
        │                                 │                                 │
        └─────────────────────────────────┼─────────────────────────────────┘
                                          ▼
                      [ MULTIMODAL FUSION & URGENCY ENGINE ]
                                          │
           ┌──────────────────────────────┴──────────────────────────────┐
           ▼                                                             ▼
 [ Dynamic Urgency Score ]                                     [ Contextual Text Tags ]
   Score: 94/100 (CRITICAL)                                  #DIGITAL_ARREST_SCAM
   Priority: TIER 1                                          #ACUTE_VOCAL_PANIC
   Action: Immediate Intervention                            #PITCH_TREMOR_DETECTED
                                          │
                                          ▼
                     [ REAL-TIME OFFICER COMMAND DASHBOARD ]
               (WebSocket Push: Live Waveform, Triage Queue, Alert Banner)
```

---

## 3. The 3 Core Analytical Approaches

### Pillar 1: Speech Emotion Recognition (SER)
* **Model:** `emotion2vec+` (Seed/Base variant) by Alibaba / FunASR (ACL 2024 SOTA).
* **Role:** Dedicated emotional representation foundation model pre-trained on 40,000+ hours of emotional speech.
* **Emotions Tracked:** `fearful`, `sad` (crying/grief), `angry`, `surprised`, `neutral`.
* **Output:** Normalized probability distribution: `{"fearful": 0.86, "sad": 0.65, "neutral": 0.04, ...}`.

### Pillar 2: Acoustic Biomarkers & Pitch Volatility (DSP)
* **Toolkit:** `librosa`, `scipy.signal`, `numpy`.
* **Role:** Extracts physical vocal tract distress markers:
  * **Pitch ($F_0$) Volatility:** Measures fundamental frequency standard deviation using the pYIN algorithm. Extreme pitch jumping signals involuntary vocal fold constriction under acute panic.
  * **Zero-Crossing Rate (ZCR):** Detects voice roughness, shivering breath, and hyperventilation.
  * **RMS Energy:** Detects whispering under duress versus shouting threats.
* **Output:** `{"pitch_std": 48.6, "voice_tremor": true, "energy_level": "suppressed_whisper"}`.

### Pillar 3: Speech-to-Text & Threat Taxonomy (Semantic Context)
* **Model:** `faster-whisper` (OpenAI Whisper optimized via CTranslate2 for ultra-fast local execution).
* **Role:** Transcribes caller speech to text in sub-second intervals and matches words against a **Cybercrime Incident Taxonomy**:
  * *Digital Arrest / Extortion:* *"CBI"*, *"customs"*, *"illegal package"*, *"Skype"*, *"arrest"* $\rightarrow$ `[#DIGITAL_ARREST_SCAM]`
  * *Violent / Hostage Duress:* *"kidnap"*, *"ransom"*, *"kill"*, *"weapon"* $\rightarrow$ `[#KIDNAPPING_THREAT]`
  * *Sextortion / Blackmail:* *"leak video"*, *"photos"*, *"transfer money immediately"* $\rightarrow$ `[#SEXTORTION_BLACKMAIL]`
  * *Financial Fraud:* *"OTP"*, *"CVV"*, *"AnyDesk"*, *"account blocked"* $\rightarrow$ `[#BANKING_FRAUD]`

---

## 4. Urgency Calculation & Priority Tiers

The Multimodal Fusion Engine computes a unified **Urgency Index (0 to 100)**:

$$\text{Urgency Score} = \text{Acoustic \& SER Score (Max 75 pts)} + \text{Keyword Context Boost (Max 25 pts)}$$

### Scoring Breakdown:
1. **Base Emotion Score (0 – 60 pts):**
   $$\text{Base} = (P_{\text{fear}} \times 40) + (P_{\text{sad}} \times 20) + (P_{\text{angry}} \times 15) - (P_{\text{neutral}} \times 20)$$
2. **Acoustic Biomarker Bonus (0 – 15 pts):**
   * Pitch Standard Deviation $> 40\text{ Hz}$ (Vocal Tremors): **+10 pts**
   * Volume dynamic suppression (Whispering under duress): **+5 pts**
3. **Keyword Threat Bonus (0 – 25 pts):**
   * Violent / Kidnap keywords: **+25 pts**
   * Digital Arrest / Extortion keywords: **+20 pts**
   * Phishing / Banking keywords: **+10 pts**
4. **Acute Distress Override:**
   * If $P_{\text{fear}} > 0.85$ and vocal instability is detected, the score is automatically boosted to **90+ (CRITICAL)**, ensuring weeping callers who cannot articulate keywords are never downgraded.

### Priority Tiers for Law Enforcement:
| Score Range | Priority Tier | UI Visual | Operational Directive |
| :---: | :---: | :---: | :--- |
| **75 – 100** | 🔴 **CRITICAL** | Flashing Red Alert | Active extortion, digital arrest, or acute terror in progress. Needs immediate escalation. |
| **45 – 74** | 🟡 **ELEVATED** | Amber Badge | High agitation, confrontational caller, or suspected ongoing fraud. Elevated queue priority. |
| **0 – 44** | 🟢 **ROUTINE** | Solid Green Badge | Informational inquiry, past incident reporting, or general complaint follow-up. Standard queue. |

---

## 5. Technology Stack Master Table

| Layer | Technology | Justification & Purpose |
| :--- | :--- | :--- |
| **Core Language** | **Python 3.10+** | Unified language for AI, DSP, and async streaming APIs. |
| **Backend Framework** | **`FastAPI` + `Uvicorn`** | High-performance asynchronous framework for REST endpoints and WebSockets. |
| **Real-Time Pipe** | **`WebSockets`** | Low-latency (< 100ms) bidirectional binary audio streaming and alert emission. |
| **Speech Emotion Model** | **`funasr` (`emotion2vec+`)** | SOTA pre-trained foundation model for speech emotion representation (fear, sadness, anger). |
| **Speech-to-Text Model** | **`faster-whisper`** | Sub-second local speech recognition for cybercrime keyword extraction. |
| **Acoustic DSP** | **`librosa`, `scipy`, `numpy`** | Pitch tracking ($F_0$ extraction via pYIN), vocal jitter, and energy dynamics. |
| **Voice Activity (VAD)** | **`silero-vad`** | Fast PyTorch-based VAD to eliminate silence and line static before model inference. |
| **Audio I/O & Decoding** | **`soundfile`, `pydub`** | Handling 16 kHz PCM buffers and decoding MP3/WAV forensic audio files. |
| **Officer Dashboard (UI)** | **Modern HTML5 / CSS / Vanilla JS** | Lightweight, zero-build dashboard featuring live waveforms, urgency badges, and call triage queue. |

---

## 6. Real-Time Output Contract (JSON Payload)

Every 1–2 seconds, the Python backend pushes this payload to the officer's workstation:

```json
{
  "call_id": "CYBER-CALL-9823",
  "mode": "LIVE_STREAM",
  "timestamp": "00:14",
  "dominant_emotion": "FEARFUL",
  "emotion_breakdown": {
    "fearful": 0.86,
    "sad": 0.64,
    "angry": 0.08,
    "neutral": 0.04
  },
  "acoustic_metrics": {
    "pitch_stability": "ERRATIC_HIGH_JITTER",
    "voice_tremor": true,
    "pitch_std_hz": 48.6
  },
  "transcript": "They told me they are from CBI Mumbai and my bank account is linked to money laundering...",
  "detected_tags": [
    "#DIGITAL_ARREST_SCAM",
    "#ACUTE_PANIC",
    "#VOCAL_TREMORS"
  ],
  "urgency_score": 93,
  "priority_level": "CRITICAL",
  "investigator_advisory": "High probability of active digital arrest coercion. Immediate supervisor intervention advised.",
  "responsible_ai_disclaimer": "Indicative signal to assist officer triage; not legal proof of guilt, honesty, or intention."
}
```

---

## 7. Operational Workflow (Dual-Mode)

### Mode 1: Live Concurrent Call Monitoring
1. Incoming call streams via WebSockets into the backend.
2. The AI runs in the background while the officer talks on the headset.
3. The queue dynamically ranks calls: weeping/terrified callers automatically jump to `#1 in Queue`.
4. The officer's screen displays an active emotion radar, waveform instability indicator, and contextual threat tags.

### Mode 2: Recorded Forensic Case Analysis
1. Officer uploads case recordings (`.wav`, `.mp3`) from scam calls or wiretaps.
2. The AI processes the full audio file in chronological slices.
3. Produces a full **Investigation Timeline Report** highlighting panic peaks, extortion demands, and caller distress spikes.

---

## 8. Responsible AI, Privacy & Security Guardrails

1. **Air-Gapped & Local Deployment:** All models execute entirely within the police department's internal local network. No external API calls; zero data leaks.
2. **Decision-Support Framing:** The UI clearly enforces that emotion predictions are **supportive triage signals**, not definitive legal proof of guilt, honesty, or criminal intention.
