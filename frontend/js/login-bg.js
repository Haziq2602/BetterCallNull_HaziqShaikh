/* ==========================================================
   CyberGuard — Constellation Plexus Backdrop
   Faithful recreation of deep-space 3D node network:
   - Fixed, calm, subtle slow drifting speed
   - Multi-depth nodes: sharp midground, soft bokeh foreground, faint deep nodes
   - Interconnected dynamic lines & subtle triangular facets
   - App signature color scheme: Mint (#3dffa0) & Cyan (#5df2b8)
   ========================================================== */
(() => {
    "use strict";

    const body = document.body;
    let cv = document.getElementById("plexus");
    if (!cv) {
        cv = document.createElement("canvas");
        cv.id = "plexus";
        cv.setAttribute("aria-hidden", "true");
        body.prepend(cv);
    }

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Palette: mint-green, luminous cyan, soft sage
    const COLORS = [
        { r: 61, g: 255, b: 160 },   // #3dffa0
        { r: 93, g: 242, b: 184 },   // #5df2b8
        { r: 47, g: 232, b: 144 }    // #2fe890
    ];

    // Pre-rendered offscreen sprites for soft glow / bokeh performance
    const bokehSprites = COLORS.map(c => {
        const off = document.createElement("canvas");
        off.width = off.height = 80;
        const octx = off.getContext("2d");
        const rad = octx.createRadialGradient(40, 40, 0, 40, 40, 40);
        rad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.35)`);
        rad.addColorStop(0.35, `rgba(${c.r}, ${c.g}, ${c.b}, 0.14)`);
        rad.addColorStop(0.7, `rgba(${c.r}, ${c.g}, ${c.b}, 0.04)`);
        rad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        octx.fillStyle = rad;
        octx.fillRect(0, 0, 80, 80);
        return off;
    });

    const glowSprites = COLORS.map(c => {
        const off = document.createElement("canvas");
        off.width = off.height = 24;
        const octx = off.getContext("2d");
        const rad = octx.createRadialGradient(12, 12, 0, 12, 12, 12);
        rad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.95)`);
        rad.addColorStop(0.3, `rgba(${c.r}, ${c.g}, ${c.b}, 0.45)`);
        rad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        octx.fillStyle = rad;
        octx.fillRect(0, 0, 24, 24);
        return off;
    });

    let W = 0, H = 0, dpr = 1;
    let nodes = [];
    let linkDistance = 145;
    let triDistance = 105;
    const BASE_SPEED = 9.5; // Fixed, calm, slow speed in px/s
    let speedMult = 1.0;
    let targetSpeedMult = 1.0;
    let lastTime = 0;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        cv.style.width = W + "px";
        cv.style.height = H + "px";

        linkDistance = Math.min(170, Math.max(115, Math.round(W * 0.11)));
        triDistance = Math.round(linkDistance * 0.75);

        // Calibrated node count: clear structure, zero visual noise
        const targetCount = Math.min(105, Math.max(45, Math.round((W * H) / 13500)));

        nodes = [];
        for (let i = 0; i < targetCount; i++) {
            const isBokeh = Math.random() < 0.14; // soft out-of-focus drifting orbs
            const z = isBokeh ? (0.2 + Math.random() * 0.25) : (0.45 + Math.random() * 0.55);
            const angle = Math.random() * Math.PI * 2;
            const spd = (BASE_SPEED * (0.6 + z * 0.6));

            nodes.push({
                x: Math.random() * W,
                y: Math.random() * H,
                z: z,
                isBokeh: isBokeh,
                radius: isBokeh ? (22 + Math.random() * 22) : (1.4 + z * 1.5),
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                colorIdx: Math.floor(Math.random() * COLORS.length),
                alpha: isBokeh ? (0.16 + Math.random() * 0.18) : (0.35 + z * 0.55)
            });
        }

        if (prefersReducedMotion) renderOnce();
    }

    function draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const linkDistSq = linkDistance * linkDistance;
        const triDistSq = triDistance * triDistance;
        const n = nodes.length;

        // 1. Draw subtle triangular meshes where triplets connect
        for (let i = 0; i < n; i++) {
            const p1 = nodes[i];
            if (p1.isBokeh) continue;

            for (let j = i + 1; j < n; j++) {
                const p2 = nodes[j];
                if (p2.isBokeh) continue;
                const d12Sq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
                if (d12Sq > triDistSq) continue;

                for (let k = j + 1; k < n; k++) {
                    const p3 = nodes[k];
                    if (p3.isBokeh) continue;
                    const d23Sq = (p2.x - p3.x) ** 2 + (p2.y - p3.y) ** 2;
                    if (d23Sq > triDistSq) continue;
                    const d31Sq = (p3.x - p1.x) ** 2 + (p3.y - p1.y) ** 2;
                    if (d31Sq > triDistSq) continue;

                    const triAlpha = 0.024 * Math.min(p1.z, p2.z, p3.z);
                    const c = COLORS[p1.colorIdx];
                    ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${triAlpha.toFixed(4)})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // 2. Draw connecting lines between nearby constellation nodes
        ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
            const p1 = nodes[i];
            if (p1.isBokeh) continue;

            for (let j = i + 1; j < n; j++) {
                const p2 = nodes[j];
                if (p2.isBokeh) continue;

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < linkDistSq) {
                    const dist = Math.sqrt(distSq);
                    const lineAlpha = (1 - dist / linkDistance) * 0.42 * Math.min(p1.z, p2.z);
                    const c = COLORS[p1.colorIdx];

                    ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${lineAlpha.toFixed(3)})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        // 3. Draw nodes: Bokeh orbs & glowing sharp points
        for (let i = 0; i < n; i++) {
            const p = nodes[i];

            if (p.isBokeh) {
                // Soft blurry out-of-focus orbs
                const diam = p.radius * 2;
                ctx.globalAlpha = p.alpha;
                ctx.drawImage(bokehSprites[p.colorIdx], p.x - p.radius, p.y - p.radius, diam, diam);
            } else {
                // Sharp glowing node
                const glowSize = 10 + p.z * 10;
                ctx.globalAlpha = p.alpha * 0.7;
                ctx.drawImage(glowSprites[p.colorIdx], p.x - glowSize / 2, p.y - glowSize / 2, glowSize, glowSize);

                // Bright core dot
                ctx.globalAlpha = p.alpha;
                const c = COLORS[p.colorIdx];
                ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1.0;
    }

    function renderOnce() {
        draw();
    }

    function loop(ts) {
        requestAnimationFrame(loop);
        if (!lastTime) lastTime = ts;
        const dt = Math.min(0.05, (ts - lastTime) / 1000);
        lastTime = ts;

        speedMult += (targetSpeedMult - speedMult) * Math.min(1, dt * 2.5);

        const pad = 40;
        for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            p.x += p.vx * dt * speedMult;
            p.y += p.vy * dt * speedMult;

            // Seamless toroidal boundary wrap
            if (p.x < -pad) p.x = W + pad;
            else if (p.x > W + pad) p.x = -pad;

            if (p.y < -pad) p.y = H + pad;
            else if (p.y > H + pad) p.y = -pad;
        }

        draw();
    }

    // Gentle acceleration on access granted
    new MutationObserver(() => {
        if (body.classList.contains("lg-granted")) {
            targetSpeedMult = 2.8;
            setTimeout(() => { targetSpeedMult = 1.0; }, 900);
        }
    }).observe(body, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", resize);
    resize();

    if (!prefersReducedMotion) {
        requestAnimationFrame(loop);
    }
})();
