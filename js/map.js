// ===== 지도 위치 데이터 =====
// x, y: 지도 이미지 기준 % 좌표
// match: fish/insect/bird.json의 location 필드와 매칭
const MAP_LOCATIONS = [
    // ── 바다 ──
    { id: 'whale_sea',  name: '고래 바다',     x:  6.5, y: 48,   type: 'sea',     match: ['고래 바다', '고래바다'] },
    { id: 'east_sea',   name: '동해',          x: 93,   y: 50,   type: 'sea',     match: ['동해'] },
    { id: 'calm_sea',   name: '잔잔한 바다',   x: 49,   y: 87,   type: 'sea',     match: ['잔잔한 바다'] },
    { id: 'old_sea',    name: '구해',          x: 51,   y:  9,   type: 'sea',     match: ['구해'] },

    // ── 강 ──
    { id: 'sunset_rv',  name: '노을강',        x: 25,   y: 39,   type: 'river',   match: ['노을강'] },
    { id: 'shallow_rv', name: '얕은 강',       x: 64,   y: 37,   type: 'river',   match: ['얕은 강'] },
    { id: 'quiet_rv',   name: '고요한 강',     x: 42,   y: 71,   type: 'river',   match: ['고요한 강'] },
    { id: 'giant_rv',   name: '거목강',        x: 59,   y: 71,   type: 'river',   match: ['거목강'] },

    // ── 호수 ──
    { id: 'hotsp_lk1',  name: '온천산 호수',   x: 42,   y: 21,   type: 'lake',    match: ['온천산 호수'] },
    { id: 'hotsp_lk2',  name: '온천산 호수',   x: 57,   y: 33,   type: 'lake',    match: ['온천산 호수'] },
    { id: 'prairie_lk', name: '초원 호수',     x: 23,   y: 53,   type: 'lake',    match: ['초원 호수', '초원호수'] },
    { id: 'suburb_lk1', name: '근교 호수',     x: 48,   y: 42,   type: 'lake',    match: ['근교 호수', '근교호수'] },
    { id: 'suburb_lk2', name: '근교 호수',     x: 50,   y: 63,   type: 'lake',    match: ['근교 호수', '근교호수'] },
    { id: 'forest_lk1', name: '숲속 호수',     x: 73,   y: 44,   type: 'lake',    match: ['숲속 호수'] },
    { id: 'forest_lk2', name: '숲속 호수',     x: 74,   y: 62,   type: 'lake',    match: ['숲속 호수'] },

    // ── 바다 낚시 (특수) ──
    { id: 'sea_fish',   name: '바다 낚시',     x: 47,   y: 77,   type: 'fishing', match: ['바다 낚시', '바다낚시'] },

    // ── 섬 ──
    { id: 'forest_isl', name: '숲속 섬',       x: 90,   y: 35,   type: 'island',  match: ['숲속 섬'] },

    // ── 지역 라벨 (낚시 불가, 참고용) ──
    { id: 'town',       name: '마을',          x: 50,   y: 49,   type: 'area',    match: [] },
    { id: 'forest',     name: '숲속',          x: 80,   y: 50,   type: 'area',    match: [] },
    { id: 'hotsp_mt',   name: '온천산',        x: 56,   y: 25,   type: 'area',    match: [] },
    { id: 'fishing_vg', name: '어촌',          x: 50,   y: 74,   type: 'area',    match: [] },
    { id: 'flower_fld', name: '꽃밭',          x: 22,   y: 52,   type: 'area',    match: [] },
    { id: 'windmill',   name: '풍차 꽃밭',     x: 20,   y: 66,   type: 'spot',    match: [] },
    { id: 'whale_mt',   name: '고래산',        x: 14,   y: 47,   type: 'spot',    match: [] },
    { id: 'deer_tower', name: '소록탑',        x: 77,   y: 38,   type: 'spot',    match: [] },
    { id: 'spirit_oak', name: '영목 소나무숲', x: 77,   y: 54,   type: 'spot',    match: [] },
    { id: 'beach',      name: '자주빛 해변',   x: 33,   y: 81,   type: 'spot',    match: [] },
    { id: 'ruins',      name: '유적지',        x: 37,   y: 16,   type: 'spot',    match: [] },
    { id: 'stone_cliff',name: '석안 절벽',     x: 73,   y: 27,   type: 'spot',    match: [] },
    { id: 'hotspring',  name: '온천',          x: 60,   y: 26,   type: 'spot',    match: [] },
    { id: 'dock',       name: '부두',          x: 46,   y: 75,   type: 'spot',    match: [] },
];

// 범용 위치 매핑 (fish.json의 "모든 강" 등)
const RIVER_LOCS  = ['노을강', '얕은 강', '고요한 강', '거목강'];
const LAKE_LOCS   = ['온천산 호수', '초원 호수', '근교 호수', '숲속 호수'];
const SEA_LOCS    = ['고래 바다', '고래바다', '잔잔한 바다', '동해', '구해'];

function locMatches(itemLoc, targetMatchList) {
    if (!targetMatchList || targetMatchList.length === 0) return false;
    const loc = itemLoc ? itemLoc.trim() : '';
    if (targetMatchList.some(k => loc === k)) return true;
    if ((loc === '강 (아무데나)' || loc === '모든 강') && RIVER_LOCS.some(r => targetMatchList.includes(r))) return true;
    if ((loc === '호수' || loc === '모든 호수') && LAKE_LOCS.some(l => targetMatchList.includes(l))) return true;
    if ((loc === '바다' || loc === '모든 바다') && SEA_LOCS.some(s => targetMatchList.includes(s))) return true;
    return false;
}

// ===== 게임 데이터 =====
let gameData   = [];
let starRatings = {};
let panelCat   = 'all';
let activeLoc  = null;

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
    sea:     '🌊',
    river:   '🏞️',
    lake:    '💧',
    fishing: '🎣',
    island:  '🏝️',
    area:    '',
    spot:    '📍',
};

function renderPins() {
    const container = document.getElementById('map-pins');
    container.innerHTML = '';
    MAP_LOCATIONS.forEach(loc => {
        const pin = document.createElement('div');
        pin.className = `map-pin map-pin-${loc.type}${loc.match.length === 0 ? ' map-pin-label' : ''}`;
        pin.style.left = loc.x + '%';
        pin.style.top  = loc.y + '%';
        pin.dataset.id = loc.id;

        const count = loc.match.length > 0
            ? gameData.filter(i => locMatches(i.location, loc.match) && !['cat_food','dog_food'].includes(i.type)).length
            : 0;

        pin.innerHTML = `
            <span class="map-pin-icon">${PIN_ICONS[loc.type] || ''}</span>
            <span class="map-pin-name">${loc.name}</span>
            ${count > 0 ? `<span class="map-pin-count">${count}</span>` : ''}
        `;

        if (loc.match.length > 0) {
            pin.onclick = () => openMapPanel(loc);
        }
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
        : [panelCat === 'fish' ? 'fish' : panelCat === 'insect' ? 'insect' : 'bird'];

    const items = gameData.filter(i =>
        catFilter.includes(i.type) && locMatches(i.location, activeLoc.match)
    );

    if (items.length === 0) {
        listEl.innerHTML = '<p class="map-panel-empty">이 장소에서 잡을 수 있는 아이템이 없어요</p>';
        return;
    }

    listEl.innerHTML = items.map(item => {
        const rating   = starRatings[item.id] || 0;
        const collected = rating === 5;
        const stars    = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const timeInfo = item.time_ranges
            ? item.time_ranges.map(([s,e]) => `${s}~${e}시`).join('/')
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
