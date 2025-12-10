/* script.js - HEXA LANDS ENGINE v5.3 (Origin Point Support) */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const pCtx = previewCanvas.getContext('2d');
const container = document.getElementById('gameContainer');

// UI Elements
const scoreEl = document.getElementById('scoreVal');
const stackEl = document.getElementById('stackVal');
const modal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');

// === CONFIGURATION ===
const HEX_SIZE = 40;
const START_TILES = 40;        // [NERF] Было 60. Стартуем скромнее.

// БАЛАНС (HARDCORE)
const SMART_SPAWN_CHANCE = 0.15; // [NERF] Было 0.35. "Умные" тайлы теперь редкость.
const QUEST_CHANCE = 0.20;       // Чаще квесты — они теперь главный источник дохода.
const ATTRACTION_CHANCE = 0.08;
const QUEST_REWARD = 5;

// === FALLBACK DATA (Пример с ORIGIN) ===
const FALLBACK_BIOMES = {
    "1": [
        // origin: {x:0.5, y:0.9} опускает центр привязки вниз -> дерево "стоит" на земле
        { "id": "forest_default", "src": "forest_1.png", "weight": 50, "scale": 0.6, "origin": { "x": 0.5, "y": 0.9 } },
        { "id": "forest_bear", "src": "bear.png", "weight": 5, "scale": 0.5, "origin": { "x": 0.5, "y": 0.8 } }
    ],
    "2": [
        // Вода обычно плоская, ей подойдет центр (0.5, 0.5)
        { "id": "water_wave", "src": "wave.png", "weight": 60, "scale": 0.5, "origin": { "x": 0.5, "y": 0.5 } },
        { "id": "water_ship", "src": "ship.png", "weight": 5, "scale": 0.6, "origin": { "x": 0.5, "y": 0.8 } }
    ],
    "3": [
        { "id": "house_small", "src": "house_1.png", "weight": 50, "scale": 0.6, "origin": { "x": 0.5, "y": 0.9 } },
        { "id": "house_road", "src": "road.png", "weight": 30, "scale": 0.5, "origin": { "x": 0.5, "y": 0.5 } }
    ],
    "4": [
        { "id": "field_wheat", "src": "wheat.png", "weight": 60, "scale": 0.6, "origin": { "x": 0.5, "y": 0.9 } },
        { "id": "field_tractor", "src": "tractor.png", "weight": 5, "scale": 0.5, "origin": { "x": 0.5, "y": 0.8 } }
    ]
};

let BIOME_VARIANTS = {};
let VARIANT_DATA = {};

// === ASSETS CONFIG (Attractions) ===
const ATTRACTIONS_LIST = [
    { id: 'tree_giant', name: 'tree_giant', biome: 1, minTarget: 15, scale: 2.5, anchorY: 0.8 },
    { id: 'fountain', name: 'fountain', biome: 2, minTarget: 10, scale: 1.5, anchorY: 0.8, fixedEdges: [2, 2, 2, 2, 2, 2] },
    { id: 'castle', name: 'castle', biome: 3, minTarget: 20, scale: 2.0, anchorY: 0.8, fixedEdges: [3, 3, 3, 4, 3, 3] },
    { id: 'windmill', name: 'windmill', biome: 4, minTarget: 25, scale: 2.2, anchorY: 0.8 }
];

let assets = {};
let assetsLoaded = false;

// Colors & Biomes
const BIOMES = {
    GRASS: { id: 0, color: '#a3d977', dark: '#475569' },
    FOREST: { id: 1, color: '#3d8c40', dark: '#166534', detail: 'tree' },
    WATER: { id: 2, color: '#38bdf8', dark: '#0ea5e9', detail: 'wave' },
    HOUSE: { id: 3, color: '#d97706', dark: '#b45309', detail: 'house' },
    FIELD: { id: 4, color: '#facc15', dark: '#ca8a04', detail: 'lines' }
};

