/* main.js - ЯДРО СИСТЕМЫ (FULL VERSION) */

// ==========================================
// 1. КОНФИГУРАЦИЯ И ДАННЫЕ
// ==========================================

const APPS = [
    { id: 'roas',       name: 'Реклама (ROAS)', icon: '💰',     category: 'finance' },
    { id: 'crypto',     name: 'Сложный %',      icon: '📈',     category: 'finance' },
    { id: 'mortgage',   name: 'Ипотека',        icon: '🏠',     category: 'finance' },
    { id: 'nds',        name: 'НДС 20%',        icon: '📊',      category: 'finance' },
    { id: 'goal',       name: 'Копилка',        icon: '🎯',      category: 'finance' },
    { id: 'bmi',        name: 'Вес (BMI)',      icon: '⚖️',     category: 'health' },
    { id: 'calories',   name: 'Калории',        icon: '🥦',     category: 'health' },
    { id: 'gym',        name: 'Жим (1ПМ)',      icon: '💪', category: 'health' },
    { id: 'breathe',    name: 'Релакс',         icon: '🧘', category: 'health' },
    { id: 'life',       name: 'Жизнь (Memento)',icon: '⏳', category: 'health' },
    { id: 'sounds',     name: 'Фокус и Релакс', icon: '🎧', category: 'health' },
    { id: 'ambient',    name: 'Фокус Видео',    icon: '🏔️', category: 'health' },
    { id: 'habits',     name: 'Мой Сад',        icon: '🌿', category: 'health' },
    { id: 'freelance',  name: 'Рейт в час',     icon: '💸', category: 'work' },
    { id: 'pomodoro',   name: 'Фокус Таймер',   icon: '🍅', category: 'work' },
    { id: 'text',       name: 'Анализ текста',  icon: '📝', category: 'work' },
    { id: 'translit',   name: 'Транслит',       icon: '🔤', category: 'work' },
    { id: 'palette',    name: 'Палитры',        icon: '🎨', category: 'work' },
    { id: 'json',       name: 'JSON Редактор',  icon: 'hb', category: 'work' },
    { id: 'glass',      name: 'Glass UI',       icon: '💎', category: 'work' },
    { id: 'notes',      name: 'Заметки',        icon: '📌', category: 'work' },
    { id: 'pass',       name: 'Пароли',         icon: '🔐', category: 'tools' },
    { id: 'qr',         name: 'QR Код',         icon: '📱', category: 'tools' },
    { id: 'date',       name: 'Дней до...',     icon: '📅', category: 'tools' },
    { id: 'metronome',  name: 'Метроном',       icon: '🥁', category: 'tools' },
    { id: 'blob',       name: 'Liquid Blob',    icon: '💧', category: 'tools' },
    { id: 'audio',      name: 'Аудио Каттер',   icon: '✂️', category: 'tools' },
    { id: 'mesh',       name: 'Mesh Gradients', icon: '🌈', category: 'tools' },
    { id: 'image',      name: 'Сжатие фото',    icon: '🖼️', category: 'tools' },
    { id: 'sign',       name: 'Автограф',       icon: '✍️', category: 'tools' },
    { id: 'timer',      name: 'Visual Timer',   icon: '⏳', category: 'tools' },
    { id: 'timeline',   name: 'Timeline',       icon: '🧬', category: 'tools' },
    { id: 'clicker',    name: 'Принтер $',      icon: '🖨️', category: 'fun' },
    { id: 'reaction',   name: 'Реакция',        icon: '⚡', category: 'fun' },
    { id: 'typer',      name: 'Хакер Тайпер',   icon: '⌨️', category: 'fun' },
    { id: 'hexaland',   name: 'Hexa Lands',     icon: '🏝️', category: 'fun' },
    { id: 'wheel',      name: 'Колесо удачи',   icon: '🎡', category: 'fun' },
];

// Настройки Рекламы и Аналитики
const SPREADSHEET_ID = '1BSQxNAZgGc5q1ONvHlDy0NzYq3zZaraedBADrlx4X3w'; 
const SHEET_NAME = 'Sheet1';
const YANDEX_METRICA_ID = 105629640;
const GOOGLE_ANALYTICS_ID = ''; 

// Логика путей (Роутинг)
let currentAppId = 'home';
let pathPrefix = './';

APPS.forEach(app => {
    if (window.location.href.includes(`/${app.id}/`)) {
        currentAppId = app.id;
        pathPrefix = '../';
    }
});
console.log(`📍 App: ${currentAppId}, Path: ${pathPrefix}`);


