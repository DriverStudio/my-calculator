// === КОНФИГУРАЦИЯ ИГРЫ ===
const GAME_CONFIG = {
    items: [
        { id: 'cursor',  name: 'Курсор', baseCost: 50,    income: 0.5, icon: '👆', desc: 'Автоклик раз в 2 сек' },
        { id: 'coffee',  name: 'Кофемашина', baseCost: 750,   income: 4,   icon: '☕', desc: 'Бодрит офис' },
        { id: 'intern',  name: 'Стажер', baseCost: 3000,  income: 15,  icon: '👶', desc: 'Работает за опыт' },
        { id: 'manager', name: 'Менеджер', baseCost: 12000,  income: 50,  icon: '👔', desc: 'Контролирует стажеров' },
        { id: 'server',  name: 'Серверная', baseCost: 50000,  income: 180, icon: '🗄️', desc: 'Шумит и греет' },
        { id: 'ai',      name: 'ИИ Аналитик', baseCost: 300000, income: 900, icon: '🤖', desc: 'Заменяет отдел' },
        { id: 'ipo',     name: 'Выход на IPO', baseCost: 10000000, income: 6000, icon: '📈', desc: 'Акции ту зе мун' }
    ]
};

// === СОСТОЯНИЕ ===
let state = JSON.parse(localStorage.getItem('clickerSave')) || {
    money: 0,
    totalEarned: 0,
    upgrades: {} 
};

window.odometerOptions = { format: '(,ddd)', duration: 500 };

function saveGame() { localStorage.setItem('clickerSave', JSON.stringify(state)); }
setInterval(saveGame, 5000);

// === ИГРОВОЙ ЦИКЛ ===
let lastTime = performance.now();
let currentCps = 0;

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    currentCps = 0;
    GAME_CONFIG.items.forEach(item => {
        const count = state.upgrades[item.id] || 0;
        currentCps += count * item.income;
    });

    if (currentCps > 0) {
        addMoney(currentCps * deltaTime);
    }

    const moneyEl = document.getElementById('money');
    if (moneyEl) moneyEl.innerHTML = Math.floor(state.money);
    
    const cpsEl = document.getElementById('cps');
    if (cpsEl) cpsEl.innerText = currentCps.toLocaleString('en-US', {maximumFractionDigits: 1});

    renderShopButtons();
    requestAnimationFrame(gameLoop);
}

function addMoney(amount) {
    state.money += amount;
    state.totalEarned += amount;
}

window.userClick = function(event) {
    const clickPower = 1 + (currentCps * 0.1); 
    addMoney(clickPower);
    document.getElementById('money').innerHTML = Math.floor(state.money);
    spawnFloatText(event, `+$${clickPower.toFixed(1)}`);
}

window.buyItem = function(itemId) {
    const item = GAME_CONFIG.items.find(i => i.id === itemId);
    const count = state.upgrades[itemId] || 0;
    const cost = Math.floor(item.baseCost * Math.pow(1.15, count));

    if (state.money >= cost) {
        state.money -= cost;
        state.upgrades[itemId] = count + 1;
        document.getElementById('money').innerHTML = Math.floor(state.money);
        renderShopPrices();
        saveGame();
    }
}

window.resetGame = function() {
    if(confirm('Вы уверены? Весь прогресс будет удален.')) {
        localStorage.removeItem('clickerSave');
        location.reload();
    }
}