const BIOMES_BY_ID = {
    1: BIOMES.FOREST,
    2: BIOMES.WATER,
    3: BIOMES.HOUSE,
    4: BIOMES.FIELD
};

// === GAME STATE ===
let map = new Map();
let score = 0;
let stackCount = START_TILES;
let currentTile = null;
let isGameOver = false;

let camX = 0, camY = 0, zoom = 1;
let isDragging = false;
let lastMouseX, lastMouseY, clickStartX, clickStartY;
let hoverHex = null;

// [JUICE] Effects
let camVX = 0, camVY = 0;
let particles = [];

// [JUICE] AUDIO ENGINE
const SoundFX = {
    ctx: null,
    init: function () {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    playTone: function (freq, type, dur, vol = 0.1, slide = 0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide) osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + dur);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    },
    click: () => SoundFX.playTone(800, 'sine', 0.05, 0.05),
    place: () => { SoundFX.playTone(150, 'triangle', 0.1, 0.2, -50); SoundFX.playTone(100, 'sine', 0.15, 0.2, -20); },
    rotate: () => SoundFX.playTone(300, 'sine', 0.08, 0.05, 100),
    score: () => { SoundFX.playTone(523, 'sine', 0.2, 0.1); setTimeout(() => SoundFX.playTone(659, 'sine', 0.2, 0.1), 50); },
    perfect: () => { [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => SoundFX.playTone(f, 'triangle', 0.4, 0.1), i * 60)); },
    quest: () => SoundFX.playTone(400, 'sine', 0.5, 0.2, 800),
    error: () => SoundFX.playTone(150, 'sawtooth', 0.2, 0.1, -20)
};

// === КОНФИГ И АССЕТЫ ===
function processConfig(data) {
    BIOME_VARIANTS = data;
    VARIANT_DATA = {};
    Object.values(data).forEach(list => {
        list.forEach(item => {
            VARIANT_DATA[item.id] = item;
        });
    });
    console.log("Конфиг применен:", VARIANT_DATA);
}

function loadConfig(callback) {
    fetch('./assets/biomes.json')
        .then(response => {
            if (!response.ok) throw new Error("Status " + response.status);
            return response.json();
        })
        .then(data => {
            processConfig(data);
            callback();
        })
        .catch(err => {
            console.warn("⚠️ Не удалось загрузить JSON. Используем встроенный конфиг.", err);
            processConfig(FALLBACK_BIOMES);
            callback();
        });
}

function preloadAssets(callback) {
    let loaded = 0;
    let toLoad = [];

    ATTRACTIONS_LIST.forEach(attr => {
        toLoad.push({ id: attr.id, src: `./assets/attractions/${attr.name}.svg` });
    });

    Object.values(BIOME_VARIANTS).forEach(list => {
        list.forEach(item => {
            if (item.src && item.src !== "") {
                toLoad.push({ id: item.id, src: `./assets/details/${item.src}` });
            }
        });
    });

    const total = toLoad.length;
    if (total === 0) { callback(); return; }

    toLoad.forEach(item => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => { assets[item.id] = img; loaded++; if (loaded === total) callback(); };
        img.onerror = () => { console.warn(`❌ Не найдена картинка: ${item.src}`); loaded++; if (loaded === total) callback(); };
    });
}

// === INIT ===
function initGame() {
    if (!assetsLoaded) {
        loadConfig(() => {
            preloadAssets(() => {
                assetsLoaded = true;
                startGameLogic();
            });
        });
    } else {
        startGameLogic();
    }
}

function startGameLogic() {
    map.clear();
    score = 0;
    stackCount = START_TILES;
    isGameOver = false;
    modal.style.display = 'none';
    particles = [];

    updateUI();
    resetCam();
    resize();
    window.addEventListener('resize', resize);

    const starter = createPerfectTile(0, 0, true);
    placeTileToMap(starter, 0, 0);

    drawNextTile();
    requestAnimationFrame(loop);
}

