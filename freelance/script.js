let myChart = null;

function calculate() {
    const netIncome = getNumber('input1'); // Желаемая ЗП
    const taxRate = parseFloat(document.getElementById('input2').value);
    const expenses = getNumber('input3');
    const dailyHours = parseFloat(document.getElementById('input4').value);

    if (!netIncome || !dailyHours) return;

    // 1. Считаем рабочее время
    const workDays = 22; // В среднем рабочих дней в месяц
    const monthlyHours = workDays * dailyHours;

    // 2. Обратный отсчет (Сколько нужно Грязными)
    // Формула: (Чистые + Расходы) / (1 - Налог%)
    // Пример: (100к + 5к) / 0.94 (если налог 6%)
    const grossNeeded = (netIncome + expenses) / ((100 - taxRate) / 100);
    
    // 3. Часовая ставка
    const hourlyRate = Math.ceil(grossNeeded / monthlyHours);

    // 4. Суммы для графика (из одного часа)
    // Сколько с каждого часа уходит на налог
    const taxPerH = hourlyRate * (taxRate / 100);
    // Сколько уходит на расходы (пропорционально)
    const expPerH = expenses / monthlyHours;
    // Сколько остается мне
    const netPerH = hourlyRate - taxPerH - expPerH;


    // ВЫВОД
    const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
    document.getElementById('resultValue').innerText = fmt(hourlyRate) + " ₽/час";
    
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('chartBox').style.display = 'block';

    // РИСУЕМ КРУГОВУЮ ДИАГРАММУ
    const ctx = document.getElementById('rateChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut', // Пончик
        data: {
            labels: ['Мне в карман', 'Налоги', 'Расходы на работу'],
            datasets: [{
                data: [Math.round(netPerH), Math.round(taxPerH), Math.round(expPerH)],
                backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { 
                    display: true, 
                    text: 'Куда уходят деньги с одного часа работы' 
                }
            }
        }
    });
}