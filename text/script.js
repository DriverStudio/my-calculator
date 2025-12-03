const textArea = document.getElementById('inputText');

// Слушаем каждое нажатие клавиши
textArea.addEventListener('input', updateStats);

function updateStats() {
    const text = textArea.value;

    // 1. Символы
    document.getElementById('countChars').innerText = text.length;

    // 2. Без пробелов
    document.getElementById('countNoSpace').innerText = text.replace(/\s/g, '').length;

    // 3. Слов (разбиваем по пробелам, фильтруем пустые)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    document.getElementById('countWords').innerText = words.length;

    // 4. Строк
    // Если пусто, то 0 строк, иначе разбиваем по enter
    const lines = text.length === 0 ? 0 : text.split(/\n/).length;
    document.getElementById('countLines').innerText = lines;
}

// Кнопка "Очистить мусор"
document.getElementById('btnClean').addEventListener('click', () => {
    let text = textArea.value;
    // Заменяем множественные пробелы на один
    text = text.replace(/\s+/g, ' ').trim();
    textArea.value = text;
    updateStats(); // Обновляем цифры
});

// Переопределяем кнопку копирования для этого инструмента
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(textArea.value).then(() => alert('Текст скопирован!'));
};