// === МИНИ-ИГРА "ОФИС" V6 (Persistent UV) ===
const OfficeGame = {
    faces: [
        '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍🚀', '🧛‍♂️', '🤡', '👽', '👷', '🕵️',
        '🧙', '🧟', '🧞', '🧜‍♂️', '🦸', '🦸‍♀️', '🦹', '🦹‍♀️', '🤖', '🎅',
        '🧑‍🏫', '🧑‍🔧', '🧑‍🔬', '🧑‍⚕️', '👨‍🏭', '👩‍🏭', '👨‍🔧', '👩‍🔧',
        '👨‍🍳', '👩‍🍳', '👨‍✈️', '👩‍✈️', '🧑‍🌾', '🧑‍🎨', '👨‍🚒', '👩‍🚒'
    ],
    names: [
        'Иванов И.', 'Петров П.', 'Сидоров С.', 'Смирнов А.', 'Кузнецов Д.', 'Попов Е.',
        'Васильев О.', 'Новиков Р.', 'Фёдоров Л.', 'Морозов К.',
        'Смитт А.', 'Джонсон Р.', 'Уотсон Т.', 'Картер Д.', 'Хилл М.',
        'Маск И.', 'Дуров П.', 'Гейтс Б.', 'Джобс С.', 'Цукерберг М.', 'Безос Дж.'
    ],
    depts: ['Продажи', 'IT Отдел', 'Маркетинг', 'HR Отдел', 'Бухгалтерия', 'СБ', 'Логистика', 'Закупки', 'R&D'],
    
    // Секретные метки
    securityCodes: ['⭐', '🛡️', '👁️', '⚡', '⚓', '👑', '🔑', '🦅'],
    currentSecurityCode: '',
    
    visitor: null,
    document: null,
    
    isAnimating: false,
    today: new Date(),

    init: function() {
        this.initDragAndDrop();
        this.updateSecurityCode();
        setInterval(() => this.updateSecurityCode(), 60000);
        this.nextCase();
    },

    updateSecurityCode: function() {
        this.currentSecurityCode = this.securityCodes[Math.floor(Math.random() * this.securityCodes.length)];
        const el = document.getElementById('security-code');
        if(el) {
            el.style.opacity = 0;
            setTimeout(() => {
                el.innerText = this.currentSecurityCode;
                el.style.opacity = 1;
            }, 500);
        }
    },

    toggleUV: function() {
        const desk = document.getElementById('desk-area');
        const btn = document.getElementById('uv-btn');
        desk.classList.toggle('uv-active');
        btn.classList.toggle('active');
    },

    nextCase: function() {
        // УБРАНО: document.getElementById('desk-area').classList.remove('uv-active');
        // Теперь фонарик остается в том состоянии, в котором вы его оставили

        const isOk = Math.random() > 0.5;

        // 1. Посетитель
        const vFace = this.faces[Math.floor(Math.random() * this.faces.length)];
        const vName = this.names[Math.floor(Math.random() * this.names.length)];
        const vDept = this.depts[Math.floor(Math.random() * this.depts.length)];

        this.visitor = { face: vFace, name: vName, dept: vDept };

        // 2. Документ
        let dFace = vFace;
        let dName = vName;
        let dDept = vDept;
        let dDate = new Date(this.today);
        dDate.setDate(dDate.getDate() + Math.floor(Math.random() * 60) + 1); 
        
        let dMark = this.currentSecurityCode;

        if (!isOk) {
            const errorType = Math.floor(Math.random() * 5);
            if (errorType === 0) { // Ошибка ФОТО
                do { dFace = this.faces[Math.floor(Math.random() * this.faces.length)]; } while (dFace === vFace);
            } 
            else if (errorType === 1) { // Ошибка ИМЯ
                do { dName = this.names[Math.floor(Math.random() * this.names.length)]; } while (dName === vName);
            }
            else if (errorType === 2) { // Ошибка ОТДЕЛ
                do { dDept = this.depts[Math.floor(Math.random() * this.depts.length)]; } while (dDept === vDept);
            }
            else if (errorType === 3) { // Ошибка ДАТА
                dDate = new Date(this.today);
                dDate.setDate(dDate.getDate() - Math.floor(Math.random() * 100) - 1);
            }
            else { // Ошибка МЕТКА
                do { dMark = this.securityCodes[Math.floor(Math.random() * this.securityCodes.length)]; } 
                while (dMark === this.currentSecurityCode);
            }
        }

        this.document = {
            face: dFace, name: dName, dept: dDept, date: dDate, mark: dMark,
            isValid: (
                dFace === vFace && dName === vName && dDept === vDept && 
                dDate >= this.today && dMark === this.currentSecurityCode
            )
        };

        this.render();
        
        const el = document.getElementById('current-doc');
        el.className = 'paper-doc slide-in';
        el.style.transform = '';
        document.getElementById('stamp-ok').classList.remove('visible');
        document.getElementById('stamp-bad').classList.remove('visible');
    },

    render: function() {
        document.getElementById('vis-face').innerText = this.visitor.face;
        document.getElementById('vis-name').innerText = this.visitor.name;
        document.getElementById('vis-dept').innerText = this.visitor.dept;

        document.getElementById('doc-id').innerText = Math.floor(Math.random() * 900) + 100;
        document.getElementById('doc-photo').innerText = this.document.face;
        document.getElementById('doc-name').innerText = this.document.name;
        document.getElementById('doc-dept').innerText = this.document.dept;
        document.getElementById('doc-date').innerText = this.formatDate(this.document.date);
        document.getElementById('doc-mark').innerText = this.document.mark; 
        
        const dateEl = document.getElementById('doc-date');
        if (this.document.date < this.today) {
            dateEl.style.color = '#dc3545';
            dateEl.style.fontWeight = 'bold';
        } else {
            dateEl.style.color = '#333';
        }
    },

    initDragAndDrop: function() {
        const el = document.getElementById('current-doc');
        const desk = document.getElementById('desk-area');
        let startX, startY; let isDragging = false;

        const start = (e) => {
            if (this.isAnimating) return;
            isDragging = true; desk.classList.add('dragging');
            el.classList.remove('returning', 'slide-in');
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        };

        const move = (e) => {
            if (!isDragging) return;
            e.preventDefault(); 
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaX = clientX - startX; const deltaY = clientY - startY;
            const rotate = deltaX * 0.1; 
            el.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
        };

        const end = () => {
            if (!isDragging) return;
            isDragging = false; desk.classList.remove('dragging');
            const style = window.getComputedStyle(el);
            const matrix = new WebKitCSSMatrix(style.transform);
            const deltaX = matrix.m41;
            
            if (deltaX > 80) this.decide(true);
            else if (deltaX < -80) this.decide(false);
            else {
                el.classList.add('returning');
                el.style.transform = 'translate(0, 0) rotate(-2deg)';
            }
        };

        el.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, {passive: false});
        window.addEventListener('touchmove', move, {passive: false});
        window.addEventListener('touchend', end);
    },

    decide: function(approved) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const isCorrect = (approved === this.document.isValid);
        
        if (approved) document.getElementById('stamp-ok').classList.add('visible');
        else document.getElementById('stamp-bad').classList.add('visible');

        if (isCorrect) {
            const reward = Math.max(25, currentCps * 25); 
            addMoney(reward);
            const rect = document.getElementById('desk-area').getBoundingClientRect();
            spawnFloatText({clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2}, `ВЕРНО! +$${Math.floor(reward)}`);
        } else {
            const fine = Math.max(10, currentCps * 10);
            addMoney(-fine); 
            spawnFloatText({clientX: window.innerWidth/2, clientY: window.innerHeight/2}, `ОШИБКА! -$${Math.floor(fine)}`, 'red');
        }

        setTimeout(() => {
            const el = document.getElementById('current-doc');
            if (approved) el.classList.add('approved-anim');
            else el.classList.add('rejected-anim');

            setTimeout(() => {
                this.isAnimating = false;
                this.nextCase();
            }, 400);
        }, 500);
    },

    formatDate: function(date) { return date.toLocaleDateString('ru-RU'); }
};

