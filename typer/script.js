const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hiddenInput = document.getElementById('hiddenInput');

// Словарь (JS, HTML, CSS термины)
const WORDS = [
    'function', 'return', 'const', 'let', 'var', 'import', 'export', 'class', 
    'div', 'span', 'script', 'style', 'head', 'body', 'meta', 'link',
    'color', 'width', 'height', 'margin', 'padding', 'border', 'flex', 'grid',
    'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined',
    'console', 'window', 'document', 'event', 'click', 'submit', 'change',
    'promise', 'async', 'await', 'fetch', 'json', 'parse', 'stringify',
    'node', 'npm', 'react', 'vue', 'angular', 'svelte', 'solid', 'next',
    'python', 'java', 'ruby', 'php', 'sql', 'mongo', 'redis', 'docker', 'git',
    'linux', 'bash', 'shell', 'terminal', 'server', 'client', 'http', 'https'
];

// Состояние игры
let state = {
    running: false,
    words: [], // { text: "div", x: 100, y: 0, speed: 1.5 }
    score: 0,
    lives: 3,
    buffer: "", // Что набрал юзер
    lastSpawn: 0,
    spawnRate: 2000, // мс
    particles: [] // Взрывы {x,y,vx,vy,life}
};

// Настройка Canvas
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// === GAME LOOP ===
function startGame() {
    state = { running: true, words: [], score: 0, lives: 3, buffer: "", lastSpawn: 0, spawnRate: 2000, particles: [] };
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    updateHUD();
    hiddenInput.value = '';
    hiddenInput.focus();
    requestAnimationFrame(loop);
}

function loop(timestamp) {
    if (!state.running) return;

    // 1. Очистка
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Шлейф
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Спавн слов
    if (timestamp - state.lastSpawn > state.spawnRate) {
        spawnWord();
        state.lastSpawn = timestamp;
        if (state.spawnRate > 500) state.spawnRate -= 20; // Усложнение
    }

    // 3. Обновление слов
    ctx.font = 'bold 20px monospace';
    state.words.forEach((word, idx) => {
        word.y += word.speed;

        // Отрисовка
        ctx.fillStyle = '#0f0';
        // Если часть слова уже набрана, подсвечиваем
        if (state.buffer.length > 0 && word.text.startsWith(state.buffer)) {
            const matchPart = word.text.substring(0, state.buffer.length);
            const restPart = word.text.substring(state.buffer.length);
            
            ctx.fillStyle = '#fff';
            ctx.fillText(matchPart, word.x, word.y);
            const w = ctx.measureText(matchPart).width;
            
            ctx.fillStyle = '#0f0';
            ctx.fillText(restPart, word.x + w, word.y);
        } else {
            ctx.fillText(word.text, word.x, word.y);
        }

        // Проверка проигрыша (слово упало)
        if (word.y > canvas.height) {
            state.lives--;
            state.words.splice(idx, 1);
            createExplosion(word.x, word.y, '#f00'); // Красный взрыв
            updateHUD();
            if (state.lives <= 0) gameOver();
        }
    });

    // 4. Частицы
    updateParticles();

    requestAnimationFrame(loop);
}

// === ЛОГИКА ===
function spawnWord() {
    const text = WORDS[Math.floor(Math.random() * WORDS.length)];
    const x = Math.random() * (canvas.width - 100) + 20;
    state.words.push({
        text: text,
        x: x,
        y: -20,
        speed: 1 + 0.05 * 1.5 + (state.score / 50) // Скорость растет от очков
    });
}

function updateHUD() {
    document.getElementById('scoreVal').innerText = state.score;
    document.getElementById('livesVal').innerText = '❤️'.repeat(state.lives);
}

function gameOver() {
    state.running = false;
    document.getElementById('finalScore').innerText = state.score;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// === ВВОД ===
window.addEventListener('keydown', (e) => {
    if (!state.running) return;
    
    // Игнорируем функциональные клавиши, кроме Backspace
    if (e.key.length > 1 && e.key !== 'Backspace') return;

    if (e.key === 'Backspace') {
        state.buffer = state.buffer.slice(0, -1);
    } else {
        // Фильтруем символы (только буквы)
        if (/[a-zA-Z]/.test(e.key)) {
            state.buffer += e.key.toLowerCase();
        }
    }
    
    checkInput();
});

function checkInput() {
    // Ищем слово, которое полностью совпадает с буфером
    const matchIdx = state.words.findIndex(w => w.text === state.buffer);
    
    if (matchIdx !== -1) {
        // УНИЧТОЖЕНИЕ!
        const word = state.words[matchIdx];
        createExplosion(word.x, word.y, '#0f0');
        state.words.splice(matchIdx, 1);
        state.score += 10;
        state.buffer = ""; // Сброс
        updateHUD();
    } else {
        // Проверяем, есть ли вообще слова, начинающиеся с этого буфера
        const potential = state.words.some(w => w.text.startsWith(state.buffer));
        if (!potential) {
            state.buffer = ""; // Ошибка -> сброс (можно добавить звук ошибки)
            // Визуально мигнуть красным можно
        }
    }
}

// === ВИЗУАЛ (ЧАСТИЦЫ) ===
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        state.particles.push({
            x: x + 20, y: y - 10,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            color: color
        });
    }
}

function updateParticles() {
    state.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1.0;
        
        if (p.life <= 0) state.particles.splice(i, 1);
    });
}