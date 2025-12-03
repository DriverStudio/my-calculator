/* main.js - ЯДРО СИСТЕМЫ */

// Категории: finance, health, work, tools, fun
const APPS = [
    // === 💰 ДЕНЬГИ ===
    { id: 'roas',       name: 'Реклама (ROAS)', icon: '💰',      category: 'finance' },
    { id: 'crypto',     name: 'Сложный %',      icon: '📈',      category: 'finance' },
    { id: 'mortgage',   name: 'Ипотека',        icon: '🏠',      category: 'finance' },
    { id: 'nds',        name: 'НДС 20%',        icon: '📊',      category: 'finance' },
    { id: 'goal',       name: 'Копилка',        icon: '🎯',      category: 'finance' },
    
    // === 💊 ЗДОРОВЬЕ ===
    { id: 'bmi',        name: 'Вес (BMI)',      icon: '⚖️',     category: 'health' },
    { id: 'calories',   name: 'Калории',        icon: '🥦', category: 'health' },
    { id: 'gym',        name: 'Жим (1ПМ)',      icon: '💪', category: 'health' },
    { id: 'breathe',    name: 'Релакс',         icon: '🧘', category: 'health' },
    { id: 'life',       name: 'Жизнь (Memento)',icon: '⏳', category: 'health' },

    // === 🛠 РАБОТА & IT ===
    { id: 'freelance',  name: 'Рейт в час',     icon: '💸', category: 'work' },
    { id: 'pomodoro',   name: 'Фокус Таймер',   icon: '🍅', category: 'work' },
    { id: 'text',       name: 'Анализ текста',  icon: '📝', category: 'work' },
    { id: 'translit',   name: 'Транслит',       icon: '🔤', category: 'work' },
    { id: 'palette',    name: 'Палитры',        icon: '🎨', category: 'work' },
    { id: 'json',       name: 'JSON Редактор',  icon: 'hb', category: 'work' }, // иконка { } не везде есть, используем текст или похожую
    { id: 'glass',      name: 'Glass UI',       icon: '💎', category: 'work' },

    // === 🧰 УТИЛИТЫ ===
    { id: 'pass',       name: 'Пароли',         icon: '🔐', category: 'tools' },
    { id: 'qr',         name: 'QR Код',         icon: '📱', category: 'tools' },
    { id: 'date',       name: 'Дней до...',     icon: '📅', category: 'tools' },
    { id: 'metronome',  name: 'Метроном',       icon: '🥁', category: 'tools' },
    { id: 'blob',       name: 'Liquid Blob',    icon: '💧', category: 'tools' },

    // === 🎮 РАЗВЛЕЧЕНИЯ ===
    { id: 'clicker',    name: 'Принтер $',      icon: '🖨️', category: 'fun' },
    { id: 'reaction',   name: 'Реакция',        icon: '⚡', category: 'fun' },
    { id: 'wheel',      name: 'Колесо удачи',   icon: '🎡', category: 'fun' }
];

// ID Таблицы с рекламой
const SPREADSHEET_ID = '1BSQxNAZgGc5q1ONvHlDy0NzYq3zZaraedBADrlx4X3w'; // <--- Вставь сюда свой ID
const SHEET_NAME = 'Sheet1';

// ==========================================
// ЛОГИКА ПУТЕЙ (ИСПРАВЛЕННАЯ)
// ==========================================

let currentAppId = 'home'; // По умолчанию считаем, что мы на Главной
let pathPrefix = './';     // По умолчанию ссылки ведут в текущую папку

// Пробегаемся по списку приложений и смотрим, есть ли их ID в адресе
APPS.forEach(app => {
    // Если в адресе встречается "/bmi/" или "/roas/"
    if (window.location.href.includes(`/${app.id}/`)) {
        currentAppId = app.id; // Ага! Мы внутри калькулятора
        pathPrefix = '../';    // Значит, чтобы выйти, нужно подняться наверх
    }
});

console.log("📍 Мы находимся в разделе:", currentAppId);


