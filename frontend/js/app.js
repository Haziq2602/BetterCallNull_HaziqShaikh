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

    // Live Mic Toggle
    let isRecording = false;
    btnLiveMic.addEventListener("click", async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                btnLiveMic.textContent = "Stop Live Mic Triage";
                btnLiveMic.style.background = "#ef4444";
                isRecording = true;
                console.log("[AUDIO] Microphone stream connected successfully");
            } catch (err) {
                alert("Microphone access permission required or not detected.");
            }
        } else {
            btnLiveMic.textContent = "Start Live Mic Triage";
            btnLiveMic.style.background = "#3b82f6";
            isRecording = false;
        }
    });
});
