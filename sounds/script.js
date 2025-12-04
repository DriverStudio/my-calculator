/* script.js - SOUND MIXER PRO (SUBTLE FIRE FIX) */

const grid = document.getElementById('grid');
const statusText = document.getElementById('status');
const btnMute = document.getElementById('btnMute');

// ==========================================
// 1. БАЗА ЗВУКОВ
// ==========================================
const SOUNDS = [
    { 
        id: 'rain', name: 'Дождь', icon: '🌧️', 
        folder: './assets/rain',
        variants: [
            { name: 'Лёгкий', file: 'light.mp3' },
            { name: 'Ливень', file: 'heavy.mp3' },
            { name: 'По крыше', file: 'roof.mp3' }
        ]
    },
    { 
        id: 'thunder', name: 'Гроза', icon: '⚡', 
        folder: './assets/thunder',
        variants: [
            { name: 'Раскаты', file: 'distant.mp3' },
            { name: 'Сильная', file: 'heavy.mp3' }
        ]
    },
    { 
        id: 'fire', name: 'Камин', icon: '🔥', 
        folder: './assets/fire',
        variants: [
            { name: 'Уютный', file: 'normal.mp3' },
            { name: 'Треск', file: 'crackle.mp3' }
        ]
    },
    { 
        id: 'birds', name: 'Лес', icon: '🌲', 
        folder: './assets/forest',
        variants: [
            { name: 'Утро', file: 'morning.mp3' },
            { name: 'Птицы', file: 'birds.mp3' },
            { name: 'Ветер', file: 'wind.mp3' }
        ]
    },
    { 
        id: 'stream', name: 'Вода', icon: '💧', 
        folder: './assets/water',
        variants: [
            { name: 'Ручей', file: 'stream.mp3' },
            { name: 'Водопад', file: 'waterfall.mp3' },
            { name: 'Океан', file: 'ocean.mp3' }
        ]
    },
    { 
        id: 'cafe', name: 'Город', icon: '☕', 
        folder: './assets/city',
        variants: [
            { name: 'Кафе', file: 'cafe.mp3' },
            { name: 'Офис', file: 'library.mp3' },
            { name: 'Трафик', file: 'traffic.mp3' }
        ]
    },
    { 
        id: 'night', name: 'Ночь', icon: '🦗', 
        folder: './assets/night',
        variants: [
            { name: 'Сверчки', file: 'crickets.mp3' },
            { name: 'Костер', file: 'camp.mp3' }
        ]
    },
    { 
        id: 'keyboard', name: 'Тайпинг', icon: '⌨️', 
        folder: './assets/mech',
        variants: [
            { name: 'Мех', file: 'mechanical.mp3' }, // Исправил точку для ключа
            { name: 'Офис', file: 'office.mp3' }
        ]
    }
];

// ==========================================
// 2. ДВИЖОК
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
const mixers = {};
let isGlobalMute = false;
let isLocalFile = window.location.protocol === 'file:';

// Хелпер для перевода (ищет ключ в window.I18N или возвращает дефолт)
function getT(key, defaultText) {
    const lang = localStorage.getItem('lang') || 'ru';
    if (window.I18N && window.I18N[lang] && window.I18N[lang].sounds) {
        // Заменяем пробелы на подчеркивания для ключей, если нужно, или ищем как есть
        // В JSON мы используем ключи типа "По_крыше", а в данных "По крыше".
        // Пробуем оба варианта.
        const safeKey = key.replace(/\s/g, '_'); 
        const val = window.I18N[lang].sounds[safeKey] || window.I18N[lang].sounds[key];
        return val || defaultText;
    }
    return defaultText;
}

