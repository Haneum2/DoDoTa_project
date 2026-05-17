const MAX_FAVORITES = 3;
const PHOTO_SIZE = 200; // 저장 전 리사이즈 최대 px

let foodData = {};
let pets = JSON.parse(localStorage.getItem('ddTownPets')) || [];
let selectedPetId = null;
let newPetType = 'cat';
let currentStatusFilter = 'all';
let uploadingPetId = null;

// ===== 데이터 로드 =====
async function loadData() {
    try {
        const response = await fetch('./assets/data/encyclopedia.json');
        const allData = await response.json();
        foodData.cat = allData.filter(i => i.type === 'cat_food');
        foodData.dog = allData.filter(i => i.type === 'dog_food');
        pets = pets.map(pet => {
            if (!pet.foodStatus) {
                pet.foodStatus = {};
                (pet.checkedFoods || []).forEach(id => { pet.foodStatus[id] = 'full'; });
                delete pet.checkedFoods;
            }
            return pet;
        });
        savePets();
        showListView();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

function savePets() {
    localStorage.setItem('ddTownPets', JSON.stringify(pets));
}

// ===== 토스트 =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ===== 사진 업로드 =====
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

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // canvas로 정사각형 크롭 + 리사이즈
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;

            const canvas = document.createElement('canvas');
            canvas.width = PHOTO_SIZE;
            canvas.height = PHOTO_SIZE;
            canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, PHOTO_SIZE, PHOTO_SIZE);

            const base64 = canvas.toDataURL('image/jpeg', 0.82);
            const pet = pets.find(p => p.id === uploadingPetId);
            if (!pet) return;

            pet.photo = base64;
            savePets();

            // 목록 뷰 또는 상세 뷰 갱신
            if (document.getElementById('view-list').style.display !== 'none') {
                renderPetList();
            } else {
                renderDetailPhoto(pet);
                renderPetList(); // 목록 캐시도 갱신
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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

// ===== 모달 =====
function openModal(type) {
    newPetType = type;
    selectPetType(type);
    document.getElementById('pet-name-input').value = '';
    document.getElementById('add-pet-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('pet-name-input').focus(), 60);
}

function closeModal() {
    document.getElementById('add-pet-modal').style.display = 'none';
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('add-pet-modal')) closeModal();
}

function selectPetType(type) {
    newPetType = type;
    document.getElementById('type-btn-cat').classList.toggle('active', type === 'cat');
    document.getElementById('type-btn-dog').classList.toggle('active', type === 'dog');
}

function confirmAddPet() {
    const name = document.getElementById('pet-name-input').value.trim();
    if (!name) { document.getElementById('pet-name-input').focus(); return; }
    pets.push({ id: Date.now(), name, type: newPetType, foodStatus: {} });
    savePets();
    closeModal();
    renderPetList();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('add-pet-modal').style.display !== 'none') confirmAddPet();
    if (e.key === 'Escape') closeModal();
});

// ===== 펫 삭제 =====
function deletePet(id) {
    if (!confirm('이 펫을 삭제할까요? 체크 기록도 함께 사라져요.')) return;
    pets = pets.filter(p => p.id !== id);
    savePets();
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

        // 사진 있으면 img, 없으면 이모지
        const photoInner = pet.photo
            ? `<img src="${pet.photo}" class="pet-photo" alt="${pet.name}">`
            : `<span class="pet-emoji-default">${icon}</span>`;

        // 사진 있을 때만 삭제 버튼 표시
        const removeBtn = pet.photo
            ? `<button class="photo-remove-btn" onclick="event.stopPropagation(); removePhoto(${pet.id})" title="사진 삭제">✕</button>`
            : '';

        return `
            <div class="pet-card" onclick="showDetailView(${pet.id})">
                <button class="pet-delete-btn" onclick="event.stopPropagation(); deletePet(${pet.id})">✕</button>
                <div class="pet-photo-area" onclick="event.stopPropagation(); triggerPhotoUpload(${pet.id})">
                    ${photoInner}
                    <div class="photo-edit-overlay">📷</div>
                    ${removeBtn}
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

// ===== 상세 뷰 - 사진 영역 갱신 =====
function renderDetailPhoto(pet) {
    const area = document.getElementById('detail-photo-area');
    const icon = pet.type === 'cat' ? '🐱' : '🐶';

    const photoInner = pet.photo
        ? `<img src="${pet.photo}" class="pet-photo" alt="${pet.name}">`
        : `<span class="pet-emoji-default">${icon}</span>`;

    const removeBtn = pet.photo
        ? `<button class="photo-remove-btn" onclick="event.stopPropagation(); removePhoto(${pet.id})" title="사진 삭제">✕</button>`
        : '';

    // overlay는 유지하면서 내용만 교체
    area.innerHTML = `${photoInner}<div class="photo-edit-overlay">📷</div>${removeBtn}`;
}

// ===== 음식 상태 변경 =====
function setFoodStatus(foodId, newStatus) {
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;
    if (!pet.foodStatus) pet.foodStatus = {};

    const current = pet.foodStatus[foodId] || 'none';
    if (current === newStatus) {
        delete pet.foodStatus[foodId];
        savePets();
        renderFoodList();
        return;
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

    // 헤더 갱신
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
        container.innerHTML = `<p style="grid-column:1/-1; padding:50px; text-align:center; color:#ccc; font-family:'Gamja Flower',cursive; font-size:1.1rem;">해당하는 음식이 없어요 😅</p>`;
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

loadData();
