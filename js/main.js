let gameData = [];
let currentSelectedWeather = 'sunny';
let currentSelectedCategory = 'all';
let currentSearchQuery = '';
let checkedItems = [];
let starRatings = {};
let currentUser = null;
let syncTimer = null;

const weatherNames = { sunny: '맑음', rainbow: '무지개', rainy: '비' };

// ===== Firestore 연동 =====
async function loadChecklistFromFirestore(uid) {
    if (!db) return;
    try {
        const doc = await db.collection('users').doc(uid).get();
        const data = doc.exists ? doc.data() : {};

        checkedItems = data.encyclopediaChecked
            || JSON.parse(localStorage.getItem('ddTownChecklist')) || [];
        starRatings  = data.encyclopediaStarRatings
            || JSON.parse(localStorage.getItem('ddTownStarRatings')) || {};

        localStorage.setItem('ddTownChecklist',    JSON.stringify(checkedItems));
        localStorage.setItem('ddTownStarRatings',  JSON.stringify(starRatings));

        if (!data.encyclopediaChecked && !data.encyclopediaStarRatings) {
            if (checkedItems.length > 0 || Object.keys(starRatings).length > 0) {
                await db.collection('users').doc(uid).set(
                    { encyclopediaChecked: checkedItems, encyclopediaStarRatings: starRatings },
                    { merge: true }
                );
            }
        }
    } catch (e) {
        console.error('도감 로드 실패:', e);
        checkedItems = JSON.parse(localStorage.getItem('ddTownChecklist'))   || [];
        starRatings  = JSON.parse(localStorage.getItem('ddTownStarRatings')) || {};
    }
}

function scheduleSyncToFirestore() {
    if (!currentUser || !db) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        db.collection('users').doc(currentUser.uid).set(
            { encyclopediaChecked: checkedItems, encyclopediaStarRatings: starRatings },
            { merge: true }
        ).catch(e => console.error('도감 동기화 실패:', e));
    }, 1500);
}

// 1. JSON 데이터 불러오기
async function loadData() {
    const files = ['fish', 'insect', 'birds', 'cat_food', 'dog_food', 'season'];
    const results = await Promise.allSettled(
        files.map(f => fetch(`./assets/data/${f}.json`).then(r => r.json()))
    );

    gameData = [];
    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            gameData = gameData.concat(res.value);
        } else {
            console.warn(`${files[i]}.json 로드 실패:`, res.reason);
        }
    });

    updateDisplay();
}


// 2. 현재 시간 및 날씨 조건 체크 함수
function isAvailable(item) {
    // 펫 먹이는 시간/날씨 제한 없이 항상 표시
    if (item.type === 'cat_food' || item.type === 'dog_food') {
        return true;
    }

    const currentHour = new Date().getHours();

    // 시간 체크 (자정 포함 로직)
    let timeMatch = false;
    if (item.start_time <= item.end_time) {
        timeMatch = currentHour >= item.start_time && currentHour < item.end_time;
    } else {
        timeMatch = currentHour >= item.start_time || currentHour < item.end_time;
    }

    // 날씨 체크
    // main.js 내부의 weatherMatch 부분 수정
    const weatherMatch = item.weather.some(w =>
        w.trim().toLowerCase() === currentSelectedWeather.trim().toLowerCase()
    );
    return timeMatch && weatherMatch;
}

//체크박스 클릭 시 실행될 함수
function toggleCheck(id) {
    const index = checkedItems.indexOf(id);
    if (index === -1) {
        checkedItems.push(id); // 리스트에 추가
    } else {
        checkedItems.splice(index, 1); // 리스트에서 제거
    }
    
    localStorage.setItem('ddTownChecklist', JSON.stringify(checkedItems));
    scheduleSyncToFirestore();
    updateDisplay();
}

