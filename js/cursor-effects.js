(function () {
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after { cursor: none !important; }

        #custom-cursor {
            position: fixed;
            top: 0; left: 0;
            pointer-events: none;
            z-index: 99999;
            font-size: 28px;
            line-height: 1;
            user-select: none;
            will-change: transform;
            animation: wandGlow 2.5s ease-in-out infinite;
            transition: opacity 0.2s ease;
        }

        #cursor-dot {
            position: fixed;
            top: 0; left: 0;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ff69b4;
            pointer-events: none;
            z-index: 100000;
            will-change: transform;
            box-shadow: 0 0 5px #ff69b4, 0 0 10px rgba(255,105,180,0.6);
            transition: opacity 0.2s, transform 0.06s;
            animation: dotGlow 2.5s ease-in-out infinite;
        }

        @keyframes dotGlow {
            0%   { box-shadow: 0 0 5px #ff69b4, 0 0 10px rgba(255,105,180,0.6); background: #ff69b4; }
            25%  { box-shadow: 0 0 5px #c084fc, 0 0 10px rgba(192,132,252,0.6); background: #c084fc; }
            50%  { box-shadow: 0 0 5px #7dd3fc, 0 0 10px rgba(125,211,252,0.6); background: #7dd3fc; }
            75%  { box-shadow: 0 0 5px #fde68a, 0 0 10px rgba(253,230,138,0.7); background: #fde68a; }
            100% { box-shadow: 0 0 5px #ff69b4, 0 0 10px rgba(255,105,180,0.6); background: #ff69b4; }
        }

        .cursor-ripple {
            position: fixed;
            top: 0; left: 0;
            width: 10px;
            height: 10px;
            margin: -5px 0 0 -5px;
            border-radius: 50%;
            border: 2px solid rgba(255, 105, 180, 0.85);
            pointer-events: none;
            z-index: 99996;
            will-change: transform, opacity;
            animation: rippleExpand 0.48s ease-out forwards;
        }

        @keyframes rippleExpand {
            0%   { opacity: 0.9; transform: translate(var(--cx), var(--cy)) scale(1); }
            100% { opacity: 0;   transform: translate(var(--cx), var(--cy)) scale(5); }
        }

        @keyframes wandGlow {
            0%   { filter: drop-shadow(0 0 5px #ff69b4) drop-shadow(0 0 14px rgba(255,105,180,0.65)); }
            25%  { filter: drop-shadow(0 0 5px #c084fc) drop-shadow(0 0 14px rgba(192,132,252,0.65)); }
            50%  { filter: drop-shadow(0 0 5px #7dd3fc) drop-shadow(0 0 14px rgba(125,211,252,0.65)); }
            75%  { filter: drop-shadow(0 0 5px #fde68a) drop-shadow(0 0 14px rgba(253,230,138,0.75)); }
            100% { filter: drop-shadow(0 0 5px #ff69b4) drop-shadow(0 0 14px rgba(255,105,180,0.65)); }
        }

        .cursor-particle {
            position: fixed;
            top: 0; left: 0;
            pointer-events: none;
            z-index: 99998;
            user-select: none;
            line-height: 1;
            will-change: transform, opacity;
            animation: cursorParticleFloat var(--dur, 0.7s) ease-out forwards;
        }

        @keyframes cursorParticleFloat {
            0%   { opacity: 1; transform: translate(var(--sx), var(--sy)) scale(1)    rotate(0deg); }
            100% { opacity: 0; transform: translate(calc(var(--sx) + var(--vx, 0px)), calc(var(--sy) + var(--vy, -50px))) scale(0.2) rotate(var(--rot, 60deg)); }
        }

        .cursor-sparkle {
            position: fixed;
            top: 0; left: 0;
            pointer-events: none;
            z-index: 99997;
            user-select: none;
            line-height: 1;
            will-change: transform, opacity;
            animation: sparkleFloat var(--dur, 0.35s) ease-out forwards;
        }

        @keyframes sparkleFloat {
            0%   { opacity: 1; transform: translate(var(--sx), var(--sy)) scale(1); }
            100% { opacity: 0; transform: translate(calc(var(--sx) + var(--vx, 0px)), calc(var(--sy) + var(--vy, -15px))) scale(0.05); }
        }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.textContent = '🪄';
    document.body.appendChild(cursor);

    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    document.body.appendChild(dot);

    let mouseX = -300, mouseY = -300;
    let prevX  = -300, prevY  = -300;
    let tilt = 0;
    let isClicking = false;
    let rafPending = false;

    let lastHeartTime   = 0;
    let lastSparkleTime = 0;
    let particleCount   = 0;
    const MAX_PARTICLES = 18;

    // 파티클 생성 억제: 모달이 열려 있으면 파티클 생성 안 함
    function isModalOpen() {
        const modal = document.getElementById('pet-modal');
        const auth  = document.getElementById('auth-modal');
        const light = document.getElementById('photo-lightbox');
        return (modal  && modal.style.display  !== 'none') ||
               (auth   && auth.style.display   !== 'none') ||
               (light  && light.style.display  !== 'none');
    }

    const TIP_DX = 18, TIP_DY = -19;

    function scheduleFrame() {
        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(renderFrame);
        }
    }

    function renderFrame() {
        rafPending = false;

        const s = isClicking ? 1.5 : 1;
        const r = isClicking ? tilt + 20 : tilt;
        cursor.style.transform =
            `translate(${mouseX - 4}px, ${mouseY - 20}px) rotate(${r}deg) scale(${s})`;

        // 점은 항상 정확한 클릭 포인트에 위치
        const dotScale = isClicking ? 1.7 : 1;
        dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px) scale(${dotScale})`;

        if (isModalOpen() || particleCount >= MAX_PARTICLES) return;

        const now = Date.now();
        const tx = mouseX + TIP_DX;
        const ty = mouseY + TIP_DY;

        if (now - lastHeartTime > 90) {
            spawnHeart(tx, ty, false);
            lastHeartTime = now;
        }
        if (now - lastSparkleTime > 50) {
            spawnSparkle(tx, ty, false);
            lastSparkleTime = now;
        }
    }

    document.addEventListener('mousemove', (e) => {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            tilt += (angle * 0.3 - tilt) * 0.22;
            tilt  = Math.max(-38, Math.min(38, tilt));
        }
        prevX  = mouseX; prevY  = mouseY;
        mouseX = e.clientX; mouseY = e.clientY;
        scheduleFrame();
    });

    document.addEventListener('mousedown', () => {
        isClicking = true;
        scheduleFrame();
        spawnRipple(mouseX, mouseY);
        if (isModalOpen()) return;
        const tx = mouseX + TIP_DX, ty = mouseY + TIP_DY;
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                spawnHeart(tx, ty, true);
                spawnSparkle(tx, ty, true);
            }, i * 40);
        }
    });

    document.addEventListener('mouseup',    () => { isClicking = false; scheduleFrame(); });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; dot.style.opacity = '1'; });

    const hearts   = ['💕', '💖', '💗', '💓', '🩷', '❤️', '💝'];
    const sparkles = ['✨', '⭐', '🌟', '💫'];

    function spawnRipple(x, y) {
        const el = document.createElement('div');
        el.className = 'cursor-ripple';
        el.style.setProperty('--cx', `${x}px`);
        el.style.setProperty('--cy', `${y}px`);
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 520);
    }

    function spawnHeart(x, y, burst) {
        if (particleCount >= MAX_PARTICLES) return;
        particleCount++;
        const el = document.createElement('div');
        el.className = 'cursor-particle';
        el.textContent = hearts[Math.floor(Math.random() * hearts.length)];

        const size = burst ? (Math.random() * 14 + 10) : (Math.random() * 7 + 6);
        const vx   = (Math.random() - 0.5) * (burst ? 90 : 16);
        const vy   = -(Math.random() * (burst ? 70 : 35) + 18);
        const dur  = Math.round(burst ? Math.random() * 400 + 600 : Math.random() * 200 + 450);
        const rot  = ((Math.random() - 0.5) * 140).toFixed(1);

        el.style.cssText = `font-size:${size}px;--sx:${x}px;--sy:${y}px;--vx:${vx}px;--vy:${vy}px;--dur:${dur}ms;--rot:${rot}deg;`;
        document.body.appendChild(el);
        setTimeout(() => { el.remove(); particleCount--; }, dur + 50);
    }

    function spawnSparkle(x, y, burst) {
        if (particleCount >= MAX_PARTICLES) return;
        particleCount++;
        const el = document.createElement('div');
        el.className = 'cursor-sparkle';
        el.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];

        const size = burst ? (Math.random() * 10 + 8) : (Math.random() * 5 + 5);
        const vx   = (Math.random() - 0.5) * (burst ? 55 : 14);
        const vy   = -(Math.random() * (burst ? 45 : 20) + 8);
        const dur  = Math.round(burst ? Math.random() * 200 + 300 : Math.random() * 100 + 180);

        el.style.cssText = `font-size:${size}px;--sx:${x}px;--sy:${y}px;--vx:${vx}px;--vy:${vy}px;--dur:${dur}ms;`;
        document.body.appendChild(el);
        setTimeout(() => { el.remove(); particleCount--; }, dur + 50);
    }
})();
