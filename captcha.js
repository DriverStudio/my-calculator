/* captcha.js - Движок мини-игр */

const CAPTCHA_CONFIG = {
    minTime: 60 * 1000, // Минимум 60 секунд
    maxTime: 180 * 1000 // Максимум 3 минуты
};

let captchaTimer = null;

// Запуск таймера (вызывается при старте)
function initCaptchaSystem() {
    scheduleNextCaptcha();

    // Создаем HTML модалки один раз
    const overlay = document.createElement('div');
    overlay.className = 'captcha-overlay';
    overlay.id = 'captchaModal';
    overlay.innerHTML = `
        <div class="captcha-box">
            <div id="captchaTitle" class="captcha-title">Задание</div>
            <div id="captchaArea" class="captcha-game-area"></div>
            <p style="font-size:12px; color:#999; margin-top:10px">Выполните задание, чтобы продолжить</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function scheduleNextCaptcha() {
    const delay = Math.random() * (CAPTCHA_CONFIG.maxTime - CAPTCHA_CONFIG.minTime) + CAPTCHA_CONFIG.minTime;
    // Для тестов можно раскомментировать строку ниже (каждые 10 сек):
    // const delay = 10000; 
    console.log(`🤖 Следующая капча через ${Math.round(delay/1000)} сек.`);

    clearTimeout(captchaTimer);
    captchaTimer = setTimeout(showRandomGame, delay);
}

function showRandomGame() {
    const modal = document.getElementById('captchaModal');
    const area = document.getElementById('captchaArea');
    const title = document.getElementById('captchaTitle');

    modal.style.display = 'flex';
    area.innerHTML = ''; // Очистка

    // Список доступных игр
    const games = [
        playWipeScreen,
        playRocketLaunch,
        playFeedCat,
        playBonfire,
        playHarvest,
        playFixWires,
        playCoinDrop,
        playSwitches,
        playBuildBridge
    ];

    // Выбираем случайную
    const randomGame = games[Math.floor(Math.random() * games.length)];
    randomGame(area, title, onSuccess);
}

function onSuccess() {
    const modal = document.getElementById('captchaModal');
    const title = document.getElementById('captchaTitle');

    title.innerText = "✅ Отлично!";
    title.style.color = "#28a745";

    setTimeout(() => {
        modal.style.display = 'none';
        title.style.color = "#333"; // Сброс цвета
        scheduleNextCaptcha(); // Планируем следующую
    }, 800);
}

// ==========================================
// 🎮 ИГРА 1: ПОЧИСТИ ЭКРАН (WIPE)
// ==========================================
function playWipeScreen(container, titleLabel, callback) {
    titleLabel.innerText = "🧼 Почисти экран!";

    const grid = document.createElement('div');
    grid.className = 'dirt-grid';

    let totalCells = 100;
    let cleaned = 0;

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'dirt-cell';

        // Логика очистки при наведении
        cell.onmouseenter = () => {
            if (!cell.classList.contains('clean')) {
                cell.classList.add('clean');
                cleaned++;
                // Если очистили 85% - победа
                if (cleaned > 85) callback();
            }
        };
        // Для мобилок (touch)
        cell.ontouchstart = cell.onmouseenter;

        grid.appendChild(cell);
    }

    // Фоновая картинка (под грязью), можно логотип или котика
    container.style.background = 'url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2s2eW54eXJ5YnJ5YnJ5YnJ5/xT0xeuOy2Fcl9vDGiA/giphy.gif") center/cover';
    container.appendChild(grid);
}

// ==========================================
// 🎮 ИГРА 2: ЗАПУСТИ РАКЕТУ (TIMING)
// ==========================================
function playRocketLaunch(container, titleLabel, callback) {
    titleLabel.innerText = "🚀 Нажми в зеленой зоне!";
    container.style.background = '#222';

    container.innerHTML = `
        <div class="rocket-bar">
            <div class="rocket-target" id="targetZone"></div>
            <div class="rocket-cursor" id="cursor"></div>
        </div>
        <div style="position:absolute; color:white; opacity:0.3; font-size:80px">🌍</div>
    `;

    // Обработчик клика
    const handleClick = () => {
        const cursor = document.getElementById('cursor');
        const target = document.getElementById('targetZone');

        const cRect = cursor.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();

        // Проверка пересечения
        // (Верх курсора <= Низ цели) И (Низ курсора >= Верх цели)
        if (cRect.top <= tRect.bottom && cRect.bottom >= tRect.top) {
            container.innerHTML = '<div style="font-size:60px">🚀✨</div>';
            callback();
        } else {
            // Ошибка - красная вспышка
            container.style.background = '#500';
            setTimeout(() => container.style.background = '#222', 200);
        }
    };

    container.onclick = handleClick;
}

// ==========================================
// 🎮 ИГРА 3: ПОКОРМИ КОТА (LOGIC)
// ==========================================
function playFeedCat(container, titleLabel, callback) {
    titleLabel.innerText = "🐟 Что ест кот?";
    container.style.background = '#ffe8cc';

    const foods = [
        { icon: '🥦', correct: false },
        { icon: '🐟', correct: true },
        { icon: '🌶️', correct: false }
    ];

    // Перемешиваем
    foods.sort(() => Math.random() - 0.5);

    let html = `<div class="cat-main">😺</div><div class="cat-food-container">`;
    foods.forEach(item => {
        html += `<div class="cat-btn" data-correct="${item.correct}">${item.icon}</div>`;
    });
    html += `</div>`;

    container.innerHTML = html;

    // Логика кликов
    const buttons = container.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation(); // Чтобы не сработало на контейнере
            if (btn.dataset.correct === 'true') {
                container.querySelector('.cat-main').innerText = '😻';
                callback();
            } else {
                container.querySelector('.cat-main').innerText = '😾';
                btn.style.opacity = '0'; // Исчезает неправильный вариант
            }
        };
    });
}

// ==========================================
// 🎮 ИГРА 4: РАЗДУЙ КОСТЕР (RAPID CLICK)
// ==========================================
function playBonfire(container, titleLabel, callback) {
    titleLabel.innerText = "🔥 Раздуй огонь до 100%!";

    let heat = 30; // Начальная температура
    let isPlaying = true;

    container.innerHTML = `
        <div class="fire-container">
            <div class="fire-emoji" id="fireBtn">🔥</div>
            <div class="fire-bar-bg"><div class="fire-bar-fill" id="fireBar" style="width:30%"></div></div>
            <div style="font-size:12px; color:#777; margin-top:5px">Кликай быстро!</div>
        </div>
    `;

    const bar = document.getElementById('fireBar');
    const btn = document.getElementById('fireBtn');

    // Клик добавляет жар
    btn.onclick = () => {
        if (!isPlaying) return;
        heat += 8;
        if (heat >= 100) {
            heat = 100;
            isPlaying = false;
            bar.style.width = '100%';
            btn.style.transform = 'scale(1.5)';
            callback();
        }
        updateVisuals();
    };

    // Огонь затухает со временем
    const decay = setInterval(() => {
        if (!isPlaying) { clearInterval(decay); return; }

        heat -= 2; // Скорость затухания
        if (heat < 0) heat = 0;
        updateVisuals();
    }, 100); // Каждые 100мс

    function updateVisuals() {
        bar.style.width = heat + '%';
        // Меняем размер смайлика от температуры
        const scale = 1 + (heat / 200);
        if (isPlaying) btn.style.transform = `scale(${scale})`;
    }
}

// ==========================================
// 🎮 ИГРА 5: СОБЕРИ УРОЖАЙ (CLICK/TAP)
// ==========================================
function playHarvest(container, titleLabel, callback) {
    titleLabel.innerText = "🥕 Собери все овощи!";
    container.innerHTML = '<div class="harvest-area" id="harvestField"></div>';

    const field = document.getElementById('harvestField');
    const veggies = ['🥕', '🥔', '🍅', '🍆', '🥦'];
    const totalItems = 6;
    let collected = 0;

    for (let i = 0; i < totalItems; i++) {
        const item = document.createElement('div');
        item.className = 'harvest-item';
        // Случайный овощ
        item.innerText = veggies[Math.floor(Math.random() * veggies.length)];

        // Случайная позиция (с отступами, чтобы не вылезло за край)
        item.style.top = Math.random() * 80 + 10 + '%';
        item.style.left = Math.random() * 80 + 10 + '%';

        // Клик - сбор
        item.onmousedown = () => collect(item);
        item.ontouchstart = () => collect(item); // Для мобилок

        field.appendChild(item);
    }

    function collect(el) {
        if (el.style.display === 'none') return;

        el.style.transform = 'scale(0)';
        el.style.opacity = '0';
        setTimeout(() => el.style.display = 'none', 200);

        collected++;
        if (collected >= totalItems) {
            setTimeout(callback, 300);
        }
    }
}

// ==========================================
// 🎮 ИГРА 6: ПОЧИНИ ПРОВОДКУ (ROTATE PUZZLE)
// ==========================================
function playFixWires(container, titleLabel, callback) {
    titleLabel.innerText = "🔌 Соедини провода (в линию)";

    // Генерируем 4 куска провода
    let pieces = [0, 0, 0, 0]; // 0 = горизонтально, 1 = вертикально

    // Перемешиваем (ставим случайный поворот)
    pieces = pieces.map(() => Math.random() > 0.5 ? 1 : 0);

    // Проверка, вдруг случайно собралось само (редко, но бывает)
    if (pieces.every(p => p === 0)) pieces[0] = 1;

    const grid = document.createElement('div');
    grid.className = 'wire-grid';

    pieces.forEach((state, index) => {
        const piece = document.createElement('div');
        piece.className = 'wire-piece';

        const line = document.createElement('div');
        line.className = 'wire-line';

        // Функция отрисовки поворота
        const updateRotate = () => {
            line.style.transform = pieces[index] === 0 ? 'rotate(0deg)' : 'rotate(90deg)';
            // Подсветка, если стоит правильно (горизонтально)
            if (pieces[index] === 0) piece.classList.add('active');
            else piece.classList.remove('active');
        };

        piece.appendChild(line);
        grid.appendChild(piece);

        updateRotate(); // Первый рендер

        // Клик - поворот
        piece.onclick = () => {
            pieces[index] = pieces[index] === 0 ? 1 : 0; // Переключение 0 <-> 1
            updateRotate();
            checkWin();
        };
    });

    container.appendChild(grid);

    function checkWin() {
        // Победа, если ВСЕ кусочки равны 0 (горизонтально)
        if (pieces.every(p => p === 0)) {
            callback();
        }
    }
}

// ==========================================
// 🎮 ИГРА 7: ПОЙМАЙ МОНЕТУ (TIMING DROP)
// ==========================================
function playCoinDrop(container, titleLabel, callback) {
    titleLabel.innerText = "🪙 Поймай монету в кошелек!";
    
    container.innerHTML = `
        <div class="coin-track">
            <div class="coin-wallet" id="walletZone">👛</div>
            <div class="coin-obj" id="fallingCoin">🪙</div>
        </div>
        <button id="catchBtn" style="margin-top:10px; padding:5px 20px; cursor:pointer;">ХВАТЬ!</button>
    `;
    
    const btn = document.getElementById('catchBtn');
    const coin = document.getElementById('fallingCoin');
    const wallet = document.getElementById('walletZone');
    
    btn.onclick = () => {
        // Получаем координаты
        const cRect = coin.getBoundingClientRect();
        const wRect = wallet.getBoundingClientRect();
        
        // Проверяем пересечение центров
        const cCenter = cRect.top + cRect.height/2;
        const wTop = wRect.top;
        const wBottom = wRect.bottom;
        
        // Если центр монеты внутри кошелька
        if (cCenter >= wTop && cCenter <= wBottom) {
            coin.style.animation = 'none'; // Остановить падение
            coin.style.top = '130px'; // Зафиксировать в кошельке
            wallet.style.borderColor = '#FFD700';
            wallet.style.background = '#FFF8DC';
            btn.innerText = 'ПОЙМАЛ!';
            callback();
        } else {
            // Промах
            btn.style.background = '#dc3545';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.style.background = '';
                btn.style.color = '';
            }, 300);
        }
    };
}

// ==========================================
// 🎮 ИГРА 8: ВКЛЮЧИ СВЕТ (TOGGLE)
// ==========================================
function playSwitches(container, titleLabel, callback) {
    titleLabel.innerText = "💡 Включи все рубильники";
    
    const count = 4;
    let activeCount = 0;
    
    const row = document.createElement('div');
    row.className = 'switch-row';
    
    for(let i=0; i<count; i++) {
        const sw = document.createElement('div');
        sw.className = 'switch-item';
        sw.innerHTML = '<div class="switch-knob"></div>';
        
        sw.onclick = () => {
            if (sw.classList.contains('active')) return; // Уже включен
            
            sw.classList.add('active');
            activeCount++;
            
            // Звук щелчка (визуальный)
            sw.style.transform = 'scale(0.95)';
            setTimeout(() => sw.style.transform = 'scale(1)', 100);
            
            if (activeCount === count) {
                setTimeout(callback, 300);
            }
        };
        
        row.appendChild(sw);
    }
    
    container.appendChild(row);
}

// ==========================================
// 🎮 ИГРА 9: ПОСТРОЙ МОСТ (CONSTRUCTION)
// ==========================================
function playBuildBridge(container, titleLabel, callback) {
    titleLabel.innerText = "🌉 Построй мост (Кликай)";
    
    container.innerHTML = `
        <div class="bridge-scene">
            <div class="cliff">⛰️</div>
            <div class="bridge-gap" id="bridgeGap"></div>
            <div class="cliff">🏁</div>
        </div>
        <div style="text-align:center; color:#777; font-size:12px">Кликни 3 раза</div>
    `;
    
    const gap = document.getElementById('bridgeGap');
    let steps = 0;
    const maxSteps = 3;
    
    // Создаем доски заранее, но скрываем
    for(let i=0; i<maxSteps; i++) {
        const plank = document.createElement('div');
        plank.className = 'plank';
        // Распределяем ширину: 33% каждая
        plank.style.width = '32%';
        plank.style.left = (i * 34) + '%';
        plank.id = `plank-${i}`;
        gap.appendChild(plank);
    }
    
    container.onclick = () => {
        if (steps >= maxSteps) return;
        
        const p = document.getElementById(`plank-${steps}`);
        p.classList.add('placed');
        steps++;
        
        if (steps === maxSteps) {
            // Анимация прохода (человечек)
            const walker = document.createElement('div');
            walker.innerText = '🚶';
            walker.style.position = 'absolute';
            walker.style.left = '0';
            walker.style.top = '-25px';
            walker.style.transition = 'left 1s linear';
            gap.appendChild(walker);
            
            // Запускаем анимацию ходьбы
            setTimeout(() => {
                walker.style.left = '90%';
            }, 50);
            
            setTimeout(callback, 1200);
        }
    };
}