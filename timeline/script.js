/**
 * TIMELINE GENERATOR v5.0 (Checkboxes & Completed State)
 */

const container = document.getElementById('timelineContainer');
const btnAdd = document.getElementById('btnAdd');
const btnTheme = document.getElementById('btnTheme');
const btnExport = document.getElementById('btnExport');
const themeModal = document.getElementById('themeModal');
const canvas = document.getElementById('exportCanvas');

let activeEventId = null;

// Загрузка данных (Миграция: добавляем поле done: false старым записям)
let events = JSON.parse(localStorage.getItem('prisma_timeline')) || [
    { id: 1, date: '2025-12-06', time: '09:00', title: 'Start Project', color: null, done: false },
    { id: 2, date: '2025-12-07', time: '18:00', title: 'Deadline', color: null, done: false }
];

let accentColor = localStorage.getItem('prisma_timeline_color') || '#ff0055';
document.documentElement.style.setProperty('--tl-accent', accentColor);

function render() {
    const spine = container.querySelector('.timeline-spine');
    container.innerHTML = '';
    container.appendChild(spine);

    events.forEach((ev, index) => {
        // Миграция данных "на лету"
        if (!ev.time) ev.time = '00:00';
        if (ev.done === undefined) ev.done = false;

        const card = document.createElement('div');
        // Добавляем класс completed, если задача выполнена
        card.className = `event-card ${ev.done ? 'completed' : ''}`;
        card.draggable = true; 
        card.dataset.index = index;
        
        const cardColor = ev.color || accentColor;

        /* ИЗМЕНЕНИЯ:
           1. Создан контейнер <div class="card-actions"> для кнопок.
           2. Убраны лишние обертки.
        */
        card.innerHTML = `
            <div class="event-dot" title="Нажми, чтобы изменить цвет"></div>
            
            <div class="date-row">
                <input type="date" class="input-glass event-date-input" value="${ev.date}" style="color: ${cardColor}">
                <input type="time" class="input-glass event-time-input" value="${ev.time}" style="color: ${cardColor}">
            </div>

            <input type="text" class="input-glass event-title-input" value="${ev.title}" placeholder="Event Title...">

            <div class="card-actions">
                 <input type="checkbox" class="custom-checkbox" ${ev.done ? 'checked' : ''} title="Выполнено/Не выполнено">
                 <button class="del-btn mt-0" title="Удалить">✕</button>
            </div>
        `;
        
        const dot = card.querySelector('.event-dot');
        // Если выполнено, цвет контролируется CSS, иначе JS
        if (!ev.done) {
            dot.style.background = cardColor;
            dot.style.boxShadow = `0 0 15px ${cardColor}`;
        }

        // КЛИК ПО ТОЧКЕ (Цвет)
        dot.addEventListener('click', (e) => {
            e.stopPropagation(); 
            activeEventId = ev.id; 
            themeModal.style.display = 'flex';
        });

        // КЛИК ПО ЧЕКБОКСУ
        const checkbox = card.querySelector('.custom-checkbox');
        checkbox.addEventListener('change', (e) => {
            ev.done = e.target.checked;
            save(); // Перерендер для применения классов
        });
        // Чтобы клик по чекбоксу не вызывал Drag&Drop глюков
        checkbox.addEventListener('mousedown', (e) => e.stopPropagation());

        // ИНПУТЫ
        const inputs = card.querySelectorAll('input[type="text"], input[type="date"], input[type="time"]');
        inputs.forEach(input => {
            input.addEventListener('mousedown', (e) => e.stopPropagation());
            input.addEventListener('input', () => {
                ev.date = card.querySelector('.event-date-input').value;
                ev.time = card.querySelector('.event-time-input').value;
                ev.title = card.querySelector('.event-title-input').value;
                localStorage.setItem('prisma_timeline', JSON.stringify(events));
                updateProgressLine();
            });
        });

        // УДАЛЕНИЕ
        card.querySelector('.del-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm('Удалить событие?')) {
                events.splice(index, 1);
                save();
            }
        });

        addDnDHandlers(card);
        container.appendChild(card);
    });

    requestAnimationFrame(updateProgressLine);
}