// ===== 별점 =====
function setStarRating(id, star) {
    const prevChecked = (starRatings[id] || 0) === 5;

    const current = starRatings[id] || 0;
    starRatings[id] = (current === star) ? 0 : star;
    if (starRatings[id] === 0) delete starRatings[id];

    const newRating  = starRatings[id] || 0;
    const newChecked = newRating === 5;

    // 5성 = 수집 완료로 자동 연동
    const idx = checkedItems.indexOf(id);
    if (newChecked && idx === -1) {
        checkedItems.push(id);
        localStorage.setItem('ddTownChecklist', JSON.stringify(checkedItems));
    } else if (!newChecked && idx !== -1) {
        checkedItems.splice(idx, 1);
        localStorage.setItem('ddTownChecklist', JSON.stringify(checkedItems));
    }

    localStorage.setItem('ddTownStarRatings', JSON.stringify(starRatings));
    scheduleSyncToFirestore();

    // 체크 상태가 바뀌었고 "완료 가리기"가 켜진 경우 전체 재렌더
    if (prevChecked !== newChecked && hideChecked) {
        updateDisplay();
        return;
    }

    // 그 외엔 해당 카드만 업데이트
    const container = document.querySelector(`.star-rating[data-id="${id}"]`);
    if (container) {
        applyStarDOM(container, newRating);
        const card = container.closest('.card');
        if (card) card.classList.toggle('checked', newChecked);
    }
}

function hoverStars(container, n) {
    container.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('hovered', i < n);
    });
}

function unhoverStars(container, _id) {
    container.querySelectorAll('.star').forEach(s => s.classList.remove('hovered'));
}

function applyStarDOM(container, rating) {
    container.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('active', i < rating);
    });
}

let hideChecked = false;
let showSeasonOnly = false;

function toggleHideChecked(isHide) {
    hideChecked = isHide;
    updateDisplay();
}

function toggleSeasonOnly(isShow) {
    showSeasonOnly = isShow;
    updateDisplay();
}

function buildCardHTML(item, dimmed) {
    const isPetFood = item.type === 'cat_food' || item.type === 'dog_food';
    const isBird    = item.type === 'bird';
    const rating    = starRatings[item.id] || 0;
    const isChecked = rating === 5;
    const seasonBadge = item.season ? `<span class="season-badge">✨ 시즌</span>` : '';
    const dimBadge    = dimmed ? `<div class="unavailable-badge">🕐 현재 미등장</div>` : '';
    const starsHTML = [1,2,3,4,5].map(n =>
        `<span class="star${rating >= n ? ' active' : ''}"
               onclick="setStarRating(${item.id}, ${n})"
               onmouseenter="hoverStars(this.parentElement, ${n})"
               onmouseleave="unhoverStars(this.parentElement, ${item.id})">★</span>`
    ).join('');
    return `
        <div class="card ${item.type} ${isChecked ? 'checked' : ''} ${item.season ? 'season-item' : ''} ${dimmed ? 'card-unavailable' : ''}">
            ${seasonBadge}${dimBadge}
            <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
            <div class="card-text">
                <h3>${item.name}</h3>
                <p class="card-location">📍 ${item.location}</p>
                <p class="card-time">${(!isPetFood && !isBird) ? `⏰ ${item.start_time}:00 ~ ${item.end_time}:00` : '&nbsp;'}</p>
            </div>
            <div class="star-rating" data-id="${item.id}">
                ${starsHTML}
            </div>
        </div>`;
}

function categoryCheck(item) {
    const isPetFood = item.type === 'cat_food' || item.type === 'dog_food';
    return (currentSelectedCategory === 'all' && !isPetFood) ||
           (item.type === currentSelectedCategory);
}

