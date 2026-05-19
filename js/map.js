// ===== 지도 위치 데이터 =====
// x, y: 지도 이미지 기준 % 좌표 (첨부 지도 이미지 텍스트 위치 기반)
const MAP_LOCATIONS = [
    // ── 바다 ──
    { id: 'old_sea',     name: '구해',              x: 49,  y:  8,  type: 'sea',    match: ['구해', '구해 - 해변'] },
    { id: 'whale_sea',   name: '고래바다',           x: 14,  y: 52,  type: 'sea',    match: ['고래 바다', '고래바다', '고래바다 해변', '구해, 고래바다'] },
    { id: 'east_sea',    name: '동해',               x: 88,  y: 49,  type: 'sea',    match: ['동해', '동해 - 해변', '동해, 잔잔한 바다', '바다 - 동해'] },
    { id: 'calm_sea',    name: '잔잔한 바다',        x: 49,  y: 73,  type: 'sea',    match: ['잔잔한 바다', '바다 낚시', '동해, 잔잔한 바다', '바다'] },

    // ── 강 ──
    { id: 'sunset_rv',   name: '노을강',             x: 33,  y: 34,  type: 'river',  match: ['노을강'] },
    { id: 'shallow_rv',  name: '얕은 강',            x: 66,  y: 34,  type: 'river',  match: ['얕은 강'] },
    { id: 'quiet_rv',    name: '고요한 강',          x: 35,  y: 64,  type: 'river',  match: ['고요한 강'] },
    { id: 'giant_rv',    name: '거목강',             x: 60,  y: 63,  type: 'river',  match: ['거목강'] },

    // ── 호수 ──
    { id: 'volcano_lk',  name: '화산 호수',          x: 37,  y: 18,  type: 'lake',   match: ['화산호수', '온천산-화산 호수', '온천산 - 화산 호수'] },
    { id: 'hotsp_lk1',   name: '온천산 호수',        x: 43,  y: 22,  type: 'lake',   match: ['온천산 호수', '온천산 - 호수', '온천산 - 호숫가'] },
    { id: 'hotsp_lk2',   name: '온천산 호수',        x: 50,  y: 28,  type: 'lake',   match: ['온천산 호수', '온천산 - 호수', '온천산 - 호숫가'] },
    { id: 'prairie_lk',  name: '초원 호수',          x: 33,  y: 50,  type: 'lake',   match: ['초원 호수'] },
    { id: 'suburb_lk1',  name: '근교 호수',          x: 44,  y: 39,  type: 'lake',   match: ['근교 호수', '근교 호숫가'] },
    { id: 'suburb_lk2',  name: '근교 호수',          x: 54,  y: 46,  type: 'lake',   match: ['근교 호수', '근교 호숫가'] },
    { id: 'forest_lk1',  name: '숲속 호수',          x: 78,  y: 44,  type: 'lake',   match: ['숲속 호수', '숲-숲속 호수', '숲 - 호수', '숲 - 호숫가'] },
    { id: 'forest_lk2',  name: '숲속 호수',          x: 78,  y: 55,  type: 'lake',   match: ['숲속 호수', '숲-숲속 호수', '숲 - 호수', '숲 - 호숫가'] },

    // ── 온천산 지역 ──
    { id: 'ruins',       name: '유적',               x: 29,  y: 18,  type: 'spot',   match: ['온천산 - 유적', '온천산-유적'] },
    { id: 'hotspring',   name: '온천',               x: 57,  y: 23,  type: 'spot',   match: ['온천산 - 온천', '온천산-온천', '온천산-온천산수', '온천산'] },
    { id: 'stone_cliff', name: '바위 절벽',          x: 64,  y: 23,  type: 'spot',   match: ['온천산 - 바위절벽', '온천산-바위절벽'] },

    // ── 숲 지역 ──
    { id: 'forest_isl',  name: '숲속 섬',            x: 88,  y: 40,  type: 'island', match: ['숲속 섬', '숲-숲속 섬', '숲 - 숲속 섬'] },
    { id: 'deer_tower',  name: '순록탑',             x: 78,  y: 40,  type: 'spot',   match: ['숲-순록탑', '숲 - 순록탑'] },
    { id: 'spirit_oak',  name: '영혼의 참나무 숲',   x: 77,  y: 54,  type: 'spot',   match: ['숲 - 영혼의 참나무', '숲 - 영혼의 참나무 숲', '숲-영혼의 참나무 숲', '숲-영혼의 참나무숲'] },
    { id: 'jump_plat',   name: '점핑 플랫폼',        x: 77,  y: 66,  type: 'spot',   match: ['숲-점핑 플랫폼', '숲 - 점핑 플랫폼'] },

    // ── 꽃밭 지역 ──
    { id: 'whale_mt',    name: '고래산',             x: 21,  y: 46,  type: 'spot',   match: ['꽃밭 - 고래산', '꽃밭-고래산'] },
    { id: 'windmill',    name: '풍차 꽃밭',          x: 21,  y: 61,  type: 'spot',   match: ['꽃밭 - 풍차꽃밭', '꽃밭-풍차꽃밭', '꽃밭'] },
    { id: 'purple_bch',  name: '보라빛 해변',        x: 21,  y: 75,  type: 'spot',   match: ['꽃밭 - 보라빛 해변', '꽃밭-보라빛 해변', '해변', '고래바다 해변'] },

    // ── 도시/근교 ──
    { id: 'suburb',      name: '도시 근교',          x: 43,  y: 52,  type: 'spot',   match: ['도시 근교', '도시', '도심', '홈', '홈 근처'] },

    // ── 어촌 지역 ──
    { id: 'dock',        name: '부두',               x: 41,  y: 68,  type: 'spot',   match: ['어촌 - 부두', '어촌-부두'] },
    { id: 'fish_square', name: '어촌 광장',          x: 50,  y: 68,  type: 'spot',   match: ['어촌 - 광장', '어촌-어촌 광장', '어촌'] },
    { id: 'east_dock',   name: '어촌 동쪽 부두',     x: 57,  y: 71,  type: 'spot',   match: ['어촌 - 동쪽 부두', '어촌-어촌 동쪽부두'] },
    { id: 'lighthouse',  name: '등대',               x: 40,  y: 72,  type: 'spot',   match: ['어촌 - 등대', '어촌-어촌등대'] },
];