function save() {
    localStorage.setItem('prisma_timeline', JSON.stringify(events));
    render();
}

// --- ПРОГРЕСС БАР (Time Based) ---
function updateProgressLine() {
    const progress = document.querySelector('.scroll-progress');
    const spine = document.querySelector('.timeline-spine');
    const cards = Array.from(document.querySelectorAll('.event-card'));
    
    if (!progress || !spine || cards.length === 0) {
        if(progress) progress.style.height = '0px';
        return;
    }

    const now = new Date(); 
    let pastCardIndex = -1;
    let futureCardIndex = -1;

    for (let i = 0; i < cards.length; i++) {
        const dateVal = cards[i].querySelector('.event-date-input').value;
        const timeVal = cards[i].querySelector('.event-time-input').value || '00:00';
        const evDate = new Date(`${dateVal}T${timeVal}`);

        if (evDate <= now) {
            pastCardIndex = i;
        } else {
            futureCardIndex = i;
            break;
        }
    }

    const spineRect = spine.getBoundingClientRect();
    let fillHeight = 0;

    if (pastCardIndex === -1) {
        fillHeight = 0; 
    }
    else if (futureCardIndex === -1) {
        const lastDot = cards[cards.length - 1].querySelector('.event-dot');
        const dotRect = lastDot.getBoundingClientRect();
        fillHeight = (dotRect.top + dotRect.height/2) - spineRect.top;
    }
    else {
        const pastEl = cards[pastCardIndex];
        const futureEl = cards[futureCardIndex];
        
        const d1 = new Date(`${pastEl.querySelector('.event-date-input').value}T${pastEl.querySelector('.event-time-input').value}`).getTime();
        const d2 = new Date(`${futureEl.querySelector('.event-date-input').value}T${futureEl.querySelector('.event-time-input').value}`).getTime();
        const current = now.getTime();

        let ratio = 0;
        if (d2 > d1) ratio = (current - d1) / (d2 - d1);
        ratio = Math.max(0, Math.min(1, ratio));

        const dot1 = pastEl.querySelector('.event-dot');
        const dot2 = futureEl.querySelector('.event-dot');

        if(dot1 && dot2) {
            const r1 = dot1.getBoundingClientRect();
            const r2 = dot2.getBoundingClientRect();
            const y1 = (r1.top + r1.height/2) - spineRect.top;
            const y2 = (r2.top + r2.height/2) - spineRect.top;
            fillHeight = y1 + (y2 - y1) * ratio;
        }
    }

    progress.style.height = `${Math.max(0, fillHeight)}px`;
}
setInterval(updateProgressLine, 60000);
window.addEventListener('resize', updateProgressLine);
window.addEventListener('scroll', updateProgressLine);

// --- DRAG & DROP ---
let dragSrcEl = null;
function addDnDHandlers(card) {
    card.addEventListener('dragstart', function(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.classList.add('dragging');
        if(navigator.vibrate) navigator.vibrate(20);
    });
    card.addEventListener('dragover', function(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    });
    card.addEventListener('drop', function(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (dragSrcEl !== this) {
            const oldIndex = parseInt(dragSrcEl.dataset.index);
            const newIndex = parseInt(this.dataset.index);
            const [movedItem] = events.splice(oldIndex, 1);
            events.splice(newIndex, 0, movedItem);
            save();
        }
        return false;
    });
    card.addEventListener('dragend', function() {
        this.classList.remove('dragging');
    });
}

// --- CONTROLS ---
btnAdd.onclick = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    events.push({ 
        id: Date.now(), 
        date: dateStr, 
        time: timeStr, 
        title: '', 
        color: null,
        done: false 
    });
    save();
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
};

