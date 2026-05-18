let gameData = [];
let currentSelectedWeather = 'sunny';
let currentSelectedCategory = 'all';
let checkedItems = [];
let currentUser = null;
let syncTimer = null;

// ===== Firestore 연동 =====
async function loadChecklistFromFirestore(uid) {
    if (!db) return;
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists && doc.data().encyclopediaChecked) {
            checkedItems = doc.data().encyclopediaChecked;
            localStorage.setItem('ddTownChecklist', JSON.stringify(checkedItems));
        } else {
            const local = JSON.parse(localStorage.getItem('ddTownChecklist')) || [];
            if (local.length > 0) {
                checkedItems = local;
                await db.collection('users').doc(uid).set({ encyclopediaChecked: checkedItems }, { merge: true });
            } else {
                checkedItems = [];
            }
        }
    } catch (e) {
        console.error('도감 체크리스트 로드 실패:', e);
        checkedItems = JSON.parse(localStorage.getItem('ddTownChecklist')) || [];
    }
}

function scheduleSyncToFirestore() {
    if (!currentUser || !db) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        db.collection('users').doc(currentUser.uid).set(
            { encyclopediaChecked: checkedItems },
            { merge: true }
        ).catch(e => console.error('도감 동기화 실패:', e));
    }, 1500);
}

// 1. JSON 데이터 불러오기 부분 수정
async function loadData() {
    try {
        const response = await fetch('./assets/data/encyclopedia.json');
        gameData = await response.json();
        console.log("불러온 데이터:", gameData); // 데이터가 잘 들어왔는지 확인
        updateDisplay(); 
    } catch (error) {
        console.error("데이터 로드 실패:", error);
    }
}


// 2. 현재 시간 및 날씨 조건 체크 함수
function isAvailable(item) {
    // 펫 먹이는 시간/날씨 제한 없이 항상 표시
    if (item.type === 'cat_food' || item.type === 'dog_food') {
        return true;
    }

    const currentHour = new Date().getHours();
    console.log(`현재 시각: ${currentHour}시, 아이템: ${item.name}`); // 필터링 과정 확인

    // 시간 체크 (자정 포함 로직)
    let timeMatch = false;
    if (item.start_time <= item.end_time) {
        timeMatch = currentHour >= item.start_time && currentHour < item.end_time;
    } else {
        timeMatch = currentHour >= item.start_time || currentHour < item.end_time;
    }

    // 날씨 체크
    // main.js 내부의 weatherMatch 부분 수정
    const weatherMatch = item.weather.some(w => {
    // 1. 각 날씨 문자열의 앞뒤 공백을 완벽히 제거 (trim)
    // 2. 소문자로 통일해서 비교 (toLowerCase)
        return w.trim().toLowerCase() === currentSelectedWeather.trim().toLowerCase();
    });
    if (item.name === "줄무늬송사리" || item.name === "왕새우") {
        console.log(`[디버깅] 이름: ${item.name} | 결과: ${weatherMatch}`);
    }
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

let hideChecked = false;

function toggleHideChecked(isHide){
    hideChecked = isHide;
    updateDisplay();
}

function updateDisplay() {
    const listContainer = document.getElementById('item-list');
    listContainer.innerHTML = ''; 

    // 1. 필터링 로직
    const availableItems = gameData.filter(item => {
        // [핵심] 날씨와 시간 체크는 우리가 만든 'isAvailable' 함수에 맡깁니다.
        // 이제 여기서 some, trim, toLowerCase 로직이 실행되어 공백 문제를 해결합니다.
        const isTimeAndWeatherOk = isAvailable(item);
        
        // 카테고리 체크 (물고기/곤충/전체/펫 먹이)
        // 전체 보기에서는 펫 먹이 제외 (물고기·곤충 도감과 분리)
        const isPetFood = item.type === 'cat_food' || item.type === 'dog_food';
        const categoryMatch = (currentSelectedCategory === 'all' && !isPetFood) ||
                              (item.type === currentSelectedCategory);
        
        // 수집 완료 가리기 체크
        const isChecked = checkedItems.includes(item.id);
        const hideMatch = hideChecked ? !isChecked : true;

        return isTimeAndWeatherOk && categoryMatch && hideMatch;
    });

    // 2. 결과 출력 로직 (하나의 루프로 통합)
    if (availableItems.length === 0) {
        listContainer.innerHTML = `<p style="grid-column: 1/-1; padding: 50px;">현재 조건(날씨: ${currentSelectedWeather})에 맞는 도감이 없습니다. 😢</p>`;
    } else {
        availableItems.forEach(item => {
            const isChecked = checkedItems.includes(item.id);
            const isPetFood = item.type === 'cat_food' || item.type === 'dog_food';
            const card = `
                <div class="card ${item.type} ${isChecked ? 'checked' : ''}" onclick="toggleCheck(${item.id})">
                    <div class="checklist-marker">${isChecked ? '✅' : '⬜'}</div>
                    <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
                    <h3>${item.name}</h3>
                    <p>📍 ${item.location}</p>
                    ${!isPetFood ? `<p>⏰ ${item.start_time}:00 ~ ${item.end_time}:00</p>` : ''}
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', card);
        });
    }

    // 3. 달성률 업데이트 (함수가 있다면 실행)
    if (typeof updateProgress === 'function') {
        updateProgress();
    }
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
        const el = document.getElementById('auth-status');

        if (user) {
            if (typeof loadUserProfile === 'function') await loadUserProfile(user.uid);
            await loadChecklistFromFirestore(user.uid);

            if (el) {
                const photo = (window.userProfile && window.userProfile.photoBase64) || user.photoURL || null;
                const name  = (window.userProfile && window.userProfile.displayName) || user.displayName || user.email;
                const photoHTML = photo
                    ? `<img src="${photo}" class="auth-avatar auth-avatar-clickable" alt="프로필" onclick="openProfileModal()">`
                    : `<span class="auth-avatar-placeholder auth-avatar-clickable" onclick="openProfileModal()">👤</span>`;
                el.innerHTML = `<div class="auth-user-info">${photoHTML}<span class="auth-username auth-avatar-clickable" onclick="openProfileModal()">${name}</span><button class="auth-btn auth-logout" onclick="signOutUser()">로그아웃</button></div>`;
            }
        } else {
            checkedItems = JSON.parse(localStorage.getItem('ddTownChecklist')) || [];
            if (el) {
                el.innerHTML = `<button class="auth-btn auth-login" onclick="openAuthModal()">🔐 로그인 / 회원가입</button>`;
            }
        }

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
        clockElement.innerText = `현재 서버 시각: ${timeString}`;
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