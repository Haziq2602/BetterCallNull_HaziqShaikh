/**
 * CyberGuard - Front-End Logic & Live Triage Dashboard Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // Canvas & Waveform visualizer
    const canvas = document.getElementById("waveformCanvas");
    const ctx = canvas.getContext("2d");
    let animationId = null;

    // UI Elements
    const urgencyValue = document.getElementById("urgencyValue");
    const livePriority = document.getElementById("livePriority");
    const liveTranscript = document.getElementById("liveTranscript");
    const liveTags = document.getElementById("liveTags");
    const advisoryText = document.getElementById("advisoryText");
    const pitchStd = document.getElementById("pitchStd");
    const voiceTremor = document.getElementById("voiceTremor");

    // Bars
    const valFear = document.getElementById("valFear");
    const fillFear = document.getElementById("fillFear");
    const valSad = document.getElementById("valSad");
    const fillSad = document.getElementById("fillSad");
    const valAngry = document.getElementById("valAngry");
    const fillAngry = document.getElementById("fillAngry");
    const valNeutral = document.getElementById("valNeutral");
    const fillNeutral = document.getElementById("fillNeutral");

    // Interactive Demo Buttons
    const btnSimulatePanic = document.getElementById("btnSimulatePanic");
    const btnSimulateCalm = document.getElementById("btnSimulateCalm");
    const btnLiveMic = document.getElementById("btnLiveMic");

    // Synthetic Waveform generator
    let waveAmplitude = 15;
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

    // Simulation Scenario: Acute Panic / Digital Arrest
    btnSimulatePanic.addEventListener("click", () => {
        waveAmplitude = 35;
        waveFrequency = 0.12;
        waveColor = "#ef4444";

        urgencyValue.textContent = "94";
        urgencyValue.style.color = "#ef4444";
        livePriority.textContent = "CRITICAL";
        livePriority.className = "pill-value critical";

        pitchStd.textContent = "52.4 Hz (ERRATIC SPIKE)";
        voiceTremor.textContent = "DETECTED";

        valFear.textContent = "88%";
        fillFear.style.width = "88%";
        valSad.textContent = "72%";
        fillSad.style.width = "72%";
        valAngry.textContent = "05%";
        fillAngry.style.width = "5%";
        valNeutral.textContent = "02%";
        fillNeutral.style.width = "2%";

        liveTranscript.textContent = '"Please don\'t freeze my account! I will transfer the clearance fee right now, just please don\'t send police to arrest me..."';
        
        liveTags.innerHTML = `
            <span class="tag red">#DIGITAL_ARREST_SCAM</span>
            <span class="tag red">#ACUTE_PANIC</span>
            <span class="tag yellow">#VOCAL_TREMORS</span>
        `;

        advisoryText.textContent = "Immediate digital arrest coercion in progress. Officer protocol: instruct caller to hold, do not transfer funds, dispatch cyber unit.";
    });

    // Simulation Scenario: Calm Inquiry
    btnSimulateCalm.addEventListener("click", () => {
        waveAmplitude = 8;
        waveFrequency = 0.03;
        waveColor = "#10b981";

        urgencyValue.textContent = "22";
        urgencyValue.style.color = "#10b981";
        livePriority.textContent = "ROUTINE";
        livePriority.className = "pill-value routine";

        pitchStd.textContent = "12.1 Hz (STABLE)";
        voiceTremor.textContent = "NONE";

        valFear.textContent = "04%";
        fillFear.style.width = "4%";
        valSad.textContent = "06%";
        fillSad.style.width = "6%";
        valAngry.textContent = "03%";
        fillAngry.style.width = "3%";
        valNeutral.textContent = "87%";
        fillNeutral.style.width = "87%";

        liveTranscript.textContent = '"Hello officer, I just wanted to verify the acknowledgement number for the FIR complaint I registered yesterday online."';
        
        liveTags.innerHTML = `
            <span class="tag green">#STATUS_INQUIRY</span>
            <span class="tag green">#STABLE_BASELINE</span>
        `;

        advisoryText.textContent = "Standard inquiry regarding past cyber complaint. Standard operational queue.";
    });

    // Real-Time WebSocket Streaming & Live Microphone Ingestion
    let isRecording = false;
    let audioContext = null;
    let micStream = null;
    let scriptProcessor = null;
    let liveSocket = null;

    btnLiveMic.addEventListener("click", async () => {
        if (!isRecording) {
            try {
                // 1. Establish WebSocket connection to FastAPI backend
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const wsUrl = `${protocol}//${window.location.host}/ws/live-call/CALL-9823`;
                liveSocket = new WebSocket(wsUrl);
                liveSocket.binaryType = "arraybuffer";

                liveSocket.onopen = () => {
                    console.log("[WS] Connected to live call stream:", wsUrl);
                };

                // 2. Receive Real-Time Triage Telemetry from AI Backend
                liveSocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("[TELEMETRY RECEIVED]", data);

                    // Update Urgency & Priority
                    urgencyValue.textContent = data.urgency_score;
                    livePriority.textContent = data.priority_level;

                    if (data.priority_level === "CRITICAL") {
                        livePriority.className = "pill-value critical";
                        urgencyValue.style.color = "#ef4444";
                        waveColor = "#ef4444";
                    } else if (data.priority_level === "ELEVATED") {
                        livePriority.className = "pill-value elevated";
                        urgencyValue.style.color = "#f59e0b";
                        waveColor = "#f59e0b";
                    } else {
                        livePriority.className = "pill-value routine";
                        urgencyValue.style.color = "#10b981";
                        waveColor = "#10b981";
                    }

                    // Update Emotion Bars
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

                    // Update Acoustics
                    if (data.acoustic_metrics) {
                        pitchStd.textContent = `${data.acoustic_metrics.pitch_std} Hz`;
                        voiceTremor.textContent = data.acoustic_metrics.voice_tremor ? "DETECTED" : "NONE";
                    }

                    // Update Transcript & Tags
                    liveTranscript.textContent = `"${data.transcript}"`;
                    if (data.detected_tags && data.detected_tags.length > 0) {
                        liveTags.innerHTML = data.detected_tags.map(t => `<span class="tag red">${t}</span>`).join(" ");
                    }

                    // Update Advisory
                    advisoryText.textContent = data.investigator_advisory;
                };

                liveSocket.onerror = (err) => {
                    console.error("[WS ERROR]", err);
                };

                // 3. Request User Microphone
                micStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: { echoCancellation: true, noiseSuppression: true } 
                });

                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === "suspended") {
                    await audioContext.resume();
                }

                const source = audioContext.createMediaStreamSource(micStream);

                // ScriptProcessorNode buffers audio chunks (buffer size 4096 = ~85ms at 48kHz)
                scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

                scriptProcessor.onaudioprocess = (e) => {
                    if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) return;

                    const inputData = e.inputBuffer.getChannelData(0);

                    // Dynamic wave amplitude based on mic input volume
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    waveAmplitude = Math.max(10, Math.min(60, rms * 200));

                    // Resample from AudioContext sample rate (e.g. 44.1k/48k) to 16 kHz
                    const targetSampleRate = 16000;
                    const resampleRatio = audioContext.sampleRate / targetSampleRate;
                    const outputLength = Math.floor(inputData.length / resampleRatio);
                    const int16Buffer = new Int16Array(outputLength);

                    for (let i = 0; i < outputLength; i++) {
                        const originalIndex = Math.floor(i * resampleRatio);
                        const s = Math.max(-1, Math.min(1, inputData[originalIndex]));
                        int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    // Stream 16kHz PCM bytes to backend
                    liveSocket.send(int16Buffer.buffer);
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(audioContext.destination);

                btnLiveMic.textContent = "Stop Live Mic Triage";
                btnLiveMic.style.background = "#ef4444";
                isRecording = true;
                console.log("[AUDIO] Microphone streaming active at 16kHz PCM.");

            } catch (err) {
                alert("Microphone permission denied or not detected: " + err.message);
                console.error(err);
            }
        } else {
            // Stop recording & close socket
            if (scriptProcessor) scriptProcessor.disconnect();
            if (audioContext) audioContext.close();
            if (micStream) micStream.getTracks().forEach(t => t.stop());
            if (liveSocket) liveSocket.close();

            btnLiveMic.textContent = "Start Live Mic Triage";
            btnLiveMic.style.background = "#3b82f6";
            isRecording = false;
            console.log("[AUDIO] Microphone stream stopped.");
        }
    });
});
