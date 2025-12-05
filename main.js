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
    { id: 'clicker',    name: 'Принтер $',      icon: '🖨️', category: 'fun' },
    { id: 'reaction',   name: 'Реакция',        icon: '⚡', category: 'fun' },
    { id: 'typer',      name: 'Хакер Тайпер',   icon: '⌨️', category: 'fun' },
    { id: 'wheel',      name: 'Колесо удачи',   icon: '🎡', category: 'fun' }
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
// 4. РЕКЛАМА (GOOGLE SHEETS) - RESTORED
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
            
            if (slot && ad && String(ad.active).toLowerCase() === 'true') {
                slot.style.display = 'block';
                slot.innerHTML = `
                    <div style="font-size:9px;color:#ccc;text-transform:uppercase;margin:5px">Реклама</div>
                    <a href="${ad.link}" target="_blank" style="text-decoration:none;color:inherit">
                        <img src="${ad.image}" alt="${ad.title}" style="width:100%;border-radius:10px;">
                        <div class="ad-text" style="padding:10px;"><b>${ad.title}</b><br>${ad.text}</div>
                    </a>`;
            }
        };

        renderAd('ad-banner-top', 'top_banner');
        renderAd('ad-sidebar', 'sidebar');
    } catch (e) { console.error("Ads Error:", e); }
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
// 7. СТАРТ (ENTRY POINT)
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
    
    initInputFormatting();
    initFooter();
    initPageTransitions();
    initSidePortals();
    
    const copyBtn = document.getElementById('btnCopy');
    if(copyBtn) copyBtn.onclick = copyResult;
});

function initFooter() {
    const footer = document.createElement('footer');
    footer.className = 'global-footer';
    const year = new Date().getFullYear();
    footer.innerHTML = `
        <div>&copy; ${year} <b>DriverStudio</b>.</div>
        <div style="margin-top:10px"><a href="${pathPrefix}index.html">Главная</a></div>
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