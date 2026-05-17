const MAX_FAVORITES = 3;
const PHOTO_SIZE = 200;

let foodData = {};
let pets = [];
let selectedPetId = null;
let newPetType = 'cat';
let currentStatusFilter = 'all';
let currentUser = null;
let authInitialized = false;

// 사진 업로드 관련
let uploadingPetId = null;
let modalTempPhoto = null;
let petModalMode = 'add';
let editingPetId = null;

// 라이트박스 관련
let lightboxPetId = null;

// Firestore 디바운스 타이머
let syncTimer = null;

// ===== Firebase Auth =====
function updateAuthUI(user) {
    const el = document.getElementById('auth-status');
    if (!el) return;
    if (user) {
        const photoHTML = user.photoURL
            ? `<img src="${user.photoURL}" class="auth-avatar" alt="프로필">`
            : `<span class="auth-avatar-placeholder">👤</span>`;
        el.innerHTML = `
            <div class="auth-user-info">
                ${photoHTML}
                <span class="auth-username">${user.displayName || user.email}</span>
                <button class="auth-btn auth-logout" onclick="signOutUser()">로그아웃</button>
            </div>`;
    } else {
        el.innerHTML = `<button class="auth-btn auth-login" onclick="signInWithGoogle()">🔐 구글로 로그인</button>`;
    }
}

// ===== Firestore 동기화 =====
async function syncAllPetsToFirestore() {
    if (!currentUser) return;
    try {
        const col = db.collection('users').doc(currentUser.uid).collection('pets');
        const batch = db.batch();
        pets.forEach(pet => batch.set(col.doc(String(pet.id)), pet));
        await batch.commit();
    } catch (e) {
        console.error('Firestore 동기화 실패:', e);
    }
}

function scheduleSyncToFirestore() {
    if (!currentUser) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncAllPetsToFirestore().catch(e => console.error('동기화 실패:', e));
    }, 1500);
}

async function loadPetsFromFirestore(uid) {
    const col = db.collection('users').doc(uid).collection('pets');
    const snapshot = await col.get();

    if (!snapshot.empty) {
        pets = snapshot.docs.map(doc => doc.data());
    } else if (pets.length > 0) {
        // Firestore가 비어있고 로컬 데이터가 있으면 업로드
        await syncAllPetsToFirestore();
        showToast('💾 로컬 데이터를 클라우드에 저장했어요!');
    }

    // 구버전 데이터 마이그레이션
    pets = pets.map(pet => {
        if (!pet.foodStatus) {
            pet.foodStatus = {};
            (pet.checkedFoods || []).forEach(id => { pet.foodStatus[id] = 'full'; });
            delete pet.checkedFoods;
        }
        return pet;
    });

    localStorage.setItem('ddTownPets', JSON.stringify(pets));
}

// ===== 데이터 저장 =====
function savePets() {
    localStorage.setItem('ddTownPets', JSON.stringify(pets));
    scheduleSyncToFirestore();
}

// ===== 토스트 =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ===== 이미지 리사이즈 공통 유틸 =====
function resizeImageToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            const canvas = document.createElement('canvas');
            canvas.width = PHOTO_SIZE;
            canvas.height = PHOTO_SIZE;
            canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
            callback(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== 카드/상세 직접 사진 업로드 =====
function triggerPhotoUpload(petId) {
    uploadingPetId = petId;
    const input = document.getElementById('photo-upload-input');
    input.value = '';
    input.click();
}

function triggerDetailPhotoUpload() {
    triggerPhotoUpload(selectedPetId);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    resizeImageToBase64(file, base64 => {
        const pet = pets.find(p => p.id === uploadingPetId);
        if (!pet) return;
        pet.photo = base64;
        savePets();
        if (document.getElementById('view-list').style.display !== 'none') {
            renderPetList();
        } else {
            renderDetailPhoto(pet);
        }
    });
}

function removePhoto(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    delete pet.photo;
    savePets();
    if (document.getElementById('view-list').style.display !== 'none') {
        renderPetList();
    } else {
        renderDetailPhoto(pet);
    }
}

// ===== 라이트박스 =====
function openPhotoLightbox(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet || !pet.photo) return;
    lightboxPetId = petId;
    document.getElementById('lightbox-img').src = pet.photo;
    document.getElementById('photo-lightbox').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('photo-lightbox').style.display = 'none';
    lightboxPetId = null;
}