// ==========================================
// 2. СИСТЕМА ПЕРЕВОДОВ (I18N) - FIXED
// ==========================================

window.I18N = {}; 
let currentLang = localStorage.getItem('lang') || 'ru';

async function initTranslations() {
    console.log('🌍 I18N: Загрузка...');
    try {
        const response = await fetch(pathPrefix + 'translations_all_services.json');
        if (!response.ok) throw new Error('Network error');
        
        window.I18N = await response.json();
        console.log('✅ I18N: Загружено!');
        applyLanguage(currentLang);
    } catch (e) {
        console.error("❌ I18N Error:", e);
        // Даже при ошибке обновляем кнопку
        const btn = document.getElementById('langBtn');
        if(btn) btn.innerText = currentLang.toUpperCase();
    }
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    // 1. Обновляем кнопку (Критически важно)
    const btn = document.getElementById('langBtn');
    if (btn) btn.innerText = lang.toUpperCase();

    // 2. Если данных нет, выходим
    if (!window.I18N || !window.I18N[lang]) return;

    // 3. Применяем переводы
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const keyPath = el.getAttribute('data-i18n').split('.');
        const section = keyPath[0];
        const key = keyPath[1];
        
        if (window.I18N[lang][section] && window.I18N[lang][section][key]) {
            const val = window.I18N[lang][section][key];
            if (el.tagName === 'INPUT') el.placeholder = val;
            else el.innerText = val;
        }
    });

    // 4. Обновляем каталог на главной
    if (typeof renderCatalog === 'function') renderCatalog();
}

function toggleLanguage() {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    applyLanguage(newLang);
}


// ==========================================
// 3. МЕНЮ И ТЕМА (UI) - FIXED
// ==========================================

function initLoader() {
    // 1. Создаем элементы
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    
    // Вставляем в самое начало body
    document.body.prepend(loader);

    // 2. Функция скрытия (с небольшой задержкой для плавности)
    const hideLoader = () => {
        loader.classList.add('hidden');
        // Полностью удаляем из DOM через полсекунды (когда анимация пройдет), чтобы не мешал
        setTimeout(() => {
            if(loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
    };

    // 3. Слушаем полную загрузку страницы (картинки, стили, скрипты)
    if (document.readyState === 'complete') {
        setTimeout(hideLoader, 200); // Если уже загрузилось (кэш)
    } else {
        window.addEventListener('load', hideLoader);
    }
    
    // Страховка: если что-то зависло, всё равно убрать лоадер через 3 сек
    setTimeout(hideLoader, 3000);
}

function initMenu() {
    const navBar = document.createElement('div');
    navBar.className = 'nav-bar';
    
    // 1. Создаем контейнер для скролла
    const scrollBox = document.createElement('div');
    scrollBox.className = 'nav-scroll';

    // === 🔥 ФИКС ДЕРГАНЬЯ: ВОССТАНАВЛИВАЕМ ПОЗИЦИЮ СКРОЛЛА ===
    // Читаем сохраненную позицию из памяти
    const savedScroll = sessionStorage.getItem('navScrollPos');
    
    // Если позиция сохранена, применяем её сразу, как только элемент появится
    if (savedScroll) {
        // requestAnimationFrame гарантирует, что это произойдет до отрисовки кадра
        requestAnimationFrame(() => {
            scrollBox.scrollLeft = parseInt(savedScroll, 10);
        });
    }

    // Сохраняем позицию при каждом движении скролла
    scrollBox.addEventListener('scroll', () => {
        sessionStorage.setItem('navScrollPos', scrollBox.scrollLeft);
    });

    // === КОНЕЦ ФИКСА ===

    scrollBox.addEventListener('wheel', (evt) => {
        if (scrollBox.scrollWidth > scrollBox.clientWidth) {
            evt.preventDefault();
            scrollBox.scrollLeft += evt.deltaY;
        }
    });

    const homeLink = document.createElement('a');
    homeLink.className = `nav-link ${currentAppId === 'home' ? 'active' : ''}`;
    homeLink.href = pathPrefix + 'index.html'; 
    homeLink.innerHTML = '🏠 Все';
    scrollBox.appendChild(homeLink);

    APPS.forEach(app => {
        const link = document.createElement('a');
        const isActive = app.id === currentAppId;
        link.className = `nav-link ${isActive ? 'active' : ''}`;
        link.href = isActive ? '#' : `${pathPrefix}${app.id}/index.html`;
        link.innerHTML = `${app.icon} ${app.name}`;
        scrollBox.appendChild(link);
    });

    // Кнопки справа
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '8px';
    controls.style.paddingRight = '20px';
    // Чтобы кнопки справа не сжимались
    controls.style.flexShrink = '0'; 

    // === 🔔 КОЛОКОЛЬЧИК (НОВОЕ) ===
    const bellBtn = document.createElement('div');
    bellBtn.className = 'notification-btn';
    bellBtn.id = 'notifBtn';
    bellBtn.innerHTML = '🔔<div class="bell-badge" id="bellBadge"></div>';
    
    // Панель уведомлений
    const notifPanel = document.createElement('div');
    notifPanel.className = 'notif-panel';
    notifPanel.id = 'notifPanel';
    notifPanel.innerHTML = '<div class="notif-empty">Нет новых уведомлений</div>';

    // Логика открытия/закрытия
    bellBtn.onclick = (e) => {
        e.stopPropagation(); // Чтобы клик не ушел на window и сразу не закрыл панель
        notifPanel.classList.toggle('open');

        // === ДОБАВЛЕНО: Убираем точку при открытии ===
        if (notifPanel.classList.contains('open')) {
            const badge = document.getElementById('bellBadge');
            if (badge) {
                badge.classList.remove('active');
            }
        }
    };

    // Закрытие при клике вне панели
    window.addEventListener('click', (e) => {
        if (!notifPanel.contains(e.target) && !bellBtn.contains(e.target)) {
            notifPanel.classList.remove('open');
        }
    });

    controls.appendChild(bellBtn);
    controls.appendChild(notifPanel);
    // === КОНЕЦ КОЛОКОЛЬЧИКА ===


    // Кнопка Языка
    const langBtn = document.createElement('div');
    langBtn.className = 'theme-toggle'; 
    langBtn.id = 'langBtn'; 
    langBtn.innerText = currentLang.toUpperCase(); // innerText безопаснее
    langBtn.style.fontWeight = 'bold';
    langBtn.style.fontSize = '14px';
    langBtn.onclick = toggleLanguage;

    // Кнопка Темы
    const themeBtn = document.createElement('div');
    themeBtn.className = 'theme-toggle';
    themeBtn.id = 'themeBtn'; 
    themeBtn.innerText = '🌙'; 
    themeBtn.onclick = toggleTheme;

    controls.appendChild(langBtn);
    controls.appendChild(themeBtn);

    navBar.appendChild(scrollBox);
    navBar.appendChild(controls);
    document.body.prepend(navBar);
}

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
        createStarBackground();
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        if(icon) icon.innerText = '🌙';
    }
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved === 'dark' || (!saved && sysDark));
}


