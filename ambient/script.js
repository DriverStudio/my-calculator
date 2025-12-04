/* ambient/script.js */

const COLLECTIONS = [
    { id: 'ocean',  name: 'Тихий Океан',   count: 3 },
    { id: 'forest', name: 'Зеленый Лес',   count: 3 },
    { id: 'city',   name: 'Ночной Город',  count: 3 },
    { id: 'rain',   name: 'Дождливый День',count: 3 },
    { id: 'space',  name: 'Космос',        count: 3 },
    { id: 'fire',   name: 'Камин',         count: 4 }
];

let currentCollection = [];
let currentVideoIndex = 0;
let clockInterval;
let mouseTimer;

// Двойной буфер для плавного видео
let video1, video2;
let activeVideo = null; 
let nextVideo = null;
let isCrossfading = false;
const CROSSFADE_TIME = 2.5;

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('scenesGrid');
    const overlay = document.getElementById('focus-overlay');
    const clockEl = document.getElementById('clock');
    
    // Инициализация видео элементов
    video1 = document.getElementById('bg-video-1');
    video2 = document.getElementById('bg-video-2');

    // Настройка слушателей для Crossfade Loop
    setupLoopLogic(video1, video2);
    setupLoopLogic(video2, video1);

    // 1. Рендер КАРТОЧЕК на главной
    if (grid) {
        COLLECTIONS.forEach(col => {
            const thumbPath = `videos/${col.id}/1.jpg`; 
            const videoPath = `videos/${col.id}/1.mp4`; 

            const card = document.createElement('div');
            card.className = 'scene-card tool-card';
            
            card.innerHTML = `
                <img src="${thumbPath}" alt="${col.name}">
                <div class="scene-title">${col.name} <span style="font-size:12px; opacity:0.7">(${col.count})</span></div>
            `;
            
            const img = card.querySelector('img');

            img.onload = () => card.classList.add('loaded');

            // Fallback для ГЛАВНЫХ карточек
            img.onerror = () => {
                img.remove(); 
                const vidPreview = document.createElement('video');
                vidPreview.src = videoPath;
                vidPreview.muted = true;
                vidPreview.playsInline = true;
                vidPreview.preload = "metadata"; 
                
                vidPreview.style.width = "100%";
                vidPreview.style.height = "100%";
                vidPreview.style.objectFit = "cover";
                
                const title = card.querySelector('.scene-title');
                card.insertBefore(vidPreview, title);

                vidPreview.onloadedmetadata = () => {
                    vidPreview.currentTime = 0.5; 
                    card.classList.add('loaded');
                    card.onmouseenter = () => vidPreview.play().catch(()=>{});
                    card.onmouseleave = () => { vidPreview.pause(); };
                };
                vidPreview.onerror = () => card.remove();
            };

            card.onclick = () => openCollection(col);
            grid.appendChild(card);
        });
    }

    // 2. Логика Бесшовного Лупа
    function setupLoopLogic(current, other) {
        current.addEventListener('timeupdate', () => {
            if (activeVideo === current && !isCrossfading && current.duration) {
                const timeLeft = current.duration - current.currentTime;
                if (timeLeft <= CROSSFADE_TIME) {
                    triggerCrossfade(other);
                }
            }
        });
        current.onerror = () => console.warn('Video Error', current.error);
    }

    function triggerCrossfade(incoming) {
        isCrossfading = true;
        incoming.currentTime = 0;
        incoming.play().then(() => {
            incoming.classList.add('active'); 
            if (activeVideo) activeVideo.classList.remove('active'); 

            const oldActive = activeVideo;
            activeVideo = incoming;
            nextVideo = oldActive;

            setTimeout(() => {
                isCrossfading = false;
                if(oldActive) {
                    oldActive.pause();
                    oldActive.currentTime = 0;
                }
            }, CROSSFADE_TIME * 1000);
        }).catch(e => console.error("Loop Play Error:", e));
    }

    // 3. Открытие коллекции
    window.openCollection = async (collection) => {
        currentCollection = [];
        for (let i = 1; i <= collection.count; i++) {
            currentCollection.push({
                url: `videos/${collection.id}/${i}.mp4`,
                thumb: `videos/${collection.id}/${i}.jpg`,
                originalIndex: i - 1
            });
        }
        
        document.body.classList.add('focus-active');
        overlay.style.display = 'block';
        startClock();
        
        await playVideoAtIndex(0);

        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.log(e));
        }
        resetMouseInteraction();
    };

    // 4. Воспроизведение
    async function playVideoAtIndex(index) {
        if (index < 0 || index >= currentCollection.length) return;
        currentVideoIndex = index;
        const videoData = currentCollection[index];

        isCrossfading = false;
        video1.pause();
        video2.pause();
        
        video1.src = videoData.url;
        video2.src = videoData.url;
        
        video1.currentTime = 0;
        video2.classList.remove('active');
        video1.classList.add('active');
        activeVideo = video1;
        nextVideo = video2;

        try {
            await video1.play();
            renderSidePanels(); 
        } catch (e) {
            console.error(e);
            alert("Ошибка воспроизведения. Проверьте файлы.");
            exitFocus();
        }
    }

    // 5. Интерактив
    function resetMouseInteraction() {
        overlay.classList.add('interactive');
        document.body.style.cursor = 'default';
        if (mouseTimer) clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
            overlay.classList.remove('interactive');
            document.body.style.cursor = 'none';
        }, 3000);
    }

    // 6. Боковые панели (СУПЕР УМНЫЙ FALLBACK)
    function renderSidePanels() {
        const panelLeft = document.getElementById('panelLeft');
        const panelRight = document.getElementById('panelRight');
        if(!panelLeft || !panelRight) return;

        panelLeft.innerHTML = '';
        panelRight.innerHTML = '';

        const otherVideos = currentCollection.filter((v, idx) => idx !== currentVideoIndex);
        const mid = Math.ceil(otherVideos.length / 2);
        const leftItems = otherVideos.slice(0, mid);
        const rightItems = otherVideos.slice(mid);

        const createMiniCard = (vid) => {
            const div = document.createElement('div');
            div.className = 'mini-card';
            
            // Базовая разметка
            div.innerHTML = `
                <img src="${vid.thumb}" alt="thumb">
                <span>Сцена ${vid.originalIndex + 1}</span>
            `;

            // ЛОГИКА FALLBACK ДЛЯ САЙДБАРА
            const img = div.querySelector('img');
            img.onerror = () => {
                img.remove(); // Удаляем битую картинку
                
                // Создаем мини-видео
                const vidPreview = document.createElement('video');
                vidPreview.src = vid.url;
                vidPreview.muted = true;
                vidPreview.playsInline = true;
                vidPreview.preload = "metadata";
                
                // Стилизуем под иконку
                vidPreview.style.width = "60px";
                vidPreview.style.height = "40px";
                vidPreview.style.borderRadius = "6px";
                vidPreview.style.objectFit = "cover";
                
                // Вставляем в начало
                div.prepend(vidPreview);
                
                // Хватаем кадр
                vidPreview.onloadedmetadata = () => {
                    vidPreview.currentTime = 1.0; 
                };
            };
            
            div.onclick = (e) => {
                e.stopPropagation();
                playVideoAtIndex(vid.originalIndex);
            };
            return div;
        };

        leftItems.forEach(v => panelLeft.appendChild(createMiniCard(v)));
        rightItems.forEach(v => panelRight.appendChild(createMiniCard(v)));
    }

    // 7. Выход
    window.exitFocus = () => {
        if(video1) { video1.pause(); video1.src = ""; }
        if(video2) { video2.pause(); video2.src = ""; }
        
        document.body.classList.remove('focus-active');
        overlay.style.display = 'none';
        stopClock();
        if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen();
    };

    function startClock() {
        updateTime();
        if(clockInterval) clearInterval(clockInterval);
        clockInterval = setInterval(updateTime, 1000);
    }
    function updateTime() {
        const now = new Date();
        if(clockEl) clockEl.innerText = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }
    function stopClock() { clearInterval(clockInterval); }

    window.addEventListener('mousemove', resetMouseInteraction);
    window.addEventListener('keydown', (e) => {
        resetMouseInteraction();
        if (e.key === 'Escape') exitFocus();
    });
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay || e.target.id === 'focusUI') resetMouseInteraction();
    });
});