// === CONSOLE COMMAND: GENERATE FIELD ===
window.generateField = function (radius = 5) {
    console.log(`Generating perfect field with radius ${radius}...`);
    map.clear();
    particles = [];
    score = 0;
    stackCount = 999;

    const center = createPerfectTile(0, 0, true);
    placeTileToMap(center, 0, 0);

    for (let r = 1; r <= radius; r++) {
        for (let q = -r; q <= r; q++) {
            let r1 = Math.max(-r, -q - r);
            let r2 = Math.min(r, -q + r);
            for (let row = r1; row <= r2; row++) {
                if (!map.has(`${q},${row}`)) {
                    const tile = createPerfectTile(q, row);
                    placeTileToMap(tile, q, row);
                    const pos = hexToPixel(q, row);
                    spawnParticles(pos.x, pos.y, '#ffd700', 2);
                }
            }
        }
    }
    resetCam();
    updateUI();
};

function createPerfectTile(q, r, forceRandom = false) {
    const neighbors = getNeighbors(q, r);
    const edges = [];
    const details = [];

    for (let i = 0; i < 6; i++) {
        const nPos = neighbors[i];
        const nKey = `${nPos.q},${nPos.r}`;
        let biome;

        if (map.has(nKey) && !forceRandom) {
            biome = map.get(nKey).edges[(i + 3) % 6];
        } else {
            biome = Math.floor(Math.random() * 4) + 1;
        }

        edges.push(biome);
        details.push(getRandomVariant(biome));
    }
    return { edges, details, q, r };
}

