/* script.js - ЯДРО КОНСТРУКТОРА (FIXED) */

const stage = document.getElementById('stage');
const controlsArea = document.getElementById('controlsArea');
const cssOutput = document.getElementById('cssOutput');
const widgetList = document.getElementById('widgetList');

// ==========================================
// 1. КОНФИГУРАЦИЯ ВИДЖЕТОВ
// ==========================================

const WIDGETS = {
    button: {
        name: 'Кнопка (Button)',
        icon: '🔘',
        html: '<button class="preview-target">Кнопка</button>',
        baseClass: 'my-btn',
        props: [
            {
                group: '🎨 Внешний вид',
                fields: [
                    { id: 'bg', label: 'Фон', type: 'color', prop: 'background-color', val: '#28a745' },
                    { id: 'color', label: 'Текст', type: 'color', prop: 'color', val: '#ffffff' },
                    { id: 'radius', label: 'Закругление', type: 'range', prop: 'border-radius', min: 0, max: 50, unit: 'px', val: 8 },
                    { id: 'cursor', label: 'Курсор', type: 'select', prop: 'cursor', options: ['pointer', 'default', 'not-allowed'], val: 'pointer' }
                ]
            },
            {
                group: '📏 Размеры и Границы',
                fields: [
                    { id: 'paddingV', label: 'Отступ верт.', type: 'range', prop: '--pad-v', min: 0, max: 40, unit: 'px', val: 12 },
                    { id: 'paddingH', label: 'Отступ гориз.', type: 'range', prop: '--pad-h', min: 0, max: 80, unit: 'px', val: 24 },
                    { id: 'fontSize', label: 'Размер шрифта', type: 'range', prop: 'font-size', min: 10, max: 30, unit: 'px', val: 16 },
                    { id: 'borderW', label: 'Толщина рамки', type: 'range', prop: 'border-width', min: 0, max: 10, unit: 'px', val: 0 },
                    { id: 'borderC', label: 'Цвет рамки', type: 'color', prop: 'border-color', val: '#000000' }
                ]
            },
            {
                group: '✨ Эффекты',
                fields: [
                    { id: 'shadow', label: 'Тень (Y)', type: 'range', prop: '--shadow-y', min: 0, max: 20, unit: 'px', val: 4 },
                    { id: 'shadowBlur', label: 'Тень (Blur)', type: 'range', prop: '--shadow-blur', min: 0, max: 30, unit: 'px', val: 10 },
                    { id: 'opacity', label: 'Прозрачность', type: 'range', prop: 'opacity', min: 0, max: 1, step: 0.1, unit: '', val: 1 }
                ]
            }
        ],
        // Убрал 'border: none', добавил 'border-style: solid', чтобы слайдер толщины работал
        cssTemplate: `
.my-btn {
    padding: var(--pad-v) var(--pad-h);
    border-style: solid; 
    border-color: transparent; /* Дефолт, перекроется настройкой */
    box-shadow: 0 var(--shadow-y) var(--shadow-blur) rgba(0,0,0,0.2);
    transition: all 0.2s ease;
    font-family: inherit;
    font-weight: 600;
}
.my-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 calc(var(--shadow-y) + 2px) calc(var(--shadow-blur) + 5px) rgba(0,0,0,0.3);
}
.my-btn:active {
    transform: translateY(0);
}
        `
    },

    input: {
        name: 'Поле ввода (Input)',
        icon: '⌨️',
        html: '<input type="text" class="preview-target" placeholder="Введите текст...">',
        baseClass: 'my-input',
        props: [
            {
                group: 'Стиль',
                fields: [
                    { id: 'bg', label: 'Фон', type: 'color', prop: 'background-color', val: '#ffffff' },
                    { id: 'col', label: 'Текст', type: 'color', prop: 'color', val: '#333333' },
                    { id: 'borderCol', label: 'Цвет рамки', type: 'color', prop: 'border-color', val: '#ced4da' },
                    { id: 'radius', label: 'Радиус', type: 'range', prop: 'border-radius', min: 0, max: 30, unit: 'px', val: 6 },
                ]
            },
            {
                group: 'Размеры',
                fields: [
                    { id: 'pd', label: 'Padding', type: 'range', prop: 'padding', min: 5, max: 30, unit: 'px', val: 12 },
                    { id: 'fs', label: 'Шрифт', type: 'range', prop: 'font-size', min: 12, max: 24, unit: 'px', val: 16 },
                    { id: 'bw', label: 'Толщина рамки', type: 'range', prop: 'border-width', min: 0, max: 5, unit: 'px', val: 1 }
                ]
            }
        ],
        cssTemplate: `
.my-input {
    width: 100%;
    max-width: 300px;
    border-style: solid;
    outline: none;
    transition: border-color 0.2s;
}
.my-input:focus {
    border-color: #28a745;
    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.1);
}
        `
    },

    card: {
        name: 'Карточка (Card)',
        icon: '🃏',
        html: `
            <div class="preview-target">
                <h3 style="margin-top:0">Заголовок</h3>
                <p>Текст описания карточки. Здесь может быть любая информация.</p>
                <button style="background:#ddd; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Действие</button>
            </div>`,
        baseClass: 'my-card',
        props: [
            {
                group: 'Основа',
                fields: [
                    { id: 'bg', label: 'Фон', type: 'color', prop: 'background-color', val: '#ffffff' },
                    { id: 'col', label: 'Текст', type: 'color', prop: 'color', val: '#333333' },
                    { id: 'rad', label: 'Радиус', type: 'range', prop: 'border-radius', min: 0, max: 40, unit: 'px', val: 16 },
                ]
            },
            {
                group: 'Тень и Границы',
                fields: [
                    { id: 'shY', label: 'Высота тени', type: 'range', prop: '--sy', min: 0, max: 30, unit: 'px', val: 10 },
                    { id: 'shB', label: 'Размытие тени', type: 'range', prop: '--sb', min: 0, max: 50, unit: 'px', val: 30 },
                    { id: 'brW', label: 'Граница', type: 'range', prop: 'border-width', min: 0, max: 5, unit: 'px', val: 1 },
                    { id: 'brC', label: 'Цвет границы', type: 'color', prop: 'border-color', val: '#e9ecef' },
                ]
            },
            {
                group: 'Внутренности',
                fields: [
                    { id: 'pad', label: 'Отступы', type: 'range', prop: 'padding', min: 0, max: 50, unit: 'px', val: 24 },
                    { id: 'align', label: 'Выравнивание', type: 'select', prop: 'text-align', options: ['left', 'center', 'right'], val: 'left' }
                ]
            }
        ],
        cssTemplate: `
.my-card {
    width: 300px;
    border-style: solid;
    box-shadow: 0 var(--sy) var(--sb) rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    gap: 10px;
}
        `
    }
};

