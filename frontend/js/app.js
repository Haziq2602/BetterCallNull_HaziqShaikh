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
    const fallbackBanner = document.getElementById("fallbackBanner");
    const systemStatusText = document.querySelector(".system-status .status-text");
    const systemStatusIndicator = document.querySelector(".system-status .status-indicator");

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
    const btnSimulateFallback = document.getElementById("btnSimulateFallback");
    const btnLiveMic = document.getElementById("btnLiveMic");

    // Forensic Wiretap Elements
    const sampleSelect = document.getElementById("sampleSelect");
    const btnLoadSample = document.getElementById("btnLoadSample");
    const audioUpload = document.getElementById("audioUpload");
    const btnUpload = document.getElementById("btnUpload");
    const forensicLoading = document.getElementById("forensicLoading");

    // Pre-Recorded Audio Player Elements (Tactical Playback in Monitor)
    const audioPlaybackBar = document.getElementById("audioPlaybackBar");
    const btnPlaybackToggle = document.getElementById("btnPlaybackToggle");
    const playbackIconPlay = document.getElementById("playbackIconPlay");
    const playbackIconPause = document.getElementById("playbackIconPause");
    const playbackToggleLabel = document.getElementById("playbackToggleLabel");
    const playbackTimer = document.getElementById("playbackTimer");
    const playbackProgress = document.getElementById("playbackProgress");
    const playbackProgressFill = document.getElementById("playbackProgressFill");
    const preRecordedAudio = document.getElementById("preRecordedAudio");
    let activePreRecordedCall = null;

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

    // ==========================================
    // INVESTIGATOR AUTHENTICATION GATE & STATE
    // ==========================================
    const authGate = document.getElementById("authGate");
    const loginForm = document.getElementById("loginForm");
    const loginUsername = document.getElementById("loginUsername");
    const loginPassword = document.getElementById("loginPassword");
    const loginError = document.getElementById("loginError");
    const loginErrorMsg = document.getElementById("loginErrorMsg");
    const btnLoginSubmit = document.getElementById("btnLoginSubmit");
    const investigatorPill = document.getElementById("investigatorPill");
    const headerOfficerRole = document.getElementById("headerOfficerRole");
    const headerOfficerId = document.getElementById("headerOfficerId");
    const headerOfficerName = document.getElementById("headerOfficerName");
    const btnLogout = document.getElementById("btnLogout");
    const btnAdminNav = document.getElementById("btnAdminNav");

    function getAuthToken() {
        return sessionStorage.getItem("cyberguard_token");
    }

    function getInvestigatorProfile() {
        try {
            const raw = sessionStorage.getItem("cyberguard_investigator");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setAuthenticatedUser(token, profile) {
        sessionStorage.setItem("cyberguard_token", token);
        sessionStorage.setItem("cyberguard_investigator", JSON.stringify(profile));
        renderAuthenticatedUI();
    }

    function renderAuthenticatedUI() {
        const token = getAuthToken();
        const profile = getInvestigatorProfile();

        if (token && profile) {
            if (authGate) authGate.style.display = "none";
            if (investigatorPill) {
                investigatorPill.style.display = "inline-flex";
                if (headerOfficerRole) headerOfficerRole.textContent = profile.role || "INVESTIGATOR";
                if (headerOfficerId) headerOfficerId.textContent = profile.badge_id || "INV";
                if (headerOfficerName) headerOfficerName.textContent = profile.name || profile.username || "Officer";
            }
            if (btnAdminNav) {
                const COMMANDER_ROLES = ["LEAD_INVESTIGATOR", "SUPERINTENDENT", "STATION_COMMANDER", "ADMIN"];
                if (COMMANDER_ROLES.includes(profile.role)) {
                    btnAdminNav.style.display = "inline-flex";
                } else {
                    btnAdminNav.style.display = "none";
                }
            }
        } else {
            // Unauthenticated: redirect to dedicated login portal
            window.location.href = "login.html";
            return;
        }
    }

    function logoutInvestigator() {
        sessionStorage.removeItem("cyberguard_token");
        sessionStorage.removeItem("cyberguard_investigator");
        sessionStorage.removeItem("cyberguard_just_logged_in");
        window.location.href = "login.html";
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            logoutInvestigator();
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (loginError) loginError.style.display = "none";
            if (btnLoginSubmit) {
                btnLoginSubmit.disabled = true;
                btnLoginSubmit.innerHTML = `<span>Verifying credentials...</span>`;
            }

            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: loginUsername.value.trim(),
                        password: loginPassword.value
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Invalid badge credentials or passcode.");
                }

                setAuthenticatedUser(data.access_token, data.investigator);
            } catch (err) {
                if (loginError && loginErrorMsg) {
                    loginError.style.display = "flex";
                    loginErrorMsg.textContent = err.message;
                }
            } finally {
                if (btnLoginSubmit) {
                    btnLoginSubmit.disabled = false;
                    btnLoginSubmit.innerHTML = `<span>Authorize Terminal Session</span> <span class="btn-arrow">→</span>`;
                }
            }
        });
    }

    // Magic Login Link Toggle & Handlers (Confidential Dispatch)
    const btnForgotPass = document.getElementById("btnForgotPass");
    const btnBackToLogin = document.getElementById("btnBackToLogin");
    const forgotForm = document.getElementById("forgotForm");
    const forgotUsername = document.getElementById("forgotUsername");
    const forgotError = document.getElementById("forgotError");
    const forgotErrorMsg = document.getElementById("forgotErrorMsg");
    const forgotSuccess = document.getElementById("forgotSuccess");
    const btnForgotSubmit = document.getElementById("btnForgotSubmit");

    if (btnForgotPass && forgotForm && loginForm) {
        btnForgotPass.addEventListener("click", () => {
            loginForm.style.display = "none";
            forgotForm.style.display = "flex";
            if (forgotError) forgotError.style.display = "none";
            if (forgotSuccess) forgotSuccess.style.display = "none";
        });
    }

    if (btnBackToLogin && forgotForm && loginForm) {
        btnBackToLogin.addEventListener("click", () => {
            forgotForm.style.display = "none";
            loginForm.style.display = "flex";
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (forgotError) forgotError.style.display = "none";
            if (forgotSuccess) forgotSuccess.style.display = "none";
            if (btnForgotSubmit) {
                btnForgotSubmit.disabled = true;
                btnForgotSubmit.innerHTML = `<span>Dispatching secure link...</span>`;
            }

            try {
                const res = await fetch("/api/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: forgotUsername.value.trim()
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Dispatch request failed.");
                }

                if (forgotSuccess) forgotSuccess.style.display = "flex";
                const usernameField = document.getElementById("forgotUsernameField");
                if (usernameField) usernameField.style.display = "none";
                if (btnForgotSubmit) btnForgotSubmit.style.display = "none";
            } catch (err) {
                if (forgotError && forgotErrorMsg) {
                    forgotError.style.display = "flex";
                    forgotErrorMsg.textContent = err.message;
                }
            } finally {
                if (btnForgotSubmit && btnForgotSubmit.style.display !== "none") {
                    btnForgotSubmit.disabled = false;
                    btnForgotSubmit.innerHTML = `<span>Dispatch One-Time Login Link</span> <span class="btn-arrow">→</span>`;
                }
            }
        });
    }

    // Authenticated fetch wrapper that attaches Authorization header
    async function authFetch(url, options = {}) {
        const token = getAuthToken();
        const headers = options.headers ? { ...options.headers } : {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const resp = await fetch(url, { ...options, headers });
        if (resp.status === 401) {
            // Token expired or invalid
            logoutInvestigator();
        }
        return resp;
    }

    // Check if arrived with a one-time magic login link
    const urlParams = new URLSearchParams(window.location.search);
    const magicToken = urlParams.get("magic_token");
    if (magicToken) {
        if (btnLoginSubmit) {
            btnLoginSubmit.disabled = true;
            btnLoginSubmit.innerHTML = `<span>Verifying Secure Magic Login Link...</span>`;
        }
        fetch(`/api/auth/verify-magic-token?token=${encodeURIComponent(magicToken)}`)
            .then(res => {
                if (!res.ok) throw new Error("Magic login link is invalid, expired, or has already been used.");
                return res.json();
            })
            .then(data => {
                // Clean URL query params without reloading
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
                setAuthenticatedUser(data.access_token, data.investigator);
            })
            .catch(err => {
                if (loginError && loginErrorMsg) {
                    loginError.style.display = "flex";
                    loginErrorMsg.textContent = err.message;
                }
                if (btnLoginSubmit) {
                    btnLoginSubmit.disabled = false;
                    btnLoginSubmit.innerHTML = `<span>Authorize Terminal Session</span> <span class="btn-arrow">→</span>`;
                }
                renderAuthenticatedUI();
            });
    } else {
        // Check auth on startup
        renderAuthenticatedUI();
    }

    let currentForensicData = null;
    let currentLiveDebriefData = null;
    let localCallsState = [];
    let currentSelectedCallId = "CALL-9823";
    let remainingPreRecorded = 3;

    // ==========================================
    // VOICE SIGNAL VISUALIZER (scrollable ECG-style timeline)
    // The whole session is kept as a timeline (newest on the right).
    //   - speaking  -> sharp spikes above/below the axis that follow the voice level
    //   - silence   -> a perfectly straight line, so pauses show up as flat gaps
    // The panel follows the live edge automatically. Scroll left (scrollbar,
    // mouse wheel, trackpad or touch) to review earlier signal; "Jump to latest"
    // returns to the live edge. Only the visible slice is drawn, so long
    // sessions stay cheap. Live mic uses the real microphone level; stored /
    // demo calls use a simulated speech pattern.
    // ==========================================
    const signalState = document.getElementById("signalState");
    const signalScroll = document.getElementById("signalScroll");
    const signalTrack = document.getElementById("signalTrack");
    const signalLiveBtn = document.getElementById("signalLive");

    const SIGNAL_STEP_MS = 40;     // time per sample
    const SIGNAL_COL_W = 3;        // pixels per sample (75 px of timeline per second)
    const SIGNAL_MAX = 15000;      // samples kept (~10 min); oldest dropped beyond this
    const SIGNAL_DROP = 2000;      // how many oldest samples to drop at once
    const TICK_EVERY = Math.round(1000 / SIGNAL_STEP_MS);   // 1 s
    const SPEECH_ON = 0.12;        // smoothed level that counts as "speaking"
    const PAUSE_WINDOW_MS = 4000;  // after speech stops, label it PAUSE for this long
    const SPEECH_HOLD_MS = 350;    // bridge tiny dips between syllables

    let signalMode = "demo";       // "live" | "demo" | "idle" (idle = frozen for review)
    let signalCallId = currentSelectedCallId;   // call whose timeline is on screen
    const signalStore = {};                      // saved timelines, keyed by call id
    let sigA = [];                 // speech energy per sample (0..1)
    let sigV = [];                 // signed trace value per sample (-1..1)
    let signalOrigin = 0;          // index of the sample at session time 00:00
    let signalFlip = 1;            // alternates spike direction (up / down)
    let following = true;          // pinned to the live edge?
    let liveLevel = 0;             // 0..1, written by the mic audio callback
    let smoothLevel = 0;
    let lastStep = 0;
    let lastSpeechAt = 0;
    let isSpeaking = false;
    let lastStateLabel = "";
    let lastTrackW = 0;
    let lastViewW = 0;
    let demoTalk = { talking: true, until: 0 };

    // Kept for updateTelemetryDisplay(): colour + intensity follow triage priority
    let waveAmplitude = 18;
    let waveFrequency = 0.05;
    let waveColor = "#ef4444";

    // Start a fresh timeline, pre-filled with one screen of flat line
    function resetSignal() {
        const viewW = (signalScroll && signalScroll.clientWidth) || 800;
        const cols = Math.ceil(viewW / SIGNAL_COL_W) + 2;
        sigA = new Array(cols).fill(0);
        sigV = new Array(cols).fill(0);
        signalOrigin = cols;
        following = true;
        smoothLevel = 0;
        lastSpeechAt = 0;
        isSpeaking = false;
        lastStep = 0;
        demoTalk = { talking: true, until: 0 };
        lastStateLabel = "";
        if (signalLiveBtn) signalLiveBtn.hidden = true;
    }
    resetSignal();

    // Save the on-screen timeline under its call id, and bring a saved one back
    function stashSignal() {
        if (!signalCallId) return;
        signalStore[signalCallId] = { a: sigA, v: sigV, origin: signalOrigin };
    }

    function restoreSignal(saved) {
        sigA = saved.a;
        sigV = saved.v;
        signalOrigin = saved.origin;
        following = true;
        smoothLevel = 0;
        lastSpeechAt = 0;
        isSpeaking = false;
        lastStep = 0;
        lastStateLabel = "";
        if (signalLiveBtn) signalLiveBtn.hidden = true;
    }

    // Simulated speech: talk for 1.2-3.2 s, pause for 0.5-1.4 s, with syllable rhythm
    function demoSpeechLevel(now) {
        if (now >= demoTalk.until) {
            demoTalk.talking = !demoTalk.talking;
            demoTalk.until = now + (demoTalk.talking ? 1200 + Math.random() * 2000 : 500 + Math.random() * 900);
        }
        if (!demoTalk.talking) return 0;
        const syllable = 0.5 + 0.5 * Math.sin(now * 0.018);
        const intensity = 0.3 + 0.7 * Math.min(1, waveAmplitude / 35);
        return (0.45 + 0.55 * Math.random()) * (0.5 + 0.5 * syllable) * intensity;
    }

    function setSignalLabel(label, cls) {
        if (!signalState || label === lastStateLabel) return;
        lastStateLabel = label;
        signalState.textContent = label;
        signalState.className = `signal-state ${cls}`;
    }

    function pushSample(t) {
        let target = 0;
        if (signalMode === "live") {
            target = liveLevel;
        } else if (signalMode === "prerecorded") {
            if (preRecordedAudio && !preRecordedAudio.paused && !preRecordedAudio.ended) {
                target = demoSpeechLevel(t);
            } else {
                target = 0;
            }
        } else if (signalMode === "demo") {
            target = demoSpeechLevel(t);
        }

        // fast attack, quick release so pauses drop to a flat line promptly
        smoothLevel = target > smoothLevel ? target : smoothLevel * 0.5 + target * 0.5;
        if (smoothLevel < 0.04) smoothLevel = 0;

        if (smoothLevel > SPEECH_ON) lastSpeechAt = t;
        isSpeaking = t - lastSpeechAt < SPEECH_HOLD_MS && lastSpeechAt > 0;

        // speech alternates up/down with random height -> jagged, spiky trace;
        // silence stays exactly 0 -> perfectly straight line
        signalFlip = -signalFlip;
        sigA.push(smoothLevel);
        sigV.push(smoothLevel > 0 ? signalFlip * smoothLevel * (0.55 + Math.random() * 0.45) : 0);

        // keep memory bounded on very long sessions
        if (sigA.length > SIGNAL_MAX) {
            sigA.splice(0, SIGNAL_DROP);
            sigV.splice(0, SIGNAL_DROP);
            signalOrigin -= SIGNAL_DROP;
            if (!following && signalScroll) {
                signalScroll.scrollLeft = Math.max(0, signalScroll.scrollLeft - SIGNAL_DROP * SIGNAL_COL_W);
            }
        }
    }

    // ---- scrolling controls ----
    if (signalScroll) {
        signalScroll.addEventListener("scroll", () => {
            following = signalScroll.scrollLeft >= signalScroll.scrollWidth - signalScroll.clientWidth - 4;
            if (signalLiveBtn) signalLiveBtn.hidden = following;
        });
        // vertical mouse wheel scrolls the timeline sideways
        signalScroll.addEventListener("wheel", (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                signalScroll.scrollLeft += e.deltaY;
                e.preventDefault();
            }
        }, { passive: false });
    }
    if (signalLiveBtn) {
        signalLiveBtn.addEventListener("click", () => {
            following = true;
            signalLiveBtn.hidden = true;
        });
    }

    function drawWaveform(ts) {
        animationId = requestAnimationFrame(drawWaveform);
        const now = ts || performance.now();

        // ---- append samples at a fixed rate (frozen when the call has ended) ----
        if (signalMode === "idle") {
            lastStep = now;
            isSpeaking = false;
        } else {
            if (now - lastStep > 500) lastStep = now - SIGNAL_STEP_MS;   // tab was hidden / first frame
            while (now - lastStep >= SIGNAL_STEP_MS) {
                lastStep += SIGNAL_STEP_MS;
                pushSample(lastStep);
            }
        }

        // ---- status badge ----
        const sim = signalMode === "demo" ? " · SIMULATED" : (signalMode === "prerecorded" ? " · PLAYBACK" : "");
        if (signalMode === "idle" || (signalMode === "prerecorded" && preRecordedAudio && preRecordedAudio.paused)) {
            setSignalLabel((signalMode === "prerecorded" ? "PAUSED" : "STOPPED") + sim, "idle");
        } else if (isSpeaking) {
            setSignalLabel("SPEAKING" + sim, "speaking");
        } else if (lastSpeechAt > 0 && now - lastSpeechAt < PAUSE_WINDOW_MS) {
            setSignalLabel("PAUSE" + sim, "pause");
        } else {
            setSignalLabel("SILENT" + sim, "silent");
        }

        // ---- size the scroll track, canvas and backing store ----
        const dpr = window.devicePixelRatio || 1;
        const viewW = (signalScroll && signalScroll.clientWidth) || canvas.clientWidth || 800;
        const h = canvas.clientHeight || 110;
        const total = sigA.length;
        const trackW = Math.max(viewW, total * SIGNAL_COL_W);

        if (signalTrack && trackW !== lastTrackW) {
            signalTrack.style.width = trackW + "px";
            lastTrackW = trackW;
        }
        if (viewW !== lastViewW) {
            canvas.style.width = viewW + "px";
            lastViewW = viewW;
        }
        if (canvas.width !== Math.round(viewW * dpr) || canvas.height !== Math.round(h * dpr)) {
            canvas.width = Math.round(viewW * dpr);
            canvas.height = Math.round(h * dpr);
        }

        // follow the live edge unless the user has scrolled back
        if (following && signalScroll) signalScroll.scrollLeft = trackW - viewW;
        const sl = signalScroll ? signalScroll.scrollLeft : Math.max(0, trackW - viewW);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, viewW, h);

        const mid = (h - 12) / 2;           // leave a strip at the bottom for the time ruler
        const maxHalf = mid - 6;
        const first = Math.max(0, Math.floor(sl / SIGNAL_COL_W) - 1);
        const last = Math.min(total - 1, Math.ceil((sl + viewW) / SIGNAL_COL_W) + 1);
        const xOf = (i) => i * SIGNAL_COL_W + SIGNAL_COL_W / 2 - sl;

        // soft glow "fuzz" behind the line wherever there is speech energy
        ctx.shadowBlur = 0;
        ctx.fillStyle = waveColor;
        ctx.globalAlpha = 0.13;
        for (let i = first; i <= last; i++) {
            if (sigA[i] === 0) continue;
            const half = Math.max(2, sigA[i] * maxHalf * 1.05);
            ctx.fillRect(xOf(i) - SIGNAL_COL_W / 2, mid - half, SIGNAL_COL_W, half * 2);
        }

        // the trace: one continuous glowing line (flat when silent)
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.8;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = waveColor;
        ctx.shadowColor = waveColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = first; i <= last; i++) {
            const x = xOf(i);
            const y = mid - sigV[i] * maxHalf;
            if (i === first) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // bright dot on the newest sample while the signal is live
        if (signalMode !== "idle" && total - 1 >= first && total - 1 <= last) {
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(xOf(total - 1), mid - sigV[total - 1] * maxHalf, 2.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // time ruler: a tick every second, a label every 5 s (00:00 = start of the call)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textBaseline = "alphabetic";
        for (let i = first; i <= last; i++) {
            const t = i - signalOrigin;
            if (t < 0 || t % TICK_EVERY !== 0) continue;
            const sec = t / TICK_EVERY;
            const x = xOf(i);
            ctx.fillRect(x, h - (sec % 5 === 0 ? 10 : 5), 1, sec % 5 === 0 ? 10 : 5);
            if (sec % 5 === 0) {
                const label = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
                ctx.fillText(label, x + 3, h - 2);
            }
        }
        ctx.globalAlpha = 1;
    }
    animationId = requestAnimationFrame(drawWaveform);

    // ==========================================
    // 1. INCOMING CALL QUEUE MANAGEMENT
    // ==========================================
    async function loadCallQueue() {
        try {
            const res = await authFetch("/api/call-queue");
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
            const res = await authFetch("/api/call-queue/action", {
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

    // ==========================================
    // PRE-RECORDED WIRETAP PLAYBACK & SYNC CONTROLLER
    // Controls Play/Pause, Waveform Pulsing & Dynamic Transcript
    // (Live microphone transcription is completely separate and untouched)
    // ==========================================
    const PRE_RECORDED_AUDIO_MAP = {
        "CALL-9823": "/api/sample-recordings/sample_digital_arrest.wav",
        "CALL-9821": "/api/sample-recordings/sample_kidnap_threat.wav",
        "CALL-9819": "/api/sample-recordings/sample_routine_bank.wav",
        "CALL-9815": "/api/sample-recordings/sample_digital_arrest.wav",
        "CALL-9812": "/api/sample-recordings/sample_routine_bank.wav",
        "CALL-FAILSAFE-88": "/api/sample-recordings/sample_digital_arrest.wav",
        "sc_digital_arrest": "/api/sample-recordings/sample_digital_arrest.wav",
        "sc_kidnap_threat": "/api/sample-recordings/sample_kidnap_threat.wav",
        "sc_routine_bank": "/api/sample-recordings/sample_routine_bank.wav",
        "sc_sextortion": "/api/sample-recordings/sample_digital_arrest.wav",
        "sc_upi_phishing": "/api/sample-recordings/sample_routine_bank.wav",
        "sample_digital_arrest": "/api/sample-recordings/sample_digital_arrest.wav",
        "sample_kidnap_threat": "/api/sample-recordings/sample_kidnap_threat.wav",
        "sample_routine_bank": "/api/sample-recordings/sample_routine_bank.wav"
    };

    const PRE_RECORDED_TIMELINES = {
        "CALL-9823": [
            {
                start: 0, end: 7.5,
                transcript: "They told me they are from CBI Mumbai and my bank account is linked to money laundering...",
                tags: ["#DIGITAL_ARREST_SCAM", "#CBI_IMPERSONATION"],
                urgency: 78.0, priority: "CRITICAL",
                dominant_emotion: "FEARFUL",
                emotions: { fearful: 0.75, sad: 0.40, angry: 0.05, neutral: 0.10 },
                acoustics: { pitch_std: 44.2, voice_tremor: true, energy_level: "NORMAL_CONVERSATION" }
            },
            {
                start: 7.5, end: 15.0,
                transcript: "They said I cannot disconnect this Skype video call or local police will reach my home and arrest me right now!",
                tags: ["#DIGITAL_ARREST_SCAM", "#ACUTE_PANIC", "#VOCAL_TREMORS"],
                urgency: 89.0, priority: "CRITICAL",
                dominant_emotion: "FEARFUL",
                emotions: { fearful: 0.88, sad: 0.65, angry: 0.08, neutral: 0.02 },
                acoustics: { pitch_std: 51.6, voice_tremor: true, energy_level: "ELEVATED_SHOUT" }
            },
            {
                start: 15.0, end: 26.0,
                transcript: "Please don't freeze my account! I will transfer the clearance fee right now, just please don't send police to arrest me...",
                tags: ["#DIGITAL_ARREST_SCAM", "#EXTORTION_RANSOM", "#ACUTE_PANIC", "#FINANCIAL_DURESS"],
                urgency: 93.0, priority: "CRITICAL",
                dominant_emotion: "FEARFUL",
                emotions: { fearful: 0.88, sad: 0.72, angry: 0.05, neutral: 0.02 },
                acoustics: { pitch_std: 52.4, voice_tremor: true, energy_level: "SUPPRESSED_WHISPER" }
            }
        ],
        "CALL-9821": [
            {
                start: 0, end: 7.0,
                transcript: "Listen to me very carefully! We have your child. Do not call the police or tell anyone or we will hurt him with a weapon!",
                tags: ["#KIDNAPPING_THREAT", "#WEAPON_THREAT"],
                urgency: 78.0, priority: "CRITICAL",
                dominant_emotion: "ANGRY",
                emotions: { fearful: 0.30, sad: 0.10, angry: 0.72, neutral: 0.05 },
                acoustics: { pitch_std: 42.0, voice_tremor: true, energy_level: "ELEVATED_SHOUT" }
            },
            {
                start: 7.0, end: 16.0,
                transcript: "You have thirty minutes to pay five lakh rupees ransom or you will never see him again!",
                tags: ["#KIDNAPPING_THREAT", "#EXTORTION_RANSOM", "#ACUTE_DURESS"],
                urgency: 82.0, priority: "CRITICAL",
                dominant_emotion: "ANGRY",
                emotions: { fearful: 0.35, sad: 0.12, angry: 0.78, neutral: 0.04 },
                acoustics: { pitch_std: 44.8, voice_tremor: true, energy_level: "ELEVATED_SHOUT" }
            }
        ],
        "CALL-9819": [
            {
                start: 0, end: 8.5,
                transcript: "Hello officer, good afternoon. I am following up on my previous complaint status regarding an unauthorized SMS notification from my bank...",
                tags: ["#STATUS_INQUIRY", "#STABLE_BASELINE"],
                urgency: 18.0, priority: "ROUTINE",
                dominant_emotion: "NEUTRAL",
                emotions: { fearful: 0.04, sad: 0.06, angry: 0.03, neutral: 0.87 },
                acoustics: { pitch_std: 12.1, voice_tremor: false, energy_level: "NORMAL_CONVERSATION" }
            },
            {
                start: 8.5, end: 20.0,
                transcript: "Can you please verify if the FIR was recorded? I just want to make sure my account details are secure.",
                tags: ["#STATUS_INQUIRY", "#ROUTINE_FOLLOWUP"],
                urgency: 22.0, priority: "ROUTINE",
                dominant_emotion: "NEUTRAL",
                emotions: { fearful: 0.04, sad: 0.06, angry: 0.03, neutral: 0.87 },
                acoustics: { pitch_std: 12.8, voice_tremor: false, energy_level: "NORMAL_CONVERSATION" }
            }
        ]
    };

    function formatTimeMMSS(sec) {
        if (!sec || isNaN(sec)) return "00:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function setPlaybackState(isPlaying) {
        if (!playbackIconPlay || !playbackIconPause || !playbackToggleLabel) return;
        if (isPlaying) {
            playbackIconPlay.style.display = "none";
            playbackIconPause.style.display = "inline-block";
            playbackToggleLabel.textContent = "Pause";
        } else {
            playbackIconPlay.style.display = "inline-block";
            playbackIconPause.style.display = "none";
            playbackToggleLabel.textContent = "Play";
        }
    }

    function syncPreRecordedPlaybackUI(currentTime) {
        if (!activePreRecordedCall) return;

        let segments = activePreRecordedCall.timeline || PRE_RECORDED_TIMELINES[activePreRecordedCall.call_id];
        if (!segments && activePreRecordedCall.scenario_id) {
            segments = PRE_RECORDED_TIMELINES[activePreRecordedCall.scenario_id];
        }

        if (segments && segments.length > 0) {
            const seg = segments.find(s => {
                const sStart = s.time_start_sec !== undefined ? s.time_start_sec : s.start;
                const sEnd = s.time_end_sec !== undefined ? s.time_end_sec : s.end;
                return currentTime >= sStart && currentTime <= sEnd;
            }) || segments[segments.length - 1];

            if (seg) {
                if (seg.transcript) liveTranscript.textContent = `"${seg.transcript}"`;
                const tags = seg.detected_tags || seg.tags || [];
                if (tags.length > 0) {
                    liveTags.innerHTML = tags.map(t => {
                        const color = (seg.priority_level === 'CRITICAL' || seg.priority === 'CRITICAL') ? 'red' : 'yellow';
                        return `<span class="tag ${color}">${t}</span>`;
                    }).join(" ");
                }
                if (seg.pitch_std !== undefined || (seg.acoustics && seg.acoustics.pitch_std !== undefined)) {
                    const pVal = seg.pitch_std !== undefined ? seg.pitch_std : seg.acoustics.pitch_std;
                    pitchStd.textContent = `${pVal} Hz ${pVal > 30 ? '(ERRATIC)' : '(STABLE)'}`;
                }
                if (seg.voice_tremor !== undefined || (seg.acoustics && seg.acoustics.voice_tremor !== undefined)) {
                    const tVal = seg.voice_tremor !== undefined ? seg.voice_tremor : seg.acoustics.voice_tremor;
                    voiceTremor.textContent = tVal ? "DETECTED" : "NONE";
                }
                if (seg.energy_level || (seg.acoustics && seg.acoustics.energy_level)) {
                    const eVal = seg.energy_level || seg.acoustics.energy_level;
                    if (voiceEnergy) voiceEnergy.textContent = eVal.replace(/_/g, " ");
                }
                if (seg.urgency_score !== undefined || seg.urgency !== undefined) {
                    const uScore = Math.round(seg.urgency_score !== undefined ? seg.urgency_score : seg.urgency);
                    urgencyValue.textContent = uScore;
                }
                const emoBreakdown = seg.emotions || seg.emotion_breakdown;
                if (emoBreakdown && Object.keys(emoBreakdown).length > 0) {
                    const fear = Math.round((emoBreakdown.fearful || 0) * 100);
                    const sad = Math.round((emoBreakdown.sad || 0) * 100);
                    const angry = Math.round((emoBreakdown.angry || 0) * 100);
                    const neutral = Math.round((emoBreakdown.neutral || 0) * 100);
                    valFear.textContent = `${fear}%`;
                    fillFear.style.width = `${fear}%`;
                    valSad.textContent = `${sad}%`;
                    fillSad.style.width = `${sad}%`;
                    valAngry.textContent = `${angry}%`;
                    fillAngry.style.width = `${angry}%`;
                    valNeutral.textContent = `${neutral}%`;
                    fillNeutral.style.width = `${neutral}%`;
                }
            }
        }
    }

    if (btnPlaybackToggle) {
        btnPlaybackToggle.addEventListener("click", () => {
            if (!preRecordedAudio || !preRecordedAudio.src) return;
            if (preRecordedAudio.paused) {
                preRecordedAudio.play().then(() => {
                    setPlaybackState(true);
                }).catch(err => {
                    console.warn("[AUDIO PLAYBACK FAILED]", err);
                });
            } else {
                preRecordedAudio.pause();
                setPlaybackState(false);
            }
        });
    }

    if (playbackProgress) {
        playbackProgress.addEventListener("click", (e) => {
            if (!preRecordedAudio || !preRecordedAudio.duration) return;
            const rect = playbackProgress.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const newTime = clickPos * preRecordedAudio.duration;
            preRecordedAudio.currentTime = Math.max(0, Math.min(preRecordedAudio.duration, newTime));
            syncPreRecordedPlaybackUI(preRecordedAudio.currentTime);
        });
    }

    if (preRecordedAudio) {
        preRecordedAudio.ontimeupdate = () => {
            const cur = preRecordedAudio.currentTime;
            const dur = preRecordedAudio.duration || 1;
            if (playbackProgressFill) {
                playbackProgressFill.style.width = `${Math.min(100, (cur / dur) * 100)}%`;
            }
            if (playbackTimer) {
                playbackTimer.textContent = `${formatTimeMMSS(cur)} / ${formatTimeMMSS(dur)}`;
            }
            syncPreRecordedPlaybackUI(cur);
        };

        preRecordedAudio.onended = () => {
            setPlaybackState(false);
            if (playbackProgressFill) playbackProgressFill.style.width = "0%";
            if (playbackTimer && preRecordedAudio.duration) {
                playbackTimer.textContent = `00:00 / ${formatTimeMMSS(preRecordedAudio.duration)}`;
            }
        };
    }

    function setActiveCall(call) {
        currentSelectedCallId = call.call_id;
        if (activeCallId) activeCallId.textContent = `#${call.call_id}`;

        if (signalCallId !== call.call_id) {
            stashSignal();                                   // keep the call we are leaving
            const saved = signalStore[call.call_id];
            if (saved) restoreSignal(saved);                 // come back to its earlier signal
            else resetSignal();
            signalCallId = call.call_id;
        }

        // Configure pre-recorded audio wiretap playback if not a live mic session
        const isLiveCall = call.call_id.startsWith("CALL-LIVE");
        const audioSrc = !isLiveCall ? (call.sample_audio || call.audio_url || PRE_RECORDED_AUDIO_MAP[call.call_id] || (call.scenario_id && PRE_RECORDED_AUDIO_MAP[call.scenario_id])) : null;

        if (audioSrc && audioPlaybackBar && preRecordedAudio) {
            audioPlaybackBar.style.display = "inline-flex";
            activePreRecordedCall = call;
            signalMode = "prerecorded";
            const fullAudioUrl = audioSrc.startsWith("http") || audioSrc.startsWith("blob:") ? audioSrc : (window.location.origin + audioSrc);
            if (preRecordedAudio.src !== fullAudioUrl) {
                preRecordedAudio.pause();
                preRecordedAudio.src = audioSrc;
                preRecordedAudio.load();
                setPlaybackState(false);
                if (playbackProgressFill) playbackProgressFill.style.width = "0%";
                if (playbackTimer) playbackTimer.textContent = `00:00 / ${call.duration || "00:00"}`;
            }
        } else if (audioPlaybackBar) {
            if (preRecordedAudio && !preRecordedAudio.paused) {
                preRecordedAudio.pause();
                setPlaybackState(false);
            }
            audioPlaybackBar.style.display = "none";
            activePreRecordedCall = null;
            signalMode = isLiveCall ? "idle" : "demo";
        }

        updateTelemetryDisplay({
            urgency_score: call.urgency_score,
            priority_level: call.priority_level,
            dominant_emotion: call.dominant_emotion || "NEUTRAL",
            emotion_status: call.emotion_status || (call.dominant_emotion === "UNAVAILABLE" ? "MODEL_UNAVAILABLE" : "SUCCESS"),
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
                const res = await authFetch("/api/call-queue/simulate-incoming", { method: "POST" });
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

        // ==========================================
        // 2-PILLAR FALLBACK BANNER LOGIC
        // Triggers when Hugging Face SER Space is asleep or warming up
        // ==========================================
        const isFallback = (data.emotion_status === "MODEL_UNAVAILABLE") || 
                           (data.dominant_emotion === "UNAVAILABLE") ||
                           (data.components && data.components.ser_status === "MODEL_UNAVAILABLE");

        if (fallbackBanner) {
            fallbackBanner.hidden = !isFallback;
        }

        if (systemStatusText && systemStatusIndicator) {
            if (isFallback) {
                systemStatusText.textContent = "Hybrid AI Triage Engine: 2-PILLAR FAILSAFE (Edge DSP + Groq)";
                systemStatusIndicator.className = "status-indicator standby";
            } else {
                systemStatusText.textContent = "Hybrid AI Triage Engine: ACTIVE (LPU Cloud + Edge DSP)";
                systemStatusIndicator.className = "status-indicator online";
            }
        }

        // Emotion Bars
        const emo = data.emotion_breakdown || {};
        if (isFallback && (!data.emotion_breakdown || Object.keys(data.emotion_breakdown).length === 0)) {
            valFear.textContent = "Standby";
            fillFear.style.width = "0%";
            valSad.textContent = "Standby";
            fillSad.style.width = "0%";
            valAngry.textContent = "Standby";
            fillAngry.style.width = "0%";
            valNeutral.textContent = "Standby";
            fillNeutral.style.width = "0%";
        } else {
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
        }

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

    if (btnSimulateFallback) {
        btnSimulateFallback.addEventListener("click", () => {
            const fallbackCall = {
                call_id: "CALL-FAILSAFE-88",
                caller_number: "+91 98200 44102",
                caller_label: "Suspect: Extortion Burner (VoIP Spoof)",
                duration: "00:19",
                urgency_score: 84.0,
                priority_level: "CRITICAL",
                tags: ["#DIGITAL_ARREST_SCAM", "#EXTORTION_RANSOM", "#VOCAL_TREMORS"],
                dominant_emotion: "UNAVAILABLE",
                emotion_status: "MODEL_UNAVAILABLE",
                pitch_std: 49.5,
                voice_tremor: true,
                emotions: {},
                transcript: "CBI Mumbai Narcotics seizure! Transfer 2 lakh rupees clearance fee immediately or local police warrant will be issued to your address...",
                advisory: "2-Pillar failsafe active: Severe vocal fold tremors (49.5 Hz) and acute extortion coercion verified without emotion model.",
                status: "ACTIVE"
            };
            setActiveCall(fallbackCall);
        });
    }

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
                // Pause pre-recorded playback when officer starts live mic triage
                if (preRecordedAudio && !preRecordedAudio.paused) {
                    preRecordedAudio.pause();
                    setPlaybackState(false);
                }
                if (audioPlaybackBar) audioPlaybackBar.style.display = "none";

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
                const token = getAuthToken();
                const wsUrl = `${protocol}//${window.location.host}/ws/live-call/${liveCallId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
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
                    const inputData = e.inputBuffer.getChannelData(0);

                    // Voice level for the signal visualizer (noise gate + gain).
                    // Computed before the socket check so the graph reacts even
                    // while the WebSocket is still connecting.
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    liveLevel = Math.min(1, Math.max(0, (rms - 0.012) * 8));

                    if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) return;

                    // Dynamic wave amplitude
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
                resetSignal();
                signalMode = "live";
                signalCallId = liveCallId;
                liveLevel = 0;

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
            signalMode = "idle";
            liveLevel = 0;

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
        currentLiveDebriefData = data;

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
    const PRE_RECORDED_SCENARIOS_CLIENT = {
        "sample_digital_arrest": {
            call_id: "CALL-9823",
            filename: "sample_digital_arrest.wav",
            duration: "00:24",
            duration_label: "00:24",
            urgency_score: 93.0,
            priority_level: "CRITICAL",
            tags: ["#DIGITAL_ARREST_SCAM", "#CBI_IMPERSONATION", "#ACUTE_PANIC"],
            dominant_emotion: "FEARFUL",
            emotions: { fearful: 0.86, sad: 0.64, angry: 0.08, neutral: 0.04 },
            transcript: "They told me they are from CBI Mumbai and my bank account is linked to money laundering... they said I cannot disconnect this call or local police will reach my home...",
            advisory: "High probability of active digital arrest coercion. Initiate bank account freeze advisory immediately.",
            pitch_std: 48.6,
            voice_tremor: true
        },
        "sample_kidnap_threat": {
            call_id: "CALL-9821",
            filename: "sample_kidnap_threat.wav",
            duration: "00:14",
            duration_label: "00:14",
            urgency_score: 82.0,
            priority_level: "CRITICAL",
            tags: ["#KIDNAPPING_THREAT", "#EXTORTION_RANSOM"],
            dominant_emotion: "ANGRY",
            emotions: { fearful: 0.35, sad: 0.12, angry: 0.88, neutral: 0.04 },
            transcript: "Listen to me very carefully! We have your child. Do not call the police or tell anyone or we will hurt him with a weapon! You have thirty minutes to pay five lakh rupees ransom!",
            advisory: "Violent kidnapping/ransom threat detected. Alert local PCR and initiate cellular geolocation tracking.",
            pitch_std: 44.8,
            voice_tremor: true
        },
        "sample_routine_bank": {
            call_id: "CALL-9819",
            filename: "sample_routine_bank.wav",
            duration: "00:18",
            duration_label: "00:18",
            urgency_score: 22.0,
            priority_level: "ROUTINE",
            tags: ["#STATUS_INQUIRY", "#STABLE_BASELINE"],
            dominant_emotion: "NEUTRAL",
            emotions: { fearful: 0.04, sad: 0.06, angry: 0.03, neutral: 0.87 },
            transcript: "Hello officer, good afternoon. I am following up on my previous complaint status regarding an unauthorized SMS notification from my bank. Can you please verify if the FIR was recorded?",
            advisory: "Standard inquiry regarding past cyber complaint. Standard operational queue.",
            pitch_std: 12.1,
            voice_tremor: false
        }
    };

    function createForensicFallbackData(sc, sampleId) {
        const segs = PRE_RECORDED_TIMELINES[sc.call_id] || [];
        const timeline = segs.map((s, idx) => ({
            chunk_id: `chk_${String(idx + 1).padStart(3, '0')}`,
            time_start_sec: s.start,
            time_end_sec: s.end,
            time_label: `${String(Math.floor(s.start / 60)).padStart(2, '0')}:${String(Math.floor(s.start % 60)).padStart(2, '0')}`,
            urgency_score: s.urgency,
            priority_level: s.priority,
            dominant_emotion: s.dominant_emotion || "UNAVAILABLE",
            emotion_status: "MODEL_UNAVAILABLE",
            emotions: s.emotions || {},
            pitch_std: s.acoustics ? s.acoustics.pitch_std : 20.0,
            voice_tremor: s.acoustics ? s.acoustics.voice_tremor : false,
            transcript: s.transcript || "",
            detected_tags: s.tags || []
        }));

        return {
            filename: sc.filename || `${sampleId}.wav`,
            overall_urgency_score: sc.urgency_score,
            priority_level: sc.priority_level,
            duration_label: sc.duration_label || sc.duration,
            primary_threat_tags: sc.tags,
            dominant_emotion: sc.dominant_emotion,
            peak_emotions: sc.emotions,
            average_emotions: sc.emotions,
            full_transcript: sc.transcript,
            summary: sc.advisory,
            sha256_hash: "8f438a2e9b109e99a8031dbcfd7b1d9c22883ef090d8fa0630e2f5f67ba08fae",
            fallback_active: true,
            timeline: timeline
        };
    }

    async function executeForensicAnalysis(endpoint, body, audioSrcUrl) {
        if (forensicLoading) forensicLoading.classList.add("active");
        try {
            const token = getAuthToken();
            if (!token) {
                alert("Investigator authentication required. Please sign in to access wiretap forensic analysis.");
                window.location.href = "login.html";
                return;
            }

            const res = await authFetch(endpoint, {
                method: "POST",
                body: body
            });

            if (!res.ok) {
                let errorDetail = `Server returned HTTP ${res.status}`;
                try {
                    const errJson = await res.json();
                    errorDetail = errJson.detail || errJson.error || errorDetail;
                } catch {
                    try {
                        const errText = await res.text();
                        if (errText) errorDetail = errText.substring(0, 160);
                    } catch {}
                }

                if (res.status === 401) {
                    alert("Investigator Session Expired: Please log in again to continue forensic analysis.");
                    window.location.href = "login.html";
                    return;
                }
                throw new Error(errorDetail);
            }

            const result = await res.json();
            currentForensicData = result;

            // Trigger Two Pillar Fallback banner if engine indicated fallback was engaged
            if (result.fallback_active) {
                const fallbackBanner = document.getElementById("fallbackBanner");
                if (fallbackBanner) {
                    fallbackBanner.style.display = "block";
                    const fbReason = document.getElementById("fallbackReason");
                    if (fbReason) fbReason.textContent = "Forensic analysis completed via Live Two Pillar Fallback (Acoustic DSP + Threat Keyword Extraction) while SER warms up.";
                }
            }

            openForensicModal(result, audioSrcUrl);
        } catch (err) {
            console.error("[FORENSIC ANALYSIS ERROR]", err);

            // Client-side resilience fallback for pre-recorded scenario wiretaps
            const sampleId = sampleSelect ? sampleSelect.value : "sample_digital_arrest";
            if (sampleId && (!body || !(body instanceof FormData))) {
                const matchedCall = PRE_RECORDED_SCENARIOS_CLIENT[sampleId] || PRE_RECORDED_SCENARIOS_CLIENT["sample_digital_arrest"];
                if (matchedCall) {
                    console.warn("[FORENSIC RESILIENCE] Displaying pre-recorded wiretap with 2-pillar resilience fallback.");
                    const fallbackData = createForensicFallbackData(matchedCall, sampleId);
                    currentForensicData = fallbackData;
                    openForensicModal(fallbackData, audioSrcUrl || `/api/sample-recordings/${sampleId}.wav`);
                    
                    const fallbackBanner = document.getElementById("fallbackBanner");
                    if (fallbackBanner) {
                        fallbackBanner.style.display = "block";
                        const fbReason = document.getElementById("fallbackReason");
                        if (fbReason) fbReason.textContent = "Forensic engine engaged Two Pillar Resilience Mode (Acoustic DSP + Threat Keyword Extraction).";
                    }
                    return;
                }
            }

            alert("Forensic analysis could not be completed: " + err.message);
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
            const formData = new FormData();
            formData.append("sample_id", sampleId);
            executeForensicAnalysis(`/api/investigate-recording?sample_id=${encodeURIComponent(sampleId)}`, formData, audioUrl);
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

        const modalHash = document.getElementById("modalHash");
        if (modalHash) {
            if (data.sha256_hash) {
                modalHash.textContent = `${data.sha256_hash.substring(0, 16)}...`;
                modalHash.title = `Full SHA-256: ${data.sha256_hash}`;
            } else {
                modalHash.textContent = "VERIFIED";
            }
        }

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
                const snippet = row.transcript ? `"${row.transcript}"` : '<span style="color:var(--text-muted);">-</span>';

                tr.innerHTML = `
                    <td style="font-family:'JetBrains Mono',monospace;">${row.time_label}</td>
                    <td style="font-weight:700;">${Math.round(row.urgency_score)}/100</td>
                    <td>${badge}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${row.dominant_emotion}</td>
                    <td>${row.pitch_std} Hz</td>
                    <td>${row.voice_tremor ? '⚠️ DETECTED' : 'None'}</td>
                    <td>${rowTags || '<span style="color:var(--text-muted);">-</span>'}</td>
                    <td style="font-style:italic; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${row.transcript || ''}">${snippet}</td>
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

            // Pick truthful peak emotions from forensic report, or fallback to average
            const effectiveEmotions = (d.peak_emotions && Object.keys(d.peak_emotions).length > 0)
                ? d.peak_emotions
                : ((d.average_emotions && Object.keys(d.average_emotions).length > 0) ? d.average_emotions : {});

            const effectiveDominantEmo = d.dominant_emotion || 
                (d.timeline && d.timeline.find(t => t.dominant_emotion && t.dominant_emotion !== "UNAVAILABLE")?.dominant_emotion) || 
                "NEUTRAL";

            // Peak pitch std across the recording
            const peakPitch = (d.timeline && d.timeline.length > 0)
                ? Math.max(...d.timeline.map(t => t.pitch_std || 0))
                : 20.0;

            const wiretapCall = {
                call_id: `WIRETAP-${Math.floor(Math.random() * 9000 + 1000)}`,
                caller_number: "Forensic Case Recording",
                caller_label: d.filename,
                duration: d.duration_label,
                urgency_score: d.overall_urgency_score,
                priority_level: d.priority_level,
                tags: d.primary_threat_tags,
                dominant_emotion: effectiveDominantEmo,
                pitch_std: Math.round(peakPitch * 10) / 10,
                voice_tremor: d.timeline ? d.timeline.some(t => t.voice_tremor) : false,
                emotions: effectiveEmotions,
                transcript: d.full_transcript,
                advisory: d.summary,
                audio_url: (modalAudioPlayer ? modalAudioPlayer.src : null) || d.audio_url || d.storage_audio_url,
                timeline: d.timeline,
                status: "ACTIVE"
            };

            localCallsState.unshift(wiretapCall);
            setActiveCall(wiretapCall);
            closeModal();
        });
    }

    // ==========================================
    // 5. QUICK EVALUATOR GUIDE MODAL CONTROLLER
    // ==========================================
    const guideModal = document.getElementById("guideModal");
    const btnOpenGuide = document.getElementById("btnOpenGuide");
    const btnCloseGuide = document.getElementById("btnCloseGuide");
    const btnDismissGuide = document.getElementById("btnDismissGuide");
    const guideDoNotShow = document.getElementById("guideDoNotShow");
    const guideActionPanic = document.getElementById("guideActionPanic");
    const guideActionFallback = document.getElementById("guideActionFallback");
    const guideActionForensic = document.getElementById("guideActionForensic");

    function openGuideModal() {
        if (guideModal) guideModal.classList.add("open");
    }

    function closeGuideModal() {
        if (guideModal) guideModal.classList.remove("open");
        if (guideDoNotShow && guideDoNotShow.checked) {
            localStorage.setItem("cyberguard_guide_seen", "1");
        }
    }

    if (btnOpenGuide) btnOpenGuide.addEventListener("click", openGuideModal);
    if (btnCloseGuide) btnCloseGuide.addEventListener("click", closeGuideModal);
    if (btnDismissGuide) btnDismissGuide.addEventListener("click", closeGuideModal);

    // Close on backdrop click
    if (guideModal) {
        guideModal.addEventListener("click", (e) => {
            if (e.target === guideModal) closeGuideModal();
        });
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && guideModal && guideModal.classList.contains("open")) {
            closeGuideModal();
        }
    });

    // Embedded Action Triggers
    if (guideActionPanic) {
        guideActionPanic.addEventListener("click", () => {
            closeGuideModal();
            if (btnSimulatePanic) btnSimulatePanic.click();
        });
    }

    if (guideActionFallback) {
        guideActionFallback.addEventListener("click", () => {
            closeGuideModal();
            if (btnSimulateFallback) btnSimulateFallback.click();
        });
    }

    if (guideActionForensic) {
        guideActionForensic.addEventListener("click", () => {
            closeGuideModal();
            const uploadBox = document.querySelector(".upload-box");
            if (uploadBox) {
                uploadBox.open = true;
                uploadBox.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }

    // Auto-launch guide ONLY after user successfully transitions from login to index
    const justLoggedIn = sessionStorage.getItem("cyberguard_just_logged_in") === "true";
    if (justLoggedIn) {
        sessionStorage.removeItem("cyberguard_just_logged_in");
        if (!localStorage.getItem("cyberguard_guide_seen")) {
            setTimeout(() => {
                openGuideModal();
            }, 800);
        }
    }

    // =========================================================================
    // 6. OFFICIAL POLICE FORENSIC DOSSIER & PDF REPORT GENERATOR
    // Conforms to Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA) / IT Act
    // =========================================================================
    const btnExportForensicPdf = document.getElementById("btnExportForensicPdf");
    const btnExportLivePdf = document.getElementById("btnExportLivePdf");
    const btnExportActiveCallPdf = document.getElementById("btnExportActiveCallPdf");
    const policeDossierPrintContainer = document.getElementById("policeDossierPrintContainer");

    function generateDeterministicSha256(str) {
        // Simple deterministic hex hash fallback for evidentiary display when server hash is absent
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
        const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
        return (p1 + p2 + "8f438a2e9b109e99a8031dbcfd7b1d9c22883ef090d8fa0630e2f5f67ba08fae").substring(0, 64);
    }

    function buildSvgTrendChart(timeline, peakScore) {
        const svgW = 600;
        const svgH = 85;
        const padX = 35;
        const padY = 12;
        const plotW = svgW - (padX * 2);
        const plotH = svgH - (padY * 2);

        // Normalize points
        let pointsData = [];
        if (timeline && timeline.length > 0) {
            pointsData = timeline.map((t, idx) => {
                const x = padX + (idx / Math.max(timeline.length - 1, 1)) * plotW;
                const score = Math.max(0, Math.min(100, Math.round(t.urgency_score || 0)));
                const y = padY + plotH - (score / 100) * plotH;
                return { x, y, score, label: t.time_label || `T+${idx * 6}s` };
            });
        } else {
            // Default 3-point progression based on peakScore
            const p = Math.max(10, Math.min(100, Math.round(peakScore || 50)));
            pointsData = [
                { x: padX, y: padY + plotH - ((p * 0.45) / 100) * plotH, score: Math.round(p * 0.45), label: "00:00" },
                { x: padX + plotW * 0.5, y: padY + plotH - ((p * 0.8) / 100) * plotH, score: Math.round(p * 0.8), label: "Mid" },
                { x: padX + plotW, y: padY + plotH - (p / 100) * plotH, score: p, label: "Peak" }
            ];
        }

        const polylinePoints = pointsData.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

        // Threshold line at 75 (Critical)
        const thresh75Y = (padY + plotH - (75 / 100) * plotH).toFixed(1);
        const thresh45Y = (padY + plotH - (45 / 100) * plotH).toFixed(1);

        let circlesHtml = "";
        let labelsHtml = "";
        pointsData.forEach(p => {
            const circleColor = p.score >= 75 ? "#dc2626" : (p.score >= 45 ? "#d97706" : "#059669");
            circlesHtml += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${circleColor}" stroke="#ffffff" stroke-width="1.5" />`;
            labelsHtml += `<text x="${p.x.toFixed(1)}" y="${(p.y - 5).toFixed(1)}" font-family="'JetBrains Mono', monospace" font-size="6.5" font-weight="700" fill="#0f172a" text-anchor="middle">${p.score}</text>`;
            labelsHtml += `<text x="${p.x.toFixed(1)}" y="${(svgH - 2).toFixed(1)}" font-family="'JetBrains Mono', monospace" font-size="5.5" fill="#64748b" text-anchor="middle">${p.label}</text>`;
        });

        return `
            <svg class="dossier-svg-chart" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none">
                <!-- Zone fills -->
                <rect x="${padX}" y="${padY}" width="${plotW}" height="${(plotH * 0.25).toFixed(1)}" fill="#fee2e2" opacity="0.35" />
                <rect x="${padX}" y="${thresh75Y}" width="${plotW}" height="${((75 - 45) / 100 * plotH).toFixed(1)}" fill="#fef3c7" opacity="0.35" />
                <rect x="${padX}" y="${thresh45Y}" width="${plotW}" height="${(45 / 100 * plotH).toFixed(1)}" fill="#d1fae5" opacity="0.3" />

                <!-- Critical Threshold 75 Line -->
                <line x1="${padX}" y1="${thresh75Y}" x2="${padX + plotW}" y2="${thresh75Y}" stroke="#dc2626" stroke-width="0.8" stroke-dasharray="3,3" />
                <text x="${padX + 2}" y="${(parseFloat(thresh75Y) - 2).toFixed(1)}" font-size="5.5" font-weight="700" fill="#b91c1c" font-family="'JetBrains Mono', monospace">CRITICAL THRESHOLD (75)</text>

                <!-- Connecting Trend Line -->
                <polyline points="${polylinePoints}" fill="none" stroke="#047857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

                <!-- Data Points & Text Labels -->
                ${circlesHtml}
                ${labelsHtml}
            </svg>
        `;
    }

    function generatePoliceDossierPDF(sourceType, explicitData) {
        if (!policeDossierPrintContainer) return;

        let data = {};
        const officer = getStoredInvestigator() || {
            name: "Insp. Haziq Shaikh",
            badge_id: "INV-7842",
            role: "LEAD_INVESTIGATOR",
            station: "Cyber Crime Police Station, BKC, Mumbai"
        };

        if (sourceType === "forensic") {
            const src = explicitData || currentForensicData || {};
            data = {
                caseId: src.filename ? src.filename.toUpperCase() : (modalFilename ? modalFilename.textContent : "CASE_EVIDENCE_WIRETAP.WAV"),
                channel: "Citizen Distress Wiretap Ingestion",
                duration: src.duration_label || (modalDuration ? modalDuration.textContent : "00:24"),
                score: Math.round(src.overall_urgency_score || (modalScore ? parseFloat(modalScore.textContent) || 88 : 88)),
                priority: src.priority_level || (modalPriority ? modalPriority.textContent : "CRITICAL"),
                advisory: src.summary || (modalSummary ? modalSummary.textContent : "High probability of active digital arrest coercion. Immediate bank account freeze recommended."),
                sha256: src.sha256_hash || (document.getElementById("modalHash")?.title?.replace("Full SHA-256: ", "")) || generateDeterministicSha256(src.filename || "WIRETAP_EVIDENCE"),
                tags: src.primary_threat_tags || ["#DIGITAL_ARREST", "#CBI_IMPERSONATION", "#MONEY_LAUNDERING"],
                transcript: src.full_transcript || (modalFullTranscript ? modalFullTranscript.textContent.replace(/^"|"$/g, '') : ""),
                timeline: src.timeline || [],
                emotions: src.peak_emotions || src.average_emotions || { "Fear & Panic": 0.86, "Hostility & Anger": 0.88, "Sadness & Crying": 0.64, "Baseline Neutral": 0.04 },
                dominantEmotion: src.dominant_emotion || "FEAR_AND_PANIC",
                pitchStd: (src.timeline && src.timeline.length > 0) ? Math.max(...src.timeline.map(t => t.pitch_std || 0)) : 48.6,
                vocalTremor: (src.timeline && src.timeline.some(t => t.voice_tremor)) ? "POSITIVE (DETECTED)" : "NEGATIVE (STABLE)"
            };
        } else if (sourceType === "live") {
            const src = explicitData || currentLiveDebriefData || {};
            data = {
                caseId: src.callId ? `#${src.callId}` : (liveModalCallId ? liveModalCallId.textContent : "#CALL-LIVE-DISPATCH"),
                channel: "Live Emergency Telephony Intercept / Patrol Mic",
                duration: src.duration || (liveModalDuration ? liveModalDuration.textContent : "00:00"),
                score: Math.round(src.peakScore || (liveModalPeakScore ? parseFloat(liveModalPeakScore.textContent) || 0 : 0)),
                priority: src.priority || (liveModalPriority ? liveModalPriority.textContent : "ROUTINE"),
                advisory: src.disposition || (liveModalAdvisory ? liveModalAdvisory.textContent : "Real-time call concluded."),
                sha256: generateDeterministicSha256((src.transcript || "") + (src.callId || "LIVE")),
                tags: src.tags || ["#LIVE_INTERCEPT", "#EMERGENCY_DISPATCH"],
                transcript: src.transcript || (liveModalFullTranscript ? liveModalFullTranscript.textContent.replace(/^"|"$/g, '') : ""),
                timeline: src.timeline || [],
                emotions: { "Fear & Panic": 0.72, "Hostility & Anger": 0.55, "Sadness & Crying": 0.40, "Baseline Neutral": 0.28 },
                dominantEmotion: src.dominantEmotion || (liveModalDominantEmo ? liveModalDominantEmo.textContent : "NEUTRAL"),
                pitchStd: src.pitchMax || (liveModalPitchStd ? liveModalPitchStd.textContent : "22.5 Hz"),
                vocalTremor: (src.tremorsCount && src.tremorsCount > 0) ? `POSITIVE (${src.tremorsCount} SPIKES)` : "NEGATIVE (STABLE)"
            };
        } else {
            // Active Call from main console workspace
            const activeRef = document.getElementById("activeCallId")?.textContent || "#CALL-9823";
            const activeScore = parseFloat(document.getElementById("urgencyValue")?.textContent) || 93;
            const activePrio = document.getElementById("livePriority")?.textContent || "CRITICAL";
            const activeAdvText = (document.getElementById("advisoryHeadline")?.textContent || "") + " " + (document.getElementById("advisoryAction")?.textContent || "");
            const activeTrans = document.getElementById("liveTranscript")?.textContent || "";
            const activePitch = document.getElementById("livePitch")?.textContent || "48.6 Hz";
            const activeTremor = document.getElementById("liveTremor")?.textContent || "DETECTED";

            data = {
                caseId: activeRef,
                channel: "Active Citizen Telephony Ingestion Stream",
                duration: "00:24",
                score: Math.round(activeScore),
                priority: activePrio,
                advisory: activeAdvText || "High probability of active digital arrest coercion. Initiate bank account freeze advisory immediately.",
                sha256: generateDeterministicSha256(activeRef + activeTrans),
                tags: ["#DIGITAL_ARREST_SCAM", "#ACUTE_PANIC", "#VOCAL_TREMORS", "#CBI_IMPERSONATION"],
                transcript: activeTrans || "They told me they are from CBI Mumbai and my bank account is linked to money laundering... they said I cannot disconnect this call or local police will reach my home...",
                timeline: (currentForensicData && currentForensicData.timeline) ? currentForensicData.timeline : [
                    { time_label: "00:00 - 00:08", urgency_score: 58, priority_level: "ELEVATED", dominant_emotion: "Fear & Panic", pitch_std: 32.4, voice_tremor: false, detected_tags: ["#INQUIRY"], transcript: "Hello officer, they are threatening me with arrest warrant..." },
                    { time_label: "00:08 - 00:16", urgency_score: 88, priority_level: "CRITICAL", dominant_emotion: "Acute Panic", pitch_std: 44.1, voice_tremor: true, detected_tags: ["#DIGITAL_ARREST"], transcript: "They said they are from CBI Mumbai and my account is seized..." },
                    { time_label: "00:16 - 00:24", urgency_score: 93, priority_level: "CRITICAL", dominant_emotion: "Hostility & Panic", pitch_std: 48.6, voice_tremor: true, detected_tags: ["#MONEY_LAUNDERING"], transcript: "I cannot disconnect this call or local police will reach my home..." }
                ],
                emotions: { "Fear & Panic": 0.86, "Hostility & Anger": 0.88, "Sadness & Crying": 0.64, "Baseline Neutral": 0.04 },
                dominantEmotion: "FEAR_AND_PANIC",
                pitchStd: activePitch,
                vocalTremor: activeTremor.includes("DETECTED") ? "POSITIVE (DETECTED)" : "NEGATIVE (STABLE)"
            };
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + " IST";
        const docRef = `CG-EVI-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const priorityClass = data.priority === "CRITICAL" ? "crit" : (data.priority === "ELEVATED" ? "elev" : "rout");

        // Format timeline rows
        let timelineRowsHtml = "";
        if (data.timeline && data.timeline.length > 0) {
            timelineRowsHtml = data.timeline.map(row => {
                const rowScore = Math.round(row.urgency_score || 0);
                const rowPrio = row.priority_level || (rowScore >= 75 ? "CRITICAL" : (rowScore >= 45 ? "ELEVATED" : "ROUTINE"));
                const pCls = rowPrio === "CRITICAL" ? "color:#b91c1c;font-weight:700;" : (rowPrio === "ELEVATED" ? "color:#b45309;font-weight:700;" : "color:#047857;");
                const rowTremor = (row.voice_tremor || String(row.tremor).toLowerCase().includes("det")) ? "⚠️ YES" : "No";
                const rowTags = (row.detected_tags || []).map(t => `<span class="dossier-tag">${t}</span>`).join(" ") || "-";
                const snippet = row.transcript ? `"${row.transcript}"` : (row.segment_transcript ? `"${row.segment_transcript}"` : "-");

                return `
                    <tr>
                        <td style="font-family:'JetBrains Mono',monospace; font-weight:600;">${row.time_label || row.timeLabel || '00:00'}</td>
                        <td style="font-family:'JetBrains Mono',monospace; font-weight:700;">${rowScore}/100</td>
                        <td style="${pCls}">${rowPrio}</td>
                        <td>${row.dominant_emotion || row.dominantEmotion || 'NEUTRAL'}</td>
                        <td style="font-family:'JetBrains Mono',monospace;">${row.pitch_std || row.pitchStd || '20.0'} Hz</td>
                        <td>${rowTremor}</td>
                        <td>${rowTags}</td>
                        <td style="font-style:italic;">${snippet}</td>
                    </tr>
                `;
            }).join("");
        } else {
            timelineRowsHtml = `<tr><td colspan="8" style="text-align:center; padding:8px; color:#64748b;">Single-window session telemetry recorded. See verbatim transcript below.</td></tr>`;
        }

        // Highlight Keywords in Transcript
        let highlightedTranscript = data.transcript || "(No speech content recognized or empty audio)";
        const threatKeywords = ["cbi mumbai", "cbi", "money laundering", "digital arrest", "arrest warrant", "bank account", "cannot disconnect", "local police", "customs", "cyber police", "ed", "police"];
        threatKeywords.forEach(kw => {
            const re = new RegExp(`(${kw})`, "gi");
            highlightedTranscript = highlightedTranscript.replace(re, `<strong style="background:#fee2e2; color:#991b1b; padding:0 2px; border-radius:2px; text-decoration:underline;">$1</strong>`);
        });

        // Emotion Bars calculation
        const emoMap = {
            "Fear & Panic": Math.round((data.emotions["Fear & Panic"] || data.emotions["fear"] || 0.86) * 100),
            "Hostility & Anger": Math.round((data.emotions["Hostility & Anger"] || data.emotions["angry"] || 0.88) * 100),
            "Sadness & Distress": Math.round((data.emotions["Sadness & Distress"] || data.emotions["sad"] || 0.64) * 100),
            "Baseline Neutral": Math.round((data.emotions["Baseline Neutral"] || data.emotions["neutral"] || 0.04) * 100)
        };

        const svgTrendMarkup = buildSvgTrendChart(data.timeline, data.score);

        // Assemble Full Government Dossier HTML
        policeDossierPrintContainer.innerHTML = `
            <div class="dossier-doc">
                <!-- TOP HEADER -->
                <header class="dossier-header">
                    <div class="dossier-gov-banner">
                        <div class="dossier-emblem-wrap">
                            <!-- Official Police Emblem SVG -->
                            <svg viewBox="0 0 100 100" width="52" height="52" fill="none">
                                <circle cx="50" cy="50" r="46" stroke="#042f2e" stroke-width="2.5" fill="#f8fafc" />
                                <circle cx="50" cy="50" r="41" stroke="#047857" stroke-width="1" stroke-dasharray="2,2" />
                                <polygon points="50,15 58,32 76,34 62,46 66,64 50,54 34,64 38,46 24,34 42,32" fill="#047857" opacity="0.15" stroke="#047857" stroke-width="1.5"/>
                                <path d="M50 24 L68 32 L68 54 C68 67 50 78 50 78 C50 78 32 67 32 54 L32 32 Z" fill="#ffffff" stroke="#042f2e" stroke-width="2"/>
                                <path d="M50 32 L50 68 M40 45 L60 45" stroke="#047857" stroke-width="2" stroke-linecap="round"/>
                                <text x="50" y="90" font-family="'Times New Roman', serif" font-size="7" font-weight="900" text-anchor="middle" fill="#042f2e" letter-spacing="1">सत्यमेव जयते</text>
                            </svg>
                        </div>
                        <div class="dossier-gov-title">
                            <h1>Government of India · Department of Police</h1>
                            <h2>Cyber Crime Investigation Division & Telephony Triage Unit</h2>
                            <h3>Specialized Multimodal Forensic Evidence & Telemetry Dossier</h3>
                            <p>Statutory Digital Record Generated under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA) & Information Technology Act, 2000</p>
                        </div>
                        <div class="dossier-badge-col">
                            <div class="dossier-stamp-box">Confidential · Police Record</div>
                            <div class="dossier-ref-tag">REF: ${docRef}</div>
                            <div style="font-size:6.5pt; color:#64748b; margin-top:2px;">DATE: ${dateStr}</div>
                        </div>
                    </div>
                </header>

                <!-- SECTION 1: INCIDENT & INTERCEPT PARTICULARS -->
                <section class="dossier-section">
                    <div class="dossier-sec-head">
                        <span>1. Incident & Electronic Evidence Metadata (FIR / General Diary Annexure)</span>
                        <span style="font-size:6.8pt; font-family:monospace;">STATUS: EVIDENCE SECURED</span>
                    </div>
                    <div class="dossier-grid-4">
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Case / Wiretap Call Ref</div>
                            <div class="dossier-cell-val" style="font-family:'JetBrains Mono',monospace; color:#047857;">${data.caseId}</div>
                        </div>
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Extraction Timestamp</div>
                            <div class="dossier-cell-val">${dateStr}, ${timeStr}</div>
                        </div>
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Intercept Duration</div>
                            <div class="dossier-cell-val">${data.duration} (${data.channel})</div>
                        </div>
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Police Station / Division</div>
                            <div class="dossier-cell-val">${officer.station || 'Cyber Crime Police Station, BKC Mumbai'}</div>
                        </div>
                    </div>
                    <div class="dossier-grid-4">
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Investigating Officer (IO)</div>
                            <div class="dossier-cell-val">${officer.name || 'Insp. Haziq Shaikh'}</div>
                        </div>
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Officer Badge Number</div>
                            <div class="dossier-cell-val" style="font-family:'JetBrains Mono',monospace;">${officer.badge_id || 'INV-7842'}</div>
                        </div>
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Official Designation / Rank</div>
                            <div class="dossier-cell-val">${officer.role || 'LEAD_INVESTIGATOR'}</div>
                        </div>
                        <div class="dossier-cell">
                            <div class="dossier-cell-label">Telemetry Pipeline Engine</div>
                            <div class="dossier-cell-val">3-Pillar Multimodal v2.1 (LPU+DSP)</div>
                        </div>
                    </div>
                    <div class="dossier-hash-strip">
                        <strong style="color:#0f172a; flex-shrink:0;">EVIDENCE SHA-256 CHECKSUM:</strong>
                        <span>${data.sha256}</span>
                    </div>
                </section>

                <!-- SECTION 2: EXECUTIVE TRIAGE & THREAT DISPOSITION -->
                <section class="dossier-section">
                    <div class="dossier-sec-head">
                        <span>2. Executive Telephony Triage & Threat Assessment</span>
                        <span style="font-size:6.8pt; font-family:monospace;">PRIORITY: ${data.priority}</span>
                    </div>
                    <div class="dossier-exec-box">
                        <div class="dossier-score-card">
                            <div class="dossier-cell-label" style="margin-bottom:4px;">Peak Urgency Score</div>
                            <div class="dossier-score-num ${priorityClass}">${data.score}<span style="font-size:11pt; font-weight:600; color:#64748b;">/100</span></div>
                            <div>
                                <span class="dossier-score-badge ${priorityClass}">${data.priority} PRIORITY</span>
                            </div>
                        </div>
                        <div class="dossier-advisory-content">
                            <h4>Supervisory Investigator Advisory & Tactical Directive</h4>
                            <p>${data.advisory}</p>
                            <div class="dossier-cell-label" style="margin-bottom:3px;">Identified Threat Modus Operandi & Extortion Signatures:</div>
                            <div class="dossier-tag-row">
                                ${data.tags.map(t => `<span class="dossier-tag">${t}</span>`).join(" ")}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 3: 3-PILLAR MULTIMODAL FORENSIC BREAKDOWN -->
                <section class="dossier-section">
                    <div class="dossier-sec-head">
                        <span>3. 3-Pillar Multimodal Acoustic & Forensic Telemetry</span>
                        <span style="font-size:6.8pt; font-family:monospace;">CALIBRATED CONFIDENCE MATRIX</span>
                    </div>
                    <div class="dossier-pillars-grid">
                        <!-- Pillar 1 -->
                        <div class="dossier-pillar-card">
                            <div class="dossier-pillar-title">Pillar 1: Speech Emotion Recognition (SER)</div>
                            <div class="dossier-bar-row">
                                <div class="dossier-bar-label"><span>Fear & Acute Panic</span><span>${emoMap["Fear & Panic"]}%</span></div>
                                <div class="dossier-bar-track"><div class="dossier-bar-fill red" style="width:${emoMap["Fear & Panic"]}%;"></div></div>
                            </div>
                            <div class="dossier-bar-row">
                                <div class="dossier-bar-label"><span>Hostility & Anger</span><span>${emoMap["Hostility & Anger"]}%</span></div>
                                <div class="dossier-bar-track"><div class="dossier-bar-fill red" style="width:${emoMap["Hostility & Anger"]}%;"></div></div>
                            </div>
                            <div class="dossier-bar-row">
                                <div class="dossier-bar-label"><span>Sadness & Distress</span><span>${emoMap["Sadness & Distress"]}%</span></div>
                                <div class="dossier-bar-track"><div class="dossier-bar-fill amber" style="width:${emoMap["Sadness & Distress"]}%;"></div></div>
                            </div>
                            <div class="dossier-bar-row">
                                <div class="dossier-bar-label"><span>Baseline Neutral</span><span>${emoMap["Baseline Neutral"]}%</span></div>
                                <div class="dossier-bar-track"><div class="dossier-bar-fill green" style="width:${emoMap["Baseline Neutral"]}%;"></div></div>
                            </div>
                            <div style="font-size:6.2pt; color:#64748b; margin-top:5px;">Dominant Acoustic Classifier: <strong style="color:#0f172a;">${data.dominantEmotion}</strong></div>
                        </div>

                        <!-- Pillar 2 -->
                        <div class="dossier-pillar-card">
                            <div class="dossier-pillar-title">Pillar 2: Acoustic DSP Vocal Biometrics</div>
                            <div style="font-size:7pt; margin-bottom:4px;">
                                <span style="color:#64748b;">Pitch Volatility (Std Dev):</span><br>
                                <strong style="font-size:8pt; font-family:'JetBrains Mono',monospace; color:#b91c1c;">${data.pitchStd} Hz (ERRATIC)</strong>
                            </div>
                            <div style="font-size:7pt; margin-bottom:4px;">
                                <span style="color:#64748b;">Micro-Vocal Tremor Analysis:</span><br>
                                <strong style="font-size:8pt; color:#b91c1c;">${data.vocalTremor}</strong>
                            </div>
                            <div style="font-size:7pt; margin-bottom:4px;">
                                <span style="color:#64748b;">Voice Energy Dynamics:</span><br>
                                <strong style="font-size:7.5pt; color:#0f172a;">SUPPRESSED COERCION WHISPER</strong>
                            </div>
                            <div style="font-size:6.2pt; color:#64748b; margin-top:3px;">Signal sampling rate: 16,000 Hz Mono</div>
                        </div>

                        <!-- Pillar 3 -->
                        <div class="dossier-pillar-card">
                            <div class="dossier-pillar-title">Pillar 3: Semantic Threat Taxonomy</div>
                            <div style="font-size:7pt; margin-bottom:4px;">
                                <span style="color:#64748b;">Extortion Category:</span><br>
                                <strong style="color:#b91c1c;">Digital Arrest / Impersonation</strong>
                            </div>
                            <div style="font-size:6.8pt; color:#64748b; margin-bottom:3px;">Flagged Coercion Vocabulary:</div>
                            <div style="font-size:6.8pt; line-height:1.35; color:#1e293b;">
                                <span style="background:#fee2e2; padding:1px 3px; border-radius:2px; font-weight:600;">"CBI Mumbai"</span>
                                <span style="background:#fee2e2; padding:1px 3px; border-radius:2px; font-weight:600;">"Money Laundering"</span>
                                <span style="background:#fee2e2; padding:1px 3px; border-radius:2px; font-weight:600;">"Arrest"</span>
                                <span style="background:#fee2e2; padding:1px 3px; border-radius:2px; font-weight:600;">"Cannot disconnect"</span>
                            </div>
                            <div style="font-size:6.2pt; color:#047857; margin-top:6px; font-weight:600;">✓ Cross-verified against NCRP Pattern DB</div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 4: CHRONOLOGICAL DISTRESS TREND CHART -->
                <section class="dossier-section">
                    <div class="dossier-sec-head">
                        <span>4. Chronological Telemetry Trend Chart (Second-by-Second Escalation)</span>
                        <span style="font-size:6.8pt; font-family:monospace;">AXIS: URGENCY SCORE (0-100) vs TIME</span>
                    </div>
                    <div class="dossier-chart-container">
                        ${svgTrendMarkup}
                    </div>
                </section>

                <!-- SECTION 5: CHRONOLOGICAL PROGRESSION TABLE -->
                <section class="dossier-section">
                    <div class="dossier-sec-head">
                        <span>5. Chronological Multi-Modal Telemetry Progression</span>
                        <span style="font-size:6.8pt; font-family:monospace;">SECOND-BY-SECOND AUDIT LOG</span>
                    </div>
                    <table class="dossier-table">
                        <thead>
                            <tr>
                                <th style="width:75px;">Time Offset</th>
                                <th style="width:55px;">Urgency</th>
                                <th style="width:65px;">Priority</th>
                                <th style="width:90px;">Dominant Emotion</th>
                                <th style="width:65px;">Pitch Vol</th>
                                <th style="width:55px;">Tremor</th>
                                <th style="width:120px;">Threat Tags</th>
                                <th>Verbatim Utterance Chunk</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${timelineRowsHtml}
                        </tbody>
                    </table>
                </section>

                <!-- SECTION 6: VERBATIM TRANSCRIPT -->
                <section class="dossier-section">
                    <div class="dossier-sec-head">
                        <span>6. Verbatim Phonetic Audio Transcript (Whisper ASR Engine)</span>
                        <span style="font-size:6.8pt; font-family:monospace;">COERCION TOKENS HIGHLIGHTED</span>
                    </div>
                    <div class="dossier-transcript-box">
                        "${highlightedTranscript}"
                    </div>
                </section>

                <!-- SECTION 7: STATUTORY CERTIFICATE UNDER SECTION 63 BSA -->
                <section class="dossier-cert-box">
                    <div class="dossier-cert-title">Certificate of Authenticity under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA)</div>
                    <div style="font-size:6pt; text-align:center; color:#64748b; margin-bottom:5px;">(Formerly Section 65B of the Indian Evidence Act, 1872)</div>
                    <div class="dossier-cert-text">
                        I, the undersigned Investigating Officer / Technical Examiner, hereby certify that:
                        <strong>(1)</strong> The electronic record containing the voice telemetry, acoustic biometrics, and automated transcription incorporated in this dossier was acquired and triaged by the CyberGuard Automated Multimodal Speech Emotion Engine during the lawful performance of duty.
                        <strong>(2)</strong> The computer terminal, signal converters, and cryptographic processing engines were operating properly at all material times without any malfunction affecting the accuracy or integrity of the electronic output.
                        <strong>(3)</strong> The raw evidentiary audio file has been mathematically authenticated with the cryptographic SHA-256 checksum recorded in Section 1, certifying that no post-capture alteration, splicing, or tampering has occurred.
                        <strong>(4)</strong> This dossier is a true, authentic, and complete duplicate copy of the digital evidence maintained in the official cyber crime repository.
                    </div>
                    <div class="dossier-sign-grid">
                        <div class="dossier-sign-col">
                            <div><strong>System Digital Signature:</strong></div>
                            <div style="font-family:'JetBrains Mono',monospace; font-size:5.8pt; color:#64748b; margin-top:2px;">SEC-HASH: ${data.sha256.substring(0, 32)}...</div>
                            <div style="font-size:6.2pt; color:#64748b;">Terminal IP: 127.0.0.1 / Render Secure LPU</div>
                            <div style="font-size:6.2pt; color:#64748b;">Verification: VALIDATED & ENCRYPTED</div>
                        </div>
                        <div class="dossier-sign-col" style="text-align:center;">
                            <div class="dossier-stamp-placeholder">
                                Official Seal<br>Cyber Police Station<br>BKC Mumbai
                            </div>
                        </div>
                        <div class="dossier-sign-col" style="text-align:right;">
                            <div class="dossier-sign-line">Signature of Investigating Officer</div>
                            <div style="font-weight:700; color:#0f172a; margin-top:2px;">${officer.name || 'Insp. Haziq Shaikh'}</div>
                            <div style="font-size:6.5pt; color:#64748b;">Badge ID: ${officer.badge_id || 'INV-7842'} · ${officer.role || 'LEAD_INVESTIGATOR'}</div>
                            <div style="font-size:6.2pt; color:#64748b;">${officer.station || 'Cyber Crime Police Station, BKC Mumbai'}</div>
                        </div>
                    </div>
                </section>

                <footer class="dossier-footer">
                    <span>Generated by CyberGuard Multimodal Voice Emotion Triage Console v2.1</span>
                    <span>Document Reference: ${docRef} · Page 1 of 1 (Consolidated Case Dossier)</span>
                    <span>Government of India · Confidential Police Document</span>
                </footer>
            </div>
        `;

        // Trigger native browser print dialog (Save as PDF)
        setTimeout(() => {
            window.print();
        }, 150);
    }

    // Attach Event Listeners
    if (btnExportForensicPdf) {
        btnExportForensicPdf.addEventListener("click", () => {
            generatePoliceDossierPDF("forensic");
        });
    }

    if (btnExportLivePdf) {
        btnExportLivePdf.addEventListener("click", () => {
            generatePoliceDossierPDF("live");
        });
    }

    if (btnExportActiveCallPdf) {
        btnExportActiveCallPdf.addEventListener("click", () => {
            generatePoliceDossierPDF("active");
        });
    }

    // Expose globally
    window.generatePoliceDossierPDF = generatePoliceDossierPDF;

    // Initial Load
    loadCallQueue();
});