function lightboxChangePhoto() {
    closeLightbox();
    triggerPhotoUpload(lightboxPetId || selectedPetId);
}

function lightboxDeletePhoto() {
    const id = lightboxPetId;
    closeLightbox();
    removePhoto(id);
}

// ===== 모달 사진 업로드 =====
function triggerModalPhotoUpload() {
    const input = document.getElementById('modal-photo-upload-input');
    input.value = '';
    input.click();
}

function handleModalPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    resizeImageToBase64(file, base64 => {
        modalTempPhoto = base64;
        renderModalPhoto();
    });
}

function removeModalPhoto() {
    modalTempPhoto = null;
    renderModalPhoto();
}

function renderModalPhoto() {
    const preview = document.getElementById('modal-photo-preview');
    const removeBtn = document.getElementById('modal-photo-remove-btn');

    if (modalTempPhoto) {
        preview.innerHTML = `<img src="${modalTempPhoto}" class="pet-photo" alt="사진">`;
        removeBtn.style.display = 'flex';
    } else {
        let icon;
        if (petModalMode === 'edit') {
            const pet = pets.find(p => p.id === editingPetId);
            icon = pet?.type === 'cat' ? '🐱' : '🐶';
        } else {
            icon = newPetType === 'cat' ? '🐱' : '🐶';
        }
        preview.innerHTML = `<span class="pet-emoji-default">${icon}</span>`;
        removeBtn.style.display = 'none';
    }
}

// ===== 통합 펫 모달 =====
function openModal(type) {
    petModalMode = 'add';
    newPetType = type;
    modalTempPhoto = null;
    editingPetId = null;
    selectPetType(type);
    document.getElementById('pet-name-input').value = '';
    document.getElementById('modal-title').textContent = '새 펫 추가';
    document.getElementById('modal-confirm-btn').textContent = '추가하기';
    document.getElementById('modal-type-row').style.display = 'flex';
    renderModalPhoto();
    document.getElementById('pet-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('pet-name-input').focus(), 60);
}

function openEditModal(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    petModalMode = 'edit';
    editingPetId = petId;
    modalTempPhoto = pet.photo || null;
    document.getElementById('pet-name-input').value = pet.name;
    document.getElementById('modal-title').textContent = '펫 설정';
    document.getElementById('modal-confirm-btn').textContent = '저장';
    document.getElementById('modal-type-row').style.display = 'none';
    renderModalPhoto();
    document.getElementById('pet-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('pet-name-input').focus(), 60);
}

function closeModal() {
    document.getElementById('pet-modal').style.display = 'none';
    modalTempPhoto = null;
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('pet-modal')) closeModal();
}

function selectPetType(type) {
    newPetType = type;
    document.getElementById('type-btn-cat').classList.toggle('active', type === 'cat');
    document.getElementById('type-btn-dog').classList.toggle('active', type === 'dog');
    if (!modalTempPhoto) renderModalPhoto();
}

function confirmModal() {
    const name = document.getElementById('pet-name-input').value.trim();
    if (!name) { document.getElementById('pet-name-input').focus(); return; }

    if (petModalMode === 'add') {
        const newPet = { id: Date.now(), name, type: newPetType, foodStatus: {} };
        if (modalTempPhoto) newPet.photo = modalTempPhoto;
        pets.push(newPet);
    } else {
        const pet = pets.find(p => p.id === editingPetId);
        if (!pet) return;
        pet.name = name;
        if (modalTempPhoto) {
            pet.photo = modalTempPhoto;
        } else {
            delete pet.photo;
        }
        if (document.getElementById('view-detail').style.display !== 'none' && selectedPetId === editingPetId) {
            document.getElementById('detail-pet-name').textContent = pet.name;
            renderDetailPhoto(pet);
        }
    }

    savePets();
    closeModal();
    renderPetList();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('pet-modal').style.display !== 'none') confirmModal();
    if (e.key === 'Escape') {
        closeModal();
        closeLightbox();
    }
});

// ===== 펫 삭제 =====
function deletePet(id) {
    if (!confirm('이 펫을 삭제할까요? 체크 기록도 함께 사라져요.')) return;
    pets = pets.filter(p => p.id !== id);
    localStorage.setItem('ddTownPets', JSON.stringify(pets));
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).collection('pets').doc(String(id)).delete()
            .catch(e => console.error('Firestore 삭제 실패:', e));
    }
    renderPetList();
}