let activeWidgetId = 'button';
let currentValues = {};

// ==========================================
// 2. ЯДРО: РЕНДЕР UI
// ==========================================

function init() {
    renderWidgetList();
    loadWidget('button');
    renderHistory();
}

function renderWidgetList() {
    widgetList.innerHTML = '';
    Object.keys(WIDGETS).forEach(key => {
        const w = WIDGETS[key];
        const btn = document.createElement('div');
        btn.className = `widget-btn ${key === activeWidgetId ? 'active' : ''}`;
        btn.innerHTML = `<span style="font-size:20px">${w.icon}</span> ${w.name}`;
        btn.onclick = () => loadWidget(key);
        widgetList.appendChild(btn);
    });
}

function loadWidget(id) {
    activeWidgetId = id;
    const config = WIDGETS[id];
    
    // UI Update
    document.querySelectorAll('.widget-btn').forEach(b => b.classList.remove('active'));
    renderWidgetList(); 

    // Reset Values
    currentValues = {};
    config.props.forEach(group => {
        group.fields.forEach(f => {
            currentValues[f.id] = f.val;
        });
    });

    renderControls();
    updatePreview();
}

function renderControls() {
    controlsArea.innerHTML = '';
    const config = WIDGETS[activeWidgetId];

    document.getElementById('settingsTitle').innerText = config.name;

    config.props.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'setting-group';
        groupDiv.innerHTML = `<div class="group-title">${group.group}</div>`;

        group.fields.forEach(field => {
            const row = document.createElement('div');
            row.className = 'control-row';
            
            const label = document.createElement('div');
            label.className = 'control-label';
            const displayVal = field.unit ? `${currentValues[field.id]}${field.unit}` : currentValues[field.id];
            label.innerHTML = `<span>${field.label}</span> <span id="val-${field.id}">${displayVal}</span>`;
            row.appendChild(label);

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.innerText = opt;
                    if (opt === currentValues[field.id]) option.selected = true;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = field.type;
                input.value = currentValues[field.id];
                if (field.type === 'range') {
                    input.min = field.min;
                    input.max = field.max;
                    input.step = field.step || 1;
                }
            }

            input.oninput = (e) => {
                currentValues[field.id] = e.target.value;
                const valSpan = document.getElementById(`val-${field.id}`);
                if (valSpan) valSpan.innerText = field.unit ? `${e.target.value}${field.unit}` : e.target.value;
                updatePreview();
            };

            row.appendChild(input);
            groupDiv.appendChild(row);
        });

        controlsArea.appendChild(groupDiv);
    });
}

