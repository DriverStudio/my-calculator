const grid = document.getElementById('grid');
const countLabel = document.getElementById('countVal');
const modeLabel = document.getElementById('modeName');

// СОСТОЯНИЕ
let colors = []; 
let currentColorCount = 5;
const MAX_COLORS = 25;
const MIN_COLORS = 2;

// ==========================================
// 1. МАТЕМАТИКА ЦВЕТА (HSL to HEX)
// ==========================================
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Получаем числовую яркость (для сортировки и цвета текста)
function getLuminanceVal(hex) {
    const c = hex.substring(1);
    const r = parseInt(c.substring(0,2), 16);
    const g = parseInt(c.substring(2,4), 16);
    const b = parseInt(c.substring(4,6), 16);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getTextClass(hex) {
    return getLuminanceVal(hex) < 128 ? 'text-light' : 'text-dark';
}

// ==========================================
// 2. ГЕНЕРАТОР ГАРМОНИИ
// ==========================================
function generateNewColor(strategy, index, total) {
    // strategy: 'pastel', 'vibrant', 'dark', 'analogous'
    
    let h, s, l;

    switch (strategy) {
        case 'pastel': // Высокая яркость, низкая/средняя насыщенность
            h = Math.floor(Math.random() * 360);
            s = Math.floor(Math.random() * 40) + 60; // 60-100%
            l = Math.floor(Math.random() * 15) + 80; // 80-95%
            break;
        
        case 'dark': // Низкая яркость
            h = Math.floor(Math.random() * 360);
            s = Math.floor(Math.random() * 50) + 30;
            l = Math.floor(Math.random() * 20) + 10; // 10-30%
            break;

        case 'vibrant': // Высокая насыщенность
            h = Math.floor(Math.random() * 360);
            s = Math.floor(Math.random() * 20) + 80; // 80-100%
            l = Math.floor(Math.random() * 30) + 45; // 45-75%
            break;
            
        case 'analogous': // Цвета рядом друг с другом
            // Базовый цвет зависит от индекса, чтобы создать радугу
            const baseHue = Math.floor(Math.random() * 360);
            const step = 30; // Шаг оттенка
            h = (baseHue + (index * step)) % 360;
            s = Math.floor(Math.random() * 30) + 50; 
            l = Math.floor(Math.random() * 40) + 30;
            break;

        default: // Случайный, но сбалансированный
            h = Math.floor(Math.random() * 360);
            s = Math.floor(Math.random() * 50) + 50; // Не слишком серые
            l = Math.floor(Math.random() * 60) + 20; // Не черные и не белые
            break;
    }

    return hslToHex(h, s, l);
}

// ==========================================
// 3. ОСНОВНАЯ ЛОГИКА
// ==========================================

function initColors() {
    colors = [];
    for(let i=0; i<currentColorCount; i++) {
        colors.push({ hex: generateNewColor('default', i, currentColorCount), isLocked: false });
    }
    render();
}

function generatePalette() {
    // Выбираем случайную стратегию для этого нажатия
    const strategies = ['pastel', 'vibrant', 'dark', 'analogous', 'default'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    // Переводим название для юзера
    const names = {
        'pastel': 'Пастель', 'vibrant': 'Яркий', 'dark': 'Темный', 
        'analogous': 'Аналоговый', 'default': 'Случайный'
    };
    modeLabel.innerText = `Режим: ${names[strategy]}`;

    // Генерируем только незаблокированные
    colors.forEach((col, index) => {
        if (!col.isLocked) {
            col.hex = generateNewColor(strategy, index, currentColorCount);
        }
    });
    render();
}

function sortColors() {
    // Сортировка по яркости (Luminance)
    colors.sort((a, b) => getLuminanceVal(a.hex) - getLuminanceVal(b.hex));
    render();
}

function render() {
    grid.innerHTML = '';
    countLabel.innerText = currentColorCount;

    colors.forEach((colorObj, index) => {
        const col = document.createElement('div');
        col.className = `color-col ${getTextClass(colorObj.hex)}`;
        col.style.backgroundColor = colorObj.hex;

        col.innerHTML = `
            <div class="col-content">
                <button class="lock-btn ${colorObj.isLocked ? 'locked' : ''}" onclick="toggleLock(${index})">
                    ${colorObj.isLocked ? '🔒' : '🔓'}
                </button>
                <div class="hex-tag" onclick="copyColor('${colorObj.hex}')">${colorObj.hex}</div>
            </div>
        `;
        grid.appendChild(col);
    });
}

// ==========================================
// 4. УПРАВЛЕНИЕ
// ==========================================
window.toggleLock = (index) => {
    colors[index].isLocked = !colors[index].isLocked;
    render();
};

window.changeCount = (delta) => {
    const newCount = currentColorCount + delta;
    if (newCount >= MIN_COLORS && newCount <= MAX_COLORS) {
        currentColorCount = newCount;
        if (delta > 0) {
            // Добавляем новый (используем текущий режим для гармонии или дефолт)
            colors.push({ hex: generateNewColor('default', 0, 0), isLocked: false });
        } else {
            colors.pop();
        }
        render();
    }
};

window.copyColor = (hex) => {
    navigator.clipboard.writeText(hex).then(() => {
        const prevTitle = document.title;
        document.title = `Скопировано: ${hex}`;
        setTimeout(() => document.title = prevTitle, 1000);
    });
};

document.getElementById('btnGen').addEventListener('click', generatePalette);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); generatePalette(); }
});

// Сортировка доступна глобально
window.sortColors = sortColors;

// Старт
initColors();