function initAudioContext() {
    if (isLocalFile) return null;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function init() {
    grid.innerHTML = '';
    initScene(); 
    
    document.addEventListener('mousemove', (e) => {
        document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    });

    if (isLocalFile) {
        const warnText = getT("Локальный_режим_Звук_работает_но_панорама_отключена", "⚠️ Локальный режим. Звук работает, но панорама отключена.");
        const warn = document.createElement('div');
        warn.style.cssText = "background:#fff3cd; color:#856404; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center; font-size:13px; border:1px solid #ffeeba;";
        warn.innerHTML = warnText;
        grid.parentNode.insertBefore(warn, grid);
    }

    // === СТИЛИ (оставляем без изменений) ===
    if (!document.getElementById('sound-styles')) {
        const style = document.createElement('style');
        style.id = 'sound-styles';
        style.innerHTML = `
            .card-controls { width: 100%; margin-top: 10px; opacity: 0.5; pointer-events: none; transition: 0.3s; }
            .sound-card.active .card-controls { opacity: 1; pointer-events: all; }
            .variants-row { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; margin-bottom: 15px; }
            .variant-btn { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 15px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: 0.2s; }
            .variant-btn:hover { border-color: var(--accent); color: var(--text-main); }
            .variant-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
            .slider-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px; color: var(--text-muted); }
            .slider-icon { width: 15px; text-align: center; }
            input[type="range"] { flex: 1; height: 4px; background: var(--border-color); border-radius: 2px; appearance: none; cursor: pointer; }
            input[type="range"]::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; background: var(--accent); border-radius: 50%; }
            .pan-slider::-webkit-slider-thumb { background: #888; border-radius: 2px; width: 8px; height: 14px; }
            .pan-disabled { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
            #scene-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }
            .scene-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 1.5s ease-in-out; }
            .scene-layer.visible { opacity: 1; }
            .scene-night { background: radial-gradient(circle 350px at var(--cursor-x, 50%) var(--cursor-y, 50%), transparent 0%, rgba(10, 15, 30, 0.3) 40%, rgba(5, 10, 25, 0.8) 100%); transition: opacity 1s ease; }
            .scene-fire { background: radial-gradient(ellipse at 50% 105%, rgba(255, 60, 0, 0.3) 0%, rgba(255, 100, 50, 0.1) 40%, transparent 60%); mix-blend-mode: screen; opacity: 0; }
            .scene-fire.visible { opacity: 1; animation: firePulse 5s infinite alternate ease-in-out; }
            @keyframes firePulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.1); opacity: 1; } }
            .scene-rain { background-image: url("data:image/svg+xml,%3Csvg width='20' height='60' viewBox='0 0 20 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0 L10 20' stroke='%23a4b9c9' stroke-width='0.5' stroke-opacity='0.3' stroke-linecap='round'/%3E%3C/svg%3E"); background-size: 200px 600px; animation: rainFall 1s linear infinite; }
            .scene-rain::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url("data:image/svg+xml,%3Csvg width='20' height='60' viewBox='0 0 20 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0 L10 15' stroke='%23a4b9c9' stroke-width='0.3' stroke-opacity='0.2' stroke-linecap='round'/%3E%3C/svg%3E"); background-size: 150px 500px; animation: rainFall 0.7s linear infinite; }
            @keyframes rainFall { from { background-position: 0 0; } to { background-position: 0 600px; } }
            .scene-thunder { background: #fff; opacity: 0; mix-blend-mode: screen; }
            .scene-thunder.flash { animation: thunderFlash 10s infinite; }
            @keyframes thunderFlash { 0%, 90% { opacity: 0; } 90.5% { opacity: 0.5; } 91% { opacity: 0; } 92% { opacity: 0.2; } 93% { opacity: 0; } 100% { opacity: 0; } }
            .scene-forest { background: linear-gradient(to bottom, transparent 60%, rgba(10, 40, 20, 0.2) 100%); pointer-events: none; }
            .error-msg { position: absolute; bottom: 5px; left: 0; width: 100%; font-size: 10px; color: #dc3545; background: rgba(255,255,255,0.9); padding: 2px; display: none; }
            .sound-card.error { border-color: #dc3545; }
            .sound-card.error .error-msg { display: block; }
        `;
        document.head.appendChild(style);
    }

    // ТЕКСТЫ ИНТЕРФЕЙСА
    const txtVol = getT("Громкость", "Громкость");
    const txtPan = getT("Баланс", "Баланс");
    const txtErr = getT("Ошибка", "Ошибка");
    const txtFileNotFound = getT("Файл_не_найден", "Файл не найден");

    SOUNDS.forEach(sound => {
        const audioEl = new Audio();
        audioEl.src = `${sound.folder}/${sound.variants[0].file}`;
        audioEl.loop = true;
        
        audioEl.onerror = (e) => {
            const card = document.getElementById(`card-${sound.id}`);
            if(card) {
                card.classList.add('error');
                card.querySelector('.error-msg').innerText = txtFileNotFound;
            }
        };

        mixers[sound.id] = {
            element: audioEl,
            sourceNode: null,
            gainNode: null,
            pannerNode: null,
            currentVolume: 0.5,
            currentPan: 0,
            isPlaying: false
        };

        const card = document.createElement('div');
        card.className = 'sound-card';
        card.id = `card-${sound.id}`;

        // Генерация кнопок вариантов с переводом
        const variantsHtml = sound.variants.map((v, idx) => {
            const variantName = getT(v.name, v.name);
            return `<button class="variant-btn ${idx===0?'active':''}" 
                     onclick="switchVariant('${sound.id}', ${idx}, this); event.stopPropagation()">
                ${variantName}
            </button>`;
        }).join('');

        const panClass = isLocalFile ? 'pan-disabled' : '';
        const soundName = getT(sound.name, sound.name);

        card.innerHTML = `
            <div class="sound-icon">${sound.icon}</div>
            <div class="sound-name">${soundName}</div>
            
            <div class="card-controls">
                <div class="variants-row">${variantsHtml}</div>
                <div class="slider-row" title="${txtVol}">
                    <div class="slider-icon">🔊</div>
                    <input type="range" min="0" max="1" step="0.01" value="0.5" 
                           oninput="setVolume('${sound.id}', this.value)"
                           onclick="event.stopPropagation()">
                </div>
                <div class="slider-row ${panClass}" title="${txtPan}">
                    <div class="slider-icon">↔️</div>
                    <input class="pan-slider" type="range" min="-1" max="1" step="0.1" value="0" 
                           oninput="setPan('${sound.id}', this.value)"
                           onclick="event.stopPropagation()">
                </div>
            </div>
            <div class="error-msg">${txtErr}</div>
        `;

        card.onclick = (e) => {
            if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
            toggleSound(sound.id);
        };

        grid.appendChild(card);
    });

    updateStatus(); // Обновить статус сразу после инициализации
}

// ==========================================
// 3. SCENE MANAGER
// ==========================================
function initScene() {
    if (!document.getElementById('scene-root')) {
        const root = document.createElement('div');
        root.id = 'scene-root';
        root.innerHTML = `
            <div id="layer-night" class="scene-layer scene-night"></div>
            <div id="layer-forest" class="scene-layer scene-forest"></div>
            <div id="layer-rain" class="scene-layer scene-rain"></div>
            <div id="layer-thunder" class="scene-layer scene-thunder"></div>
            <div id="layer-fire" class="scene-layer scene-fire"></div>
        `;
        document.body.prepend(root);
    }
}

function updateScene() {
    const activeIds = Object.keys(mixers).filter(id => mixers[id].isPlaying);
    
    const setVisible = (layerId, isVisible) => {
        const el = document.getElementById(layerId);
        if (el) {
            if (isVisible) el.classList.add('visible');
            else el.classList.remove('visible');
        }
    };

    setVisible('layer-night', activeIds.includes('night'));
    setVisible('layer-rain', activeIds.includes('rain'));
    
    const thunderEl = document.getElementById('layer-thunder');
    if (thunderEl) {
        if (activeIds.includes('thunder')) thunderEl.classList.add('flash');
        else thunderEl.classList.remove('flash');
    }
    
    setVisible('layer-fire', activeIds.includes('fire'));
    setVisible('layer-forest', activeIds.includes('birds') || activeIds.includes('stream'));
}

// ==========================================
// 4. УПРАВЛЕНИЕ ЗВУКОМ
// ==========================================

async function toggleSound(id) {
    const mix = mixers[id];
    const card = document.getElementById(`card-${id}`);

    if (isLocalFile) {
        if (!mix.isPlaying) {
            mix.isPlaying = true;
            card.classList.add('active');
            mix.element.volume = mix.currentVolume;
            mix.element.play().catch(e => {
                console.error(e);
                alert(getT("Ошибка", "Ошибка"));
                mix.isPlaying = false;
                card.classList.remove('active');
            });
        } else {
            mix.isPlaying = false;
            card.classList.remove('active');
            mix.element.pause();
        }
        updateScene();
        updateStatus();
        return;
    }

    const ctx = initAudioContext();
    if (ctx && ctx.state === 'suspended') await ctx.resume();

    if (!mix.sourceNode) {
        try {
            mix.sourceNode = ctx.createMediaElementSource(mix.element);
            mix.gainNode = ctx.createGain();
            mix.pannerNode = ctx.createStereoPanner();
            mix.sourceNode.connect(mix.gainNode);
            mix.gainNode.connect(mix.pannerNode);
            mix.pannerNode.connect(ctx.destination);
        } catch (e) {
            console.error("Web Audio Error", e);
            isLocalFile = true;
            toggleSound(id);
            return;
        }
    }

    if (!mix.isPlaying) {
        mix.isPlaying = true;
        card.classList.add('active');
        mix.gainNode.gain.cancelScheduledValues(ctx.currentTime);
        mix.gainNode.gain.setValueAtTime(0, ctx.currentTime);
        mix.element.play().then(() => {
            mix.gainNode.gain.linearRampToValueAtTime(mix.currentVolume, ctx.currentTime + 0.5);
            updateScene(); 
            updateStatus();
        }).catch(e => {
            mix.isPlaying = false;
            card.classList.remove('active');
        });
    } else {
        mix.isPlaying = false;
        card.classList.remove('active');
        mix.gainNode.gain.cancelScheduledValues(ctx.currentTime);
        mix.gainNode.gain.setValueAtTime(mix.gainNode.gain.value, ctx.currentTime);
        mix.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => { if (!mix.isPlaying) mix.element.pause(); }, 1000);
        updateScene(); 
        updateStatus();
    }
}

