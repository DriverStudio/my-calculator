document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById('inputText');
    
    // Элементы статистики
    const els = {
        chars: document.getElementById('countChars'),
        words: document.getElementById('countWords'),
        noSpace: document.getElementById('countNoSpace'),
        readTime: document.getElementById('readTime')
    };

    // --- ЛОГИКА ---

    function updateStats() {
        const text = textArea.value || '';
        
        // 1. Символы
        els.chars.textContent = text.length.toLocaleString();

        // 2. Без пробелов (все пробельные символы удаляются)
        els.noSpace.textContent = text.replace(/\s/g, '').length.toLocaleString();

        // 3. Слова (разбиваем по пробелам, фильтруем пустые)
        const wordsArray = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = wordsArray.length;
        els.words.textContent = wordCount.toLocaleString();

        // 4. Время чтения (200 слов в минуту)
        const timeInSeconds = Math.ceil(wordCount / (200 / 60));
        if (timeInSeconds < 60) {
            els.readTime.textContent = `${timeInSeconds}с`;
        } else {
            const mins = Math.ceil(timeInSeconds / 60);
            els.readTime.textContent = `~${mins}м`;
        }
    }

    // --- УТИЛИТЫ ---

    // Функция показа уведомлений, использующая твой стиль .global-toast
    function showToast(message, icon = '✅') {
        const toastEl = document.getElementById('appToast');
        const msgEl = toastEl.querySelector('.toast-msg');
        const iconEl = toastEl.querySelector('.toast-icon');

        if (toastEl && msgEl) {
            msgEl.textContent = message;
            if (iconEl) iconEl.textContent = icon;
            
            toastEl.classList.add('show');
            
            // Сброс предыдущего таймера
            if (window.toastTimer) clearTimeout(window.toastTimer);
            
            window.toastTimer = setTimeout(() => {
                toastEl.classList.remove('show');
            }, 3000);
        } else {
            // Фолбэк, если HTML элемента нет
            alert(message);
        }
    }

    // --- СОБЫТИЯ ---

    // 1. Очистка лишних пробелов
    document.getElementById('btnClean').addEventListener('click', () => {
        if (!textArea.value) return showToast('Поле пустое', '⚠️');
        
        let text = textArea.value;
        // Заменяем переносы строк на пробелы (опционально, можно убрать replace \n)
        // Здесь мы просто убираем двойные пробелы, оставляя структуру строк
        text = text.replace(/[ \t]+/g, ' ').trim(); 
        
        textArea.value = text;
        updateStats();
        showToast('Пробелы очищены');
    });

    // 2. Полная очистка
    document.getElementById('btnClear').addEventListener('click', () => {
        if (!textArea.value) return;
        
        // Используем нативный confirm, пока нет модалки в дизайне
        if(confirm('Удалить весь текст безвозвратно?')) {
            textArea.value = '';
            updateStats();
            showToast('Текст удален', '🗑️');
        }
    });

    // 3. Копирование
    document.getElementById('btnCopy').addEventListener('click', () => {
        if (!textArea.value) {
            showToast('Нет текста для копирования', '⚠️');
            return;
        }
        
        navigator.clipboard.writeText(textArea.value)
            .then(() => showToast('Скопировано в буфер!'))
            .catch(() => showToast('Ошибка доступа к буферу', '❌'));
    });

    // 4. Живой ввод
    textArea.addEventListener('input', updateStats);
    
    // Инициализация (если браузер запомнил текст при перезагрузке)
    updateStats();
});