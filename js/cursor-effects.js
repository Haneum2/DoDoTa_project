(function () {
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after { cursor: none !important; }

        #custom-cursor {
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            font-size: 28px;
            line-height: 1;
            user-select: none;
            will-change: left, top, transform;
            animation: wandGlow 2.5s ease-in-out infinite;
            transition: opacity 0.2s ease;
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
            pointer-events: none;
            z-index: 99998;
            user-select: none;
            line-height: 1;
            animation: cursorParticleFloat var(--dur, 0.7s) ease-out forwards;
            will-change: transform, opacity;
        }

        @keyframes cursorParticleFloat {
            0%   { opacity: 1;   transform: translate(-50%,-50%) translate(0px,0px)                      scale(1)    rotate(0deg); }
            100% { opacity: 0;   transform: translate(-50%,-50%) translate(var(--vx,0px),var(--vy,-50px)) scale(0.2) rotate(var(--rot,60deg)); }
        }

        .cursor-sparkle {
            position: fixed;
            pointer-events: none;
            z-index: 99997;
            user-select: none;
            line-height: 1;
            animation: sparkleFloat var(--dur, 0.35s) ease-out forwards;
        }

        @keyframes sparkleFloat {
            0%   { opacity: 1;   transform: translate(-50%,-50%) scale(1); }
            100% { opacity: 0;   transform: translate(-50%,-50%) translate(var(--vx,0px),var(--vy,-15px)) scale(0.05); }
        }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.textContent = '🪄';
    document.body.appendChild(cursor);

    let mouseX = -300, mouseY = -300;
    let prevX  = -300, prevY  = -300;
    let lastHeartTime   = 0;
    let lastSparkleTime = 0;
    let tilt = 0;
    let isClicking = false;

    // 🪄 별 팁 위치 오프셋
    const TIP_X = 18;
    const TIP_Y = -19;
    function tipX() { return mouseX + TIP_X; }
    function tipY() { return mouseY + TIP_Y; }

    function updateTransform() {
        const s = isClicking ? 1.5 : 1;
        const r = isClicking ? tilt + 20 : tilt;
        cursor.style.transform = `translate(-4px,-20px) rotate(${r}deg) scale(${s})`;
    }

    document.addEventListener('mousemove', (e) => {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            tilt += (angle * 0.3 - tilt) * 0.22;
            tilt  = Math.max(-38, Math.min(38, tilt));
        }

        prevX  = mouseX;  prevY  = mouseY;
        mouseX = e.clientX; mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top  = mouseY + 'px';
        updateTransform();

        const now = Date.now();
        if (now - lastHeartTime   > 55) { spawnHeart(tipX(), tipY(), false);   lastHeartTime   = now; }
        if (now - lastSparkleTime > 28) { spawnSparkle(tipX(), tipY(), false); lastSparkleTime = now; }
    });

    document.addEventListener('mousedown', () => {
        isClicking = true;
        updateTransform();
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                spawnHeart(tipX(), tipY(), true);
                spawnSparkle(tipX(), tipY(), true);
            }, i * 35);
        }
    });

    document.addEventListener('mouseup',    () => { isClicking = false; updateTransform(); });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

    const hearts   = ['💕', '💖', '💗', '💓', '🩷', '❤️', '💝'];
    const sparkles = ['✨', '⭐', '🌟', '💫'];

    function spawnHeart(x, y, burst) {
        const el = document.createElement('div');
        el.className = 'cursor-particle';
        el.textContent = hearts[Math.floor(Math.random() * hearts.length)];

        const size = burst ? (Math.random() * 14 + 10) : (Math.random() * 7 + 6);
        const vx   = (Math.random() - 0.5) * (burst ? 90 : 16);
        const vy   = -(Math.random() * (burst ? 70 : 35) + 18);
        const dur  = Math.round(burst ? Math.random() * 400 + 600 : Math.random() * 250 + 500);
        const rot  = ((Math.random() - 0.5) * 140).toFixed(1);

        el.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px;--vx:${vx}px;--vy:${vy}px;--dur:${dur}ms;--rot:${rot}deg;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), dur + 50);
    }

    function spawnSparkle(x, y, burst) {
        const el = document.createElement('div');
        el.className = 'cursor-sparkle';
        el.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];

        const size = burst ? (Math.random() * 10 + 8) : (Math.random() * 5 + 5);
        const vx   = (Math.random() - 0.5) * (burst ? 55 : 14);
        const vy   = -(Math.random() * (burst ? 45 : 20) + 8);
        const dur  = Math.round(burst ? Math.random() * 200 + 300 : Math.random() * 120 + 200);

        el.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px;--vx:${vx}px;--vy:${vy}px;--dur:${dur}ms;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), dur + 50);
    }
})();