function resize() {
    if (!container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    previewCanvas.width = 150;
    previewCanvas.height = 150;
    camX = canvas.width / 2;
    camY = canvas.height / 2;
}

function resetCam() {
    camX = canvas.width / 2;
    camY = canvas.height / 2;
    zoom = 1;
    camVX = 0; camVY = 0;
}

// === MATH ===
function hexToPixel(q, r) {
    const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = HEX_SIZE * (3 / 2 * r);
    return { x, y };
}

function pixelToHex(x, y) {
    const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / HEX_SIZE;
    const r = (2 / 3 * y) / HEX_SIZE;
    return axialRound(q, r);
}

function axialRound(q, r) {
    let x = q, z = r, y = -x - z;
    let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    let x_diff = Math.abs(rx - x), y_diff = Math.abs(ry - y), z_diff = Math.abs(rz - z);
    if (x_diff > y_diff && x_diff > z_diff) rx = -ry - rz;
    else if (y_diff > z_diff) ry = -rx - rz;
    else rz = -rx - ry;
    return { q: rx, r: rz };
}

function getNeighbors(q, r) {
    return [
        { q: q + 1, r: r }, { q: q, r: r + 1 }, { q: q - 1, r: r + 1 },
        { q: q - 1, r: r }, { q: q, r: r - 1 }, { q: q + 1, r: r - 1 }
    ];
}

// === LOGIC ===
function getRandomVariant(biomeId) {
    const variants = BIOME_VARIANTS[biomeId];
    if (!variants || variants.length === 0) return null;
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    for (let v of variants) {
        if (random < v.weight) return v.id;
        random -= v.weight;
    }
    return variants[0].id;
}

function generateTile() {
    if (Math.random() < ATTRACTION_CHANCE) {
        const attrData = ATTRACTIONS_LIST[Math.floor(Math.random() * ATTRACTIONS_LIST.length)];
        let edges;
        if (attrData.fixedEdges && attrData.fixedEdges.length === 6) edges = [...attrData.fixedEdges];
        else edges = Array(6).fill(attrData.biome);
        return {
            edges: edges, q: 0, r: 0, attraction: attrData.id,
            details: Array(6).fill(null),
            quest: { biomeId: attrData.biome, target: attrData.minTarget + Math.floor(Math.random() * 5), current: 1, completed: false, isAttraction: true }
        };
    }
    return createPerfectTile(0, 0, true);
}

function generateSmartTile() {
    let candidates = [];
    const checked = new Set();
    map.forEach(tile => {
        getNeighbors(tile.q, tile.r).forEach(n => {
            const key = `${n.q},${n.r}`;
            if (!map.has(key) && !checked.has(key)) {
                checked.add(key);
                let active = 0;
                let neighborsArr = getNeighbors(n.q, n.r);
                neighborsArr.forEach(nb => { if (map.has(`${nb.q},${nb.r}`)) active++; });
                candidates.push({ q: n.q, r: n.r, score: active, neighborsPos: neighborsArr });
            }
        });
    });
    if (candidates.length === 0) return generateTile();
    const maxScore = Math.max(...candidates.map(c => c.score));
    if (maxScore < 2) return generateTile();
    const bestSpots = candidates.filter(c => c.score === maxScore);
    const target = bestSpots[Math.floor(Math.random() * bestSpots.length)];
    const tile = createPerfectTile(target.q, target.r);
    tile.isPerfect = true;
    return tile;
}

function drawNextTile() {
    if (stackCount <= 0) {
        gameOver();
        return;
    }
    const pBox = document.querySelector('.preview-box');
    if (pBox) { pBox.style.transform = 'scale(0.9)'; setTimeout(() => pBox.style.transform = 'scale(1)', 100); }
    SoundFX.click();

    if (Math.random() < SMART_SPAWN_CHANCE && map.size > 2) currentTile = generateSmartTile();
    else currentTile = generateTile();
    drawPreview();
}

function rotateCurrentTile(dir) {
    if (!currentTile || isGameOver) return;
    const arr = currentTile.edges;
    const dets = currentTile.details;
    if (dir > 0) {
        arr.unshift(arr.pop());
        dets.unshift(dets.pop());
    } else {
        arr.push(arr.shift());
        dets.push(dets.shift());
    }
    SoundFX.rotate();
    drawPreview();
}

function analyzeGroup(startTile, biomeId) {
    let visited = new Set();
    let queue = [startTile];
    visited.add(`${startTile.q},${startTile.r}`);
    let count = 0;
    let canGrow = false;
    while (queue.length > 0) {
        let current = queue.shift();
        count++;
        let neighbors = getNeighbors(current.q, current.r);
        neighbors.forEach((n, i) => {
            let nKey = `${n.q},${n.r}`;
            if (map.has(nKey)) {
                if (!visited.has(nKey)) {
                    let neighbor = map.get(nKey);
                    let myEdge = current.edges[i];
                    let nEdge = neighbor.edges[(i + 3) % 6];
                    if (myEdge === biomeId && nEdge === biomeId) {
                        visited.add(nKey);
                        queue.push(neighbor);
                    }
                }
            } else {
                if (current.edges[i] === biomeId) canGrow = true;
            }
        });
    }
    return { count, canGrow };
}

function checkQuests() {
    map.forEach(tile => {
        if (tile.quest && !tile.quest.completed && !tile.quest.failed) {
            const stats = analyzeGroup(tile, tile.quest.biomeId);
            tile.quest.current = stats.count;
            if (stats.count >= tile.quest.target) completeQuest(tile);
            else if (!stats.canGrow) failQuest(tile);
        }
    });
}

function completeQuest(tile) {
    tile.quest.completed = true;
    const reward = tile.quest.isAttraction ? QUEST_REWARD * 2 : QUEST_REWARD;
    const bonusScore = tile.quest.isAttraction ? 500 : 100;
    stackCount += reward;
    score += bonusScore;
    SoundFX.quest();
    const pos = hexToPixel(tile.q, tile.r);
    spawnParticles(pos.x, pos.y, '#ffd700', 15);
    showFloatingText(tile.q, tile.r, `DONE! +${reward} Tiles`, '#ffeb3b');
}

function failQuest(tile) {
    tile.quest.failed = true;
    showFloatingText(tile.q, tile.r, "Quest Failed", '#94a3b8');
    setTimeout(() => { tile.quest = null; }, 1000);
}

function tryPlaceTile(q, r) {
    const key = `${q},${r}`;
    if (map.has(key)) { SoundFX.error(); return; }

    const neighbors = getNeighbors(q, r);
    const hasNeighbor = neighbors.some(n => map.has(`${n.q},${n.r}`));
    if (!hasNeighbor && map.size > 0) { SoundFX.error(); return; }

    placeTileToMap(currentTile, q, r);
    SoundFX.place();
    const pos = hexToPixel(q, r);
    spawnParticles(pos.x, pos.y, '#aaa', 6);

    let points = 0;
    let matches = 0;
    let activeNeighbors = 0;

    neighbors.forEach((n, i) => {
        const nKey = `${n.q},${n.r}`;
        if (map.has(nKey)) {
            activeNeighbors++;
            const neighborTile = map.get(nKey);
            const myEdge = currentTile.edges[i];
            const nEdge = neighborTile.edges[(i + 3) % 6];
            if (myEdge === nEdge) {
                points += 10;
                matches++;
                const angle = (Math.PI / 180) * (60 * i);
                spawnParticles(pos.x + Math.cos(angle) * 30, pos.y + Math.sin(angle) * 30, BIOMES_BY_ID[myEdge].color, 3);
            }
        }
    });

    // === HARDCORE SCORING ===

    // 1. PERFECT (6 граней) — Единственный способ реально разбогатеть
    if (matches === 6 || (matches === activeNeighbors && activeNeighbors >= 5)) {
        points += 500;
        stackCount += 5;
        SoundFX.perfect();
        showFloatingText(q, r, "PERFECT! +5 🎴", '#d946ef');
        spawnParticles(pos.x, pos.y, '#d946ef', 20);
    }
    // 2. EXCELLENT (5 граней) — Прирост
    else if (matches === 5) {
        points += 200;
        stackCount += 2; // Реальный плюс
        SoundFX.score();
        showFloatingText(q, r, "Excellent! +2 🎴", '#22c55e');
    }
    // 3. GOOD (4 грани) — "Выход в ноль" (Sustain)
    else if (matches === 4) {
        points += 100;
        stackCount += 1; // Возмещаем потраченный тайл (итого: -1 + 1 = 0)
        SoundFX.score();
        showFloatingText(q, r, "Good! +1 🎴", '#a3d977');
    }
    // 4. NORMAL (3 грани и меньше) — ПОТЕРЯ ТАЙЛА
    else if (matches > 0) {
        points += matches * 10;
        // Никаких тайлов! Стек уменьшается.
        showFloatingText(q, r, `+${points}`);
    }

    if (points > 0) score += points;

    // Показываем очки, если это не бонусный ход (чтобы текст не сливался)
    if (matches < 3 && points > 0) showFloatingText(q, r, `+${points}`);

    checkQuests();
    stackCount--;
    updateUI();
    drawNextTile();
}

function placeTileToMap(tile, q, r) {
    map.set(`${q},${r}`, {
        edges: [...tile.edges],
        details: [...tile.details],
        q: q,
        r: r,
        quest: tile.quest ? { ...tile.quest } : null,
        attraction: tile.attraction || null,
        spawnTime: Date.now()
    });
}

function gameOver() {
    isGameOver = true;
    finalScoreEl.innerText = score;
    modal.style.display = 'flex';
}

function updateUI() {
    scoreEl.innerText = score;
    stackEl.innerText = stackCount;
}

// === PARTICLES ===
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count * 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0, color: color,
            size: Math.random() * 5 + 4
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.92; p.vy *= 0.92;
        p.life -= 0.02;
        p.size *= 0.97;
        if (p.life <= 0 || p.size < 0.5) particles.splice(i, 1);
    }
}

