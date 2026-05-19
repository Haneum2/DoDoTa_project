(function () {
    const KEY = 'ddTownTheme';

    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function applyTheme(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = dark ? '☀️' : '🌙';
    }

    function toggleTheme() {
        const next = !isDark();
        localStorage.setItem(KEY, next ? 'dark' : 'light');
        applyTheme(next);
    }

    // 초기 적용 (저장값 → 시스템 설정 순서)
    const saved = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved ? saved === 'dark' : prefersDark);

    // DOM 준비 후 버튼 생성
    function createToggleBtn() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'theme-toggle-btn';
        btn.title = '다크/라이트 모드 전환';
        btn.textContent = isDark() ? '☀️' : '🌙';
        btn.addEventListener('click', toggleTheme);
        document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleBtn);
    } else {
        createToggleBtn();
    }
})();