// ==========================================
// 4. РЕКЛАМА (GOOGLE SHEETS) - FIXED SIDEBAR
// ==========================================

async function initAds() {
    const targetId = currentAppId === 'home' ? 'home' : currentAppId;
    try {
        const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${SHEET_NAME}`;
        const response = await fetch(url);
        const data = await response.json();
        
        const myAds = data.filter(row => row.calc_id === targetId);

        const renderAd = (slotId, type) => {
            const ad = myAds.find(row => row.type === type);
            const slot = document.getElementById(slotId);
            const sidebarParent = slot ? slot.closest('.sidebar') : null;
            const hasAd = slot && ad && String(ad.active).toLowerCase() === 'true';

            if (hasAd) {
                // ЕСТЬ РЕКЛАМА
                slot.style.display = 'block';
                // Убеждаемся, что сайдбар виден (на случай если он был скрыт CSS)
                if (sidebarParent) sidebarParent.style.display = 'block';

                slot.innerHTML = `
                    <div style="font-size:9px;color:#ccc;text-transform:uppercase;margin:5px">Реклама</div>
                    <a href="${ad.link}" target="_blank" style="text-decoration:none;color:inherit">
                        <img src="${ad.image}" alt="${ad.title}">
                        <div class="ad-text">${ad.title}<br>${ad.text}</div>
                    </a>`;
            } else {
                // НЕТ РЕКЛАМЫ
                if (slot) slot.style.display = 'none';

                // ВАЖНО: Мы НЕ скрываем sidebarParent, потому что там могут быть инструкции!
            }
        };

        renderAd('ad-banner-top', 'top_banner');
        renderAd('ad-sidebar', 'sidebar');

    } catch (e) { 
        console.error("Ads Error:", e);
        // При ошибке сети тоже просто скрываем слоты, не трогая контент
        const sidebarSlot = document.getElementById('ad-sidebar');
        if (sidebarSlot) sidebarSlot.style.display = 'none';
        
        const topSlot = document.getElementById('ad-banner-top');
        if (topSlot) topSlot.style.display = 'none';
    }
}


// ==========================================
// 5. ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (Stars & Spotlight)
// ==========================================

function createStarBackground() {
    // Если контейнер уже есть, не создаем дубликат
    if (document.getElementById('stars-bg')) return;

    const container = document.createElement('div');
    container.id = 'stars-bg';
    container.className = 'stars-container';

    // Попытаемся достать "карту звезд" из памяти
    let starData = JSON.parse(localStorage.getItem('fixed_stars_v2'));

    // Если карты нет (первый заход), генерируем её
    if (!starData) {
        starData = [];
        [1, 2, 3].forEach(i => {
            let shadows = [];
            // Генерируем звезды (количество зависит от слоя)
            for (let s = 0; s < 100 * i; s++) {
                shadows.push(`${Math.floor(Math.random()*100)}vw ${Math.floor(Math.random()*100)}vh 0 ${Math.random()*2}px rgba(255,255,255,${Math.random()})`);
            }
            starData.push(shadows.join(','));
        });
        // Сохраняем "вселенную" навсегда
        localStorage.setItem('fixed_stars_v2', JSON.stringify(starData));
    }

    // Создаем слои, используя сохраненные данные
    [1, 2, 3].forEach((i, index) => {
        const layer = document.createElement('div');
        layer.className = 'star-layer';
        layer.id = `star-layer-${i}`;
        
        // Применяем сохраненные тени (координаты звезд)
        layer.style.boxShadow = starData[index];
        
        container.appendChild(layer);
    });

    document.body.prepend(container);

    // Параллакс эффект при скролле (оставляем как есть)
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const l1 = document.getElementById('star-layer-1');
        const l2 = document.getElementById('star-layer-2');
        if(l1) l1.style.transform = `translateY(${y * 0.5}px)`;
        if(l2) l2.style.transform = `translateY(${y * 0.3}px)`;
    });
}

function initAmbientBlobs() {
    if (document.querySelector('.ambient-blob')) return;
    const b1 = document.createElement('div'); b1.className = 'ambient-blob blob-1';
    const b2 = document.createElement('div'); b2.className = 'ambient-blob blob-2';
    document.body.prepend(b1);
    document.body.prepend(b2);
}

function initSpotlight() {
    const handleMove = (e, card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };
    
    const observer = new MutationObserver((mutations) => {
        if (mutations.some(m => m.addedNodes.length)) {
             document.querySelectorAll('.tool-card').forEach(c => c.onmousemove = (e) => handleMove(e, c));
        }
    });
    
    document.querySelectorAll('.tool-card').forEach(c => c.onmousemove = (e) => handleMove(e, c));
    const grid = document.querySelector('.catalog-grid');
    if (grid) observer.observe(grid, { childList: true });
}


// ==========================================
// 6. УТИЛИТЫ (Captcha, Analytics, Inputs)
// ==========================================

// ==========================================
// 8. SIDE PORTALS (Соседние страницы)
// ==========================================

function initSidePortals() {
    // 1. Не запускаем на главной (там каталог) и на мобильных
    if (currentAppId === 'home' || window.innerWidth < 1100) return;

    // 2. Ищем текущий индекс в массиве APPS
    const currentIndex = APPS.findIndex(app => app.id === currentAppId);
    if (currentIndex === -1) return; // Если приложение не найдено в списке

    // 3. Вычисляем соседей (циклично: после последнего идет первый)
    // Предыдущий
    const prevIndex = (currentIndex - 1 + APPS.length) % APPS.length;
    const prevApp = APPS[prevIndex];
    
    // Следующий
    const nextIndex = (currentIndex + 1) % APPS.length;
    const nextApp = APPS[nextIndex];

    // Функция создания HTML портала
    // Функция создания HTML портала
    const createPortal = (app, side) => {
        const container = document.createElement('div');
        container.className = `portal-container portal-${side}`;
        
        const url = `${pathPrefix}${app.id}/index.html`;

        // 1. Создаем iframe вручную
        const iframe = document.createElement('iframe');
        iframe.className = 'portal-frame';
        iframe.tabIndex = -1;
        
        // 2. СЛУШАЕМ ЗАГРУЗКУ
        iframe.onload = () => {
            // Как только загрузился — добавляем класс, который плавно покажет его
            iframe.classList.add('is-ready');
        };
        
        // Задаем src ПОСЛЕ назначения onload
        iframe.src = url;

        // Оверлей для клика
        const overlay = document.createElement('div');
        overlay.className = 'portal-overlay';
        overlay.title = `Перейти: ${app.name}`;
        
        // Сборка
        container.appendChild(iframe);
        container.appendChild(overlay);

        // Клик по оверлею = переход
        overlay.addEventListener('click', () => {
            document.body.classList.add('is-exiting');
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        });

        document.body.appendChild(container);
    };

    // 4. Создаем порталы
    createPortal(prevApp, 'left');
    createPortal(nextApp, 'right');
    
    // 5. Добавляем управление стрелками клавиатуры
    document.addEventListener('keydown', (e) => {
        // Игнорируем, если фокус в инпуте
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === 'ArrowLeft') {
            document.querySelector('.portal-left .portal-overlay').click();
        }
        if (e.key === 'ArrowRight') {
            document.querySelector('.portal-right .portal-overlay').click();
        }
    });
}

// ==========================================
// 8. СИСТЕМА ПЕРЕХОДОВ (TRANSITIONS)
// ==========================================

function initPageTransitions() {
    // 1. Перехватываем клики по всем ссылкам
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        // Если клик не по ссылке, или ссылка открывается в новом окне (_blank), игнорируем
        if (!link || link.target === '_blank' || link.getAttribute('href').startsWith('#')) return;

        // Если это внутренняя ссылка
        const href = link.getAttribute('href');
        if (href) {
            e.preventDefault(); 
            
            // 1. Вешаем класс, запускающий CSS @keyframes pageExit
            document.body.classList.add('is-exiting');

            // 2. Ждем, пока анимация (0.3s) закончится
            setTimeout(() => {
                window.location.href = href;
            }, 300); // <--- Должно быть 300, как в CSS
        }
    });

    // 2. Фикс для кнопки "Назад" в браузере
    // (Если пользователь нажал Назад, страница берется из кэша, и класс is-exiting может остаться)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            document.body.classList.remove('is-exiting');
        }
    });
}

// Загрузка капчи
(function loadCaptchaScript() {
    const script = document.createElement('script');
    script.src = pathPrefix + 'captcha.js'; 
    script.onload = () => {
        if (typeof initCaptchaSystem === 'function') initCaptchaSystem();
    };
    document.body.appendChild(script);
})();

// Форматирование инпутов
function initInputFormatting() {
    const inputs = document.querySelectorAll('input[inputmode="decimal"], input[inputmode="numeric"]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const raw = this.value.replace(/\s/g, '').replace(',', '.');
            if (raw && !isNaN(raw)) this.value = Number(raw).toLocaleString('ru-RU');
        });
        input.addEventListener('focus', function() {
            this.value = this.value.replace(/\s/g, '');
        });
    });
}

// Копирование результата
function copyResult() {
    const res = document.getElementById('resultValue')?.innerText;
    if(res) navigator.clipboard.writeText(res).then(() => alert('Скопировано!'));
}

// Аналитика (Yandex + Google)
if (YANDEX_METRICA_ID) {
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym(YANDEX_METRICA_ID, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
}

if (GOOGLE_ANALYTICS_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GOOGLE_ANALYTICS_ID);
}

// ==========================================
// 9. AUTO ICONS (Иконки из папки или Emoji)
// ==========================================

function initAutoIcons() {
    // 1. Ищем текущее приложение в базе
    const app = APPS.find(a => a.id === currentAppId);
    if (!app) return; // Если это главная или 404 — ничего не делаем

    // 2. Формируем путь к потенциальной SVG (учитываем pathPrefix ../)
    // Важно: папка icons должна лежать в корне, рядом с main.js
    const iconPath = `${pathPrefix}icons/${app.id}.svg`;

    // 3. Проверяем, существует ли файл
    const tester = new Image();
    
    tester.onload = function() {
        // SVG найдена -> ставим её
        applyPageIcon(iconPath, true);
    };
    
    tester.onerror = function() {
        // SVG нет -> ставим эмодзи из конфига
        applyPageIcon(app.icon || '💎', false);
    };
    
    tester.src = iconPath;
}

function applyPageIcon(src, isSvg) {
    // A. УСТАНОВКА FAVICON (Вкладка браузера)
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }

    if (isSvg) {
        link.type = 'image/svg+xml';
        link.href = src;
    } else {
        // Превращаем эмодзи в SVG "на лету"
        link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${src}</text></svg>`;
    }

    // B. УСТАНОВКА В ЗАГОЛОВОК H1
    const h1 = document.querySelector('h1');
    if (h1) {
        // Проверяем, не стоит ли там уже иконка (чтобы не дублировать)
        if (h1.querySelector('.logo-icon') || h1.innerText.includes(src)) return;

        if (isSvg) {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'logo-icon'; 
            img.alt = 'Logo';
            
            // Базовые стили, если в CSS их нет
            img.style.height = '1em';
            img.style.width = 'auto';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '10px';
            img.style.marginBottom = '4px'; // Чуть-чуть коррекции
            
            h1.prepend(img);
        } else {
            // Если эмодзи
            const span = document.createElement('span');
            span.innerText = src;
            span.style.marginRight = '10px';
            h1.prepend(span);
        }
    }
}