function drawParticles(c) {
    if (particles.length === 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
        c.fillStyle = p.color;
        c.globalAlpha = p.life;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
    });
    c.restore();
}

// === RENDERING ===
function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isDragging) {
        camX += camVX; camY += camVY;
        camVX *= 0.9; camVY *= 0.9;
    }

    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    const renderList = Array.from(map.values());

    if (hoverHex && !isGameOver && !isDragging) {
        const neighbors = getNeighbors(hoverHex.q, hoverHex.r);
        const hasNeighbor = neighbors.some(n => map.has(`${n.q},${n.r}`));
        if (hasNeighbor || map.size === 0) {
            renderList.push({
                ...currentTile,
                q: hoverHex.q,
                r: hoverHex.r,
                isGhost: true
            });
        }
    }

    renderList.sort((a, b) => {
        if (a.r !== b.r) return a.r - b.r;
        return a.q - b.q;
    });

    const now = Date.now();

    renderList.forEach(tile => {
        const pos = hexToPixel(tile.q, tile.r);
        let s = 1;
        if (tile.spawnTime && !tile.isGhost) {
            const age = now - tile.spawnTime;
            if (age < 300) s = 1 + Math.sin(age / 300 * Math.PI) * 0.2;
        }

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.scale(s, s);

        if (tile.isGhost) {
            ctx.translate(0, Math.sin(now / 150) * 3);
            ctx.globalAlpha = 0.6;
            drawHex(ctx, 0, 0, tile, true);
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([5, 5]);
            drawHexOutline(ctx, 0, 0, '#fff', 2);
            ctx.setLineDash([]);
        } else {
            drawHex(ctx, 0, 0, tile, true);
        }
        ctx.restore();
    });

    drawParticles(ctx);
    ctx.restore();
}