function setVolume(id, val) {
    const mix = mixers[id];
    mix.currentVolume = parseFloat(val);
    if (isLocalFile) { mix.element.volume = mix.currentVolume; return; }
    if (mix.isPlaying && mix.gainNode && audioCtx) {
        mix.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        mix.gainNode.gain.linearRampToValueAtTime(mix.currentVolume, audioCtx.currentTime + 0.1);
    }
}

function setPan(id, val) {
    if (isLocalFile) return;
    initAudioContext();
    const mix = mixers[id];
    mix.currentPan = parseFloat(val);
    if (mix.pannerNode && audioCtx) {
        mix.pannerNode.pan.setValueAtTime(mix.currentPan, audioCtx.currentTime);
    }
}

function switchVariant(id, idx, btn) {
    const mix = mixers[id];
    const soundData = SOUNDS.find(s => s.id === id);
    const newSrc = `${soundData.folder}/${soundData.variants[idx].file}`;
    const card = document.getElementById(`card-${id}`);
    card.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (mix.isPlaying) {
        if (isLocalFile) {
            mix.element.src = newSrc;
            mix.element.play();
        } else {
            mix.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
            setTimeout(() => {
                mix.element.src = newSrc;
                mix.element.play();
                mix.gainNode.gain.linearRampToValueAtTime(mix.currentVolume, audioCtx.currentTime + 0.4);
            }, 250);
        }
    } else {
        mix.element.src = newSrc;
    }
}

function toggleMuteAll() {
    isGlobalMute = !isGlobalMute;
    if (isLocalFile) {
        Object.values(mixers).forEach(m => m.element.muted = isGlobalMute);
    } else {
        if (audioCtx) isGlobalMute ? audioCtx.suspend() : audioCtx.resume();
    }
    btnMute.innerText = isGlobalMute ? '🔇' : '🔈';
}

function stopAll() {
    Object.keys(mixers).forEach(id => {
        const mix = mixers[id];
        if (mix.isPlaying) toggleSound(id);
    });
}

function updateStatus() {
    const count = Object.values(mixers).filter(m => m.isPlaying).length;
    const txtActive = getT("Активных_звуков", "Активных звуков:");
    const txtSilence = getT("Тишина", "Тишина...");
    statusText.innerText = count > 0 ? `${txtActive} ${count}` : txtSilence;
}

init();