function updateDisplay() {
    const listContainer = document.getElementById('item-list');
    listContainer.innerHTML = '';

    // 1. 현재 조건에 맞는 아이템
    const availableItems = gameData.filter(item => {
        if (!isAvailable(item)) return false;
        if (!categoryCheck(item)) return false;
        if (showSeasonOnly && !item.season) return false;
        const isChecked = (starRatings[item.id] || 0) === 5;
        if (hideChecked && isChecked) return false;
        if (currentSearchQuery && !item.name.toLowerCase().includes(currentSearchQuery)) return false;
        return true;
    });

    // 2. 검색 중일 때: 이름은 맞지만 시각/날씨로 숨겨진 아이템
    let dimmedItems = [];
    if (currentSearchQuery) {
        const shownIds = new Set(availableItems.map(i => i.id));
        dimmedItems = gameData.filter(item => {
            if (shownIds.has(item.id)) return false;
            if (!item.name.toLowerCase().includes(currentSearchQuery)) return false;
            if (!categoryCheck(item)) return false;
            return true;
        });
    }

    // 3. 렌더링
    if (availableItems.length === 0 && dimmedItems.length === 0) {
        listContainer.innerHTML = `<p style="grid-column:1/-1;padding:50px;text-align:center;">현재 조건(날씨: ${weatherNames[currentSelectedWeather] || currentSelectedWeather})에 맞는 도감이 없습니다. 😢</p>`;
    } else {
        availableItems.forEach(item =>
            listContainer.insertAdjacentHTML('beforeend', buildCardHTML(item, false))
        );
        if (dimmedItems.length > 0) {
            listContainer.insertAdjacentHTML('beforeend',
                `<div class="unavailable-section-title">🕐 현재 시각·날씨에 등장하지 않아요 (${dimmedItems.length})</div>`
            );
            dimmedItems.forEach(item =>
                listContainer.insertAdjacentHTML('beforeend', buildCardHTML(item, true))
            );
        }
    }

    if (typeof updateProgress === 'function') updateProgress();
}

function updateProgress() {
    const total = gameData.length;
    const collected = checkedItems.length;
    const percent = total > 0 ? Math.round((collected / total) * 100) : 0;
    
    const progressElement = document.getElementById('collection-progress');
    if (progressElement) {
        progressElement.innerHTML = `도감 달성률: ${percent}% (${collected}/${total})`;
    }
}

function setSearch(query) {
    currentSearchQuery = query.trim().toLowerCase();
    updateDisplay();
}

function setCategory(category) {
    console.log(`선택된 카테고리: ${category}`);
    currentSelectedCategory = category;

    // 버튼 UI 업데이트
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === category);
    });

    updateDisplay();
}

// 4. 날씨 변경 이벤트
function setWeather(weather) {
    console.log(`선택된 날씨: ${weather}`);
    currentSelectedWeather = weather;

    // UI 업데이트: 버튼 활성화 상태 변경
    const buttons = document.querySelectorAll('.weather-btn');
    buttons.forEach(btn => {
        if (btn.dataset.weather === weather) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 화면 갱신: 선택된 날씨에 맞는 리스트만 다시 그리기
    updateDisplay();
}

// 초기 로딩
loadData();
setInterval(updateDisplay, 60000);

// Auth 상태 변화 → 체크리스트 동기화 + 헤더 UI 갱신
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async function(user) {
        currentUser = user;

        if (user) {
            if (typeof loadUserProfile === 'function') await loadUserProfile(user.uid);
            await loadChecklistFromFirestore(user.uid);
        } else {
            checkedItems = JSON.parse(localStorage.getItem('ddTownChecklist'))   || [];
            starRatings  = JSON.parse(localStorage.getItem('ddTownStarRatings')) || {};
        }

        refreshAuthUI(user);

        updateDisplay();
    });
}

function updateClock() {
    const now = new Date();
    
    // 시간 형식을 예쁘게 포맷팅 (예: 05:30:05)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // 화면에 출력
    const clockElement = document.getElementById('real-time-clock');
    if (clockElement) {
        clockElement.innerText = `현재 시각: ${timeString}`;
    }

    // 정각(0분 0초)이 될 때마다 도감 리스트를 자동으로 새로고침
    if (minutes === '00' && seconds === '00') {
        updateDisplay();
    }
}

// 1초마다 시계 갱신
setInterval(updateClock, 1000);

// 페이지 로드 시 즉시 실행
updateClock();