function drawPreview() {
    pCtx.clearRect(0, 0, 150, 150);
    if (!currentTile) return;
    pCtx.save();
    pCtx.translate(75, 75);
    if (currentTile.isPerfect) {
        pCtx.shadowColor = "#ffd700";
        pCtx.shadowBlur = 15;
        pCtx.scale(1.1, 1.1);
        drawHex(pCtx, 0, 0, currentTile, false);
    } else {
        pCtx.scale(1.0, 1.0);
        drawHex(pCtx, 0, 0, currentTile, false);
    }
    pCtx.restore();
}

function drawHex(c, x, y, tile, enableShadow = true) {
    const size = HEX_SIZE;
    const edges = tile.edges;
    const theme = isDark();

    // 1. Shadow
    if (enableShadow) {
        c.save();
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 180 * (60 * i - 30);
            c[i === 0 ? 'moveTo' : 'lineTo'](x + size * Math.cos(a), y + size * Math.sin(a));
        }
        c.closePath();
        c.shadowColor = "rgba(0,0,0,0.2)";
        c.shadowBlur = 10;
        c.shadowOffsetY = 5;
        c.fillStyle = theme ? '#1e293b' : '#fff';
        c.fill();
        c.restore();
    }

    // 2. Biome Segments
    for (let i = 0; i < 6; i++) {
        const type = edges[i];
        const biome = BIOMES_BY_ID[type];
        if (!biome) continue;

        c.beginPath();
        c.moveTo(x, y);
        const a1 = (Math.PI / 180) * (60 * i - 30);
        const a2 = (Math.PI / 180) * (60 * (i + 1) - 30);
        c.lineTo(x + size * Math.cos(a1), y + size * Math.sin(a1));
        c.lineTo(x + size * Math.cos(a2), y + size * Math.sin(a2));
        c.closePath();

        c.fillStyle = theme ? biome.dark : biome.color;
        c.fill();
        c.lineWidth = 1;
        c.strokeStyle = c.fillStyle;
        c.stroke();
    }

    // 3. Details (FIXED: Upright + Origin Support)
    for (let i = 0; i < 6; i++) {
        const type = edges[i];
        const biome = BIOMES_BY_ID[type];
        const variantId = tile.details ? tile.details[i] : null;

        if (biome && !tile.attraction) {
            c.save();
            const angleDeg = 60 * i;
            const angleRad = (Math.PI / 180) * angleDeg;
            c.translate(x, y);
            c.rotate(angleRad);

            if (variantId && assets[variantId]) {
                const img = assets[variantId];
                const config = VARIANT_DATA[variantId];
                const myScale = (config && config.scale) ? config.scale : 0.5;
                const imgSize = size * myScale;

                // === ORIGIN SUPPORT ===
                const originX = (config && config.origin && config.origin.x !== undefined) ? config.origin.x : 0.5;
                const originY = (config && config.origin && config.origin.y !== undefined) ? config.origin.y : 0.5;

                // Перемещаемся в центр зоны отрисовки
                c.translate(size * 0.5, 0);
                // Отменяем вращение гекса
                c.rotate(-angleRad);
                // Рисуем картинку с учетом Origin
                c.drawImage(img, -imgSize * originX, -imgSize * originY, imgSize, imgSize);

            } else {
                c.rotate(-angleRad);
                c.translate(-x, -y);
                c.save();
                c.beginPath();
                c.moveTo(x, y);
                const a1 = (Math.PI / 180) * (60 * i - 30);
                const a2 = (Math.PI / 180) * (60 * (i + 1) - 30);
                c.lineTo(x + size * Math.cos(a1), y + size * Math.sin(a1));
                c.lineTo(x + size * Math.cos(a2), y + size * Math.sin(a2));
                c.closePath();
                c.clip();
                drawDetail(c, x, y, size, i, biome.detail, theme);
                c.restore();
            }
            c.restore();
        }
    }

    // 4. Borders
    c.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        c[i === 0 ? 'moveTo' : 'lineTo'](x + size * Math.cos(a), y + size * Math.sin(a));
    }
    c.closePath();
    c.strokeStyle = theme ? '#0f172a' : '#fff';
    c.lineWidth = 3;
    c.lineJoin = 'round';
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.1)';
    c.lineWidth = 1;
    c.stroke();

    // 5. Highlight
    c.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        c[i === 0 ? 'moveTo' : 'lineTo'](x + (size * 0.85) * Math.cos(a), y + (size * 0.85) * Math.sin(a));
    }
    c.closePath();
    c.strokeStyle = 'rgba(255,255,255,0.15)';
    c.lineWidth = 2;
    c.stroke();

    // 6. Attraction
    if (tile.attraction) {
        const img = assets[tile.attraction];
        const attrConf = ATTRACTIONS_LIST.find(a => a.id === tile.attraction);
        if (img && attrConf) {
            c.save();
            const ratio = img.naturalWidth / img.naturalHeight;
            const drawH = size * (attrConf.scale || 1.5);
            const drawW = drawH * ratio;
            const anchorX = 0.5;
            const anchorY = attrConf.anchorY || 0.85;
            const drawX = x - (drawW * anchorX);
            const drawY = y - (drawH * anchorY);

            c.shadowColor = "rgba(0,0,0,0.3)";
            c.shadowBlur = 10;
            c.shadowOffsetY = 5;
            c.drawImage(img, drawX, drawY, drawW, drawH);
            c.restore();
        }
    }

    // 7. Quest
    if (tile.quest && !tile.quest.completed && !tile.quest.failed) {
        c.save();
        c.translate(x, y);
        const isAttr = tile.quest.isAttraction;
        c.fillStyle = 'rgba(0, 0, 0, 0.6)';
        c.beginPath();
        c.arc(0, 0, 14, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = isAttr ? '#ffd700' : '#fff';
        c.lineWidth = isAttr ? 2.5 : 1.5;
        c.stroke();
        c.fillStyle = '#fff';
        c.font = 'bold 12px Arial';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const remaining = tile.quest.target - tile.quest.current;
        c.fillText(remaining > 0 ? remaining : '✓', 0, 1);
        c.restore();
    }
}

