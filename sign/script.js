/* sign/script.js - CALLIGRAPHY EDITION */

const canvas = document.getElementById('signCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');

// Элементы управления
const colorPicker = document.getElementById('colorPicker');
const minWidthInput = document.getElementById('minWidthVal');
const maxWidthInput = document.getElementById('maxWidthVal');

// === НАСТРОЙКИ ПЕРА ===
// Чем выше PEN_SMOOTHING, тем более плавная, но "ленивая" линия. 0.5 - золотая середина.
const PEN_SMOOTHING = 0.5; 
// Насколько быстро толщина реагирует на скорость. Меньше = плавнее переход толщины.
// Небольшое уменьшение веса фильтра делает ползунки и изменения более отзывчивыми.
const VELOCITY_FILTER_WEIGHT = 0.6; 

let isDrawing = false;
let points = []; // Храним историю точек для сглаживания
let lastVelocity = 0;
let lastWidth = (parseFloat(minWidthInput.value) + parseFloat(maxWidthInput.value)) / 2;

// Обновление значений при изменении ползунков
function onWidthInputsChange() {
    const min = parseFloat(minWidthInput.value);
    const max = parseFloat(maxWidthInput.value);
    // Гарантируем, что min <= max
    if (min > max) {
        // Если пользователь случайно поставил min больше max — синхронизируем max
        maxWidthInput.value = min;
    }
    // Обновляем lastWidth, чтобы визуально изменение было заметно сразу
    lastWidth = (parseFloat(minWidthInput.value) + parseFloat(maxWidthInput.value)) / 2;
    // Сбрасываем скорость, чтобы пользователь мог сразу получить толстую/тонкую линию
    lastVelocity = 0;
}

minWidthInput.addEventListener('input', onWidthInputsChange);
maxWidthInput.addEventListener('input', onWidthInputsChange);

// === ИНИЦИАЛИЗАЦИЯ ===
// Device pixel ratio used to convert CSS pixels -> device pixels
let DPR = window.devicePixelRatio || 1;

function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    DPR = window.devicePixelRatio || 1;

    // Use container size (CSS pixels) and scale backing store by DPR
    const cssWidth = Math.max(1, Math.floor(rect.width));
    const cssHeight = Math.max(1, Math.floor(rect.height) || 400);

    // Set CSS size (what the element looks like on screen)
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    // Set actual drawing buffer size (device pixels)
    canvas.width = Math.floor(cssWidth * DPR);
    canvas.height = Math.floor(cssHeight * DPR);

    // Reset any previous transforms so we work in device-pixel coordinates
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Базовые настройки кисти
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Сбрасываем состояние при ресайзе
    points = [];
    isDrawing = false;
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// === МАТЕМАТИКА КАЛЛИГРАФИИ ===

// 1. Расчет скорости движения между двумя точками
function calculateVelocity(p1, p2) {
    const time = p2.time - p1.time;
    if (!time) return lastVelocity; // Защита от деления на ноль
    const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    return distance / time;
}

// 2. Определение толщины линии на основе скорости
function getLineWidth(velocity) {
    const minW = parseFloat(minWidthInput.value);
    const maxW = parseFloat(maxWidthInput.value);
    
    // Чем быстрее скорость, тем тоньше линия.
    // Коэффициенты подобраны эмпирически для приятного ощущения.
    // Можно поиграть с числом 100, чтобы изменить чувствительность.
    let newWidth = maxW / (velocity + 1) * (100 / (maxW * 2));

    // Ограничиваем диапазоном, заданным пользователем
    newWidth = Math.min(maxW, Math.max(minW, newWidth));
    
    return newWidth;
}


// === РИСОВАНИЕ ===