// ==========================================
// 10. AUTO-SAVE (Сохранение введенных данных)
// ==========================================

function initAutoSave() {
    // Работаем только внутри сервисов (не на главной)
    if (currentAppId === 'home') return;

    // Ищем все инпуты, у которых есть ID
    const inputs = document.querySelectorAll('input[id], textarea[id], select[id]');

    inputs.forEach(input => {
        // Уникальный ключ: id_приложения + id_инпута (например: "bmi_input1")
        const storageKey = `${currentAppId}_${input.id}`;

        // 1. ВОССТАНОВЛЕНИЕ: Если есть сохраненное значение — подставляем
        const savedValue = localStorage.getItem(storageKey);
        if (savedValue !== null && savedValue !== '') {
            input.value = savedValue;
        }

        // 2. СОХРАНЕНИЕ: При каждом изменении пишем в память
        input.addEventListener('input', () => {
            localStorage.setItem(storageKey, input.value);
        });
        
        // Для select (выпадающих списков) событие change надежнее
        input.addEventListener('change', () => {
            localStorage.setItem(storageKey, input.value);
        });
    });
}

// ==========================================
// 11. HABIT REMINDER (Умные напоминания)
// ==========================================

function initHabitReminder() {
    // 1. Читаем базу
    const rawData = localStorage.getItem('prisma_habits_flat');
    if (!rawData) return;

    const habits = JSON.parse(rawData);
    if (habits.length === 0) return;

    // 2. Считаем жаждущих
    const today = new Date().toISOString().split('T')[0];
    const thirstyHabits = habits.filter(h => {
        if (h.lastWatered === today) return false;
        
        // Проверка на "мертвые" растения
        if (h.lastWatered) {
            const last = new Date(h.lastWatered);
            const now = new Date();
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            if (diffDays > 2) return false; 
        }
        return true;
    });

    const count = thirstyHabits.length;
    if (count === 0) return;

    // === ЛОГИКА КОЛОКОЛЬЧИКА ===
    const badge = document.getElementById('bellBadge');
    const panel = document.getElementById('notifPanel');

    if (badge && panel) {
        // 1. Включаем красную точку
        badge.classList.add('active');

        // 2. Наполняем панель
        const text = count === 1 ? 'растение хочет пить' : 'растения хотят пить';
        
        panel.innerHTML = `
            <div style="padding: 0 5px 10px; font-weight: bold; font-size: 13px; color: var(--text-muted); border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 5px;">
                Уведомления
            </div>
            <div class="notif-item" onclick="window.location.href='${pathPrefix}habits/index.html'">
                <div class="notif-icon">🌱</div>
                <div class="notif-content">
                    <div class="notif-title">Habit Garden</div>
                    <div class="notif-text">Сад зовёт! ${count} ${text}.</div>
                </div>
            </div>
        `;
    }

    // === ЛОГИКА ТОСТА (Оставляем для важности) ===
    // Показываем только 1 раз за сессию, если мы не внутри приложения
    const sessionKey = 'prisma_habit_toast_shown';
    if (!sessionStorage.getItem(sessionKey) && currentAppId !== 'habits') {
        showToast(count); // Используем функцию из предыдущего шага
        sessionStorage.setItem(sessionKey, 'true');
    }
}

