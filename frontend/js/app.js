/**
 * CyberGuard - Front-End Logic & Live Triage Dashboard Controller
 * Multi-call Dispatch Queue with Library Exhaustion Control,
 * Live Microphone Streaming with Cumulative Final Analysis Debrief,
 * and Forensic Wiretap Timeline Investigation.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Canvas & Waveform Visualizer
    const canvas = document.getElementById("waveformCanvas");
    const ctx = canvas.getContext("2d");
    let animationId = null;

    // UI Elements - Center & Right Panels
    const activeCallId = document.getElementById("activeCallId");
    const urgencyValue = document.getElementById("urgencyValue");
    const livePriority = document.getElementById("livePriority");
    const liveTranscript = document.getElementById("liveTranscript");
    const liveTags = document.getElementById("liveTags");
    const advisoryText = document.getElementById("advisoryText");
    const pitchStd = document.getElementById("pitchStd");
    const voiceTremor = document.getElementById("voiceTremor");
    const voiceEnergy = document.getElementById("voiceEnergy");

    // Emotion Bars
    const valFear = document.getElementById("valFear");
    const fillFear = document.getElementById("fillFear");
    const valSad = document.getElementById("valSad");
    const fillSad = document.getElementById("fillSad");
    const valAngry = document.getElementById("valAngry");
    const fillAngry = document.getElementById("fillAngry");
    const valNeutral = document.getElementById("valNeutral");
    const fillNeutral = document.getElementById("fillNeutral");

    // Queue & Action Elements
    const callQueue = document.getElementById("callQueue");
    const queueCount = document.getElementById("queueCount");
    const queueAlert = document.getElementById("queueAlert");
    const btnSimulateIncoming = document.getElementById("btnSimulateIncoming");
    const btnSimulatePanic = document.getElementById("btnSimulatePanic");
    const btnSimulateCalm = document.getElementById("btnSimulateCalm");
    const btnLiveMic = document.getElementById("btnLiveMic");

    // Forensic Wiretap Elements
    const sampleSelect = document.getElementById("sampleSelect");
    const btnLoadSample = document.getElementById("btnLoadSample");
    const audioUpload = document.getElementById("audioUpload");
    const btnUpload = document.getElementById("btnUpload");
    const forensicLoading = document.getElementById("forensicLoading");

    // Forensic Modal Elements (Recorded Wiretaps)
    const forensicModal = document.getElementById("forensicModal");
    const modalFilename = document.getElementById("modalFilename");
    const modalScore = document.getElementById("modalScore");
    const modalPriority = document.getElementById("modalPriority");
    const modalDuration = document.getElementById("modalDuration");
    const modalTags = document.getElementById("modalTags");
    const modalSummary = document.getElementById("modalSummary");
    const modalAudioPlayer = document.getElementById("modalAudioPlayer");
    const modalFullTranscript = document.getElementById("modalFullTranscript");
    const modalTimelineBody = document.getElementById("modalTimelineBody");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCloseModalBottom = document.getElementById("btnCloseModalBottom");
    const btnLoadIntoMonitor = document.getElementById("btnLoadIntoMonitor");

    // Live Call Final Forensic Modal Elements
    const liveFinalModal = document.getElementById("liveFinalModal");
    const liveModalPeakScore = document.getElementById("liveModalPeakScore");
    const liveModalPriority = document.getElementById("liveModalPriority");
    const liveModalCallId = document.getElementById("liveModalCallId");
    const liveModalDuration = document.getElementById("liveModalDuration");
    const liveModalAvgScore = document.getElementById("liveModalAvgScore");
    const liveModalTags = document.getElementById("liveModalTags");
    const liveModalAdvisory = document.getElementById("liveModalAdvisory");
    const liveModalAudioPlayer = document.getElementById("liveModalAudioPlayer");
    const liveModalDominantEmo = document.getElementById("liveModalDominantEmo");
    const liveModalPitchStd = document.getElementById("liveModalPitchStd");
    const liveModalTremorCount = document.getElementById("liveModalTremorCount");
    const liveModalWordCount = document.getElementById("liveModalWordCount");
    const liveModalFullTranscript = document.getElementById("liveModalFullTranscript");
    const liveModalTimelineBody = document.getElementById("liveModalTimelineBody");
    const btnCloseLiveModal = document.getElementById("btnCloseLiveModal");
    const btnCloseLiveModalBottom = document.getElementById("btnCloseLiveModalBottom");
    const btnSaveLiveCall = document.getElementById("btnSaveLiveCall");

    let currentForensicData = null;
    let localCallsState = [];
    let currentSelectedCallId = "CALL-9823";
    let remainingPreRecorded = 3;

    // Synthetic Waveform Generator
    let waveAmplitude = 18;
    let waveFrequency = 0.05;
    let waveColor = "#ef4444";

    function drawWaveform() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = waveColor;
        ctx.beginPath();

        const sliceWidth = canvas.width / 100;
        let x = 0;

        for (let i = 0; i < 100; i++) {
            const y = (canvas.height / 2) + Math.sin(i * waveFrequency + Date.now() * 0.005) * waveAmplitude * (Math.random() * 0.4 + 0.8);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }

        ctx.stroke();
        animationId = requestAnimationFrame(drawWaveform);
    }
    drawWaveform();

    // ==========================================
    // 1. INCOMING CALL QUEUE MANAGEMENT
    // ==========================================
    async function loadCallQueue() {
        try {
            const res = await fetch("/api/call-queue");
            if (!res.ok) throw new Error("Failed to fetch queue");
            const data = await res.json();
            localCallsState = data.calls || [];
            remainingPreRecorded = typeof data.remaining_pre_recorded === "number" ? data.remaining_pre_recorded : 0;
            updatePreRecordedAvailability(remainingPreRecorded);
            renderCallQueue();
        } catch (err) {
            console.warn("[QUEUE] Fetch error, using fallback state:", err);
        }
    }

    function updatePreRecordedAvailability(count) {
        if (!btnSimulateIncoming) return;
        if (count <= 0) {
            if (queueAlert) {
                queueAlert.textContent = "⚠️ All available pre-recorded calls from the library are currently active in the queue. No more pre-recorded calls available.";
                queueAlert.classList.add("active");
            }
            btnSimulateIncoming.classList.add("btn-disabled");
            btnSimulateIncoming.textContent = "+ Incoming (Exhausted)";
            btnSimulateIncoming.title = "No more pre-recorded calls available in library";
        } else {
            if (queueAlert) {
                queueAlert.classList.remove("active");
            }
            btnSimulateIncoming.classList.remove("btn-disabled");
            btnSimulateIncoming.textContent = `+ Incoming Call (${count} left)`;
            btnSimulateIncoming.title = "Add next pre-recorded cyber emergency call from library";
        }
    }

    function renderCallQueue() {
        if (!callQueue) return;
        callQueue.innerHTML = "";

        // Filter active (unresolved) calls
        const activeCalls = localCallsState.filter(c => c.status !== "RESOLVED");
        if (queueCount) {
            queueCount.textContent = `${activeCalls.length} ACTIVE CHANNELS`;
        }

        // Auto-sort by urgency score descending
        activeCalls.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));

        activeCalls.forEach(call => {
            const card = document.createElement("div");
            const isSelected = call.call_id === currentSelectedCallId;
            const priorityLower = (call.priority_level || "ROUTINE").toLowerCase();
            const isLive = call.call_id.startsWith("CALL-LIVE");

            card.className = `call-card ${priorityLower} ${isSelected ? "active" : ""}`;
            card.id = `card-${call.call_id}`;

            let badgeHtml = "";
            if (isLive) {
                badgeHtml = `<span class="badge-live-call">● LIVE INTERCEPT</span>`;
            } else if (call.priority_level === "CRITICAL") {
                badgeHtml = `<span class="badge priority-crit">CRITICAL</span>`;
            } else if (call.priority_level === "ELEVATED") {
                badgeHtml = `<span class="badge priority-elev">ELEVATED</span>`;
            } else {
                badgeHtml = `<span class="badge priority-rout">ROUTINE</span>`;
            }

            const tagsHtml = (call.tags || []).map(t => `<span class="tag ${call.priority_level === 'CRITICAL' ? 'red' : 'yellow'}">${t}</span>`).join(" ");

            card.innerHTML = `
                <div class="card-top">
                    <span class="call-id">#${call.call_id}</span>
                    ${badgeHtml}
                </div>
                <div class="caller-info">${call.caller_number || ''} ${call.caller_label ? '• ' + call.caller_label : ''}</div>
                <div class="card-meta">
                    <span>Duration: ${call.duration || '00:00'}</span>
                    <span>Score: <strong>${Math.round(call.urgency_score || 0)}</strong>/100</span>
                </div>
                <div class="card-tags">
                    ${tagsHtml}
                </div>
                <div class="card-actions">
                    <button class="btn-action-escalate" data-id="${call.call_id}">🚨 Escalate</button>
                    <button class="btn-action-resolve" data-id="${call.call_id}">✓ Resolve</button>
                </div>
            `;

            // Card click switches active monitored channel
            card.addEventListener("click", (e) => {
                if (e.target.tagName === "BUTTON") return;
                setActiveCall(call);
            });

            // Action: Escalate
            const btnEscalate = card.querySelector(".btn-action-escalate");
            if (btnEscalate) {
                btnEscalate.addEventListener("click", (e) => {
                    e.stopPropagation();
                    handleCallAction(call.call_id, "escalate");
                });
            }

            // Action: Resolve
            const btnResolve = card.querySelector(".btn-action-resolve");
            if (btnResolve) {
                btnResolve.addEventListener("click", (e) => {
                    e.stopPropagation();
                    handleCallAction(call.call_id, "resolve");
                });
            }

            callQueue.appendChild(card);
        });
    }

    async function handleCallAction(callId, action) {
        try {
            const res = await fetch("/api/call-queue/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ call_id: callId, action: action })
            });
            if (res.ok) {
                const data = await res.json();
                if (typeof data.remaining_pre_recorded === "number") {
                    remainingPreRecorded = data.remaining_pre_recorded;
                    updatePreRecordedAvailability(remainingPreRecorded);
                }
                await loadCallQueue();
            }
        } catch (err) {
            console.error("[ACTION ERROR]", err);
        }
    }

    function setActiveCall(call) {
        currentSelectedCallId = call.call_id;
        if (activeCallId) activeCallId.textContent = `#${call.call_id}`;

        updateTelemetryDisplay({
            urgency_score: call.urgency_score,
            priority_level: call.priority_level,
            dominant_emotion: call.dominant_emotion || "NEUTRAL",
            emotion_breakdown: call.emotions || {},
            acoustic_metrics: {
                pitch_std: call.pitch_std || 15.0,
                voice_tremor: call.voice_tremor || false,
                energy_level: call.voice_tremor ? "HIGH_INTENSITY" : "NORMAL_CONVERSATION"
            },
            transcript: call.transcript || "...",
            detected_tags: call.tags || [],
            investigator_advisory: call.advisory || "Standard triage protocol in effect."
        });

        renderCallQueue();
    }

    // Add Incoming Call from Library
    if (btnSimulateIncoming) {
        btnSimulateIncoming.addEventListener("click", async () => {
            if (btnSimulateIncoming.classList.contains("btn-disabled")) {
                if (queueAlert) queueAlert.classList.add("active");
                return;
            }

            btnSimulateIncoming.textContent = "Loading...";
            try {
                const res = await fetch("/api/call-queue/simulate-incoming", { method: "POST" });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "exhausted") {
                        updatePreRecordedAvailability(0);
                    } else if (data.call) {
                        await loadCallQueue();
                        setActiveCall(data.call);
                    }
                }
            } catch (err) {
                console.error("[SIMULATE INCOMING ERROR]", err);
            }
        });
    }

    // ==========================================
    // 2. ACTIVE MONITOR & TELEMETRY UPDATES
    // ==========================================
    function updateTelemetryDisplay(data) {
        const score = Math.round(data.urgency_score || 0);
        urgencyValue.textContent = score;
        livePriority.textContent = data.priority_level || "ROUTINE";

        if (data.priority_level === "CRITICAL") {
            livePriority.className = "pill-value critical";
            urgencyValue.style.color = "#ef4444";
            waveColor = "#ef4444";
            waveAmplitude = 35;
            waveFrequency = 0.12;
        } else if (data.priority_level === "ELEVATED") {
            livePriority.className = "pill-value elevated";
            urgencyValue.style.color = "#f59e0b";
            waveColor = "#f59e0b";
            waveAmplitude = 20;
            waveFrequency = 0.07;
        } else {
            livePriority.className = "pill-value routine";
            urgencyValue.style.color = "#10b981";
            waveColor = "#10b981";
            waveAmplitude = 8;
            waveFrequency = 0.03;
        }

        // Emotion Bars
        const emo = data.emotion_breakdown || {};
        const fear = Math.round((emo.fearful || 0) * 100);
        const sad = Math.round((emo.sad || 0) * 100);
        const angry = Math.round((emo.angry || 0) * 100);
        const neutral = Math.round((emo.neutral || 0) * 100);

        valFear.textContent = `${fear}%`;
        fillFear.style.width = `${fear}%`;
        valSad.textContent = `${sad}%`;
        fillSad.style.width = `${sad}%`;
        valAngry.textContent = `${angry}%`;
        fillAngry.style.width = `${angry}%`;
        valNeutral.textContent = `${neutral}%`;
        fillNeutral.style.width = `${neutral}%`;

        // Acoustics
        if (data.acoustic_metrics) {
            pitchStd.textContent = `${data.acoustic_metrics.pitch_std} Hz ${data.acoustic_metrics.pitch_std > 30 ? '(ERRATIC)' : '(STABLE)'}`;
            voiceTremor.textContent = data.acoustic_metrics.voice_tremor ? "DETECTED" : "NONE";
            if (voiceEnergy && data.acoustic_metrics.energy_level) {
                voiceEnergy.textContent = data.acoustic_metrics.energy_level.replace(/_/g, " ");
            }
        }

        // Transcript & Threat Tags
        if (data.transcript && data.transcript !== "...") {
            liveTranscript.textContent = `"${data.transcript}"`;
        }
        if (data.detected_tags && data.detected_tags.length > 0) {
            liveTags.innerHTML = data.detected_tags.map(t => {
                const color = data.priority_level === 'CRITICAL' ? 'red' : 'yellow';
                return `<span class="tag ${color}">${t}</span>`;
            }).join(" ");
        }

        // Advisory
        if (data.investigator_advisory) {
            advisoryText.textContent = data.investigator_advisory;
        }
    }

    // Center Panel Preset Simulators
    btnSimulatePanic.addEventListener("click", () => {
        const panicCall = localCallsState.find(c => c.call_id === "CALL-9823");
        if (panicCall) setActiveCall(panicCall);
    });

    btnSimulateCalm.addEventListener("click", () => {
        const calmCall = localCallsState.find(c => c.call_id === "CALL-9819");
        if (calmCall) setActiveCall(calmCall);
    });

    // ==========================================
    // 3. LIVE MICROPHONE INGESTION & FINAL DEBRIEF
    // ==========================================
    let isRecording = false;
    let audioContext = null;
    let micStream = null;
    let scriptProcessor = null;
    let liveSocket = null;
    let mediaRecorder = null;
    let recordedAudioChunks = [];
    let liveTimerInterval = null;

    // In-memory accumulator for live session statistics
    let liveSessionData = {
        callId: "",
        startTime: null,
        durationSec: 0,
        timeline: [],
        transcripts: [],
        allTags: new Set(),
        peakScore: 10,
        scoresList: [],
        tremorsCount: 0,
        pitchMax: 0,
        dominantEmotions: [],
        lastAdvisory: ""
    };

    btnLiveMic.addEventListener("click", async () => {
        if (!isRecording) {
            try {
                // Initialize fresh live call session
                const liveCallId = `CALL-LIVE-${Math.floor(Math.random() * 9000 + 1000)}`;
                currentSelectedCallId = liveCallId;

                liveSessionData = {
                    callId: liveCallId,
                    startTime: Date.now(),
                    durationSec: 0,
                    timeline: [],
                    transcripts: [],
                    allTags: new Set(["#LIVE_INTERCEPT"]),
                    peakScore: 10.0,
                    scoresList: [],
                    tremorsCount: 0,
                    pitchMax: 0.0,
                    dominantEmotions: [],
                    lastAdvisory: "Live triage analysis active."
                };

                const initialLiveCard = {
                    call_id: liveCallId,
                    caller_number: "Officer Live Microphone",
                    caller_label: "Active Patrol / Channel Ingestion",
                    duration: "00:01",
                    urgency_score: 10.0,
                    priority_level: "ROUTINE",
                    tags: ["#LIVE_INTERCEPT"],
                    dominant_emotion: "NEUTRAL",
                    pitch_std: 0.0,
                    voice_tremor: false,
                    emotions: { neutral: 0.95 },
                    transcript: "Listening to microphone...",
                    advisory: "Speak into the microphone to test live speech emotion, acoustic biomarkers, and threat keywords.",
                    status: "ACTIVE"
                };

                // Insert into local state & select it
                localCallsState = localCallsState.filter(c => !c.call_id.startsWith("CALL-LIVE"));
                localCallsState.unshift(initialLiveCard);
                setActiveCall(initialLiveCard);

                // 1. Establish WebSocket
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const wsUrl = `${protocol}//${window.location.host}/ws/live-call/${liveCallId}`;
                liveSocket = new WebSocket(wsUrl);
                liveSocket.binaryType = "arraybuffer";

                liveSocket.onopen = () => {
                    console.log("[WS] Live streaming started:", wsUrl);
                };

                // 2. Receive Real-Time Telemetry
                liveSocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    const nowSec = Math.round((Date.now() - liveSessionData.startTime) / 1000);
                    const timeLabel = `${String(Math.floor(nowSec / 60)).padStart(2, '0')}:${String(nowSec % 60).padStart(2, '0')}`;

                    // Update session tracking
                    const score = data.urgency_score || 10.0;
                    liveSessionData.scoresList.push(score);
                    liveSessionData.peakScore = Math.max(liveSessionData.peakScore, score);
                    liveSessionData.lastAdvisory = data.investigator_advisory || liveSessionData.lastAdvisory;

                    if (data.dominant_emotion) {
                        liveSessionData.dominantEmotions.push(data.dominant_emotion);
                    }

                    if (data.detected_tags && data.detected_tags.length > 0) {
                        data.detected_tags.forEach(t => liveSessionData.allTags.add(t));
                    }

                    if (data.acoustic_metrics) {
                        liveSessionData.pitchMax = Math.max(liveSessionData.pitchMax, data.acoustic_metrics.pitch_std || 0);
                        if (data.acoustic_metrics.voice_tremor) {
                            liveSessionData.tremorsCount++;
                        }
                    }

                    if (data.transcript && data.transcript !== "..." && !liveSessionData.transcripts.includes(data.transcript)) {
                        liveSessionData.transcripts.push(data.transcript);
                    }

                    // Add to timeline
                    liveSessionData.timeline.push({
                        timeLabel: timeLabel,
                        urgency_score: score,
                        priority_level: data.priority_level,
                        dominant_emotion: data.dominant_emotion,
                        pitch_std: data.acoustic_metrics ? data.acoustic_metrics.pitch_std : 0.0,
                        voice_tremor: data.acoustic_metrics ? data.acoustic_metrics.voice_tremor : false,
                        transcript: data.transcript || "..."
                    });

                    // Live update active screen
                    updateTelemetryDisplay(data);

                    // Live update card in queue
                    const card = localCallsState.find(c => c.call_id === liveCallId);
                    if (card) {
                        card.urgency_score = liveSessionData.peakScore;
                        card.priority_level = data.priority_level;
                        card.tags = Array.from(liveSessionData.allTags);
                        card.dominant_emotion = data.dominant_emotion;
                        card.duration = timeLabel;
                        card.transcript = data.transcript;
                        card.advisory = data.investigator_advisory;
                        card.pitch_std = data.acoustic_metrics ? data.acoustic_metrics.pitch_std : 0.0;
                        card.voice_tremor = data.acoustic_metrics ? data.acoustic_metrics.voice_tremor : false;
                        card.emotions = data.emotion_breakdown || {};
                        renderCallQueue();
                    }
                };

                // 3. Capture Microphone Audio
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true }
                });

                // Also record audio blob for playback in final analysis
                recordedAudioChunks = [];
                try {
                    mediaRecorder = new MediaRecorder(micStream);
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) recordedAudioChunks.push(e.data);
                    };
                    mediaRecorder.start(250);
                } catch (e) {
                    console.warn("MediaRecorder not supported for playback:", e);
                }

                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === "suspended") {
                    await audioContext.resume();
                }

                const source = audioContext.createMediaStreamSource(micStream);
                scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

                scriptProcessor.onaudioprocess = (e) => {
                    if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) return;

                    const inputData = e.inputBuffer.getChannelData(0);

                    // Dynamic wave amplitude
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    waveAmplitude = Math.max(10, Math.min(60, rms * 200));

                    // Resample to 16 kHz
                    const targetSampleRate = 16000;
                    const resampleRatio = audioContext.sampleRate / targetSampleRate;
                    const outputLength = Math.floor(inputData.length / resampleRatio);
                    const int16Buffer = new Int16Array(outputLength);

                    for (let i = 0; i < outputLength; i++) {
                        const originalIndex = Math.floor(i * resampleRatio);
                        const s = Math.max(-1, Math.min(1, inputData[originalIndex]));
                        int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    liveSocket.send(int16Buffer.buffer);
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(audioContext.destination);

                // Update Button State to pulsing red recording mode with timer
                btnLiveMic.classList.add("btn-recording");
                btnLiveMic.textContent = "🔴 Stop Live Call (00:00) & View Final Analysis";
                isRecording = true;

                // Live timer ticker
                liveTimerInterval = setInterval(() => {
                    const elapsed = Math.round((Date.now() - liveSessionData.startTime) / 1000);
                    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
                    const ss = String(elapsed % 60).padStart(2, '0');
                    btnLiveMic.textContent = `🔴 Stop Live Call (${mm}:${ss}) & View Final Analysis`;
                }, 1000);

            } catch (err) {
                alert("Microphone permission denied or not detected: " + err.message);
                console.error(err);
            }
        } else {
            // ==========================================
            // STOP CALL & GENERATE FINAL ANALYSIS REPORT
            // ==========================================
            clearInterval(liveTimerInterval);
            liveTimerInterval = null;

            if (scriptProcessor) scriptProcessor.disconnect();
            if (audioContext) audioContext.close();
            if (micStream) micStream.getTracks().forEach(t => t.stop());
            if (liveSocket) liveSocket.close();

            btnLiveMic.classList.remove("btn-recording");
            btnLiveMic.textContent = "Start Live Mic Triage";
            isRecording = false;

            // Stop MediaRecorder and package audio
            let recordedAudioUrl = null;
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
                const audioBlob = new Blob(recordedAudioChunks, { type: "audio/webm" });
                recordedAudioUrl = URL.createObjectURL(audioBlob);
            }

            // Compute Final Debrief Metrics
            const totalDurationSec = Math.max(1, Math.round((Date.now() - liveSessionData.startTime) / 1000));
            const mm = String(Math.floor(totalDurationSec / 60)).padStart(2, '0');
            const ss = String(totalDurationSec % 60).padStart(2, '0');
            const finalDurationStr = `${mm}:${ss}`;

            const peakScore = Math.round(liveSessionData.peakScore);
            const avgScore = liveSessionData.scoresList.length > 0 
                ? Math.round(liveSessionData.scoresList.reduce((a, b) => a + b, 0) / liveSessionData.scoresList.length)
                : peakScore;

            let finalPriority = "ROUTINE";
            if (peakScore >= 75) finalPriority = "CRITICAL";
            else if (peakScore >= 30) finalPriority = "ELEVATED";

            // Dominant emotion count
            const emoCounts = {};
            liveSessionData.dominantEmotions.forEach(e => emoCounts[e] = (emoCounts[e] || 0) + 1);
            let overallDominantEmo = "NEUTRAL";
            let maxCount = 0;
            for (const [e, count] of Object.entries(emoCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    overallDominantEmo = e;
                }
            }

            const consolidatedTranscript = liveSessionData.transcripts.length > 0
                ? liveSessionData.transcripts.join(" ")
                : "(No distinct voice speech recognized during the live session)";

            const wordCount = consolidatedTranscript.split(/\s+/).filter(w => w.length > 0).length;

            // Final Officer Protocol Recommendation
            let finalDisposition = liveSessionData.lastAdvisory;
            if (finalPriority === "CRITICAL") {
                finalDisposition = "CRITICAL COERCION / DISTRESS DETECTED: Immediate officer dispatch and banking freeze advisory warranted. High risk of extortion in progress.";
            } else if (finalPriority === "ELEVATED") {
                finalDisposition = "MODERATE THREAT / SUSPICIOUS CONVERSATION: Secondary officer review advised. Log threat keywords and cross-reference with active FIR records.";
            } else {
                finalDisposition = "ROUTINE CHANNEL VERIFIED: Stable vocal baseline and no extortion keywords detected. Standard administrative queue closure.";
            }

            // OPEN FINAL CALL ANALYSIS MODAL
            openLiveFinalModal({
                callId: liveSessionData.callId,
                duration: finalDurationStr,
                peakScore: peakScore,
                avgScore: avgScore,
                priority: finalPriority,
                dominantEmotion: overallDominantEmo,
                pitchMax: liveSessionData.pitchMax.toFixed(1),
                tremorsCount: liveSessionData.tremorsCount,
                wordCount: wordCount,
                tags: Array.from(liveSessionData.allTags),
                transcript: consolidatedTranscript,
                disposition: finalDisposition,
                timeline: liveSessionData.timeline,
                audioSrc: recordedAudioUrl
            });
        }
    });

    function openLiveFinalModal(data) {
        if (!liveFinalModal) return;

        liveModalCallId.textContent = `#${data.callId}`;
        liveModalDuration.textContent = data.duration;
        liveModalPeakScore.textContent = data.peakScore;
        liveModalAvgScore.textContent = `${data.avgScore}/100`;
        liveModalPriority.textContent = data.priority;

        if (data.priority === "CRITICAL") {
            liveModalPriority.className = "badge priority-crit";
            liveModalPeakScore.style.color = "#ef4444";
        } else if (data.priority === "ELEVATED") {
            liveModalPriority.className = "badge priority-elev";
            liveModalPeakScore.style.color = "#f59e0b";
        } else {
            liveModalPriority.className = "badge priority-rout";
            liveModalPeakScore.style.color = "#10b981";
        }

        // Tags
        if (data.tags && data.tags.length > 0) {
            liveModalTags.innerHTML = data.tags.map(t => `<span class="tag ${data.priority === 'CRITICAL' ? 'red' : 'yellow'}">${t}</span>`).join(" ");
        } else {
            liveModalTags.innerHTML = `<span class="tag green">#STABLE_LINE</span>`;
        }

        liveModalAdvisory.textContent = data.disposition;
        liveModalDominantEmo.textContent = data.dominantEmotion;
        liveModalPitchStd.textContent = `${data.pitchMax} Hz`;
        liveModalTremorCount.textContent = `${data.tremorsCount} SPIKES`;
        liveModalWordCount.textContent = `${data.wordCount} WORDS`;
        liveModalFullTranscript.textContent = `"${data.transcript}"`;

        // Audio Playback
        if (data.audioSrc && liveModalAudioPlayer) {
            liveModalAudioPlayer.src = data.audioSrc;
            liveModalAudioPlayer.load();
        }

        // Populate Timeline Progression Table
        if (liveModalTimelineBody) {
            liveModalTimelineBody.innerHTML = "";
            (data.timeline || []).forEach(row => {
                const tr = document.createElement("tr");

                let badge = `<span class="badge priority-rout">ROUTINE</span>`;
                if (row.priority_level === "CRITICAL") badge = `<span class="badge priority-crit">CRITICAL</span>`;
                else if (row.priority_level === "ELEVATED") badge = `<span class="badge priority-elev">ELEVATED</span>`;

                tr.innerHTML = `
                    <td style="font-family:'JetBrains Mono',monospace;">${row.timeLabel}</td>
                    <td style="font-weight:700;">${Math.round(row.urgency_score)}/100</td>
                    <td>${badge}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${row.dominant_emotion || 'NEUTRAL'}</td>
                    <td>${row.pitch_std} Hz</td>
                    <td>${row.voice_tremor ? '⚠️ DETECTED' : 'None'}</td>
                    <td style="font-style:italic; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${row.transcript}"</td>
                `;
                liveModalTimelineBody.appendChild(tr);
            });
        }

        liveFinalModal.classList.add("open");
    }

    function closeLiveModal() {
        if (liveModalAudioPlayer) liveModalAudioPlayer.pause();
        if (liveFinalModal) liveFinalModal.classList.remove("open");
    }

    if (btnCloseLiveModal) btnCloseLiveModal.addEventListener("click", closeLiveModal);
    if (btnCloseLiveModalBottom) btnCloseLiveModalBottom.addEventListener("click", closeLiveModal);
    if (btnSaveLiveCall) {
        btnSaveLiveCall.addEventListener("click", () => {
            closeLiveModal();
            renderCallQueue();
        });
    }

    // ==========================================
    // 4. FORENSIC CASE AUDIO & WIRETAP ANALYSIS
    // ==========================================
    async function executeForensicAnalysis(endpoint, body, audioSrcUrl) {
        if (forensicLoading) forensicLoading.classList.add("active");
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                body: body
            });

            if (!res.ok) throw new Error("Forensic server analysis returned error");
            const result = await res.json();
            currentForensicData = result;

            openForensicModal(result, audioSrcUrl);
        } catch (err) {
            alert("Forensic analysis failed: " + err.message);
            console.error(err);
        } finally {
            if (forensicLoading) forensicLoading.classList.remove("active");
        }
    }

    if (btnLoadSample && sampleSelect) {
        btnLoadSample.addEventListener("click", () => {
            const sampleId = sampleSelect.value;
            if (!sampleId) {
                alert("Please select a wiretap scenario from the dropdown first.");
                return;
            }
            const audioUrl = `/api/sample-recordings/${sampleId}.wav`;
            executeForensicAnalysis(`/api/investigate-recording?sample_id=${encodeURIComponent(sampleId)}`, null, audioUrl);
        });
    }

    if (btnUpload && audioUpload) {
        btnUpload.addEventListener("click", () => {
            const file = audioUpload.files[0];
            if (!file) {
                alert("Please select an audio file (.wav or .mp3) to upload.");
                return;
            }
            const formData = new FormData();
            formData.append("file", file);
            const audioUrl = URL.createObjectURL(file);
            executeForensicAnalysis("/api/investigate-recording", formData, audioUrl);
        });
    }

    function openForensicModal(data, audioSrc) {
        if (!forensicModal) return;

        modalFilename.textContent = data.filename || "CASE_EVIDENCE.WAV";
        modalScore.textContent = Math.round(data.overall_urgency_score || 0);
        modalPriority.textContent = data.priority_level || "ROUTINE";
        modalDuration.textContent = data.duration_label || "00:00";

        if (data.priority_level === "CRITICAL") {
            modalPriority.className = "badge priority-crit";
            modalScore.style.color = "#ef4444";
        } else if (data.priority_level === "ELEVATED") {
            modalPriority.className = "badge priority-elev";
            modalScore.style.color = "#f59e0b";
        } else {
            modalPriority.className = "badge priority-rout";
            modalScore.style.color = "#10b981";
        }

        // Tags
        if (data.primary_threat_tags && data.primary_threat_tags.length > 0) {
            modalTags.innerHTML = data.primary_threat_tags.map(t => `<span class="tag red">${t}</span>`).join(" ");
        } else {
            modalTags.innerHTML = `<span class="tag green">#STABLE_LINE</span>`;
        }

        modalSummary.textContent = data.summary || "No active threat patterns detected.";
        modalFullTranscript.textContent = `"${data.full_transcript || '(No speech transcript recognized)'}"`;

        if (audioSrc && modalAudioPlayer) {
            modalAudioPlayer.src = audioSrc;
            modalAudioPlayer.load();
        }

        // Timeline Table
        if (modalTimelineBody && data.timeline) {
            modalTimelineBody.innerHTML = "";
            data.timeline.forEach(row => {
                const tr = document.createElement("tr");

                let badge = `<span class="badge priority-rout">ROUTINE</span>`;
                if (row.priority_level === "CRITICAL") badge = `<span class="badge priority-crit">CRITICAL</span>`;
                else if (row.priority_level === "ELEVATED") badge = `<span class="badge priority-elev">ELEVATED</span>`;

                const rowTags = (row.detected_tags || []).map(t => `<span class="tag red">${t}</span>`).join(" ");

                tr.innerHTML = `
                    <td style="font-family:'JetBrains Mono',monospace;">${row.time_label}</td>
                    <td style="font-weight:700;">${Math.round(row.urgency_score)}/100</td>
                    <td>${badge}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${row.dominant_emotion}</td>
                    <td>${row.pitch_std} Hz</td>
                    <td>${row.voice_tremor ? '⚠️ DETECTED' : 'None'}</td>
                    <td>${rowTags || '<span style="color:var(--text-muted);">-</span>'}</td>
                `;
                modalTimelineBody.appendChild(tr);
            });
        }

        forensicModal.classList.add("open");
    }

    function closeModal() {
        if (modalAudioPlayer) modalAudioPlayer.pause();
        if (forensicModal) forensicModal.classList.remove("open");
    }

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCloseModalBottom) btnCloseModalBottom.addEventListener("click", closeModal);

    // Transfer Forensic Case Data to Active Monitor
    if (btnLoadIntoMonitor) {
        btnLoadIntoMonitor.addEventListener("click", () => {
            if (!currentForensicData) return;
            const d = currentForensicData;

            const wiretapCall = {
                call_id: `WIRETAP-${Math.floor(Math.random() * 9000 + 1000)}`,
                caller_number: "Forensic Case Recording",
                caller_label: d.filename,
                duration: d.duration_label,
                urgency_score: d.overall_urgency_score,
                priority_level: d.priority_level,
                tags: d.primary_threat_tags,
                dominant_emotion: d.timeline && d.timeline[0] ? d.timeline[0].dominant_emotion : "NEUTRAL",
                pitch_std: d.timeline && d.timeline[0] ? d.timeline[0].pitch_std : 20.0,
                voice_tremor: d.timeline ? d.timeline.some(t => t.voice_tremor) : false,
                emotions: d.timeline && d.timeline[0] ? d.timeline[0].emotions : {},
                transcript: d.full_transcript,
                advisory: d.summary,
                status: "ACTIVE"
            };

            localCallsState.unshift(wiretapCall);
            setActiveCall(wiretapCall);
            closeModal();
        });
    }

    // Initial Load
    loadCallQueue();
});
