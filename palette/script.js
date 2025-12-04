const grid = document.getElementById('grid');
const countLabel = document.getElementById('countVal');
const modeSelect = document.getElementById('modeSelect');

// СОСТОЯНИЕ
let colors = []; 
let currentColorCount = 5;
const MAX_COLORS = 25;
const MIN_COLORS = 2;

// ==========================================
// 1. МАТЕМАТИКА ЦВЕТА (HSL to HEX)
// ==========================================
function hslToHex(h, s, l) {
    // Нормализация значений
    if (s > 100) s = 100; if (s < 0) s = 0;
    if (l > 100) l = 100; if (l < 0) l = 0;
    h = h % 360; 
    if (h < 0) h += 360;

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
/**
 * @param {string} strategy - режим генерации
 * @param {number} index - индекс текущего цвета в массиве (0..N)
 * @param {number} total - всего цветов
 * @param {number} baseHue - базовый оттенок (0-360), общий для всей палитры
 */
function generateNewColor(strategy, index, total, baseHue) {
    let h, s, l;

    // Вспомогательная функция для random
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    switch (strategy) {
        case 'pastel': 
            h = rand(0, 360);
            s = rand(60, 90); 
            l = rand(80, 95); 
            break;
        
        case 'dark': 
            h = rand(0, 360);
            s = rand(30, 70);
            l = rand(10, 25); 
            break;

        case 'light': 
            h = rand(0, 360);
            s = rand(30, 60);
            l = rand(90, 98); 
            break;

        case 'vibrant': 
            h = rand(0, 360);
            s = rand(85, 100); 
            l = rand(45, 65); 
            break;

        case 'neon': 
            h = rand(0, 360);
            s = 100; 
            l = 50; 
            break;
            
        case 'monochrome': 
            // Один Hue, разные S и L
            h = baseHue; 
            s = rand(30, 90);
            // Распределяем яркость равномерно, чтобы цвета не сливались
            const stepM = 80 / (total || 1);
            l = 10 + (index * stepM) + rand(-5, 5); 
            break;

        case 'analogous': 
            // Цвета рядом друг с другом (веер 30-60 градусов)
            const angleA = 40; 
            // Смещение: -angle/2 ... +angle/2
            const offsetA = (index / (total-1 || 1)) * angleA - (angleA/2);
            h = baseHue + offsetA + rand(-5, 5);
            s = rand(60, 90); 
            l = rand(40, 70);
            break;
        
        case 'triad': 
            // 3 точки на круге (0, 120, 240)
            const triadStep = Math.floor(index % 3) * 120;
            h = baseHue + triadStep + rand(-10, 10);
            s = rand(60, 90);
            l = rand(40, 70);
            break;

        case 'warm': 
            // Красный, оранжевый, желтый (Hue 330..60)
            // Делаем трюк с модулем, чтобы пройти через 0
            const warmBase = rand(-30, 60); 
            h = warmBase;
            s = rand(60, 90);
            l = rand(40, 80);
            break;
        
        case 'cold': 
            // Синий, голубой, фиолетовый (Hue 170..270)
            h = rand(170, 270);
            s = rand(50, 90);
            l = rand(30, 80);
            break;

        case 'vintage': 
            // Сниженная насыщенность, теплые или блеклые тона
            h = rand(0, 360);
            s = rand(10, 50);
            l = rand(40, 70);
            break;

        default: // 'random' и прочее
            h = rand(0, 360);
            s = rand(40, 95); 
            l = rand(30, 80);
            break;
    }

    return hslToHex(h, s, l);
}

// ==========================================
// 3. ОСНОВНАЯ ЛОГИКА
// ==========================================

function initColors() {
    colors = [];
    generatePalette(); // Используем основную функцию для старта
}

function generatePalette() {
    let strategy = modeSelect.value;
    
    // Список стратегий для рандома
    const strategies = ['pastel', 'vibrant', 'dark', 'monochrome', 'analogous', 'triad', 'warm', 'cold', 'vintage'];
    
    if (strategy === 'random') {
        strategy = strategies[Math.floor(Math.random() * strategies.length)];
        // Можно визуально показать в консоли, какой режим выпал, или обновить селект (по желанию)
        // console.log("Auto mode picked:", strategy); 
    }

    // Генерируем БАЗОВЫЙ ОТТЕНОК для этого нажатия
    // Это важно для режимов Monochromatic, Analogous, Triad,
    // чтобы они выглядели как единая палитра.
    const baseHue = Math.floor(Math.random() * 360);

    // Если массив пуст (первый запуск), заполняем заглушками
    if (colors.length < currentColorCount) {
        for(let i=0; i<currentColorCount; i++) {
            colors.push({ hex: '#000000', isLocked: false });
        }
    } else {
        // Если уменьшали и увеличивали количество, массив может быть не той длины
        while(colors.length < currentColorCount) colors.push({ hex: '#000000', isLocked: false });
        while(colors.length > currentColorCount) colors.pop();
    }

    // Применяем цвета
    colors.forEach((col, index) => {
        if (!col.isLocked) {
            col.hex = generateNewColor(strategy, index, currentColorCount, baseHue);
        }
    });
    
    render();
}

function sortColors() {
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
        
        // При добавлении сразу генерируем цвет, соответствующий текущей палитре
        // Но так как мы не знаем текущий baseHue предыдущей генерации, 
        // просто генерируем случайный совместимый или 'default'.
        // Для простоты — перегенерируем незалоченные или добавляем рандом.
        if (delta > 0) {
            const tempHue = Math.floor(Math.random() * 360);
            colors.push({ 
                hex: generateNewColor(modeSelect.value === 'random' ? 'default' : modeSelect.value, colors.length, newCount, tempHue), 
                isLocked: false 
            });
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
    // Генерируем только если фокус не на селекте (иначе пробел открывает селект)
    if (e.code === 'Space' && document.activeElement !== modeSelect) { 
        e.preventDefault(); 
        generatePalette(); 
    }
});

// Экспорт функций
window.sortColors = sortColors;
window.generatePalette = generatePalette;

// Старт
initColors();