function initShop() {
    const container = document.getElementById('shopContainer');
    if(!container) return;
    container.innerHTML = '';
    GAME_CONFIG.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        div.id = `upg-btn-${item.id}`;
        div.onclick = () => window.buyItem(item.id);
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div class="upg-icon">${item.icon}</div>
                <div class="upg-info">
                    <h4>${item.name} <span style="font-size:10px; color:#28a745" id="count-${item.id}">x0</span></h4>
                    <p>${item.desc} (+${item.income}$/c)</p>
                </div>
            </div>
            <div class="upg-cost" id="cost-${item.id}">$${item.baseCost}</div>
        `;
        container.appendChild(div);
    });
    renderShopPrices();
}

function renderShopPrices() {
    GAME_CONFIG.items.forEach(item => {
        const count = state.upgrades[item.id] || 0;
        const cost = Math.floor(item.baseCost * Math.pow(1.15, count));
        const costEl = document.getElementById(`cost-${item.id}`);
        const countEl = document.getElementById(`count-${item.id}`);
        if(costEl) costEl.innerText = '$' + cost.toLocaleString();
        if(countEl) countEl.innerText = 'x' + count;
    });
}

function renderShopButtons() {
    GAME_CONFIG.items.forEach(item => {
        const count = state.upgrades[item.id] || 0;
        const cost = Math.floor(item.baseCost * Math.pow(1.15, count));
        const btn = document.getElementById(`upg-btn-${item.id}`);
        if (btn) {
            if (state.money >= cost) {
                btn.classList.add('affordable');
                btn.style.opacity = '1';
                btn.style.borderColor = '#28a745';
            } else {
                btn.classList.remove('affordable');
                btn.style.opacity = '0.6';
                btn.style.borderColor = '#eee';
            }
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(`tab-${tabName}`);
    if(target) target.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabName)) btn.classList.add('active');
    });
    if (tabName === 'top') renderLeaderboard();
}

function renderLeaderboard() {
    const box = document.getElementById('leaderboard');
    if(!box) return;
    const myScore = Math.floor(state.totalEarned);
    const leaders = [
    { name: "Triangle 🜂", score: 300000000000 },
    { name: "Elon Musk", score: 250000000000 },
    { name: "Jeff Bezos", score: 180000000000 },
    { name: "Bernard Arnault", score: 167000000000 },
    { name: "Bill Gates", score: 130000000000 },
    { name: "Mark Zuckerberg", score: 118000000000 },
    { name: "Warren Buffett", score: 114000000000 },
    { name: "Larry Ellison", score: 110000000000 },
    { name: "Larry Page", score: 105000000000 },
    { name: "Sergey Brin", score: 102000000000 },
    { name: "Satoshi", score: 50000000 },
    { name: "MrBeast", score: 10000000 },
    { name: "PewDiePie", score: 5000000 },
    { name: "Ninja", score: 4500000 },
    { name: "Shroud", score: 3500000 },
    { name: "Dream", score: 3200000 },
    { name: "Hamster", score: Math.max(0, myScore - 500) },
    { name: "Dogecoin Doge", score: 3000000 },
    { name: "CatCoin Kitty", score: 2900000 },
    { name: "Crypto Whale", score: 2800000 },
    { name: "Alien", score: 2700000 },
    { name: "Clown", score: 2600000 },
    { name: "Vampire", score: 2500000 },
    { name: "Wizard", score: 2400000 },
    { name: "Zombie", score: 2300000 },
    { name: "Robot", score: 2200000 },
    { name: "Santa", score: 2000000 },
    { name: "Pirate", score: 1800000 },
    { name: "Detective", score: 1600000 },
    { name: "Astronaut", score: 1500000 },
    { name: "Builder", score: 1400000 },
    { name: "Chef", score: 1300000 },
    { name: "Farmer", score: 1200000 },
    { name: "Magician", score: 1100000 },
    { name: "Ninja", score: 1000000 },
    { name: "Knight", score: 950000 },
    { name: "Samurai", score: 900000 },
    { name: "Dragon", score: 850000 },
    { name: "Phoenix", score: 800000 },
    { name: "Stone Golem", score: 750000 },
    { name: "AI Overlord", score: 700000 },
    { name: "Time Traveler", score: 680000 },
    { name: "Shadow Entity", score: 650000 },
    { name: "Ghost", score: 600000 },
    { name: "King", score: 550000 },
    { name: "Queen", score: 530000 },
    { name: "Gladiator", score: 500000 },
    { name: "You (ВЫ)", score: myScore, isMe: true }
];

    leaders.sort((a, b) => b.score - a.score);
    let html = '';
    leaders.forEach((p, index) => {
        const isMe = p.isMe ? 'me' : '';
        const scoreFmt = p.score > 1000000 ? (p.score / 1000000).toFixed(1) + 'M' : p.score.toLocaleString();
        html += `<div class="leaderboard-row ${isMe}"><div style="display:flex; gap:10px;"><div class="rank">#${index + 1}</div><div>${p.name}</div></div><div style="font-weight:bold">${scoreFmt}$</div></div>`;
    });
    box.innerHTML = html;
}

function spawnFloatText(e, text, color = null) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = text;
    if (color) el.style.color = color; 
    let x = e.clientX; let y = e.clientY;
    if (!x) { x = window.innerWidth/2; y = window.innerHeight/2; }
    x += (Math.random() - 0.5) * 20;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    initShop();
    OfficeGame.init();
    requestAnimationFrame(gameLoop);
});