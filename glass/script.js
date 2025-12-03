/* script.js - Логика Генератора Стекла */

// Элементы управления
const inBlur = document.getElementById('inBlur');
const inOpacity = document.getElementById('inOpacity');
const inSaturate = document.getElementById('inSaturate');
const inColor = document.getElementById('inColor');
const inOutline = document.getElementById('inOutline');

// Текстовые метки
const valBlur = document.getElementById('valBlur');
const valOpacity = document.getElementById('valOpacity');
const valSaturate = document.getElementById('valSaturate');

// Цель и вывод
const target = document.getElementById('target');
const cssResult = document.getElementById('cssResult');

// Утилита: HEX -> RGB
function hexToRgb(hex) {
    // Убираем # если есть
    hex = hex.replace(/^#/, '');
    
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return `${r}, ${g}, ${b}`;
}

// Главная функция обновления
function updateGlass() {
    const blur = inBlur.value;
    const opacity = inOpacity.value;
    const saturate = inSaturate.value;
    const colorHex = inColor.value;
    const hasBorder = inOutline.checked;
    
    const rgb = hexToRgb(colorHex);

    // 1. Обновляем метки
    valBlur.innerText = `${blur}px`;
    valOpacity.innerText = opacity;
    valSaturate.innerText = `${saturate}%`;

    // 2. Формируем стили
    const bgStyle = `rgba(${rgb}, ${opacity})`;
    const borderStyle = hasBorder ? `1px solid rgba(255, 255, 255, 0.3)` : `none`;
    const backdropFilter = `blur(${blur}px) saturate(${saturate}%)`;
    
    // Текст внутри карточки должен контрастировать
    // Простая логика: если цвет стекла черный, текст белый, и наоборот (упрощенно оставим белый для красоты глассморфизма)
    target.style.color = (parseInt(hexToRgb(colorHex).split(',')[0]) > 200 && opacity > 0.5) ? '#333' : '#fff';

    // 3. Применяем к карточке
    target.style.background = bgStyle;
    target.style.backdropFilter = backdropFilter;
    target.style.webkitBackdropFilter = backdropFilter; // Для Safari
    target.style.border = borderStyle;

    // 4. Генерируем код
    const code = `
.glass-effect {
    background: ${bgStyle};
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: ${backdropFilter};
    -webkit-backdrop-filter: ${backdropFilter};
    border: ${borderStyle};
}`;
    
    // Вставляем код, убирая первый перенос строки
    cssResult.innerText = code.trim();
}

// Копирование
window.copyCSS = () => {
    navigator.clipboard.writeText(cssResult.innerText).then(() => {
        const originalText = cssResult.innerText;
        cssResult.style.background = '#28a745';
        cssResult.innerText = "✅ COPIED TO CLIPBOARD!";
        
        setTimeout(() => {
            cssResult.style.background = '#1e1e1e';
            cssResult.innerText = originalText;
        }, 1000);
    });
};

// Слушатели событий
[inBlur, inOpacity, inSaturate, inColor, inOutline].forEach(el => {
    el.addEventListener('input', updateGlass);
});

// Инициализация
updateGlass();