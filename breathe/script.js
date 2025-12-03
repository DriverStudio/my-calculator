const circle = document.getElementById('circle');
const text = document.getElementById('text');
const btn = document.getElementById('btnToggle');

let isRunning = false;
let interval = null;

btn.addEventListener('click', () => {
    if (!isRunning) {
        startBreathing();
    } else {
        stopBreathing();
    }
});

function startBreathing() {
    isRunning = true;
    btn.innerText = '⏹ Остановить';
    btn.style.background = '#6c757d'; // Серый цвет
    
    circle.classList.add('grow');
    
    // Запускаем цикл текста сразу
    runTextCycle();
    // И повторяем каждые 8 секунд (время CSS анимации)
    interval = setInterval(runTextCycle, 8000); 
}

function stopBreathing() {
    isRunning = false;
    btn.innerText = '▶️ Начать';
    btn.style.background = ''; // Вернуть зеленый градиент
    
    circle.classList.remove('grow');
    clearInterval(interval);
    text.innerText = 'Пауза';
}

function runTextCycle() {
    text.innerText = 'Вдох...';
    
    setTimeout(() => {
        text.innerText = 'Держим!';
    }, 3200); // Чуть раньше 4 сек, чтобы подготовиться

    setTimeout(() => {
        text.innerText = 'Выдох...';
    }, 4000); // Ровно на пике
}