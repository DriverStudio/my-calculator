let timeLeft = 25 * 60; // 25 минут в секундах
let timerId = null;
let isRunning = false;
let currentMode = 'work'; // 'work' или 'break'

const display = document.getElementById('timer');
const btnStart = document.getElementById('btnStart');
const title = document.title; // Сохраняем исходный заголовок

// Форматирование времени (125 -> 02:05)
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateDisplay() {
    const timeStr = formatTime(timeLeft);
    display.innerText = timeStr;
    // Обновляем заголовок вкладки, чтобы было видно время!
    document.title = `(${timeStr}) ${currentMode === 'work' ? 'Работа' : 'Отдых'}`;
}

// Старт / Пауза
btnStart.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerId);
        isRunning = false;
        btnStart.innerText = '▶️ Продолжить';
    } else {
        isRunning = true;
        btnStart.innerText = '⏸ Пауза';
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                // Время вышло
                clearInterval(timerId);
                isRunning = false;
                const sound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                sound.play().catch(() => {}); // Игнор ошибок автоплей
                alert('Время вышло! Пора сменить деятельность.');
                btnStart.innerText = '▶️ Старт';
            }
        }, 1000);
    }
});

// Сброс
document.getElementById('btnReset').addEventListener('click', () => {
    clearInterval(timerId);
    isRunning = false;
    btnStart.innerText = '▶️ Старт';
    setMode(currentMode); // Сброс к началу текущего режима
});

// Переключение режимов
window.setMode = (mode) => { // window, чтобы вызвать из HTML
    clearInterval(timerId);
    isRunning = false;
    btnStart.innerText = '▶️ Старт';
    currentMode = mode;
    
    // UI переключение
    document.getElementById('modeWork').classList.toggle('active', mode === 'work');
    document.getElementById('modeBreak').classList.toggle('active', mode === 'break');

    if (mode === 'work') {
        timeLeft = 25 * 60;
    } else {
        timeLeft = 5 * 60;
    }
    updateDisplay();
    document.title = title; // Возвращаем заголовок при сбросе
};