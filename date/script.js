// Устанавливаем сегодняшнюю дату во второй инпут по умолчанию
document.getElementById('date2').valueAsDate = new Date();

document.getElementById('btnCalc').addEventListener('click', () => {
    const d1Str = document.getElementById('date1').value;
    const d2Str = document.getElementById('date2').value;

    if (!d1Str || !d2Str) {
        alert('Пожалуйста, выберите обе даты.');
        return;
    }

    const date1 = new Date(d1Str);
    const date2 = new Date(d2Str);

    // Считаем разницу в миллисекундах
    const diffTime = Math.abs(date2 - date1);
    // Переводим в дни (1000мс * 60с * 60м * 24ч)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // Доп. расчеты (недели, месяцы грубо)
    const weeks = (diffDays / 7).toFixed(1);
    const years = (diffDays / 365).toFixed(2);

    document.getElementById('resultBox').style.display = 'block';
    
    // Красивое склонение слова "день" (дня, дней)
    const suffix = (days) => {
        if (days % 10 === 1 && days % 100 !== 11) return 'день';
        if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
        return 'дней';
    };

    document.getElementById('resultValue').innerText = `${diffDays} ${suffix(diffDays)}`;
    
    document.getElementById('resultDescription').innerHTML = 
        `Это примерно <b>${weeks}</b> недель или <b>${years}</b> лет.<br>` +
        `<small style="color:#777">В расчет включены високосные года, если они попадаются.</small>`;
});