// Глобальная переменная для хранения графика (чтобы можно было его удалять перед перерисовкой)
let myChart = null;

function calculate() {
    // 1. Забираем данные (используем getNumber для полей с пробелами)
    let initial = getNumber('input1');
    let monthlyAdd = getNumber('input2');
    let rate = parseFloat(document.getElementById('input3').value) || 0;
    let years = parseFloat(document.getElementById('input4').value) || 0;

    if (years === 0 || years > 50) { // Ограничим 50 годами, чтобы браузер не завис
        alert("Укажите срок от 1 до 50 лет");
        return;
    }

    let total = initial;
    let totalInvested = initial;
    let months = years * 12;
    let monthlyRate = rate / 100 / 12;

    // МАССИВЫ ДЛЯ ГРАФИКА
    let labels = []; // Годы (Ось X)
    let dataTotal = []; // Всего денег (Ось Y)
    let dataInvested = []; // Моих денег (Ось Y)

    // Добавляем точку "Старт" (Год 0)
    labels.push('Старт');
    dataTotal.push(initial);
    dataInvested.push(initial);

    // 2. Цикл расчета по месяцам
    for (let i = 1; i <= months; i++) {
        total += monthlyAdd;          
        total += total * monthlyRate; 
        totalInvested += monthlyAdd;  

        // Если прошел ровно год (или это самый последний месяц)
        if (i % 12 === 0 || i === months) {
            const currentYear = Math.ceil(i / 12);
            // Запоминаем данные для графика
            labels.push('Год ' + currentYear);
            dataTotal.push(Math.round(total));
            dataInvested.push(Math.round(totalInvested));
        }
    }

    // Округляем итоги
    total = Math.round(total);
    totalInvested = Math.round(totalInvested);
    const profit = total - totalInvested;

    // 3. Вывод текстовых результатов
    const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    
    const resVal = document.getElementById('resultValue');
    resVal.innerText = "$" + fmt(total);

    let desc = document.getElementById('resultDescription');
    if (!desc) {
        desc = document.createElement('p');
        desc.id = 'resultDescription';
        desc.style.textAlign = 'left'; desc.style.background = 'white';
        desc.style.padding = '15px'; desc.style.borderRadius = '10px';
        desc.style.marginTop = '15px';
        resVal.after(desc);
    }

    desc.innerHTML = `
        💼 <b>Личных вложений:</b> $${fmt(totalInvested)}<br>
        📈 <b>Чистая прибыль:</b> <span style="color:#28a745">+$${fmt(profit)}</span>
    `;

    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('chartBox').style.display = 'block'; // Показываем контейнер графика

    // 4. ВЫЗЫВАЕМ ФУНКЦИЮ РИСОВАНИЯ ГРАФИКА
    renderChart(labels, dataTotal, dataInvested);
}

// === НОВАЯ ФУНКЦИЯ ДЛЯ ОТРИСОВКИ ГРАФИКА (Chart.js) ===
function renderChart(labels, dataTotal, dataInvested) {
    const ctx = document.getElementById('growthChart').getContext('2d');

    // ВАЖНО: Если график уже был нарисован, уничтожаем его перед рисованием нового.
    // Иначе старый график останется под новым и будут глюки при наведении мыши.
    if (myChart) {
        myChart.destroy();
    }

    // Создаем новый график
    myChart = new Chart(ctx, {
        type: 'line', // Линейный график
        data: {
            labels: labels, // Ось X (Годы)
            datasets: [
                {
                    label: 'Итоговый капитал ($)', // Зеленая линия
                    data: dataTotal, // Данные
                    borderColor: '#28a745', // Цвет линии
                    backgroundColor: 'rgba(40, 167, 69, 0.2)', // Цвет заливки под линией
                    fill: true, // Включить заливку
                    tension: 0.4, // Плавность линий (изгиб)
                    pointRadius: 4 // Размер точек
                },
                {
                    label: 'Мои вложения ($)', // Синяя линия (пониже)
                    data: dataInvested,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Растягивать по высоте контейнера
            interaction: {
                mode: 'index', // Показывать подсказки для обоих линий сразу
                intersect: false,
            },
            scales: {
                y: {
                    beginAtZero: true, // Ось Y начинается с нуля
                    ticks: {
                        // Добавляем значок $ к цифрам на оси Y
                        callback: function(value) {
                            return '$' + value.toLocaleString(); 
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                     // Форматирование цифр в всплывающей подсказке
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}