function showToast(count) {
    const toast = document.createElement('div');
    toast.className = 'global-toast';
    
    // Текст зависит от числа
    const text = count === 1 ? 'растение хочет пить' : 'растения хотят пить';
    
    toast.innerHTML = `
        <span style="font-size:20px">🌱</span>
        <div style="font-size:14px; font-weight:600">
            Сад зовёт! <span style="font-weight:400; opacity:0.8">${count} ${text}.</span>
        </div>
    `;

    // При клике - переход в приложение
    toast.onclick = () => {
        // Эффект выхода перед переходом
        document.body.classList.add('is-exiting');
        setTimeout(() => {
            // Учитываем pathPrefix, чтобы ссылка сработала из любой папки
            window.location.href = `${pathPrefix}habits/index.html`; 
        }, 300);
    };

    document.body.appendChild(toast);

    // Анимация входа (небольшая задержка, чтобы интерфейс прогрузился)
    setTimeout(() => {
        toast.classList.add('show');
        // Звук "Pop" (опционально, очень тихий)
        // new Audio(pathPrefix + 'assets/pop.mp3').play().catch(()=>{}); 
    }, 1500);

    // Авто-скрытие через 6 секунд
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    }, 8000);
}

// ==========================================
// 12. ТУТОРИАЛ (АВТОМАТИЧЕСКАЯ ЗАГРУЗКА)
// ==========================================

