let bpm = 120;
let isPlaying = false;
let nextNoteTime = 0.0; // Когда должен быть следующий удар
let timerID = null;
let lookahead = 25.0; // Как часто смотреть вперед (мс)
let scheduleAheadTime = 0.1; // На сколько вперед планировать (сек)

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const bpmDisplay = document.getElementById('bpmValue');
const bpmRange = document.getElementById('bpmRange');
const btnPlay = document.getElementById('btnPlay');
const indicator = document.getElementById('indicator');

// 1. ЗВУКОВОЙ ДВИЖОК
function playClick(time) {
    // Создаем осциллятор (генератор звука)
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Частота звука (тик)
    osc.frequency.value = 1000; 
    
    // Короткий "бип"
    gainNode.gain.value = 1;
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);

    // Визуальная вспышка (синхронно со звуком)
    // Используем setTimeout, чтобы синхронизировать с AudioContext временем
    // Это не идеально точно визуально, но для глаза достаточно
    setTimeout(() => {
        indicator.classList.add('active');
        setTimeout(() => indicator.classList.remove('active'), 100);
    }, (time - audioCtx.currentTime) * 1000);
}

// 2. ПЛАНИРОВЩИК (Scheduler)
function nextNote() {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime += secondsPerBeat;
}

function scheduler() {
    // Пока есть ноты, которые нужно сыграть в ближайшее время...
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        playClick(nextNoteTime);
        nextNote();
    }
    timerID = setTimeout(scheduler, lookahead);
}

// 3. УПРАВЛЕНИЕ
btnPlay.addEventListener('click', () => {
    if (isPlaying) {
        // Стоп
        isPlaying = false;
        clearTimeout(timerID);
        btnPlay.innerHTML = '▶️';
        btnPlay.classList.remove('playing');
    } else {
        // Старт
        // Нужно возобновить AudioContext (браузеры блокируют автоплей)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        isPlaying = true;
        nextNoteTime = audioCtx.currentTime + 0.05;
        scheduler();
        btnPlay.innerHTML = '⏹';
        btnPlay.classList.add('playing');
    }
});

// Изменение BPM
bpmRange.addEventListener('input', function() {
    bpm = this.value;
    bpmDisplay.innerText = bpm;
});

window.changeBpm = (delta) => {
    let newVal = parseInt(bpm) + delta;
    if (newVal < 40) newVal = 40;
    if (newVal > 220) newVal = 220;
    
    bpm = newVal;
    bpmRange.value = bpm;
    bpmDisplay.innerText = bpm;
};