function calculate() {
    const birthInput = document.getElementById('birthDate').value;
    if (!birthInput) {
        alert("Введите дату рождения");
        return;
    }

    const birthDate = new Date(birthInput);
    const today = new Date();
    const lifeExpectancyYears = 90; // Оптимистичный прогноз
    
    // Считаем недели
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weeksLived = Math.floor((today - birthDate) / oneWeek);
    const totalWeeks = lifeExpectancyYears * 52;

    document.getElementById('weeksLived').innerText = weeksLived;
    
    // Мотивирующая фраза
    const percentage = ((weeksLived / totalWeeks) * 100).toFixed(1);
    document.getElementById('subText').innerText = `Это ${percentage}% от 90-летней жизни.`;

    // ГЕНЕРАЦИЯ СЕТКИ (Рисуем квадратики)
    const grid = document.getElementById('lifeGrid');
    grid.innerHTML = ''; // Очищаем

    // Создаем фрагмент (для производительности, чтобы не тормозило)
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < totalWeeks; i++) {
        const div = document.createElement('div');
        div.className = 'week-box';
        
        if (i < weeksLived) {
            div.classList.add('lived'); // Прошлое
        } else if (i === weeksLived) {
            div.classList.add('active'); // Эта неделя
        }
        
        // (Опционально) Добавляем title, чтобы при наведении видеть год
        // div.title = `Неделя ${i}`; 

        fragment.appendChild(div);
    }

    grid.appendChild(fragment);
    document.getElementById('resultBox').style.display = 'block';
}