function drawDetail(c, cx, cy, size, i, type, isDark) {
    const midAngle = (Math.PI / 180) * (60 * i);
    const mx = cx + (size * 0.6) * Math.cos(midAngle);
    const my = cy + (size * 0.6) * Math.sin(midAngle);
    c.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)';
    if (type === 'tree') {
        c.beginPath(); c.moveTo(mx, my - 8); c.lineTo(mx + 6, my + 4); c.lineTo(mx - 6, my + 4); c.fill();
    } else if (type === 'house') {
        c.fillRect(mx - 4, my - 4, 8, 8); c.beginPath(); c.moveTo(mx - 6, my - 4); c.lineTo(mx, my - 10); c.lineTo(mx + 6, my - 4); c.fill();
    } else if (type === 'wave') {
        c.strokeStyle = c.fillStyle; c.beginPath(); c.arc(mx, my, 6, 0, Math.PI * 2); c.stroke();
    } else if (type === 'lines') {
        c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(mx - 6, my - 6); c.lineTo(mx + 6, my + 6); c.moveTo(mx + 2, my - 6); c.lineTo(mx - 6, my + 2); c.lineWidth = 2; c.stroke();
    }
}

function drawHexOutline(c, x, y, color, width) {
    const size = HEX_SIZE;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        const px = x + size * Math.cos(a);
        const py = y + size * Math.sin(a);
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
    }
    c.closePath();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
}

