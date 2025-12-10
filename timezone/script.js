document.addEventListener('DOMContentLoaded', () => {
    // --- ДАННЫЕ ---
    const ALL_CITIES = [
        { name: 'Мое Время (Местное)', zone: 'local', icon: '👤', lat: null, lng: null }, // Специальный тип
        { name: 'Москва', zone: 'Europe/Moscow', icon: '🇷🇺', lat: 55.75, lng: 37.61 },
        { name: 'Санкт-Петербург', zone: 'Europe/Moscow', icon: '🇷🇺', lat: 59.93, lng: 30.33 },
        { name: 'Лондон', zone: 'Europe/London', icon: '🇬🇧', lat: 51.50, lng: -0.12 },
        { name: 'Нью-Йорк', zone: 'America/New_York', icon: '🇺🇸', lat: 40.71, lng: -74.00 },
        { name: 'Токио', zone: 'Asia/Tokyo', icon: '🇯🇵', lat: 35.67, lng: 139.65 },
        { name: 'Дубай', zone: 'Asia/Dubai', icon: '🇦🇪', lat: 25.20, lng: 55.27 },
        { name: 'Бали', zone: 'Asia/Makassar', icon: '🇮🇩', lat: -8.40, lng: 115.18 },
        { name: 'Берлин', zone: 'Europe/Berlin', icon: '🇩🇪', lat: 52.52, lng: 13.40 },
        { name: 'Париж', zone: 'Europe/Paris', icon: '🇫🇷', lat: 48.85, lng: 2.35 },
        { name: 'Астана', zone: 'Asia/Almaty', icon: '🇰🇿', lat: 51.16, lng: 71.47 },
        { name: 'Минск', zone: 'Europe/Minsk', icon: '🇧🇾', lat: 53.90, lng: 27.56 },
        { name: 'Лос-Анджелес', zone: 'America/Los_Angeles', icon: '🇺🇸', lat: 34.05, lng: -118.24 }
    ];

    // По умолчанию только местное время
    let activeCities = [ ALL_CITIES[0] ];
    
    // Выбранная дата (объект Date)
    let selectedDate = new Date();
    
    // Выбранное место (объект)
    let selectedPlace = {
        name: null,
        address: null,
        coords: null,
        url: null
    };

    // --- ЭЛЕМЕНТЫ DOM ---
    const slider = document.getElementById('timeSlider');
    const mainClock = document.getElementById('mainClock');
    const citiesContainer = document.getElementById('citiesList');
    const placeNameEl = document.getElementById('placeName');
    const placeAddrEl = document.getElementById('placeAddress');
    
    // --- 1. КАРТА И ГЕОКОДИНГ ---
    
    // Инициализация карты (пока центр 0,0)
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let marker = null;

    // Пытаемся найти пользователя
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 13); // Зум к пользователю
        }, () => {
            // Если запретил, ставим Москву
            map.setView([55.75, 37.61], 10);
        });
    } else {
        map.setView([55.75, 37.61], 10);
    }

    // ОБРАБОТКА КЛИКА ПО КАРТЕ (Geocoding)
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // 1. Ставим маркер
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);

        // 2. UI: Показываем "Загрузка..."
        placeNameEl.textContent = "⏳ Определяем место...";
        placeAddrEl.textContent = "";

        // 3. Запрос к Nominatim (Бесплатный Reverse Geocoding)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await response.json();

            // 4. Парсим ответ
            // Nominatim возвращает поле 'name' (название заведения) или мы берем из address
            const addr = data.address || {};
            
            // Пытаемся найти "человеческое" название (Кафе, Отель, Парк)
            const establishment = data.name || addr.amenity || addr.shop || addr.tourism || addr.building || "Точка на карте";
            
            // Формируем адрес (Улица, Дом, Город)
            const street = addr.road || "";
            const house = addr.house_number || "";
            const city = addr.city || addr.town || addr.village || "";
            const fullAddress = [street, house, city].filter(Boolean).join(', ');

            // Сохраняем в состояние
            selectedPlace = {
                name: establishment,
                address: fullAddress,
                coords: `${lat.toFixed(5)},${lng.toFixed(5)}`,
                url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            };

            // 5. Обновляем UI
            placeNameEl.textContent = `📍 ${selectedPlace.name}`;
            placeAddrEl.textContent = selectedPlace.address || "Адрес не определен";

        } catch (error) {
            console.error(error);
            placeNameEl.textContent = "📍 Ошибка определения адреса";
            selectedPlace.name = "Выбранная точка";
            selectedPlace.coords = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            selectedPlace.url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        }
    });

    // --- 2. ЛОГИКА ВРЕМЕНИ ---

    function updateUI() {
        const minutes = parseInt(slider.value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        selectedDate = new Date(now.getTime() + minutes * 60000);

        // Главные часы
        mainClock.textContent = selectedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        // Рендер городов
        citiesContainer.innerHTML = '';
        
        activeCities.forEach((city, index) => {
            // Обработка таймзоны
            let timeString;
            let dateString;
            
            if (city.zone === 'local') {
                // Местное время браузера
                timeString = selectedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                dateString = "Ваше время";
            } else {
                timeString = selectedDate.toLocaleTimeString('ru-RU', { 
                    timeZone: city.zone, hour: '2-digit', minute: '2-digit' 
                });
                // Определяем разницу дат (сегодня/завтра) - упрощенно
                // Для MVP просто выводим таймзону
                dateString = city.zone.split('/')[1].replace('_', ' '); 
            }

            // Статус (Рабочее время)
            const hour = parseInt(timeString.split(':')[0]);
            let statusBadge = '';
            if (hour >= 9 && hour < 18) {
                statusBadge = `<span class="status-badge status-work">Рабочее</span>`;
            } else if (hour >= 23 || hour < 7) {
                statusBadge = `<span class="status-badge status-sleep">Спят</span>`;
            } else {
                statusBadge = `<span class="status-badge status-evening">Вечер</span>`;
            }

            const card = document.createElement('div');
            card.className = 'city-card';
            card.innerHTML = `
                <div>
                    <div style="font-weight: bold; font-size: 1.1rem;">${city.icon} ${city.name}</div>
                    <div style="font-size: 0.8rem; color: #aaa;">${dateString}</div>
                </div>
                <div style="text-align: right;">
                    <div class="time-val">${timeString}</div>
                    ${statusBadge}
                </div>
                ${index !== 0 ? `<button class="remove-btn" onclick="removeCity(${index})">×</button>` : ''}
            `;
            citiesContainer.appendChild(card);
        });
    }

    slider.addEventListener('input', updateUI);

    // --- 3. ДОБАВЛЕНИЕ ГОРОДОВ ---
    const citySelect = document.getElementById('citySelect');
    ALL_CITIES.slice(1).forEach((city, i) => { // Пропускаем "Local"
        const opt = document.createElement('option');
        opt.value = i + 1; // Индекс в оригинальном массиве
        opt.textContent = `${city.icon} ${city.name} (${city.zone})`;
        citySelect.appendChild(opt);
    });

    document.getElementById('btnAddCityBtn').addEventListener('click', () => document.getElementById('addCityDialog').showModal());
    
    document.getElementById('confirmAddCity').addEventListener('click', () => {
        const idx = citySelect.value;
        if (idx) {
            const city = ALL_CITIES[idx];
            if (!activeCities.find(c => c.name === city.name)) {
                activeCities.push(city);
                updateUI();
            }
            document.getElementById('addCityDialog').close();
        }
    });

    window.removeCity = (idx) => {
        activeCities.splice(idx, 1);
        updateUI();
    };

    // --- 4. ГЕНЕРАЦИЯ ПРИГЛАШЕНИЯ ---
    document.getElementById('btnShare').addEventListener('click', () => {
        // Заголовок
        let text = `📅 *Приглашение на встречу*\n\n`;
        
        // Время (берем первое время из списка как основное)
        const mainTimeStr = selectedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const dateStr = selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        
        text += `⏰ *Время:* ${mainTimeStr} (${dateStr})\n`;
        
        // Место (если выбрано)
        if (selectedPlace.name) {
            text += `📍 *Место:* ${selectedPlace.name}\n`;
            if (selectedPlace.address) text += `🏠 Адрес: ${selectedPlace.address}\n`;
            if (selectedPlace.url) text += `🗺 Карта: ${selectedPlace.url}\n`;
        } else {
            text += `📍 *Место:* Онлайн / Не указано\n`;
        }
        
        // Другие часовые пояса (спрятаны внизу)
        if (activeCities.length > 1) {
            text += `\n🌍 *Для справки:*`;
            activeCities.forEach(city => {
                const t = city.zone === 'local' 
                    ? selectedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : selectedDate.toLocaleTimeString('ru-RU', { timeZone: city.zone, hour: '2-digit', minute: '2-digit' });
                
                text += `\n▫️ ${city.name}: ${t}`;
            });
        }

        navigator.clipboard.writeText(text).then(() => {
            const t = document.getElementById('appToast');
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        });
    });

    // Старт
    updateUI();
});