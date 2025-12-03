/* script.js - ГЕНЕРАТОР MESH ГРАДИЕНТОВ */

const meshTarget = document.getElementById('meshTarget');
const cssOut = document.getElementById('cssOut');
const colorsContainer = document.getElementById('colorsContainer');
const inSpeed = document.getElementById('inSpeed');
const inNoise = document.getElementById('inNoise');
const bgColorInput = document.getElementById('bgColor');

// Состояние
let colors = ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb']; // 4 цвета по умолчанию
let animationDuration = 10;

// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ ИНПУТОВ
// ==========================================
function initInputs() {
    colorsContainer.innerHTML = '';
    colors.forEach((col, idx) => {
        const div = document.createElement('div');
        div.className = 'color-input-wrap';
        div.innerHTML = `
            <input type="color" value="${col}" data-idx="${idx}" oninput="updateColor(this)">
            <span style="font-size:12px; font-family:monospace;">${col}</span>
        `;
        colorsContainer.appendChild(div);
    });
}

function updateColor(input) {
    const idx = input.getAttribute('data-idx');
    colors[idx] = input.value;
    input.nextElementSibling.innerText = input.value;
    render();
}

// ==========================================
// 2. ГЕНЕРАЦИЯ CSS
// ==========================================
function render() {
    const bg = bgColorInput.value;
    const speed = inSpeed.value;
    document.getElementById('valSpeed').innerText = `${speed}s`;
    
    // Включаем/выключаем шум
    document.getElementById('noiseLayer').style.opacity = inNoise.checked ? '0.08' : '0';

    // 1. Формируем статичные стили для превью
    // Мы используем background-image с множеством градиентов
    /*
      Трюк: используем radial-gradient, но с огромными размерами
      и позиционируем их в разных углах.
    */
    
    // Для превью мы просто используем animation, которую сгенерируем
    const css = generateCSS(bg, colors, speed);
    
    // Вставляем стили в страницу
    let styleTag = document.getElementById('mesh-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'mesh-style';
        document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = css;

    // Применяем класс к блоку
    meshTarget.className = 'mesh-target animated-mesh';
    
    // Выводим код для юзера (немного чистим от лишнего)
    cssOut.innerText = css.trim();
}

function generateCSS(bg, cols, duration) {
    /* Генерируем Keyframes.
       Идея: Двигаем background-position.
       Но для radial-gradient это работает специфично. 
       Лучше использовать анимацию трансформации или переменных, 
       но самый совместимый способ - это двигать background-position 
       у огромного background-size.
    */

    return `
.animated-mesh {
    background-color: ${bg};
    background-image: 
        radial-gradient(at 0% 0%, ${cols[0]} 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${cols[1]} 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${cols[2]} 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${cols[3]} 0px, transparent 50%);
    background-size: 180% 180%; /* Увеличиваем, чтобы было куда двигать */
    animation: mesh-move ${duration}s ease infinite alternate;
}

@keyframes mesh-move {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 50% 100%; }
}
`;
}

// ==========================================
// 3. РАНДОМАЙЗЕР (УМНЫЙ)
// ==========================================
function randomize() {
    // Палитры (Гармоничные сочетания)
    const palettes = [
        ['#FF9A9E', '#FECFEF', '#F6D365', '#FDA085'], // Sunset
        ['#a18cd1', '#fbc2eb', '#8fd3f4', '#84fab0'], // Aurora
        ['#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'], // Peach
        ['#28a745', '#84fab0', '#8fd3f4', '#f0f2f5'], // Fresh
        ['#0f172a', '#1e293b', '#334155', '#475569'], // Dark
        ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7']  // Cyber
    ];

    const p = palettes[Math.floor(Math.random() * palettes.length)];
    colors = [...p]; // Копируем
    
    initInputs();
    render();
}

// ==========================================
// 4. УТИЛИТЫ
// ==========================================
window.copyCSS = () => {
    navigator.clipboard.writeText(cssOut.innerText).then(() => alert('CSS Code Copied!'));
};

// События
inSpeed.addEventListener('input', render);
bgColorInput.addEventListener('input', render);
inNoise.addEventListener('change', render);

// Старт
initInputs();
render();