// ===== 뷰 전환 =====
function showListView() {
    currentStatusFilter = 'all';
    document.getElementById('view-list').style.display = 'block';
    document.getElementById('view-detail').style.display = 'none';
    renderPetList();
}

function showDetailView(petId) {
    selectedPetId = petId;
    currentStatusFilter = 'all';
    document.getElementById('view-list').style.display = 'none';
    document.getElementById('view-detail').style.display = 'block';
    updateStatusFilterUI();
    renderFoodList();
}

// ===== 펫 목록 렌더링 =====
function renderPetList() {
    const container = document.getElementById('pet-list-grid');

    if (pets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🐾</div>
                <p>아직 등록된 펫이 없어요</p>
                <p>위 버튼으로 펫을 추가해보세요!</p>
            </div>`;
        return;
    }

    container.innerHTML = pets.map(pet => {
        const foods = foodData[pet.type] || [];
        const fs = pet.foodStatus || {};
        const counts = { favorite: 0, dislike: 0, full: 0, none: 0 };
        foods.forEach(f => { counts[fs[f.id] || 'none']++; });
        const icon = pet.type === 'cat' ? '🐱' : '🐶';

        const photoInner = pet.photo
            ? `<img src="${pet.photo}" class="pet-photo" alt="${pet.name}">`
            : `<span class="pet-emoji-default">${icon}</span>`;

        const photoOnclick = pet.photo
            ? `event.stopPropagation(); openPhotoLightbox(${pet.id})`
            : `event.stopPropagation(); triggerPhotoUpload(${pet.id})`;

        const photoHint = pet.photo ? '' : `<div class="photo-edit-overlay">📷</div>`;

        return `
            <div class="pet-card" onclick="showDetailView(${pet.id})">
                <button class="settings-btn" onclick="event.stopPropagation(); openEditModal(${pet.id})" title="설정">⚙️</button>
                <button class="pet-delete-btn" onclick="event.stopPropagation(); deletePet(${pet.id})">✕</button>
                <div class="pet-photo-area" onclick="${photoOnclick}">
                    ${photoInner}
                    ${photoHint}
                </div>
                <h3>${pet.name}</h3>
                <div class="pet-status-summary">
                    <span class="ps-chip ps-favorite">❤️ ${counts.favorite}/3</span>
                    <span class="ps-chip ps-dislike">👎 ${counts.dislike}</span>
                    <span class="ps-chip ps-full">🍽️ ${counts.full}</span>
                </div>
            </div>`;
    }).join('');
}

// ===== 상세 뷰 사진 영역 갱신 =====
function renderDetailPhoto(pet) {
    const area = document.getElementById('detail-photo-area');
    const icon = pet.type === 'cat' ? '🐱' : '🐶';

    if (pet.photo) {
        area.innerHTML = `
            <img src="${pet.photo}" class="pet-photo" alt="${pet.name}">
            <div class="photo-edit-overlay" style="font-size:1rem;">🔍</div>`;
        area.onclick = () => openPhotoLightbox(pet.id);
    } else {
        area.innerHTML = `
            <span class="pet-emoji-default">${icon}</span>
            <div class="photo-edit-overlay">📷</div>`;
        area.onclick = triggerDetailPhotoUpload;
    }
}

// ===== 음식 상태 변경 =====
function setFoodStatus(foodId, newStatus) {
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;
    if (!pet.foodStatus) pet.foodStatus = {};

    const current = pet.foodStatus[foodId] || 'none';
    if (current === newStatus) {
        delete pet.foodStatus[foodId];
        savePets(); renderFoodList(); return;
    }

    if (newStatus === 'favorite') {
        const favCount = Object.values(pet.foodStatus).filter(s => s === 'favorite').length;
        if (favCount >= MAX_FAVORITES) {
            showToast('❤️ 좋아하는 음식은 최대 3개까지만 설정할 수 있어요!');
            return;
        }
    }

    pet.foodStatus[foodId] = newStatus;
    savePets();
    renderFoodList();
}

// ===== 상태 필터 =====
function setStatusFilter(status) {
    currentStatusFilter = status;
    updateStatusFilterUI();
    renderFoodList();
}

function updateStatusFilterUI() {
    document.querySelectorAll('.sfil-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === currentStatusFilter);
    });
}

// ===== 음식 목록 렌더링 =====
function renderFoodList() {
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;
    if (!pet.foodStatus) pet.foodStatus = {};

    document.getElementById('detail-pet-name').textContent = pet.name;
    renderDetailPhoto(pet);

    const foods = foodData[pet.type] || [];
    const fs = pet.foodStatus;
    const counts = { favorite: 0, dislike: 0, full: 0, none: 0 };
    foods.forEach(f => { counts[fs[f.id] || 'none']++; });

    document.getElementById('detail-summary').innerHTML =
        `❤️ ${counts.favorite}/3 &nbsp;·&nbsp; 👎 싫어함 ${counts.dislike} &nbsp;·&nbsp; 🍽️ 배불림 ${counts.full} &nbsp;·&nbsp; ⬜ 보통 ${counts.none}`;

    const filtered = currentStatusFilter === 'all'
        ? foods
        : foods.filter(f => (fs[f.id] || 'none') === currentStatusFilter);

    const container = document.getElementById('detail-food-list');

    if (filtered.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1;padding:50px;text-align:center;color:#ccc;font-family:'Gamja Flower',cursive;font-size:1.1rem;">해당하는 음식이 없어요 😅</p>`;
        return;
    }

    const statusLabel = { favorite: '❤️ 좋아함', dislike: '👎 싫어함', full: '🍽️ 배불림', none: '' };

    container.innerHTML = filtered.map(food => {
        const status = fs[food.id] || 'none';
        const label = statusLabel[status];
        return `
            <div class="card food-card status-${status}">
                ${label ? `<div class="food-status-badge badge-${status}">${label}</div>` : ''}
                <img src="${food.image}" alt="${food.name}" onerror="this.style.display='none'">
                <h3>${food.name}</h3>
                <div class="food-status-btns">
                    <button class="status-btn btn-favorite ${status === 'favorite' ? 'active' : ''}"
                        onclick="setFoodStatus(${food.id}, 'favorite')" title="좋아하는 음식 (최대 3개)">❤️</button>
                    <button class="status-btn btn-dislike ${status === 'dislike' ? 'active' : ''}"
                        onclick="setFoodStatus(${food.id}, 'dislike')" title="싫어하는 음식">👎</button>
                    <button class="status-btn btn-full ${status === 'full' ? 'active' : ''}"
                        onclick="setFoodStatus(${food.id}, 'full')" title="배불리 먹은 음식">🍽️</button>
                </div>
            </div>`;
    }).join('');
}