// ==========================================
// 3. ГЕНЕРАЦИЯ CSS (ИСПРАВЛЕННАЯ ЛОГИКА)
// ==========================================

function generateCSS() {
    const config = WIDGETS[activeWidgetId];
    let finalCSS = config.cssTemplate || '';
    
    // Строка для вставки обычных свойств
    let injectedProps = '';

    Object.keys(currentValues).forEach(fieldId => {
        // Ищем поле в конфиге, чтобы узнать его свойство (prop) и единицу (unit)
        let field;
        config.props.some(g => {
            const found = g.fields.find(fi => fi.id === fieldId);
            if(found) { field = found; return true; }
        });
        
        if (field) {
            const val = field.unit ? `${currentValues[fieldId]}${field.unit}` : currentValues[fieldId];
            
            if (field.prop.startsWith('--')) {
                // Если это переменная, заменяем её в шаблоне
                const regex = new RegExp(`var\\(${field.prop}\\)`, 'g');
                finalCSS = finalCSS.replace(regex, val);
            } else {
                // Если обычное свойство (color, background), добавляем в список для вставки
                injectedProps += `    ${field.prop}: ${val};\n`;
            }
        }
    });

    // === ГЛАВНОЕ ИСПРАВЛЕНИЕ ===
    // Вставляем новые свойства в КОНЕЦ первого блока (перед первой закрывающей скобкой)
    // Это гарантирует, что наши настройки перекроют старые настройки шаблона
    const insertIndex = finalCSS.indexOf('}'); 
    if (insertIndex !== -1) {
        finalCSS = finalCSS.slice(0, insertIndex) + injectedProps + finalCSS.slice(insertIndex);
    }

    return finalCSS.trim();
}

function updatePreview() {
    const config = WIDGETS[activeWidgetId];
    const generatedCSS = generateCSS();
    
    stage.innerHTML = '';
    
    const styleTag = document.createElement('style');
    styleTag.innerHTML = generatedCSS;
    stage.appendChild(styleTag);
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = config.html;
    
    const el = wrapper.firstElementChild;
    el.classList.add(config.baseClass);
    
    stage.appendChild(el);
    cssOutput.innerText = generatedCSS;
}

// ==========================================
// 4. УТИЛИТЫ
// ==========================================

function copyCSS() {
    navigator.clipboard.writeText(cssOutput.innerText).then(() => alert('CSS скопирован!'));
}

function downloadCSS() {
    const blob = new Blob([cssOutput.innerText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${WIDGETS[activeWidgetId].baseClass}.css`;
    a.click();
}

function resetToDefault() {
    if(confirm('Сбросить настройки?')) loadWidget(activeWidgetId);
}

function saveToHistory() {
    const item = {
        id: activeWidgetId,
        date: new Date().toLocaleTimeString(),
        values: {...currentValues}
    };
    const history = JSON.parse(localStorage.getItem('ui_history') || '[]');
    history.unshift(item);
    if(history.length > 10) history.pop();
    localStorage.setItem('ui_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('ui_history') || '[]');
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    
    if (history.length === 0) {
        list.innerHTML = '<div style="color:#777; font-size:12px">Нет сохраненных версий</div>';
        return;
    }

    history.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'history-item';
        row.innerHTML = `<span>${WIDGETS[item.id].icon} ${item.date}</span>`;
        row.onclick = () => {
            activeWidgetId = item.id;
            currentValues = item.values;
            renderControls();
            updatePreview();
        };
        list.appendChild(row);
    });
}

// Старт
init();