async function initTutorial() {
    // 1. На главной странице туториал сервисов не нужен
    if (currentAppId === 'home') return;

    try {
        // 2. Пытаемся найти файл tutorial.json ПРЯМО В ТЕКУЩЕЙ ПАПКЕ
        // (Т.к. index.html и tutorial.json лежат рядом, путь просто имя файла)
        const response = await fetch('tutorial.json');

        if (response.ok) {
            const steps = await response.json();
            console.log('🎓 Найден туториал для', currentAppId);
            
            // 3. Если файл есть — грузим движок и запускаем
            loadDriverJs(steps);
        }
    } catch (e) {
        // Если файла нет (404) — просто молчим, ошибки не будет
        // console.log('Туториала нет');
    }
}

function loadDriverJs(steps) {
    // Проверяем, может библиотека уже есть
    if (window.driver) {
        startTour(steps);
        return;
    }

    // Динамически подключаем стили
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.css';
    document.head.appendChild(link);

    // Динамически подключаем скрипт
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.js.iife.js';
    
    script.onload = () => {
        // Сохраняем шаги глобально, чтобы кнопка в футере могла их перезапустить
        window.currentTutorialSteps = steps;
        
        // Проверяем, видел ли юзер этот туториал ранее
        const key = `tutorial_seen_${currentAppId}`;
        if (!localStorage.getItem(key)) {
            startTour(steps);
            localStorage.setItem(key, 'true');
        }
    };
    
    document.head.appendChild(script);
}

