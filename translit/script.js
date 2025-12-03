const source = document.getElementById('source');
const result = document.getElementById('result');

// Карта символов
const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
};

function doTranslit(isSlug = false) {
    let text = source.value;
    let out = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const lower = char.toLowerCase();
        
        let newChar = char; // По умолчанию оставляем как есть

        if (map[lower] !== undefined) {
            // Если есть в карте
            if (char === lower) {
                newChar = map[lower]; // маленькая
            } else {
                // Большая буква. Делаем первую букву замены большой (Zh, A, B)
                const val = map[lower];
                newChar = val.charAt(0).toUpperCase() + val.slice(1);
            }
        }
        
        out += newChar;
    }

    if (isSlug) {
        // Превращаем в URL-формат: только маленькие, пробелы -> дефисы, убираем спецсимволы
        out = out.toLowerCase()
                 .replace(/\s+/g, '-')     // Пробелы в дефисы
                 .replace(/[^\w-]/g, '');  // Убираем всё, что не буквы/цифры/дефис
    }

    result.value = out;
}

// Слушаем ввод
source.addEventListener('input', () => doTranslit(false));

// Кнопка для URL
document.getElementById('btnSlug').addEventListener('click', () => {
    doTranslit(true);
});

// Кнопка копирования результата
document.getElementById('btnCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(result.value).then(() => alert('Скопировано!'));
});