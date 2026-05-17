const MAX_FAVORITES = 3;

let foodData = {}; // { cat: [...], dog: [...] }
let pets = JSON.parse(localStorage.getItem('ddTownPets')) || [];
let selectedPetId = null;
let newPetType = 'cat';
let currentStatusFilter = 'all';

// ===== 데이터 로드 =====
async function loadData() {
    try {
        const response = await fetch('./assets/data/encyclopedia.json');
        const allData = await response.json();
        foodData.cat = allData.filter(i => i.type === 'cat_food');
        foodData.dog = allData.filter(i => i.type === 'dog_food');
        // 구버전 데이터 마이그레이션
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

// ===== 토스트 알림 =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
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

        return `
            <div class="pet-card" onclick="showDetailView(${pet.id})">
                <button class="pet-delete-btn" onclick="event.stopPropagation(); deletePet(${pet.id})">✕</button>
                <span class="pet-icon-large">${icon}</span>
                <h3>${pet.name}</h3>
                <div class="pet-status-summary">
                    <span class="ps-chip ps-favorite">❤️ ${counts.favorite}/3</span>
                    <span class="ps-chip ps-dislike">👎 ${counts.dislike}</span>
                    <span class="ps-chip ps-full">🍽️ ${counts.full}</span>
                </div>
            </div>`;
    }).join('');
}

// ===== 음식 상태 변경 =====
function setFoodStatus(foodId, newStatus) {
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;
    if (!pet.foodStatus) pet.foodStatus = {};

    const current = pet.foodStatus[foodId] || 'none';

    // 같은 버튼 클릭 시 → 보통으로 리셋
    if (current === newStatus) {
        delete pet.foodStatus[foodId];
        savePets();
        renderFoodList();
        return;
    }

    // 좋아함 최대 3개 제한
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

    const icon = pet.type === 'cat' ? '🐱' : '🐶';
    document.getElementById('detail-pet-name').textContent = `${icon} ${pet.name}`;

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