// ==========================================
// МОДУЛЬ 1: ОТРИСОВКА МЕНЮ
// ==========================================
// ==========================================
// МОДУЛЬ 1: ОТРИСОВКА МЕНЮ (Обновленный)
// ==========================================
// ==========================================
// МОДУЛЬ 1: ОТРИСОВКА МЕНЮ (С кнопкой темы)
// ==========================================
function initMenu() {
    const navBar = document.createElement('div');
    navBar.className = 'nav-bar';
    
    // Контейнер для скролла
    const scrollBox = document.createElement('div');
    scrollBox.className = 'nav-scroll';
    // Крутим колесиком горизонтально
    scrollBox.addEventListener('wheel', (evt) => {
        if (scrollBox.scrollWidth > scrollBox.clientWidth) {
            evt.preventDefault();
            scrollBox.scrollLeft += evt.deltaY;
        }
    });

    // Ссылка Домой
    const homeLink = document.createElement('a');
    homeLink.className = `nav-link ${currentAppId === 'home' ? 'active' : ''}`;
    homeLink.href = pathPrefix + 'index.html'; 
    homeLink.innerHTML = '🏠 Все';
    scrollBox.appendChild(homeLink);

    // Ссылки приложений
    APPS.forEach(app => {
        const link = document.createElement('a');
        const isActive = app.id === currentAppId;
        link.className = `nav-link ${isActive ? 'active' : ''}`;
        link.href = isActive ? '#' : `${pathPrefix}${app.id}/index.html`;
        link.innerHTML = `${app.icon} ${app.name}`;
        scrollBox.appendChild(link);
    });

    // --- НОВОЕ: Кнопка темы ---
    const themeBtn = document.createElement('div');
    themeBtn.className = 'theme-toggle';
    themeBtn.id = 'themeBtn'; // ID для поиска
    themeBtn.innerHTML = '🌙'; // Иконка по умолчанию
    themeBtn.onclick = toggleTheme; // Обработчик клика

    navBar.appendChild(scrollBox);
    navBar.appendChild(themeBtn); // Добавляем кнопку в меню
    document.body.prepend(navBar);
}
// ==========================================
// МОДУЛЬ 2: ЗАГРУЗКА РЕКЛАМЫ
// ==========================================
async function initAds() {
    const targetId = currentAppId === 'home' ? 'home' : currentAppId;
    console.log("1. Ищем рекламу для:", targetId); // <--- ЖУЧОК 1

    try {
        const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${SHEET_NAME}`;
        console.log("2. Стучимся по ссылке:", url); // <--- ЖУЧОК 2
        
        const response = await fetch(url);
        const data = await response.json();
        console.log("3. Получили данные из таблицы:", data); // <--- ЖУЧОК 3
        
        // Фильтруем рекламу
        const myAds = data.filter(row => row.calc_id === targetId);
        console.log("4. Отфильтрованная реклама для этой страницы:", myAds); // <--- ЖУЧОК 4

        const renderAd = (slotId, type) => {
            const ad = myAds.find(row => row.type === type);
            const slot = document.getElementById(slotId);
            
            if (slot && ad && String(ad.active).toLowerCase() === 'true') {
                console.log(`5. Рисуем баннер ${type}!`); // <--- ЖУЧОК 5
                slot.style.display = 'block';
                slot.style.border = 'none';
                slot.innerHTML = `
                    <div style="font-size:9px;color:#ccc;text-transform:uppercase;margin:5px">Реклама</div>
                    <a href="${ad.link}" target="_blank" style="text-decoration:none;color:inherit">
                        <img src="${ad.image}" alt="${ad.title}">
                        <div class="ad-text"><b>${ad.title}</b><br>${ad.text}</div>
                    </a>`;
            } else {
                 console.log(`Баннер ${type} не прошел проверку (или выключен). Слот найден? ${!!slot}`);
            }
        };

        renderAd('ad-banner-top', 'top_banner');
        renderAd('ad-sidebar', 'sidebar');
    } catch (e) { console.error("ОШИБКА ЗАГРУЗКИ:", e); }
}

// ==========================================
// МОДУЛЬ 3: КОПИРОВАНИЕ
// ==========================================
function copyResult() {
    const val1 = document.getElementById('input1')?.value || '';
    const val2 = document.getElementById('input2')?.value || '';
    const res = document.getElementById('resultValue')?.innerText || '';
    
    // Пытаемся взять описание. Если это input/textarea (бывает), берем value, иначе innerText
    const descEl = document.getElementById('resultDescription');
    const desc = descEl ? (descEl.value || descEl.innerText) : '';

    const text = `📊 Мой результат:\n\nДанные: ${val1} / ${val2}\nИтог: ${res}\n${desc}\n\nПосчитано на: ${window.location.href}`;
    
    navigator.clipboard.writeText(text).then(() => alert('Скопировано!'));
}

// ЗАПУСК
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAmbientBlobs();
    initSpotlight()
    initMenu();
    initFooter();
    initAds();
    
    const copyBtn = document.getElementById('btnCopy');
    if(copyBtn) copyBtn.onclick = copyResult;
});


// ==========================================
// МОДУЛЬ 4: КРАСИВЫЕ ЧИСЛА (Input Formatting)
// ==========================================

// 1. Функция-помощник для калькуляторов
// Вместо parseFloat(...) теперь используй getNumber('id')
function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    // Убираем пробелы и меняем запятую на точку (для тех, кто пишет 12,5)
    const cleanValue = el.value.replace(/\s/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
}

// 2. Логика форматирования при вводе
function initInputFormatting() {
    // Ищем все инпуты, которые должны быть цифрами
    const inputs = document.querySelectorAll('input[inputmode="decimal"], input[inputmode="numeric"]');

    inputs.forEach(input => {
        // Когда уходим из поля -> делаем красиво (12 000)
        input.addEventListener('blur', function() {
            const rawValue = this.value.replace(/\s/g, '').replace(',', '.');
            if (!rawValue || isNaN(rawValue)) return;
            
            // Форматируем (ru-RU делает пробелы: 12 000.5)
            this.value = Number(rawValue).toLocaleString('ru-RU');
        });

        // Когда кликаем в поле -> возвращаем как было (12000), чтобы удобно править
        input.addEventListener('focus', function() {
            this.value = this.value.replace(/\s/g, '');
        });
    });
}

// Добавляем запуск форматирования в старт
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initAds();
    initInputFormatting(); // <--- ЗАПУСКАЕМ КРАСОТУ

    const copyBtn = document.getElementById('btnCopy');
    if(copyBtn) copyBtn.onclick = copyResult;
});

// === АВТО-ЗАГРУЗКА CAPTCHA ===
(function loadCaptchaScript() {
    // Определяем путь к скрипту (зависит от того, где мы: в корне или в папке)
    // pathPrefix мы уже вычисляли в начале main.js (./ или ../)
    const script = document.createElement('script');
    script.src = pathPrefix + 'captcha.js'; 
    script.onload = () => {
        if (typeof initCaptchaSystem === 'function') {
            initCaptchaSystem();
        }
    };
    document.body.appendChild(script);
})();


// ==========================================
// МОДУЛЬ: АНАЛИТИКА (Яндекс + Google)
// ==========================================

// 1. ВСТАВЬ СЮДА СВОИ ID (если какого-то нет, оставь пустым '')
const YANDEX_METRICA_ID = 105629640; // ID
const GOOGLE_ANALYTICS_ID = '';       // Например 'G-XXXXXXXX'

// ------------------------------------------
// Дальше магию не трогаем
// ------------------------------------------

// АВТО-ЗАГРУЗКА ЯНДЕКС.МЕТРИКИ

if (YANDEX_METRICA_ID) {
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(YANDEX_METRICA_ID, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true 
    });
    console.log(`📊 Yandex Metrica [${YANDEX_METRICA_ID}] подключена.`);
}

// АВТО-ЗАГРУЗКА GOOGLE ANALYTICS 4
if (GOOGLE_ANALYTICS_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GOOGLE_ANALYTICS_ID);
    console.log(`📊 Google Analytics [${GOOGLE_ANALYTICS_ID}] подключен.`);
}

// ==========================================
// МОДУЛЬ: ПОДВАЛ (FOOTER)
// ==========================================
function initFooter() {
    const footer = document.createElement('footer');
    footer.className = 'global-footer';
    
    const year = new Date().getFullYear();
    
    // Ты можешь поменять "Империя Инструментов" на свое название
    // pathPrefix у нас уже вычислен в начале файла (./ или ../)
    const homeLink = pathPrefix + 'index.html';

    footer.innerHTML = `
        <div>&copy; ${year} <b>DriverStudio</b>. Все права защищены.</div>
        <div style="margin-top: 10px;">
            <a href="${homeLink}">Главная</a> • 
            <a href="https://github.com/твое-имя/репозиторий" target="_blank">GitHub</a>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #999;">
            Сделано с 💻 и ☕
        </div>
    `;

    // Вставляем в конец body
    document.body.appendChild(footer);
}

// ==========================================
// НОВОЕ: ЛОГИКА ТЕМЫ И ЗВЕЗД
// ==========================================

// Глобальная функция переключения (чтобы initMenu её видел)
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
}

function applyTheme(isDark) {
    const icon = document.getElementById('themeBtn');
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        if(icon) icon.innerText = '☀️';
        createStarBackground(); // Создаем звезды, если их еще нет
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        if(icon) icon.innerText = '🌙';
    }
}

// Инициализация при загрузке
function initTheme() {
    const saved = localStorage.getItem('theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Если сохранено dark ИЛИ (не сохранено ничего И в системе dark)
    const shouldBeDark = saved === 'dark' || (!saved && sysDark);
    applyTheme(shouldBeDark);
}

// Генерация звезд (CSS Box-Shadow)
function createStarBackground() {
    if (document.getElementById('stars-bg')) return; // Не создаем дубликаты

    const container = document.createElement('div');
    container.id = 'stars-bg';
    container.className = 'stars-container';
    
    // 3 слоя для глубины
    [1, 2, 3].forEach(i => {
        const layer = document.createElement('div');
        layer.className = 'star-layer';
        layer.id = `star-layer-${i}`;
        
        let shadows = [];
        // Генерируем 100-300 звезд на слой
        for (let s = 0; s < 100 * i; s++) {
            const x = Math.floor(Math.random() * 100);
            const y = Math.floor(Math.random() * 100);
            const size = Math.random() * 2; 
            const alpha = Math.random();
            shadows.push(`${x}vw ${y}vh 0 ${size}px rgba(255,255,255,${alpha})`);
        }
        layer.style.boxShadow = shadows.join(',');
        container.appendChild(layer);
    });

    document.body.prepend(container);

    // Параллакс эффект при скролле
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const l1 = document.getElementById('star-layer-1');
        const l2 = document.getElementById('star-layer-2');
        const l3 = document.getElementById('star-layer-3');
        if(l1) l1.style.transform = `translateY(${y * 0.5}px)`;
        if(l2) l2.style.transform = `translateY(${y * 0.3}px)`;
        if(l3) l3.style.transform = `translateY(${y * 0.1}px)`;
    });
}

// Генерация фоновых пятен (Aurora Effect)
function initAmbientBlobs() {
    // Проверка, чтобы не создавать дубликаты
    if (document.querySelector('.ambient-blob')) return;

    const b1 = document.createElement('div');
    b1.className = 'ambient-blob blob-1';
    
    const b2 = document.createElement('div');
    b2.className = 'ambient-blob blob-2';

    // Вставляем в body
    document.body.prepend(b1);
    document.body.prepend(b2);
}

// ==========================================
// 5. ЭФФЕКТ "SPOTLIGHT" (ПОДСВЕТКА КУРСОРА)
// ==========================================
function initSpotlight() {
    const cards = document.querySelectorAll('.tool-card');
    
    // Функция обновления координат
    const handleMove = (e, card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
    };

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => handleMove(e, card));
        // При уходе мыши свет погаснет сам (через CSS opacity),
        // но координаты останутся на краю, что выглядит естественно.
    });

    // Следим за появлением новых карточек (если они грузятся динамически)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                document.querySelectorAll('.tool-card').forEach(card => {
                    // Вешаем обработчик, если еще нет (простая защита от дублей)
                    card.onmousemove = (e) => handleMove(e, card); 
                });
            }
        });
    });
    
    const grid = document.querySelector('.catalog-grid');
    if (grid) observer.observe(grid, { childList: true });
}