function startTour(steps) {
    if (!window.driver || !window.driver.js) return;

    const driverObj = window.driver.js.driver({
        showProgress: true,
        steps: steps,
        nextBtnText: 'Далее →',
        prevBtnText: '← Назад',
        doneBtnText: 'Готово',
        // Исправляем перекрытие элементами интерфейса (на всякий случай)
        popoverClass: 'driverjs-theme'
    });

    driverObj.drive();
}

// Глобальная функция для кнопки "Обучение" в футере
window.restartTour = function() {
    if (window.currentTutorialSteps) {
        startTour(window.currentTutorialSteps);
    } else {
        // Если шаги еще не загружены, попробуем загрузить принудительно
        // (на случай если юзер закрыл и снова нажал, а переменная стерлась)
        initTutorial().then(() => {
             if(window.currentTutorialSteps) startTour(window.currentTutorialSteps);
             else alert('Для этого раздела нет обучения');
        });
    }
};


// ==========================================
// СТАРТ (ENTRY POINT)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // === 🛠️ ФИКС ДЛЯ ПОРТАЛОВ (Убираем скролл и лишнее) ===
    if (window.self !== window.top) {
        // Мы внутри iframe!
        
        // 1. Убираем скроллбары намертво
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        // 2. (Опционально) Скрываем меню навигации в миниатюрах, 
        // чтобы карточка выглядела чище (только контент)
        const nav = document.querySelector('.nav-bar');
        if (nav) nav.style.display = 'none';
        
        // 3. Отступ сверху тоже убираем, чтобы контент был по центру
        document.body.style.paddingTop = '0';
    }
    initTheme();
    initAmbientBlobs();
    initSpotlight();
    
    initMenu();          // 1. Создаем меню
    initTranslations();  // 2. Грузим язык
    initAds();           // 3. Грузим рекламу

    initAutoIcons();
    
    initInputFormatting();
    initFooter();
    initPageTransitions();
    initSidePortals();
    initAutoSave();
    initHabitReminder();

    initTutorial();      // 4. Пытаемся загрузить туториал (если есть)
    
    const copyBtn = document.getElementById('btnCopy');
    if(copyBtn) copyBtn.onclick = copyResult;
});