btnTheme.onclick = () => {
    activeEventId = null; 
    themeModal.style.display = 'flex';
};

themeModal.onclick = (e) => {
    if (e.target.classList.contains('color-swatch')) {
        const selectedColor = e.target.dataset.color;
        if (activeEventId) {
            const ev = events.find(e => e.id === activeEventId);
            if (ev) { ev.color = selectedColor; save(); }
        } else {
            accentColor = selectedColor;
            document.documentElement.style.setProperty('--tl-accent', accentColor);
            localStorage.setItem('prisma_timeline_color', accentColor);
            const progress = document.querySelector('.scroll-progress');
            if(progress) {
                progress.style.background = accentColor;
                progress.style.boxShadow = `0 0 15px ${accentColor}`;
            }
            render(); 
        }
        themeModal.style.display = 'none';
        activeEventId = null;
    } else if (e.target === themeModal) {
        themeModal.style.display = 'none';
        activeEventId = null;
    }
};

// --- ЭКСПОРТ (Поддержка галочек) ---
btnExport.onclick = () => {
    const ctx = canvas.getContext('2d');
    const width = 1080; 
    const height = Math.max(1920, events.length * 280 + 600);
    
    canvas.width = width;
    canvas.height = height;

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f2027');
    grad.addColorStop(0.5, '#203a43');
    grad.addColorStop(1, '#2c5364');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 20;
    ctx.fillText('TIMELINE', width / 2, 200);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(width / 2, 300);
    ctx.lineTo(width / 2, height - 200);
    ctx.stroke();

    ctx.textAlign = 'left';
    
    events.forEach((ev, i) => {
        const y = 450 + (i * 280);
        const isLeft = i % 2 === 0; 
        const centerX = width / 2;
        let thisColor = ev.color || accentColor;
        
        // Если выполнено, меняем цвет на серый для экспорта
        if (ev.done) thisColor = '#777777';

        // Точка
        ctx.fillStyle = thisColor;
        ctx.shadowColor = ev.done ? 'transparent' : thisColor;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(centerX, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        const cardW = 420;
        const cardH = 160;
        const cardX = isLeft ? centerX - cardW - 60 : centerX + 60;
        const cardY = y - cardH / 2;

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        if(ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 20);
        else ctx.rect(cardX, cardY, cardW, cardH);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = thisColor;
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = isLeft ? 'right' : 'left';
        const textX = isLeft ? cardX + cardW - 30 : cardX + 30;
        
        const displayTime = ev.time ? ` ${ev.time}` : '';
        ctx.fillText(`${ev.date}${displayTime}`, textX, cardY + 60);

        // Рисуем статус выполнения
        if (ev.done) {
            ctx.fillStyle = '#aaa'; // Серый текст
            ctx.font = 'italic 500 40px sans-serif'; // Курсив для выполненных
            
            // Рисуем зеленую галочку рядом
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 40px sans-serif';
            const checkX = isLeft ? cardX + 20 : cardX + cardW - 50;
            ctx.fillText('✔', checkX, cardY + 50);
            
            ctx.fillStyle = '#aaa'; // Возвращаем серый для текста
        } else {
            ctx.fillStyle = '#fff';
            ctx.font = '500 40px sans-serif';
        }

        let displayTitle = ev.title || 'Untitled';
        if(displayTitle.length > 20) displayTitle = displayTitle.substring(0,20) + '...';
        
        // Эффект зачеркивания для экспорта
        if (ev.done) {
             const widthText = ctx.measureText(displayTitle).width;
             const lineX = isLeft ? textX - widthText : textX;
             ctx.fillRect(lineX, cardY + 105, widthText, 4);
        }

        ctx.fillText(displayTitle, textX, cardY + 115);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by PRISMA Portal', width / 2, height - 80);

    const link = document.createElement('a');
    link.download = `timeline-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

render();