// ===== 데이터 로드 =====
async function loadData() {
    try {
        const response = await fetch('./assets/data/encyclopedia.json');
        const allData = await response.json();
        foodData.cat = allData.filter(i => i.type === 'cat_food');
        foodData.dog = allData.filter(i => i.type === 'dog_food');

        // 로컬 데이터 먼저 로드해서 즉시 렌더
        pets = JSON.parse(localStorage.getItem('ddTownPets')) || [];
        pets = pets.map(pet => {
            if (!pet.foodStatus) {
                pet.foodStatus = {};
                (pet.checkedFoods || []).forEach(id => { pet.foodStatus[id] = 'full'; });
                delete pet.checkedFoods;
            }
            return pet;
        });
        showListView();

        // Auth 상태 감지 - 변경 시 자동으로 데이터 동기화
        auth.onAuthStateChanged(async (user) => {
            const prevUser = currentUser;
            currentUser = user;
            updateAuthUI(user);

            if (user) {
                try {
                    await loadPetsFromFirestore(user.uid);
                    if (authInitialized) {
                        showToast(`✅ ${user.displayName || ''}님의 데이터를 불러왔어요!`);
                    }
                } catch (e) {
                    console.error('Firestore 로드 실패:', e);
                    showToast('⚠️ 클라우드 로드 실패. 로컬 데이터를 사용해요.');
                }
            } else {
                pets = JSON.parse(localStorage.getItem('ddTownPets')) || [];
                if (prevUser) showToast('👋 로그아웃했어요.');
            }

            authInitialized = true;
            showListView();
        });
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        pets = JSON.parse(localStorage.getItem('ddTownPets')) || [];
        showListView();
    }
}

loadData();