// 범용 위치 매핑
const RIVER_LOCS  = ['노을강', '얕은 강', '고요한 강', '거목강'];
const LAKE_LOCS   = ['화산호수', '온천산 호수', '초원 호수', '근교 호수', '숲속 호수'];
const SEA_LOCS    = ['고래 바다', '고래바다', '잔잔한 바다', '동해', '구해'];

function locMatches(itemLoc, targetMatchList) {
    if (!targetMatchList || targetMatchList.length === 0) return false;
    const loc = itemLoc ? itemLoc.trim() : '';
    if (targetMatchList.some(k => loc === k)) return true;
    if ((loc === '강' || loc === '강 (아무데나)' || loc === '강변') && RIVER_LOCS.some(r => targetMatchList.includes(r))) return true;
    if ((loc === '호수' || loc === '물가') && LAKE_LOCS.some(l => targetMatchList.includes(l))) return true;
    if ((loc === '바다' || loc === '해변') && SEA_LOCS.some(s => targetMatchList.includes(s))) return true;
    return false;
}

// ===== 게임 데이터 =====
let gameData    = [];
let starRatings = {};
let panelCat    = 'all';
let activeLoc   = null;

async function loadMapData() {
    const files = ['fish', 'insect', 'birds', 'season'];
    const results = await Promise.allSettled(
        files.map(f => fetch(`./assets/data/${f}.json`).then(r => r.json()))
    );
    gameData = [];
    results.forEach(r => { if (r.status === 'fulfilled') gameData = gameData.concat(r.value); });
    starRatings = JSON.parse(localStorage.getItem('ddTownStarRatings')) || {};
    renderPins();
}

