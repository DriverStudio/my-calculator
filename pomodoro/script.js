/* script.js - Pomodoro Logic */

// Настройки
const MODES = {
    work: { time: 25 * 60, color: '#ff6b6b', label: 'Работа' }, // Красный
    break: { time: 5 * 60,  color: '#4dabf7', label: 'Отдых' }  // Голубой
};

let currentMode = 'work';
let timeLeft = MODES.work.time;
let timerId = null;
let isRunning = false;

// DOM Элементы
const display = document.getElementById('timerDisplay');
const circle = document.getElementById('progressCircle');
const btnAction = document.getElementById('btnAction');
const btnReset = document.getElementById('btnReset');

// Для SVG круга
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius; // Длина окружности

// Инициализация
function initTimer() {
    // Настраиваем SVG
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = 0;
    
    updateInterface();
    
    // Слушатели
    btnAction.onclick = toggleTimer;
    btnReset.onclick = resetTimer;
}

// Переключение режимов
window.switchMode = (mode) => {
    resetTimer();
    currentMode = mode;
    timeLeft = MODES[mode].time;
    
    // UI кнопок
    document.getElementById('btnModeWork').classList.toggle('active', mode === 'work');
    document.getElementById('btnModeBreak').classList.toggle('active', mode === 'break');
    
    updateInterface();
}

// Старт / Пауза
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    isRunning = true;
    btnAction.innerText = '⏸ Пауза';
    btnAction.style.background = '#ffd43b'; // Желтый для паузы
    btnAction.style.color = '#000';

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateInterface();
            updateTitle();
        } else {
            finishTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    btnAction.innerText = '▶️ Продолжить';
    btnAction.style.background = ''; // Возвращаем градиент
    btnAction.style.color = '';
    document.title = 'Фокус Таймер | PRISMA';
}

function resetTimer() {
    pauseTimer();
    timeLeft = MODES[currentMode].time;
    btnAction.innerText = '▶️ Старт';
    updateInterface();
}

// Завершение таймера
function finishTimer() {
    pauseTimer();
    timeLeft = 0;
    updateInterface();

    // 1. Звук (Используем встроенный в браузер или короткий URL)
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio error:', e));

    // 2. ОТПРАВКА УВЕДОМЛЕНИЯ (Интеграция с main.js)
    if (typeof sendNotification === 'function') {
        const title = currentMode === 'work' ? 'Время отдыхать! ☕' : 'Пора за работу! 🔥';
        const msg = currentMode === 'work' ? 'Отличная работа! Сделайте перерыв 5 минут.' : 'Перерыв окончен. Готовы продолжить?';
        const icon = currentMode === 'work' ? '☕' : '🚀';

        sendNotification(title, msg, icon, () => {
            // При клике на уведомление можно переключить режим
            const nextMode = currentMode === 'work' ? 'break' : 'work';
            switchMode(nextMode);
        });
    } else {
        alert('Время вышло!');
    }
}

// Обновление UI (Текст + Круг + Цвет)
function updateInterface() {
    // 1. Текст
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    display.innerText = `${m}:${s}`;

    // 2. Цвет (CSS переменная --accent)
    const color = MODES[currentMode].color;
    document.documentElement.style.setProperty('--accent', color);

    // 3. SVG Круг (offset)
    const totalTime = MODES[currentMode].time;
    const offset = circumference - (timeLeft / totalTime) * circumference;
    circle.style.strokeDashoffset = offset;
}

// Обновление заголовка вкладки
function updateTitle() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    const icon = isRunning ? '▶️' : '⏸';
    document.title = `${icon} ${m}:${s} - ${MODES[currentMode].label}`;
}

// Запуск
initTimer();