const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const inputArea = document.getElementById('inputs');
const btnSpin = document.getElementById('btnSpin');
const btnUpdate = document.getElementById('btnUpdate');
const winnerBox = document.getElementById('winner');

// НАСТРОЙКИ
let items = ['Пицца', 'Суши', 'Бургеры', 'Салат', 'Паста', 'Шаурма'];
let colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

let startAngle = 0;
let arc = Math.PI / (items.length / 2);
let spinTime = 0;
let spinTimeTotal = 0;
let spinAngleStart = 0;

// Инициализация при загрузке
inputArea.value = items.join('\n');
drawRouletteWheel();

// ОБНОВЛЕНИЕ СПИСКА
btnUpdate.addEventListener('click', () => {
    const text = inputArea.value.trim();
    if (!text) return;
    items = text.split('\n').filter(item => item.trim() !== '');
    arc = Math.PI / (items.length / 2);
    drawRouletteWheel();
});

// КНОПКА СТАРТ
btnSpin.addEventListener('click', spin);

// 1. РИСОВАНИЕ КОЛЕСА
function drawRouletteWheel() {
    if (canvas.getContext) {
        const outsideRadius = 230;
        const textRadius = 160;
        const insideRadius = 0; // Можно сделать 50 для "бублика"

        ctx.clearRect(0, 0, 500, 500);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.font = 'bold 16px Helvetica, Arial';

        for (let i = 0; i < items.length; i++) {
            const angle = startAngle + i * arc;
            
            // Сектор
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
            ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
            ctx.stroke();
            ctx.fill();

            // Текст
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.5)"; // Тень для читаемости
            ctx.shadowBlur = 4;
            ctx.fillStyle = "white";
            
            // Переносим контекст в центр сектора для поворота текста
            ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius, 
                          250 + Math.sin(angle + arc / 2) * textRadius);
            ctx.rotate(angle + arc / 2 + Math.PI); // Поворот текста
            
            const text = items[i];
            // Обрезаем, если длинный
            const displayText = text.length > 15 ? text.substring(0,14)+'...' : text;
            ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
            ctx.restore();
        }
    }
}

// 2. ЛОГИКА ВРАЩЕНИЯ
function spin() {
    // Сбрасываем победителя
    winnerBox.style.display = 'none';
    
    // Случайная сила вращения
    spinAngleStart = Math.random() * 10 + 10; // Скорость
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000; // Время вращения (4-7 сек)
    
    rotateWheel();
}

function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    
    // Функция плавности (Ease Out) - колесо замедляется
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawRouletteWheel();
    requestAnimationFrame(rotateWheel);
}

// Функция замедления (математика)
function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// 3. ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ
function stopRotateWheel() {
    // Вычисляем угол в градусах
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);
    
    ctx.save();
    const text = items[index];
    
    // Показываем результат
    winnerBox.innerText = `🎉 Выпало: ${text} 🎉`;
    winnerBox.style.display = 'block';
    
    // Запускаем конфетти (простая эмуляция звука/эффекта)
    // Можно добавить Audio API, если нужно
    ctx.restore();
}