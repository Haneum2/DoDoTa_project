window.userProfile = { displayName: null, photoBase64: null };
let profileTempPhoto = null;

// ===== Firestore 프로필 로드/저장 =====
async function loadUserProfile(uid) {
    if (!db) return;
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            window.userProfile.displayName = data.displayName || null;
            window.userProfile.photoBase64 = data.photoBase64 || null;
        }
    } catch (e) {
        console.error('프로필 로드 실패:', e);
    }
}

async function saveUserProfileToFirestore(uid, data) {
    if (!db) return;
    await db.collection('users').doc(uid).set(data, { merge: true });
}

// ===== 모달 주입 =====
function injectProfileModal() {
    if (document.getElementById('profile-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'auth-modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="auth-modal-box profile-modal-box">
            <button class="auth-modal-close" onclick="closeProfileModal()">✕</button>
            <h3 class="auth-modal-title">⚙️ 프로필 설정</h3>

            <!-- 사진 업로드 -->
            <div class="profile-photo-upload" onclick="triggerProfilePhotoUpload()">
                <div id="profile-photo-preview" class="profile-photo-preview"></div>
                <div class="photo-edit-overlay">📷</div>
            </div>
            <input type="file" id="profile-photo-input" accept="image/*" style="display:none" onchange="handleProfilePhotoUpload(event)">

            <!-- 닉네임 -->
            <input type="text" id="profile-name-input" placeholder="닉네임 (최대 12자)" class="auth-input" maxlength="12">

            <p id="profile-msg" class="profile-msg"></p>

            <button class="auth-submit-btn" onclick="saveProfile()">저장하기</button>

            <!-- 비밀번호 변경 (이메일 계정만) -->
            <div id="profile-pw-section" class="profile-section" style="display:none;">
                <button class="profile-section-toggle" onclick="togglePwSection()">
                    🔑 비밀번호 변경 <span id="pw-toggle-arrow">▼</span>
                </button>
                <div id="profile-pw-form" class="profile-section-body" style="display:none;">
                    <input type="password" id="profile-current-pw" placeholder="현재 비밀번호" class="auth-input">
                    <input type="password" id="profile-new-pw"     placeholder="새 비밀번호 (6자 이상)" class="auth-input">
                    <input type="password" id="profile-confirm-pw" placeholder="새 비밀번호 확인" class="auth-input">
                    <p id="profile-pw-msg" class="profile-msg"></p>
                    <button class="auth-submit-btn" id="profile-pw-btn" onclick="changePassword()">비밀번호 변경</button>
                </div>
            </div>

            <!-- 계정 탈퇴 -->
            <div class="profile-danger-zone">
                <button class="profile-delete-btn" onclick="confirmDeleteAccount()">계정 탈퇴</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeProfileModal(); });
}

// ===== 모달 열기/닫기 =====
function openProfileModal() {
    injectProfileModal();
    const user = auth.currentUser;
    if (!user) return;

    // 현재 프로필 데이터 채우기
    profileTempPhoto = window.userProfile.photoBase64 || null;
    renderProfilePhoto(user);

    const nameInput = document.getElementById('profile-name-input');
    nameInput.value = window.userProfile.displayName || user.displayName || '';

    setProfileMsg('', '');
    setProfilePwMsg('', '');

    // 이메일 계정만 비밀번호 변경 표시
    const isEmail = user.providerData.some(p => p.providerId === 'password');
    const pwSection = document.getElementById('profile-pw-section');
    if (pwSection) pwSection.style.display = isEmail ? 'block' : 'none';

    // 비번 폼 닫힌 상태로 초기화
    const pwForm = document.getElementById('profile-pw-form');
    if (pwForm) pwForm.style.display = 'none';
    const arrow = document.getElementById('pw-toggle-arrow');
    if (arrow) arrow.textContent = '▼';

    ['profile-current-pw', 'profile-new-pw', 'profile-confirm-pw'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
    profileTempPhoto = null;
}

// ===== 사진 처리 =====
function renderProfilePhoto(user) {
    const preview = document.getElementById('profile-photo-preview');
    if (!preview) return;
    const src = profileTempPhoto || user.photoURL || null;
    if (src) {
        preview.innerHTML = `<img src="${src}" class="pet-photo" alt="프로필">`;
    } else {
        preview.innerHTML = `<span class="pet-emoji-default">👤</span>`;
    }
}

function triggerProfilePhotoUpload() {
    const input = document.getElementById('profile-photo-input');
    input.value = '';
    input.click();
}

function handleProfilePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    resizeImageToBase64(file, base64 => {
        profileTempPhoto = base64;
        renderProfilePhoto(auth.currentUser);
    });
}