function startDrawing(e) {
    isDrawing = true;
    const coords = getCoords(e);
    // Добавляем первую точку с отметкой времени
    points.push({ x: coords.x, y: coords.y, time: Date.now() });
    
    // Сброс параметров для нового штриха
    lastVelocity = 0;
    lastWidth = (parseFloat(minWidthInput.value) + parseFloat(maxWidthInput.value)) / 2;
    
    // Рисуем точку в начале, чтобы можно было ставить просто точки
    ctx.beginPath();
    ctx.fillStyle = colorPicker.value;
    // Рисуем круг чуть меньше минимальной толщины
    ctx.arc(coords.x, coords.y, (parseFloat(minWidthInput.value) / 2) * DPR, 0, Math.PI * 2);
    ctx.fill();
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoords(e);
    points.push({ x: coords.x, y: coords.y, time: Date.now() });

    // Нам нужно минимум 3 точки для построения плавной кривой Безье
    if (points.length < 3) return;

    // Берем последние 3 точки
    const p0 = points[points.length - 3]; // Пред-предыдущая
    const p1 = points[points.length - 2]; // Предыдущая (будет контрольной точкой)
    const p2 = points[points.length - 1]; // Текущая

    // --- Расчет толщины ---
    const currentVelocity = calculateVelocity(p1, p2);
    // Фильтруем скорость для плавного изменения толщины (чтобы не дергалась)
    const smoothedVelocity = VELOCITY_FILTER_WEIGHT * currentVelocity + (1 - VELOCITY_FILTER_WEIGHT) * lastVelocity;
    const targetWidth = getLineWidth(smoothedVelocity);
    // Еще немного сглаживаем саму ширину
    const smoothedWidth = VELOCITY_FILTER_WEIGHT * targetWidth + (1 - VELOCITY_FILTER_WEIGHT) * lastWidth;

    // --- Рисование кривой ---
    // Мы рисуем не от точки к точке, а от середины предыдущего сегмента к середине текущего.
    // Это ключевая техника для супер-гладких линий в JS.
    
    // Середина между p0 и p1
    const startPoint = {
        x: p0.x + (p1.x - p0.x) * PEN_SMOOTHING,
        y: p0.y + (p1.y - p0.y) * PEN_SMOOTHING
    };
    
    // Середина между p1 и p2
    const endPoint = {
        x: p1.x + (p2.x - p1.x) * PEN_SMOOTHING,
        y: p1.y + (p2.y - p1.y) * PEN_SMOOTHING
    };

    // Делаем эффектную двухслойную линию:
    // 1) широкая мягкая тень/основа (имитирует растекание чернил)
    // 2) узкая чёткая внутренняя линия (острый контур)

    const deviceWidth = smoothedWidth * DPR;

    // --- Шаг 1: мягкая основа ---
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = deviceWidth * 1.25; // немного шире для основы
    // тень/размытие для эффекта чернильного пятна
    ctx.shadowColor = colorPicker.value;
    ctx.shadowBlur = Math.min(24, deviceWidth * 0.9);
    ctx.globalAlpha = 0.85;
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.quadraticCurveTo(p1.x, p1.y, endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.restore();

    // --- Шаг 2: внутренняя чёткая линия ---
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = Math.max(1, deviceWidth * 0.55); // тонкая чёткая сердцевина
    ctx.globalAlpha = 1;
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.quadraticCurveTo(p1.x, p1.y, endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.restore();

    // Запоминаем для следующего шага
    lastVelocity = smoothedVelocity;
    lastWidth = smoothedWidth;
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    points = []; // Очищаем историю точек
}


// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    // Учитываем ratio, если канвас был отмасштабирован
    const ratio = canvas.width / rect.width; 
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    return {
        x: (clientX - rect.left) * ratio,
        y: (clientY - rect.top) * ratio
    };
}

// === СОБЫТИЯ ===
// Используем pointer events для унификации мыши и тача
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing); // Если увели курсор за пределы

// Кнопки
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
}

function downloadSign() {
    // Создаем временный канвас, чтобы обрезать пустые поля (опционально, но круто)
    const link = document.createElement('a');
    link.download = 'signature_calligraphy.png';
    // Качаем оригинальный канвас в высоком разрешении
    link.href = canvas.toDataURL('image/png');
    link.click();
}