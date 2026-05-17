let petData = [];
let currentPetCategory = 'all';
let checkedItems = JSON.parse(localStorage.getItem('ddTownChecklist')) || [];
let hideChecked = false;

async function loadData() {
    try {
        const response = await fetch('./assets/data/encyclopedia.json');
        const allData = await response.json();
        petData = allData.filter(item => item.type === 'cat_food' || item.type === 'dog_food');
        updateDisplay();
    } catch (error) {
        console.error("데이터 로드 실패:", error);
    }
}

function toggleCheck(id) {
    const index = checkedItems.indexOf(id);
    if (index === -1) {
        checkedItems.push(id);
    } else {
        checkedItems.splice(index, 1);
    }
    localStorage.setItem('ddTownChecklist', JSON.stringify(checkedItems));
    updateDisplay();
}

function toggleHideChecked(isHide) {
    hideChecked = isHide;
    updateDisplay();
}

function setPetCategory(category) {
    currentPetCategory = category;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === category);
    });
    updateDisplay();
}

function updateDisplay() {
    const listContainer = document.getElementById('item-list');
    listContainer.innerHTML = '';

    const filtered = petData.filter(item => {
        const categoryMatch = currentPetCategory === 'all' || item.type === currentPetCategory;
        const isChecked = checkedItems.includes(item.id);
        const hideMatch = hideChecked ? !isChecked : true;
        return categoryMatch && hideMatch;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="grid-column: 1/-1; padding: 50px;">항목이 없습니다. 😢</p>`;
    } else {
        filtered.forEach(item => {
            const isChecked = checkedItems.includes(item.id);
            const card = `
                <div class="card ${item.type} ${isChecked ? 'checked' : ''}" onclick="toggleCheck(${item.id})">
                    <div class="checklist-marker">${isChecked ? '✅' : '⬜'}</div>
                    <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
                    <h3>${item.name}</h3>
                    <p>📍 ${item.location}</p>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', card);
        });
    }

    updateProgress();
}

function updateProgress() {
    const catTotal = petData.filter(i => i.type === 'cat_food').length;
    const dogTotal = petData.filter(i => i.type === 'dog_food').length;
    const catCollected = petData.filter(i => i.type === 'cat_food' && checkedItems.includes(i.id)).length;
    const dogCollected = petData.filter(i => i.type === 'dog_food' && checkedItems.includes(i.id)).length;

    const el = document.getElementById('pet-progress');
    if (el) {
        el.innerHTML = `🐱 고양이 ${catCollected}/${catTotal} &nbsp;|&nbsp; 🐶 강아지 ${dogCollected}/${dogTotal}`;
    }
}

loadData();