// ===== 저장 =====
async function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById('profile-name-input').value.trim();
    if (!name) {
        setProfileMsg('닉네임을 입력해주세요.', 'error');
        return;
    }

    setProfileMsg('저장 중...', '');
    try {
        // Firebase Auth displayName 업데이트
        await user.updateProfile({ displayName: name });

        // Firestore에 프로필 저장
        const data = { displayName: name };
        if (profileTempPhoto !== undefined) data.photoBase64 = profileTempPhoto || null;
        await saveUserProfileToFirestore(user.uid, data);

        // 전역 상태 업데이트
        window.userProfile.displayName = name;
        window.userProfile.photoBase64 = profileTempPhoto;

        // 헤더 UI 갱신
        if (typeof updateAuthUI === 'function') updateAuthUI(user);

        setProfileMsg('✅ 저장되었어요!', 'success');
    } catch (e) {
        console.error('프로필 저장 실패:', e);
        setProfileMsg('저장에 실패했어요. 다시 시도해주세요.', 'error');
    }
}

// ===== 비밀번호 변경 =====
function togglePwSection() {
    const form  = document.getElementById('profile-pw-form');
    const arrow = document.getElementById('pw-toggle-arrow');
    const open  = form.style.display === 'none';
    form.style.display  = open ? 'block' : 'none';
    arrow.textContent   = open ? '▲' : '▼';
}

async function changePassword() {
    const user       = auth.currentUser;
    const currentPw  = document.getElementById('profile-current-pw').value;
    const newPw      = document.getElementById('profile-new-pw').value;
    const confirmPw  = document.getElementById('profile-confirm-pw').value;
    const btn        = document.getElementById('profile-pw-btn');

    if (!currentPw || !newPw || !confirmPw) {
        setProfilePwMsg('모든 항목을 입력해주세요.', 'error'); return;
    }
    if (newPw.length < 6) {
        setProfilePwMsg('새 비밀번호는 6자 이상이어야 해요.', 'error'); return;
    }
    if (newPw !== confirmPw) {
        setProfilePwMsg('새 비밀번호가 일치하지 않아요.', 'error'); return;
    }

    btn.disabled = true;
    btn.textContent = '처리 중...';
    setProfilePwMsg('', '');

    try {
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPw);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPw);

        setProfilePwMsg('✅ 비밀번호가 변경되었어요!', 'success');
        ['profile-current-pw', 'profile-new-pw', 'profile-confirm-pw'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } catch (e) {
        const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
            ? '현재 비밀번호가 틀렸어요.'
            : '변경에 실패했어요. (' + e.code + ')';
        setProfilePwMsg(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '비밀번호 변경';
    }
}

// ===== 계정 탈퇴 =====
async function confirmDeleteAccount() {
    const user = auth.currentUser;
    if (!user) return;

    const isEmail = user.providerData.some(p => p.providerId === 'password');
    let confirmed = false;

    if (isEmail) {
        const pw = prompt('계정을 삭제하려면 비밀번호를 입력하세요.\n(이 작업은 되돌릴 수 없어요)');
        if (!pw) return;
        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, pw);
            await user.reauthenticateWithCredential(credential);
            confirmed = true;
        } catch (e) {
            alert('비밀번호가 틀렸어요. 다시 시도해주세요.');
            return;
        }
    } else {
        confirmed = confirm('계정을 삭제할까요? 모든 데이터가 삭제되고 되돌릴 수 없어요.');
    }

    if (!confirmed) return;

    try {
        const uid = user.uid;
        // Firestore 데이터 삭제
        if (db) {
            const petsSnap = await db.collection('users').doc(uid).collection('pets').get();
            const batch = db.batch();
            petsSnap.forEach(doc => batch.delete(doc.ref));
            batch.delete(db.collection('users').doc(uid));
            await batch.commit();
        }
        localStorage.removeItem('ddTownPets');
        await user.delete();
        closeProfileModal();
        alert('계정이 삭제되었어요. 이용해 주셔서 감사합니다.');
    } catch (e) {
        alert('계정 삭제에 실패했어요. 다시 로그인 후 시도해주세요.');
    }
}

// ===== 메시지 헬퍼 =====
function setProfileMsg(text, type) {
    const el = document.getElementById('profile-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'profile-msg' + (type ? ' profile-msg-' + type : '');
}

function setProfilePwMsg(text, type) {
    const el = document.getElementById('profile-pw-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'profile-msg' + (type ? ' profile-msg-' + type : '');
}

document.addEventListener('DOMContentLoaded', injectProfileModal);
