/* script.js - ГЕНЕРАТОР КЛЯКС */

const blob = document.getElementById('blob');
const output = document.getElementById('outputCode');
const gradientsDiv = document.getElementById('gradients');

// Слайдеры
const r1 = document.getElementById('r1'); // Top
const r2 = document.getElementById('r2'); // Right
const r3 = document.getElementById('r3'); // Bottom
const r4 = document.getElementById('r4'); // Left

// Пресеты градиентов
const GRADIENTS = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', // Pink
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Purple
    'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', // Blue-Green
    'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)', // Red-Orange
    '#28a745', // Solid Green
    '#333333'  // Solid Dark
];

let isAnimated = false;

// ==========================================
// 1. ЛОГИКА ФОРМЫ (Fancy Math)
// ==========================================
function updateBlob() {
    const v1 = r1.value;
    const v2 = r2.value;
    const v3 = r3.value;
    const v4 = r4.value;

    // Формула "Fancy Border Radius":
    // Top-Left | Top-Right | Bottom-Right | Bottom-Left / ...
    // Мы инвертируем значения, чтобы сохранить объем (100 - v)
    
    const radius = `${v1}% ${100 - v1}% ${100 - v3}% ${v3}% / ${100 - v4}% ${v2}% ${100 - v2}% ${v4}%`;
    
    blob.style.borderRadius = radius;
    
    // Если анимация выключена, показываем код radius
    if (!isAnimated) {
        output.innerText = `border-radius: ${radius};`;
        blob.style.animation = 'none';
    }
}

// ==========================================
// 2. ГЕНЕРАЦИЯ СЛУЧАЙНОЙ ФОРМЫ
// ==========================================
function randomize() {
    // Генерируем числа от 25 до 75 (чтобы не было совсем уродливых форм)
    const rand = () => Math.floor(Math.random() * 50) + 25;
    
    r1.value = rand();
    r2.value = rand();
    r3.value = rand();
    r4.value = rand();
    
    if (isAnimated) toggleAnimation(); // Останавливаем анимацию при ручном изменении
    updateBlob();
}

// ==========================================
// 3. АНИМАЦИЯ (ЖИВОЙ РЕЖИМ)
// ==========================================
function toggleAnimation() {
    const btn = document.getElementById('btnAnimate');
    
    if (isAnimated) {
        // Выключаем
        isAnimated = false;
        btn.innerHTML = '🎬 Оживить (Animate)';
        btn.classList.remove('active'); // Если есть класс для активной кнопки
        updateBlob(); // Возвращаем форму слайдеров
    } else {
        // Включаем
        isAnimated = true;
        btn.innerHTML = '⏹ Стоп';
        
        // Генерируем 3 случайных кадра
        const k1 = generateRandomRadius();
        const k2 = generateRandomRadius();
        const k3 = generateRandomRadius();
        
        // Вставляем стили анимации
        const cssAnim = `
@keyframes blob-move {
  0%, 100% { border-radius: ${blob.style.borderRadius}; }
  33% { border-radius: ${k1}; }
  66% { border-radius: ${k2}; }
}
.animated-blob {
  animation: blob-move 6s ease-in-out infinite;
}`;
        
        // Показываем этот код пользователю
        output.innerText = cssAnim.trim();
        
        // Применяем анимацию через вставку style (хак для динамических keyframes)
        let styleTag = document.getElementById('blob-anim-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'blob-anim-style';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = cssAnim;
        
        blob.style.animation = 'blob-move 6s ease-in-out infinite';
    }
}

function generateRandomRadius() {
    const r = () => Math.floor(Math.random() * 40) + 30; // 30-70%
    return `${r()}% ${100 - r()}% ${100 - r()}% ${r()}% / ${100 - r()}% ${r()}% ${100 - r()}% ${r()}%`;
}


// ==========================================
// 4. ИНИЦИАЛИЗАЦИЯ
// ==========================================

// Рендер цветов
GRADIENTS.forEach((g, i) => {
    const btn = document.createElement('div');
    btn.className = `gradient-btn ${i === 0 ? 'active' : ''}`;
    btn.style.background = g;
    btn.onclick = () => {
        document.querySelectorAll('.gradient-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        blob.style.background = g;
    };
    gradientsDiv.appendChild(btn);
});

// Слушатели
[r1, r2, r3, r4].forEach(el => {
    el.addEventListener('input', () => {
        if(isAnimated) toggleAnimation(); // Если тронул слайдер - стоп анимация
        updateBlob();
    });
});

document.getElementById('btnRandom').onclick = randomize;
document.getElementById('btnAnimate').onclick = toggleAnimation;
window.copyCSS = () => {
    navigator.clipboard.writeText(output.innerText).then(() => alert('CSS скопирован!'));
};

// Старт
randomize();