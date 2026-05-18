function injectAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="auth-modal-box">
            <button class="auth-modal-close" onclick="closeAuthModal()">✕</button>
            <h3 class="auth-modal-title">🏡 두근두근타운</h3>

            <!-- 상태 1: 로그인 / 회원가입 폼 -->
            <div id="auth-form-view">
                <div class="auth-tabs">
                    <button class="auth-tab active" id="tab-login"  onclick="switchAuthTab('login')">로그인</button>
                    <button class="auth-tab"         id="tab-signup" onclick="switchAuthTab('signup')">회원가입</button>
                </div>

                <input type="email"    id="auth-email"            placeholder="이메일"        class="auth-input" autocomplete="email">
                <input type="password" id="auth-password"         placeholder="비밀번호 (6자 이상)" class="auth-input" autocomplete="current-password">
                <input type="password" id="auth-password-confirm" placeholder="비밀번호 확인"  class="auth-input" style="display:none" autocomplete="new-password">

                <p id="auth-error" class="auth-error"></p>

                <button class="auth-submit-btn" id="auth-submit-btn" onclick="submitAuthForm()">로그인</button>

                <div class="auth-divider"><span>또는</span></div>

                <button class="auth-google-btn" onclick="closeAuthModal(); signInWithGoogle();">
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    구글로 계속하기
                </button>
            </div>

            <!-- 상태 2: 인증 이메일 발송 완료 -->
            <div id="auth-verify-view" style="display:none;">
                <div class="auth-verify-state">
                    <div class="auth-verify-icon">📧</div>
                    <p class="auth-verify-title">인증 이메일을 보냈어요!</p>
                    <p class="auth-verify-desc">이메일함을 확인하고 인증 링크를 클릭한 후<br>다시 로그인해주세요.</p>
                    <button class="auth-submit-btn" onclick="showAuthFormView()">로그인하기</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeAuthModal(); });
}

let currentAuthTab = 'login';

function openAuthModal() {
    injectAuthModal();
    showAuthFormView();
    switchAuthTab('login');
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-password-confirm').value = '';
    document.getElementById('auth-error').textContent = '';
    document.getElementById('auth-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('auth-email').focus(), 60);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

function showAuthFormView() {
    document.getElementById('auth-form-view').style.display = 'block';
    document.getElementById('auth-verify-view').style.display = 'none';
    const btn = document.getElementById('auth-submit-btn');
    if (btn) { btn.disabled = false; btn.textContent = currentAuthTab === 'login' ? '로그인' : '회원가입'; }
    const errEl = document.getElementById('auth-error');
    if (errEl) errEl.textContent = '';
}

function showVerifyView() {
    document.getElementById('auth-form-view').style.display = 'none';
    document.getElementById('auth-verify-view').style.display = 'block';
}

function switchAuthTab(tab) {
    currentAuthTab = tab;
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
    document.getElementById('auth-password-confirm').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('auth-submit-btn').textContent = tab === 'login' ? '로그인' : '회원가입';
    document.getElementById('auth-error').textContent = '';
}

async function submitAuthForm() {
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const confirm  = document.getElementById('auth-password-confirm').value;
    const errorEl  = document.getElementById('auth-error');
    const btn      = document.getElementById('auth-submit-btn');

    if (!email || !password) {
        errorEl.textContent = '이메일과 비밀번호를 입력해주세요.';
        return;
    }

    if (currentAuthTab === 'signup') {
        if (password.length < 6) { errorEl.textContent = '비밀번호는 6자 이상이어야 해요.'; return; }
        if (password !== confirm) { errorEl.textContent = '비밀번호가 일치하지 않아요.'; return; }
    }

    btn.disabled = true;
    btn.textContent = '처리 중...';
    errorEl.textContent = '';

    try {
        if (currentAuthTab === 'login') {
            const cred = await auth.signInWithEmailAndPassword(email, password);

            if (!cred.user.emailVerified) {
                // 미인증 상태 - 인증 링크 재발송 후 로그아웃
                try { await cred.user.sendEmailVerification(); } catch (_) {}
                await auth.signOut();
                errorEl.textContent = '이메일 인증이 필요해요. 인증 링크를 다시 보냈어요.';
                btn.disabled = false;
                btn.textContent = '로그인';
                return;
            }

            closeAuthModal();

        } else {
            // 회원가입 - 인증 이메일 발송 후 즉시 로그아웃
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            await cred.user.sendEmailVerification();
            await auth.signOut();
            showVerifyView();
        }

    } catch (e) {
        errorEl.textContent = getAuthErrorMessage(e.code);
        btn.disabled = false;
        btn.textContent = currentAuthTab === 'login' ? '로그인' : '회원가입';
    }
}

function getAuthErrorMessage(code) {
    const map = {
        'auth/email-already-in-use':   '이미 사용 중인 이메일이에요.',
        'auth/invalid-email':          '이메일 형식이 올바르지 않아요.',
        'auth/user-not-found':         '등록되지 않은 이메일이에요.',
        'auth/wrong-password':         '비밀번호가 틀렸어요.',
        'auth/invalid-credential':     '이메일 또는 비밀번호가 올바르지 않아요.',
        'auth/weak-password':          '비밀번호는 6자 이상이어야 해요.',
        'auth/too-many-requests':      '로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.',
        'auth/network-request-failed': '네트워크 오류가 발생했어요.',
    };
    return map[code] || '오류가 발생했어요. (' + code + ')';
}

document.addEventListener('keydown', e => {
    const modal = document.getElementById('auth-modal');
    if (!modal || modal.style.display === 'none') return;
    if (e.key === 'Escape') closeAuthModal();
    if (e.key === 'Enter') submitAuthForm();
});

document.addEventListener('DOMContentLoaded', injectAuthModal);
