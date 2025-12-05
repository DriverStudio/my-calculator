/**
 * HABIT GARDEN (FLAT VERSION)
 * Stack: Vanilla JS + LocalStorage
 */

const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');

// Modals
const modalAdd = document.getElementById('modalAdd');
const modalInfo = document.getElementById('modalInfo');

// Buttons
const btnAdd = document.getElementById('btnAdd');
const btnHelp = document.getElementById('btnHelp'); // Кнопка ?
const btnSave = document.getElementById('btnSave');
const btnCancelAdd = document.getElementById('btnCancelAdd');
const btnCloseInfo = document.getElementById('btnCloseInfo'); // Кнопка "Всё понятно"

const inputName = document.getElementById('inputName');

// --- ICONS EVOLUTION ---
const STAGES = {
    0: '🌰', 1: '🌱', 2: '🌿', 3: '🌳', 4: '🍎', '-1': '🥀'
};

// --- STATE ---
let habits = JSON.parse(localStorage.getItem('prisma_habits_flat')) || [];

function save() {
    localStorage.setItem('prisma_habits_flat', JSON.stringify(habits));
    render();
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getStage(habit) {
    if (habit.streak === 0) return 0;
    if (habit.lastWatered) {
        const last = new Date(habit.lastWatered);
        const now = new Date();
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (diffDays > 2) return -1; 
    }
    if (habit.streak < 3) return 1;
    if (habit.streak < 7) return 2;
    if (habit.streak < 21) return 3;
    return 4;
}

function render() {
    grid.innerHTML = '';
    
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    const today = getToday();

    habits.forEach((habit, index) => {
        const stage = getStage(habit);
        const icon = STAGES[stage];
        const isDone = habit.lastWatered === today;
        
        const card = document.createElement('div');
        card.className = `habit-card ${isDone ? 'watered' : 'sleeping'}`;
        
        card.innerHTML = `
            <div class="habit-title">${habit.title}</div>
            <div class="plant-icon">${icon}</div>
            <div class="habit-streak">🔥 ${habit.streak} дн.</div>
            <div class="splash"></div>
        `;

        card.onclick = () => {
            if (!isDone) {
                const splash = card.querySelector('.splash');
                splash.style.animation = 'splashAnim 0.6s forwards';
                if(navigator.vibrate) navigator.vibrate(50);
                waterHabit(index);
            }
        };

        card.oncontextmenu = (e) => {
            e.preventDefault();
            if(confirm(`Удалить "${habit.title}"?`)) {
                habits.splice(index, 1);
                save();
            }
        };

        grid.appendChild(card);
    });
}

function waterHabit(index) {
    const habit = habits[index];
    const today = getToday();
    
    if (habit.lastWatered) {
        const last = new Date(habit.lastWatered);
        const now = new Date();
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) habit.streak++;
        else if (diffDays > 1) habit.streak = 1; 
    } else {
        habit.streak = 1;
    }

    habit.lastWatered = today;
    setTimeout(() => save(), 500);
}

// --- UI HANDLERS ---

// Open ADD
btnAdd.onclick = () => {
    modalAdd.style.display = 'flex';
    inputName.focus();
};

// Close ADD
btnCancelAdd.onclick = () => {
    modalAdd.style.display = 'none';
};

// Save ADD
btnSave.onclick = () => {
    const title = inputName.value.trim();
    if (title) {
        habits.push({ id: Date.now(), title: title, streak: 0, lastWatered: null });
        save();
        modalAdd.style.display = 'none';
        inputName.value = '';
    }
};

// Open INFO
btnHelp.onclick = () => {
    modalInfo.style.display = 'flex';
};

// Close INFO
btnCloseInfo.onclick = () => {
    modalInfo.style.display = 'none';
};

// Universal Close on Overlay Click
window.onclick = (e) => {
    if (e.target === modalAdd) modalAdd.style.display = 'none';
    if (e.target === modalInfo) modalInfo.style.display = 'none';
};

// INIT
render();