function initFooter() {
    const footer = document.createElement('footer');
    footer.className = 'global-footer';
    const year = new Date().getFullYear();
    
    // Добавляем ссылку "Обучение" с onclick="restartTour()"
    footer.innerHTML = `
        <div style="margin-bottom: 8px;">&copy; ${year} <b>DriverStudio</b></div>
        <div style="font-size: 13px; opacity: 0.8; display: flex; gap: 15px; justify-content: center;">
            <a href="${pathPrefix}index.html">Главная</a>
            <span>•</span>
            <span onclick="window.restartTour && window.restartTour()" style="cursor: pointer; border-bottom: 1px dotted; text-decoration: none;">Обучение</span>
        </div>
    `;
    document.body.appendChild(footer);
}

// Функция для безопасного получения числа из инпута
function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    
    // 1. Берем значение
    let val = el.value;
    
    // 2. Удаляем пробелы (от форматирования 10 000 -> 10000)
    val = val.replace(/\s/g, '');
    
    // 3. Заменяем запятую на точку (если юзер ввел 10,5)
    val = val.replace(',', '.');
    
    // 4. Превращаем в число. Если пусто или мусор — возвращаем 0
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
}

/**
 * Универсальная отправка уведомления
 * @param {string} title - Заголовок (напр. "Таймер")
 * @param {string} text - Текст сообщения
 * @param {string} icon - Эмодзи или URL
 * @param {function} onClick - Что делать при клике (необязательно)
 */
/**
 * Универсальная отправка уведомления (Панель + Всплывашка)
 */
/**
 * Проверка: если уведомлений нет, вернуть заглушку и убрать красную точку
 */
function checkNotifEmpty() {
    const panel = document.getElementById('notifPanel');
    const badge = document.getElementById('bellBadge');
    
    // Ищем элементы с классом .notif-item
    const items = panel.querySelectorAll('.notif-item');
    
    if (items.length === 0) {
        // Если пусто -> возвращаем надпись "Нет уведомлений"
        panel.innerHTML = '<div class="notif-empty">Нет новых уведомлений</div>';
        // Убираем красную точку
        if (badge) badge.classList.remove('active');
    }
}

/**
 * Очистить всё (вызывается из HTML)
 */
function clearAllNotifications() {
    const panel = document.getElementById('notifPanel');
    // Удаляем все элементы .notif-item
    panel.querySelectorAll('.notif-item').forEach(el => el.remove());
    // Проверяем состояние (вернет заглушку и уберет точку)
    checkNotifEmpty();
}

/**
 * FINAL VERSION: Уведомления с удалением и очисткой
 */
function sendNotification(title, text, icon = '🔔', onClick = null) {
    const panel = document.getElementById('notifPanel');
    const badge = document.getElementById('bellBadge');
    
    if (panel && badge) {
        badge.classList.add('active'); 

        // Если сейчас висит заглушка "Нет уведомлений" — создаем шапку
        if (panel.querySelector('.notif-empty')) {
            panel.innerHTML = `
                <div class="notif-header">
                    <span class="notif-header-title">Уведомления</span>
                    <span class="notif-clear-all" onclick="clearAllNotifications()">Очистить всё</span>
                </div>`;
        }

        // Создаем само уведомление
        const item = document.createElement('div');
        item.className = 'notif-item';
        
        // ВАЖНО: Добавили крестик (notif-close)
        item.innerHTML = `
            <div class="notif-icon">${icon}</div>
            <div class="notif-content">
                <div class="notif-title">${title}</div>
                <div class="notif-text">${text}</div>
            </div>
            <div class="notif-close">✕</div> 
        `;
        
        // 1. Логика клика по самому уведомлению
        item.onclick = (e) => {
            // Если кликнули не по крестику
            if (!e.target.classList.contains('notif-close')) {
                if (onClick) onClick();
            }
        };

        // 2. Логика клика по крестику
        const closeBtn = item.querySelector('.notif-close');
        closeBtn.onclick = (e) => {
            e.stopPropagation(); // Чтобы не сработал клик по самому уведомлению
            item.remove();       // Удаляем элемент
            checkNotifEmpty();   // Проверяем, не опустел ли список
        };

        // Вставляем после заголовка (header всегда первый child)
        panel.insertBefore(item, panel.children[1]);
    }

    // --- TOAST (Всплывашка) ---
    // (Код тоста оставляем тот же, он работает отлично)
    const toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.innerHTML = `
        <span style="font-size:24px">${icon}</span>
        <div>
            <div style="font-weight:700; font-size:14px; margin-bottom:2px">${title}</div>
            <div style="font-size:13px; opacity:0.9">${text}</div>
        </div>
    `;
    toast.onclick = () => {
        if (onClick) onClick();
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    };
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        setTimeout(() => toast.classList.add('show'), 100);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 600);
        }
    }, 6000);
}