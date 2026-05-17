let foodData = {}; // { cat: [...], dog: [...] }
let pets = JSON.parse(localStorage.getItem('ddTownPets')) || [];
let selectedPetId = null;
let newPetType = 'cat';
let hideChecked = false;

// ===== 데이터 로드 =====
async function loadData() {
    try {
        const response = await fetch('./assets/data/encyclopedia.json');
        const allData = await response.json();
        foodData.cat = allData.filter(i => i.type === 'cat_food');
        foodData.dog = allData.filter(i => i.type === 'dog_food');
        showListView();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

function savePets() {
    localStorage.setItem('ddTownPets', JSON.stringify(pets));
}

// ===== 모달 =====
function openModal(type) {
    newPetType = type;
    selectPetType(type);
    document.getElementById('pet-name-input').value = '';
    document.getElementById('add-pet-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('pet-name-input').focus(), 50);
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
    if (!name) {
        document.getElementById('pet-name-input').focus();
        return;
    }
    pets.push({ id: Date.now(), name, type: newPetType, checkedFoods: [] });
    savePets();
    closeModal();
    renderPetList();
}

// Enter 키로 모달 제출
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('add-pet-modal').style.display !== 'none') {
        confirmAddPet();
    }
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
    document.getElementById('view-list').style.display = 'block';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('hide-checked-checkbox').checked = false;
    hideChecked = false;
    renderPetList();
}

function showDetailView(petId) {
    selectedPetId = petId;
    document.getElementById('view-list').style.display = 'none';
    document.getElementById('view-detail').style.display = 'block';
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
        const total = foods.length;
        const collected = pet.checkedFoods.length;
        const percent = total > 0 ? Math.round((collected / total) * 100) : 0;
        const icon = pet.type === 'cat' ? '🐱' : '🐶';

        return `
            <div class="pet-card" onclick="showDetailView(${pet.id})">
                <button class="pet-delete-btn" onclick="event.stopPropagation(); deletePet(${pet.id})">✕</button>
                <span class="pet-icon-large">${icon}</span>
                <h3>${pet.name}</h3>
                <p class="pet-count">${collected} / ${total} 완료</p>
                <div class="pet-progress-bar">
                    <div class="pet-progress-fill ${pet.type}" style="width:${percent}%"></div>
                </div>
            </div>`;
    }).join('');
}

// ===== 먹이 체크 토글 =====
function toggleFood(foodId) {
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;
    const idx = pet.checkedFoods.indexOf(foodId);
    if (idx === -1) {
        pet.checkedFoods.push(foodId);
    } else {
        pet.checkedFoods.splice(idx, 1);
    }
    savePets();
    renderFoodList();
}

function toggleHideChecked(isHide) {
    hideChecked = isHide;
    renderFoodList();
}

// ===== 먹이 목록 렌더링 =====
function renderFoodList() {
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;

    const icon = pet.type === 'cat' ? '🐱' : '🐶';
    document.getElementById('detail-pet-name').textContent = `${icon} ${pet.name}`;

    const foods = foodData[pet.type] || [];
    const total = foods.length;
    const collected = pet.checkedFoods.length;
    const percent = total > 0 ? Math.round((collected / total) * 100) : 0;
    document.getElementById('detail-progress').textContent =
        `${collected} / ${total} 완료 (${percent}%)`;

    const filtered = hideChecked
        ? foods.filter(f => !pet.checkedFoods.includes(f.id))
        : foods;

    const container = document.getElementById('detail-food-list');
    if (filtered.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1; padding:50px; text-align:center; color:#ccc;">모두 수집 완료! 🎉</p>`;
        return;
    }

    container.innerHTML = filtered.map(food => {
        const isChecked = pet.checkedFoods.includes(food.id);
        return `
            <div class="card ${pet.type}_food ${isChecked ? 'checked' : ''}" onclick="toggleFood(${food.id})">
                <div class="checklist-marker">${isChecked ? '✅' : '⬜'}</div>
                <img src="${food.image}" alt="${food.name}" onerror="this.style.display='none'">
                <h3>${food.name}</h3>
                <p>📍 ${food.location}</p>
            </div>`;
    }).join('');
}

loadData();