function showFloatingText(q, r, text, color = '#28a745') {
    const pos = hexToPixel(q, r);
    const jitterX = (Math.random() - 0.5) * 20;
    const screenX = (pos.x * zoom) + camX + jitterX;
    const screenY = (pos.y * zoom) + camY - 20;

    const div = document.createElement('div');
    div.className = 'float-text';
    div.innerText = text;
    div.style.left = screenX + 'px';
    div.style.top = screenY + 'px';
    div.style.color = color;
    container.appendChild(div);
    setTimeout(() => div.remove(), 1500);
}

// === CONTROLS ===
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

container.addEventListener('mousedown', (e) => {
    SoundFX.init();
    const pos = getMousePos(e);
    if (e.button === 2) {
        rotateCurrentTile(1);
        return;
    }
    isDragging = true;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    clickStartX = pos.x;
    clickStartY = pos.y;
    camVX = 0; camVY = 0;
});

container.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    if (isDragging) {
        const dx = pos.x - lastMouseX;
        const dy = pos.y - lastMouseY;
        camX += dx;
        camY += dy;
        camVX = dx; camVY = dy;
        lastMouseX = pos.x;
        lastMouseY = pos.y;
    } else {
        const worldX = (pos.x - camX) / zoom;
        const worldY = (pos.y - camY) / zoom;
        hoverHex = pixelToHex(worldX, worldY);
    }
});

container.addEventListener('mouseup', (e) => {
    isDragging = false;
    const pos = getMousePos(e);
    const dist = Math.hypot(pos.x - clickStartX, pos.y - clickStartY);

    if (dist < 5 && e.button === 0 && hoverHex && !isGameOver) {
        tryPlaceTile(hoverHex.q, hoverHex.r);
    }
});

container.addEventListener('mouseleave', () => { isDragging = false; hoverHex = null; });

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.shiftKey) {
        const scaleFactor = 1.1;
        if (e.deltaY < 0) zoom *= scaleFactor; else zoom /= scaleFactor;
        zoom = Math.max(0.5, Math.min(3, zoom));
    } else {
        if (e.deltaY < 0) rotateCurrentTile(1); else rotateCurrentTile(-1);
    }
}, { passive: false });

container.addEventListener('contextmenu', e => e.preventDefault());

function loop() {
    updateParticles();
    drawFrame();
    requestAnimationFrame(loop);
}

// START
initGame();