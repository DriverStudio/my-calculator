document.addEventListener('DOMContentLoaded', () => {
    const textOld = document.getElementById('textOld');
    const textNew = document.getElementById('textNew');
    const resultContainer = document.getElementById('resultContainer');
    const btnCompare = document.getElementById('btnCompare');

    btnCompare.addEventListener('click', () => {
        const oldVal = textOld.value.trim();
        const newVal = textNew.value.trim();

        if (!oldVal && !newVal) return;

        // Показываем контейнер
        resultContainer.style.display = 'block';
        
        // Запускаем сравнение
        resultContainer.innerHTML = diffString(oldVal, newVal);
    });

    // Простой алгоритм Diff (по словам)
    function diffString(str1, str2) {
        // Разбиваем на слова (включая пробелы и знаки препинания, чтобы сохранить форматирование)
        // Используем RegEx, который ловит слова ИЛИ пробелы/знаки как отдельные токены
        const splitText = (text) => text.split(/([^\S\r\n]+|[.,!?;:()])/g).filter(Boolean);
        
        const arr1 = splitText(str1);
        const arr2 = splitText(str2);

        // Матрица LCS (Longest Common Subsequence)
        const matrix = Array(arr1.length + 1).fill(null).map(() => Array(arr2.length + 1).fill(0));

        for (let i = 1; i <= arr1.length; i++) {
            for (let j = 1; j <= arr2.length; j++) {
                if (arr1[i - 1] === arr2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1] + 1;
                } else {
                    matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                }
            }
        }

        // Восстановление пути (Backtracking)
        let html = '';
        let i = arr1.length;
        let j = arr2.length;

        const resultParts = [];

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
                resultParts.unshift(`<span class="diff-same">${escapeHtml(arr1[i - 1])}</span>`);
                i--;
                j--;
            } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
                resultParts.unshift(`<span class="diff-ins">${escapeHtml(arr2[j - 1])}</span>`);
                j--;
            } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
                resultParts.unshift(`<span class="diff-del">${escapeHtml(arr1[i - 1])}</span>`);
                i--;
            }
        }

        return resultParts.join('');
    }

    // Экранирование HTML (защита от XSS)
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    }
});