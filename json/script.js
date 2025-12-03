const input = document.getElementById('jsonInput');
const status = document.getElementById('status');

function showStatus(msg, isError = false) {
    status.className = 'status-bar ' + (isError ? 'status-error' : 'status-success');
    status.innerText = msg;
    // Скрываем успех через 3 сек, ошибку оставляем
    if (!isError) setTimeout(() => status.style.display = 'none', 3000);
}

// 1. ФОРМАТИРОВАНИЕ (BEAUTIFY)
document.getElementById('btnBeautify').addEventListener('click', () => {
    try {
        const raw = input.value;
        if (!raw) return;
        
        const obj = JSON.parse(raw);
        // 4 пробела отступа
        input.value = JSON.stringify(obj, null, 4);
        showStatus('✅ JSON валиден и отформатирован!');
    } catch (e) {
        showStatus(`❌ Ошибка синтаксиса: ${e.message}`, true);
    }
});

// 2. СЖАТИЕ (MINIFY)
document.getElementById('btnMinify').addEventListener('click', () => {
    try {
        const raw = input.value;
        if (!raw) return;
        
        const obj = JSON.parse(raw);
        input.value = JSON.stringify(obj); // Без отступов
        showStatus('✅ JSON сжат!');
    } catch (e) {
        showStatus(`❌ Ошибка синтаксиса: ${e.message}`, true);
    }
});

// 3. ИСПРАВЛЕНИЕ (FIX QUOTES)
// Часто копируют JS объекты (с одинарными кавычками или ключами без кавычек)
// Это "грязный" хак, но полезный
document.getElementById('btnFix').addEventListener('click', () => {
    let text = input.value;
    // Заменяем одинарные на двойные
    text = text.replace(/'/g, '"');
    // Пытаемся обернуть ключи без кавычек (key: "val" -> "key": "val")
    // Регулярка не идеальна, но помогает в 80% случаев
    text = text.replace(/(\w+):/g, '"$1":');
    
    input.value = text;
    // Сразу пробуем форматировать
    document.getElementById('btnBeautify').click();
});

// 4. КОПИРОВАНИЕ
document.getElementById('btnCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(input.value);
    showStatus('📋 Скопировано в буфер!');
});