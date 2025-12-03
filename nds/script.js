function calculate() {
    // Используем нашу функцию getNumber для очистки пробелов
    const amount = getNumber('input1'); 
    const rate = parseFloat(document.getElementById('input2').value);
    const mode = document.getElementById('mode').value;

    if (!amount || !rate) return;

    let tax = 0;
    let total = 0;
    let base = 0;

    // Логика
    if (mode === 'extract') {
        // Выделить: Налог сидит внутри (x * 20 / 120)
        tax = (amount * rate) / (100 + rate);
        base = amount - tax;
        total = amount;
    } else {
        // Начислить: Налог сверху
        tax = (amount * rate) / 100;
        base = amount;
        total = amount + tax;
    }

    // Округляем до копеек
    const fmt = (n) => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const resVal = document.getElementById('resultValue');
    resVal.innerText = fmt(tax) + " ₽";

    // Детальное описание
    let desc = document.getElementById('resultDescription');
    if (!desc) {
    desc = document.createElement('p');
    desc.id = 'resultDescription';
    desc.className = 'result-desc'; // <--- Вся магия теперь здесь
    resVal.after(desc);
    }

    desc.innerHTML = `
        💵 <b>Без НДС:</b> ${fmt(base)} ₽<br>
        🏛 <b>Сумма НДС:</b> <span style="color:#007bff">${fmt(tax)} ₽</span><br>
        💰 <b>Итого:</b> ${fmt(total)} ₽
    `;

    document.getElementById('resultBox').style.display = 'block';
}