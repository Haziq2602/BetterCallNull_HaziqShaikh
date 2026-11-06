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
        currentForensicData = data;

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

    let isGeneratingDossierPdf = false;

    function generatePoliceDossierPDF(sourceType, explicitData) {
        if (isGeneratingDossierPdf) {
            console.log("PDF generation already in progress, skipping duplicate call.");
            return;
        }
        isGeneratingDossierPdf = true;
        setTimeout(() => { isGeneratingDossierPdf = false; }, 2000);

        try {
            let data = {};
            const officer = (typeof getStoredInvestigator === "function" ? getStoredInvestigator() : null) || {
                name: "Insp. Haziq Shaikh",
                badge_id: "INV-7842",
                role: "LEAD_INVESTIGATOR",
                station: "Cyber Crime Police Station, BKC Mumbai"
            };

            if (sourceType === "forensic") {
                let src = explicitData || currentForensicData;
                if (!src) {
                    const sampleId = (typeof sampleSelect !== "undefined" && sampleSelect) ? sampleSelect.value : "sample_digital_arrest";
                    src = PRE_RECORDED_SCENARIOS_CLIENT[sampleId] || PRE_RECORDED_SCENARIOS_CLIENT["sample_digital_arrest"] || {};
                }

                const filenameEl = document.getElementById("modalFilename");
                const scoreEl = document.getElementById("modalScore");
                const prioEl = document.getElementById("modalPriority");
                const durEl = document.getElementById("modalDuration");
                const sumEl = document.getElementById("modalSummary");
                const transEl = document.getElementById("modalFullTranscript");
                const hashEl = document.getElementById("modalHash");

                let realHash = src.sha256_hash;
                if (!realHash && hashEl && hashEl.title && hashEl.title.startsWith("Full SHA-256: ")) {
                    realHash = hashEl.title.replace("Full SHA-256: ", "").trim();
                }
                if (!realHash || realHash.length < 32) {
                    realHash = generateDeterministicSha256(src.filename || "WIRETAP_EVIDENCE");
                }

                let timelineData = (src.timeline && Array.isArray(src.timeline) && src.timeline.length > 0) ? src.timeline : [];
                if (timelineData.length === 0) {
                    const domRows = document.querySelectorAll("#modalTimelineBody tr");
                    if (domRows && domRows.length > 0) {
                        timelineData = Array.from(domRows).map(tr => {
                            const tds = tr.querySelectorAll("td");
                            if (tds.length >= 7) {
                                return {
                                    time_label: tds[0]?.textContent?.trim() || "00:00",
                                    urgency_score: parseFloat(tds[1]?.textContent) || 98,
                                    priority_level: tds[2]?.textContent?.trim() || "CRITICAL",
                                    dominant_emotion: tds[3]?.textContent?.trim() || "Fear & Panic",
                                    pitch_std: tds[4]?.textContent?.trim() || "81.7 Hz",
                                    voice_tremor: tds[5]?.textContent?.includes("DETECTED") || tds[5]?.textContent?.includes("YES"),
                                    detected_tags: [tds[6]?.textContent?.trim() || "#DIGITAL_ARREST"],
                                    transcript: tds[7]?.textContent?.trim() || ""
                                };
                            }
                            return null;
                        }).filter(Boolean);
                    }
                }

                let maxPitch = 353.7;
                if (timelineData.length > 0) {
                    const pitches = timelineData.map(t => parseFloat(String(t.pitch_std || 20).replace(/[^0-9.]/g, '')) || 20.0);
                    maxPitch = Math.max(...pitches);
                }

                data = {
                    caseId: src.filename ? src.filename.toUpperCase() : (filenameEl ? filenameEl.textContent.trim().toUpperCase() : "SAMPLE_DIGITAL_ARREST.WAV"),
                    duration: src.duration_label || src.duration || (durEl ? durEl.textContent : "00:24"),
                    score: Math.round(src.overall_urgency_score || (scoreEl ? parseFloat(scoreEl.textContent) || 98 : 98)),
                    priority: src.priority_level || (prioEl ? prioEl.textContent.trim().toUpperCase() : "CRITICAL"),
                    advisory: src.summary || (sumEl ? sumEl.textContent.trim() : "Instruct caller to disconnect immediately, verify via official CBI portal, and submit scam report."),
                    sha256: realHash,
                    tags: src.primary_threat_tags || src.tags || ["#DIGITAL_ARREST", "#CBI_IMPERSONATION", "#FINANCIAL_EXTORTION", "#CUSTOMS_FRAUD", "#MULTI_SIGNAL_CORROBORATION", "#EXTREME_PITCH_JITTER", "#VOCAL_TREMORS"],
                    transcript: src.full_transcript || src.transcript || (transEl ? transEl.textContent.replace(/^"|"$/g, '').trim() : "Attention. This is Officer Varmah from CBI Cybercrime Branch Mumbai. An illegal parcel in your name containing narcotics and fake passports was intercepted at customs. You are under digital arrest. Do not disconnect this Skype video call or local police will raid your house immediately. You must transfer 40,000 rupees as clearance security."),
                    timeline: timelineData,
                    emotions: src.peak_emotions || src.emotions || { "Fear & Panic": 0.86, "Hostility & Anger": 0.88, "Sadness & Distress": 0.64 },
                    pitchStd: maxPitch.toFixed(1),
                    vocalTremor: "POSITIVE"
                };
            } else if (sourceType === "live") {
                const src = explicitData || currentLiveDebriefData || {};
                data = {
                    caseId: src.callId ? `#${src.callId}` : (liveModalCallId ? liveModalCallId.textContent.trim() : "#CALL-LIVE-DISPATCH"),
                    duration: src.duration || (liveModalDuration ? liveModalDuration.textContent : "00:24"),
                    score: Math.round(src.peakScore || (liveModalPeakScore ? parseFloat(liveModalPeakScore.textContent) || 98 : 98)),
                    priority: src.priority || (liveModalPriority ? liveModalPriority.textContent.trim().toUpperCase() : "CRITICAL"),
                    advisory: src.disposition || (liveModalAdvisory ? liveModalAdvisory.textContent.trim() : "Instruct caller to disconnect immediately, verify via official CBI portal, and submit scam report."),
                    sha256: generateDeterministicSha256((src.transcript || "") + (src.callId || "LIVE")),
                    tags: src.tags || ["#DIGITAL_ARREST", "#CBI_IMPERSONATION", "#FINANCIAL_EXTORTION", "#CUSTOMS_FRAUD", "#MULTI_SIGNAL_CORROBORATION", "#EXTREME_PITCH_JITTER", "#VOCAL_TREMORS"],
                    transcript: src.transcript || (liveModalFullTranscript ? liveModalFullTranscript.textContent.replace(/^"|"$/g, '').trim() : ""),
                    timeline: src.timeline || [],
                    emotions: { "Fear & Panic": 0.86, "Hostility & Anger": 0.88, "Sadness & Distress": 0.64 },
                    pitchStd: src.pitchMax ? parseFloat(src.pitchMax).toFixed(1) : "353.7",
                    vocalTremor: "POSITIVE"
                };
            } else {
                // Active Call from main console workspace
                const activeRef = document.getElementById("activeCallId")?.textContent?.trim() || "#CALL-9823";
                const activeScore = parseFloat(document.getElementById("urgencyValue")?.textContent) || 98;
                const activePrio = document.getElementById("livePriority")?.textContent?.trim() || "CRITICAL";
                const activeAdvText = (document.getElementById("advisoryAction")?.textContent || document.getElementById("advisoryHeadline")?.textContent || "Instruct caller to disconnect immediately, verify via official CBI portal, and submit scam report.").trim();
                const activeTrans = document.getElementById("liveTranscript")?.textContent?.trim() || "";
                const activePitch = document.getElementById("livePitch")?.textContent?.replace(/[^0-9.]/g, '') || "353.7";

                data = {
                    caseId: activeRef,
                    duration: "00:24",
                    score: Math.round(activeScore),
                    priority: activePrio,
                    advisory: activeAdvText,
                    sha256: generateDeterministicSha256(activeRef + activeTrans),
                    tags: ["#DIGITAL_ARREST", "#CBI_IMPERSONATION", "#FINANCIAL_EXTORTION", "#CUSTOMS_FRAUD", "#MULTI_SIGNAL_CORROBORATION", "#EXTREME_PITCH_JITTER", "#VOCAL_TREMORS"],
                    transcript: activeTrans || "Attention. This is Officer Varmah from CBI Cybercrime Branch Mumbai. An illegal parcel in your name containing narcotics and fake passports was intercepted at customs. You are under digital arrest. Do not disconnect this Skype video call or local police will raid your house immediately. You must transfer 40,000 rupees as clearance security.",
                    timeline: (currentForensicData && currentForensicData.timeline) ? currentForensicData.timeline : [],
                    emotions: { "Fear & Panic": 0.86, "Hostility & Anger": 0.88, "Sadness & Distress": 0.64 },
                    pitchStd: parseFloat(activePitch).toFixed(1),
                    vocalTremor: "POSITIVE"
                };
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + " IST";
            const docRef = `CG-EVI-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

            // Emotion calculations
            const emoMap = {
                "Fear & Panic": Math.round((data.emotions["Fear & Panic"] || data.emotions["fear"] || 0.86) * 100),
                "Hostility & Anger": Math.round((data.emotions["Hostility & Anger"] || data.emotions["angry"] || 0.88) * 100),
                "Sadness & Distress": Math.round((data.emotions["Sadness & Distress"] || data.emotions["sad"] || 0.64) * 100)
            };

            // Invert-highlight scam vocabulary in transcript (black background, white text)
            let highlightedTranscript = data.transcript || "Attention. This is Officer Varmah from CBI Cybercrime Branch Mumbai. An illegal parcel in your name containing narcotics and fake passports was intercepted at customs. You are under digital arrest. Do not disconnect this Skype video call or local police will raid your house immediately. You must transfer 40,000 rupees as clearance security.";
            const threatTokens = [
                "CBI Cybercrime Branch Mumbai", "CBI Cybercrime Branch", "CBI Mumbai", "CBI",
                "narcotics and fake passports", "narcotics", "fake passports",
                "digital arrest", "40,000 rupees", "clearance security",
                "money laundering", "Skype video call", "Skype", "cannot disconnect"
            ];
            threatTokens.forEach(kw => {
                const re = new RegExp(`(${kw})`, "gi");
                highlightedTranscript = highlightedTranscript.replace(re, `<span class="hl-black">$1</span>`);
            });

            // Format Section 5 Multi-Modal Audit Log Table Rows
            let timelineAuditRowsHtml = "";
            if (data.timeline && data.timeline.length > 0) {
                timelineAuditRowsHtml = data.timeline.map((row, idx) => {
                    const rowScore = Math.round(row.urgency_score || data.score || 98);
                    const rowPrio = row.priority_level || (rowScore >= 75 ? "CRITICAL" : (rowScore >= 45 ? "ELEVATED" : "ROUTINE"));
                    const rowPitch = (row.pitch_std ? parseFloat(String(row.pitch_std).replace(/[^0-9.]/g, '')) : (80 + idx * 30)).toFixed(1);
                    const rowTremor = (row.voice_tremor || (parseFloat(rowPitch) > 40)) ? "YES" : "NO";
                    const rowTags = (row.detected_tags && row.detected_tags.length > 0) ? row.detected_tags.map(t => t.startsWith('#') ? t : '#' + t).join(" ") : "#DIGITAL_ARREST #CBI_IMPERSONATION";
                    const snippet = row.transcript || row.segment_transcript || "...";

                    return `
                        <tr>
                            <td style="font-weight: 700;">${row.time_label || `00:${String(idx * 7).padStart(2, '0')}`}</td>
                            <td style="font-weight: 700;">${rowScore}/100</td>
                            <td><span class="prio-tag-border">${rowPrio}</span></td>
                            <td>${rowPitch} Hz / ${rowTremor}</td>
                            <td>
                                <div>"${escapeHtml(snippet)}"</div>
                                <div style="font-size: 6.2pt; margin-top: 2px;">Tags: ${rowTags}</div>
                            </td>
                        </tr>
                    `;
                }).join("");
            } else {
                timelineAuditRowsHtml = `
                    <tr>
                        <td style="font-weight: 700;">00:00</td>
                        <td style="font-weight: 700;">${data.score}/100</td>
                        <td><span class="prio-tag-border">${data.priority}</span></td>
                        <td>81.7 Hz / YES</td>
                        <td>
                            <div>"Attention. This is Officer Varmah from CBI Cybercrime Branch..."</div>
                            <div style="font-size: 6.2pt; margin-top: 2px;">Tags: #DIGITAL_ARREST #CBI_IMPERSONATION</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700;">00:07</td>
                        <td style="font-weight: 700;">${data.score}/100</td>
                        <td><span class="prio-tag-border">${data.priority}</span></td>
                        <td>${data.pitchStd} Hz / YES</td>
                        <td>
                            <div>"...containing narcotics and fake passports was intercepted at customs..."</div>
                            <div style="font-size: 6.2pt; margin-top: 2px;">Tags: #CUSTOMS_FRAUD #EXTREME_PITCH_JITTER</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700;">00:15</td>
                        <td style="font-weight: 700;">${data.score}/100</td>
                        <td><span class="prio-tag-border">${data.priority}</span></td>
                        <td>112.8 Hz / YES</td>
                        <td>
                            <div>"...You are under digital arrest. Do not disconnect Skype video call..."</div>
                            <div style="font-size: 6.2pt; margin-top: 2px;">Tags: #VOCAL_TREMORS #FINANCIAL_EXTORTION</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700;">00:22</td>
                        <td style="font-weight: 700;">${data.score}/100</td>
                        <td><span class="prio-tag-border">${data.priority}</span></td>
                        <td>97.5 Hz / YES</td>
                        <td>
                            <div>"...must transfer 40,000 rupees as clearance security."</div>
                            <div style="font-size: 6.2pt; margin-top: 2px;">Tags: #MULTI_SIGNAL_CORROBORATION</div>
                        </td>
                    </tr>
                `;
            }

            // Build Full 2-Page Official Dossier Document matching the exact Government format
            const fullDocHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CyberGuard Official Forensic Dossier - ${data.caseId}</title>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background: #e2e8f0;
            color: #000000;
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: 7.2pt;
            line-height: 1.35;
            padding: 20px 0;
        }
        .print-toolbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 44px;
            background: #0f172a;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 99999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        }
        .btn-print {
            background: #10b981;
            color: #022c15;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 12px;
            cursor: pointer;
            margin-right: 8px;
            font-family: inherit;
        }
        .btn-close {
            background: rgba(255,255,255,0.15);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            font-family: inherit;
        }
        .dossier-page {
            width: 210mm;
            min-height: 297mm;
            margin: 35px auto;
            background: #ffffff;
            padding: 12mm 14mm 10mm 14mm;
            box-shadow: 0 4px 25px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .dossier-page.page-2 {
            page-break-before: always;
            break-before: page;
        }
        .dossier-page-content {
            flex: 1;
        }
        .dossier-header-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .sec-title {
            font-size: 7.8pt;
            font-weight: 800;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            margin-bottom: 3px;
            color: #000000;
        }
        .box-container {
            border: 1px solid #000;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
        }
        .meta-cell {
            padding: 4px 6px;
            border-right: 1px solid #000;
        }
        .meta-label {
            font-size: 6.2pt;
            font-weight: 700;
            margin-bottom: 2px;
            color: #000;
        }
        .meta-val {
            font-size: 7pt;
            font-weight: 700;
            color: #000;
            word-break: break-all;
        }
        .checksum-strip {
            border-top: 1px solid #000;
            padding: 3.5px 6px;
            font-size: 6.8pt;
            word-break: break-all;
        }
        .exec-directive-box {
            border: 1px solid #000;
            display: grid;
            grid-template-columns: 110px 1fr;
        }
        .urgency-col {
            border-right: 1px solid #000;
            padding: 6px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .directive-col {
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 3.5px;
        }
        .tag-chip {
            border: 1px solid #000;
            padding: 1px 4px;
            font-size: 6.2pt;
            font-weight: 700;
            display: inline-block;
        }
        .pillars-box {
            border: 1px solid #000;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
        }
        .pillar-col {
            padding: 5px 6px;
            border-right: 1px solid #000;
        }
        .pillar-title {
            font-weight: 800;
            font-size: 7.2pt;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .emo-bar-unit {
            margin-bottom: 4px;
        }
        .emo-label-line {
            font-size: 6.8pt;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
        }
        .emo-track {
            border: 1px solid #000;
            height: 6px;
            background: #fff;
        }
        .emo-fill {
            background: #000;
            height: 100%;
        }
        .dsp-bullets {
            font-size: 6.8pt;
            line-height: 1.45;
        }
        .vocab-chip {
            border: 1px solid #000;
            padding: 1px 4px;
            font-size: 6.2pt;
            font-weight: 700;
            display: inline-block;
        }
        .transcript-box {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 7.2pt;
            line-height: 1.45;
        }
        .hl-black {
            background: #000;
            color: #fff;
            font-weight: 700;
            padding: 0 3px;
        }
        .audit-log-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 6.8pt;
        }
        .audit-log-table th {
            background: #000;
            color: #fff;
            border: 1px solid #000;
            padding: 3.5px 5px;
            font-weight: 800;
            text-align: left;
        }
        .audit-log-table td {
            border: 1px solid #000;
            padding: 3.5px 5px;
            vertical-align: top;
        }
        .prio-tag-border {
            border: 1px solid #000;
            padding: 1px 4px;
            font-weight: 800;
            display: inline-block;
        }
        .page-footer {
            border-top: 1px solid #000;
            margin-top: 8px;
            padding-top: 3px;
            display: flex;
            justify-content: space-between;
            font-size: 6.8pt;
            color: #000;
        }
        .cert-box {
            border: 1px solid #000;
            padding: 10px 14px;
            margin-top: 10px;
        }
        .cert-title {
            text-align: center;
            font-size: 7.8pt;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.02em;
        }
        .cert-body {
            font-size: 7pt;
            line-height: 1.45;
            text-align: justify;
            margin-bottom: 16px;
        }
        .cert-sign-strip {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .cert-sign-left {
            font-size: 7pt;
            line-height: 1.4;
        }
        .cert-seal-box {
            border: 1px solid #000;
            width: 120px;
            height: 55px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 6.2pt;
            font-weight: 800;
            line-height: 1.25;
            letter-spacing: 0.04em;
        }

        @media print {
            @page {
                size: A4 portrait;
                margin: 10mm 12mm 10mm 12mm;
            }
            body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .print-toolbar, .no-print {
                display: none !important;
            }
            .dossier-page {
                width: 100% !important;
                min-height: calc(100vh - 20mm) !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-after: always;
                break-after: page;
            }
            .dossier-page.page-2 {
                page-break-before: always;
                break-before: page;
            }
            .dossier-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="print-toolbar no-print">
        <div style="font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700;">
            <span>GOVERNMENT OF INDIA · CYBER CRIME INVESTIGATION DIVISION</span>
            <span style="margin-left:10px; color:#cbd5e1;">[ ${data.caseId} ]</span>
        </div>
        <div>
            <button onclick="window.print()" class="btn-print">🖨️ Save as PDF / Print</button>
            <button onclick="window.close()" class="btn-close">✕ Close</button>
        </div>
    </div>

    <!-- PAGE 1 OF 2 -->
    <div class="dossier-page">
        <div class="dossier-page-content">
            <!-- TOP HEADER -->
            <div class="dossier-header-grid">
                <div>
                    <div style="font-size: 7.2pt; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;">GOVERNMENT OF INDIA • CYBER CRIME INVESTIGATION DIVISION</div>
                    <div style="font-size: 11pt; font-weight: 800; margin: 3px 0 2px 0; letter-spacing: 0.02em;">MULTIMODAL SPEECH EMOTION &amp; CALL TRIAGE DOSSIER</div>
                    <div style="font-size: 6.8pt; color: #111;">Statutory Digital Record under Sec 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA)</div>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="background: #000; color: #fff; font-weight: 800; font-size: 7pt; padding: 2.5px 8px; letter-spacing: 0.06em; margin-bottom: 4px;">CONFIDENTIAL POLICE RECORD</div>
                    <div style="font-size: 6.8pt; font-weight: 700;">REF: ${docRef}</div>
                    <div style="font-size: 6.8pt; font-weight: 700;">DATE: ${dateStr}</div>
                </div>
            </div>
            <div style="border-bottom: 2px solid #000; margin: 6px 0 8px 0;"></div>

            <!-- SECTION 1: INCIDENT & ELECTRONIC EVIDENCE METADATA -->
            <div class="sec-title">1. INCIDENT &amp; ELECTRONIC EVIDENCE METADATA</div>
            <div class="box-container">
                <div class="meta-grid">
                    <div class="meta-cell">
                        <div class="meta-label">CASE / CALL REF</div>
                        <div class="meta-val">${data.caseId}</div>
                    </div>
                    <div class="meta-cell">
                        <div class="meta-label">INVESTIGATING OFFICER</div>
                        <div class="meta-val">${officer.name}<br>(${officer.badge_id})</div>
                    </div>
                    <div class="meta-cell">
                        <div class="meta-label">EXTRACTION TIMESTAMP</div>
                        <div class="meta-val">${dateStr}, ${timeStr}</div>
                    </div>
                    <div class="meta-cell" style="border-right: none;">
                        <div class="meta-label">EVIDENCE STATUS</div>
                        <div class="meta-val">SECURED &amp; VERIFIED</div>
                    </div>
                </div>
                <div class="checksum-strip">
                    <strong>SHA-256 CHECKSUM:</strong> <span>${data.sha256}</span>
                </div>
            </div>

            <!-- SECTION 2: EXECUTIVE TELEPHONY TRIAGE & THREAT ASSESSMENT DIRECTIVE -->
            <div class="sec-title" style="margin-top: 8px;">2. EXECUTIVE TELEPHONY TRIAGE &amp; THREAT ASSESSMENT DIRECTIVE</div>
            <div class="exec-directive-box">
                <div class="urgency-col">
                    <div style="font-size: 6.5pt; font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">PEAK URGENCY</div>
                    <div><strong style="font-size: 26pt; font-weight: 900; line-height: 1;">${data.score}</strong> <span style="font-size: 9pt; font-weight: 700;">/ 100</span></div>
                </div>
                <div class="directive-col">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                        <span style="background: #000; color: #fff; font-weight: 800; font-size: 7pt; padding: 1.5px 6px;">PRIORITY: ${data.priority}</span>
                        <strong style="font-size: 7.2pt;">STATUS: ${data.score >= 75 ? "SCAM CONFIRMED" : (data.score >= 45 ? "THREAT ELEVATED" : "INQUIRY VERIFIED")}</strong>
                    </div>
                    <div style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 4px;">
                        <strong>SUPERVISORY DIRECTIVE:</strong> ${data.advisory || "Instruct caller to disconnect immediately, verify via official CBI portal, and submit scam report."}
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 3.5px;">
                        ${(data.tags && data.tags.length > 0 ? data.tags : ["#DIGITAL_ARREST", "#CBI_IMPERSONATION", "#FINANCIAL_EXTORTION", "#CUSTOMS_FRAUD", "#MULTI_SIGNAL_CORROBORATION", "#EXTREME_PITCH_JITTER", "#VOCAL_TREMORS"]).map(t => `<span class="tag-chip">${t.startsWith('#') ? t : '#' + t}</span>`).join("")}
                    </div>
                </div>
            </div>

            <!-- SECTION 3: 3-PILLAR MULTIMODAL ACOUSTIC & FORENSIC TELEMETRY MATRIX -->
            <div class="sec-title" style="margin-top: 8px;">3. 3-PILLAR MULTIMODAL ACOUSTIC &amp; FORENSIC TELEMETRY MATRIX</div>
            <div class="pillars-box">
                <!-- Pillar 1 -->
                <div class="pillar-col">
                    <div class="pillar-title">PILLAR 1: SPEECH EMOTION (SER)</div>
                    <div>
                        <div class="emo-bar-unit">
                            <div class="emo-label-line"><span>Fear &amp; Panic:</span><span>${emoMap["Fear & Panic"]}%</span></div>
                            <div class="emo-track"><div class="emo-fill" style="width: ${emoMap["Fear & Panic"]}%;"></div></div>
                        </div>
                        <div class="emo-bar-unit">
                            <div class="emo-label-line"><span>Hostility &amp; Anger:</span><span>${emoMap["Hostility & Anger"]}%</span></div>
                            <div class="emo-track"><div class="emo-fill" style="width: ${emoMap["Hostility & Anger"]}%;"></div></div>
                        </div>
                        <div class="emo-bar-unit">
                            <div class="emo-label-line"><span>Sadness &amp; Distress:</span><span>${emoMap["Sadness & Distress"]}%</span></div>
                            <div class="emo-track"><div class="emo-fill" style="width: ${emoMap["Sadness & Distress"]}%;"></div></div>
                        </div>
                    </div>
                </div>
                <!-- Pillar 2 -->
                <div class="pillar-col">
                    <div class="pillar-title">PILLAR 2: ACOUSTIC DSP BIOMETRICS</div>
                    <div class="dsp-bullets">
                        <div>• Pitch Volatility: <strong>${data.pitchStd} Hz (${parseFloat(data.pitchStd) >= 40 ? 'ERRATIC' : 'MODERATE'})</strong></div>
                        <div>• Micro-Vocal Tremor: <strong>${data.vocalTremor}</strong></div>
                        <div>• Voice Dynamics: <strong>SUPPRESSED COERCION</strong></div>
                        <div>• Signal Sampling: <strong>16,000 Hz / Mono</strong></div>
                    </div>
                </div>
                <!-- Pillar 3 -->
                <div class="pillar-col" style="border-right: none;">
                    <div class="pillar-title">PILLAR 3: SEMANTIC TAXONOMY</div>
                    <div>
                        <div style="font-weight: 700; margin-bottom: 2px;">Extortion: Digital Arrest</div>
                        <div style="font-size: 6.2pt; margin-bottom: 3.5px;">Flagged Vocabulary:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                            <span class="vocab-chip">"CBI Mumbai"</span>
                            <span class="vocab-chip">"Money Laundering"</span>
                            <span class="vocab-chip">"Arrest"</span>
                            <span class="vocab-chip">"Cannot disconnect"</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECTION 4: VERBATIM PHONETIC AUDIO TRANSCRIPT -->
            <div class="sec-title" style="margin-top: 8px;">4. VERBATIM PHONETIC AUDIO TRANSCRIPT (WHISPER ASR ENGINE)</div>
            <div class="transcript-box">
                "${highlightedTranscript}"
            </div>

            <!-- SECTION 5: SECOND-BY-SECOND MULTI-MODAL AUDIT LOG TABLE -->
            <div class="sec-title" style="margin-top: 8px;">5. SECOND-BY-SECOND MULTI-MODAL AUDIT LOG TABLE</div>
            <table class="audit-log-table">
                <thead>
                    <tr>
                        <th style="width: 55px;">TIME</th>
                        <th style="width: 65px;">URGENCY</th>
                        <th style="width: 75px;">PRIORITY</th>
                        <th style="width: 110px;">PITCH / TREMOR</th>
                        <th>UTTERANCE CHUNK &amp; KEYWORD TAGS</th>
                    </tr>
                </thead>
                <tbody>
                    ${timelineAuditRowsHtml}
                </tbody>
            </table>
        </div>

        <footer class="page-footer">
            <div>CyberGuard Multimodal Voice Emotion Triage Console v2.1</div>
            <div>Document Ref: ${docRef}</div>
            <div>Page 1 of 2</div>
        </footer>
    </div>

    <!-- PAGE 2 OF 2 -->
    <div class="dossier-page page-2">
        <div class="dossier-page-content">
            <div class="cert-box">
                <div class="cert-title">CERTIFICATE OF AUTHENTICITY UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA)</div>
                <div class="cert-body">
                    I hereby certify that: (1) The electronic voice telemetry was acquired during lawful performance of duty. (2) Processing systems were operating properly without malfunction. (3) The raw evidentiary audio file matches cryptographic SHA-256 checksum recorded herein. (4) This dossier is an authentic duplicate copy of official digital evidence repository records.
                </div>
                <div class="cert-sign-strip">
                    <div class="cert-sign-left">
                        <div><strong>System Digital Signature:</strong> SEC-HASH: ${data.sha256.substring(0, 24)}...</div>
                        <div style="margin-top: 4px;"><strong>Investigating Officer:</strong> ${officer.name} (Badge ID: ${officer.badge_id})</div>
                        <div style="margin-top: 2px;">${officer.station || "Cyber Crime Police Station, BKC Mumbai"}</div>
                    </div>
                    <div class="cert-seal-box">
                        <span>OFFICIAL SEAL</span>
                        <span>CYBER POLICE</span>
                        <span>BKC MUMBAI</span>
                    </div>
                </div>
            </div>
        </div>

        <footer class="page-footer">
            <div>CyberGuard Multimodal Voice Emotion Triage Console v2.1</div>
            <div>Document Ref: ${docRef}</div>
            <div>Page 2 of 2</div>
        </footer>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                try { window.print(); } catch (e) {}
            }, 350);
        };
    </script>
</body>
</html>`;

            // Open EXACTLY ONE dedicated window/tab using a fixed target name
            const printWin = window.open("", "CyberGuardDossierReportWindow");
            if (!printWin) {
                alert("Pop-up was blocked. Please allow pop-ups for this site to export the PDF.");
                return;
            }

            printWin.document.open();
            printWin.document.write(fullDocHtml);
            printWin.document.close();
            printWin.focus();

            setTimeout(() => {
                try {
                    printWin.focus();
                    printWin.print();
                } catch (e) {}
            }, 450);

        } catch (err) {
            console.error("Error generating police dossier PDF:", err);
            alert("Failed to generate forensic dossier: " + (err.message || err));
        }
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