// ===== 핀 렌더링 =====
const PIN_ICONS = {
    sea:    '🌊',
    river:  '🏞️',
    lake:   '💧',
    island: '🏝️',
    spot:   '📍',
};

function renderPins() {
    const container = document.getElementById('map-pins');
    container.innerHTML = '';
    MAP_LOCATIONS.forEach(loc => {
        const pin = document.createElement('div');
        pin.className = `map-pin map-pin-${loc.type}`;
        pin.style.left = loc.x + '%';
        pin.style.top  = loc.y + '%';
        pin.dataset.id = loc.id;

        const count = gameData.filter(i =>
            locMatches(i.location, loc.match) &&
            !['cat_food', 'dog_food'].includes(i.type)
        ).length;

        pin.innerHTML = `
            <span class="map-pin-icon">${PIN_ICONS[loc.type] || '📍'}</span>
            <span class="map-pin-name">${loc.name}</span>
            ${count > 0 ? `<span class="map-pin-count">${count}</span>` : ''}
        `;

        pin.onclick = () => openMapPanel(loc);
        container.appendChild(pin);
    });
}

// ===== 패널 =====
function openMapPanel(loc) {
    activeLoc = loc;
    document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('active'));
    const pin = document.querySelector(`.map-pin[data-id="${loc.id}"]`);
    if (pin) pin.classList.add('active');

    document.getElementById('map-panel-title').textContent = loc.name;
    document.getElementById('map-panel').classList.add('open');
    renderPanelList();
}

function closeMapPanel() {
    document.getElementById('map-panel').classList.remove('open');
    document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('active'));
    activeLoc = null;
}

function setPanelCat(cat) {
    panelCat = cat;
    document.querySelectorAll('.mpf-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    renderPanelList();
}

function renderPanelList() {
    if (!activeLoc) return;
    const listEl = document.getElementById('map-panel-list');
    const catFilter = panelCat === 'all'
        ? ['fish', 'insect', 'bird']
        : [panelCat];

    const items = gameData.filter(i =>
        catFilter.includes(i.type) && locMatches(i.location, activeLoc.match)
    );

    if (items.length === 0) {
        listEl.innerHTML = '<p class="map-panel-empty">이 장소에서 잡을 수 있는 아이템이 없어요</p>';
        return;
    }

    listEl.innerHTML = items.map(item => {
        const rating    = starRatings[item.id] || 0;
        const collected = rating === 5;
        const stars     = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const timeInfo  = item.time_ranges
            ? item.time_ranges.map(([s, e]) => `${s}~${e}시`).join('/')
            : (item.start_time !== undefined && !(item.start_time === 0 && item.end_time === 24))
                ? `${item.start_time}~${item.end_time}시`
                : '상시';
        return `
            <div class="map-item-row ${collected ? 'collected' : ''}">
                <img src="${item.image}" alt="${item.name}" class="map-item-img" onerror="this.style.display='none'">
                <div class="map-item-info">
                    <span class="map-item-name">${item.name}${item.season ? ' <span class="season-badge" style="font-size:0.65rem">✨시즌</span>' : ''}</span>
                    <span class="map-item-time">${timeInfo}</span>
                </div>
                <span class="map-item-stars">${stars}</span>
            </div>`;
    }).join('');
}

// ===== 초기화 =====
loadMapData();

if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            if (typeof loadUserProfile === 'function') await loadUserProfile(user.uid);
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().encyclopediaStarRatings) {
                    starRatings = doc.data().encyclopediaStarRatings;
                    localStorage.setItem('ddTownStarRatings', JSON.stringify(starRatings));
                }
            } catch(e) {}
        }
        refreshAuthUI(user);
        if (gameData.length > 0) renderPins();
    });
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMapPanel(); });
