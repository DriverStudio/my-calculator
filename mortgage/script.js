function calculate() {
    // 1. Данные
    const price = parseFloat(document.getElementById('input1').value);
    const downPayment = parseFloat(document.getElementById('input2').value);
    const years = parseFloat(document.getElementById('input3').value);
    const rateYear = parseFloat(document.getElementById('input4').value);

    if (!price || !years || !rateYear) {
        alert("Заполните все поля");
        return;
    }

    // 2. Математика (Аннуитетный платеж)
    const loanAmount = price - downPayment; // Тело кредита
    const months = years * 12;
    const rateMonth = rateYear / 100 / 12; // Месячная ставка

    // Формула: A = S * (r * (1+r)^n) / ((1+r)^n - 1)
    const factor = Math.pow(1 + rateMonth, months);
    const monthlyPayment = loanAmount * (rateMonth * factor) / (factor - 1);

    const totalPayment = monthlyPayment * months;
    const overpayment = totalPayment - loanAmount;

    // 3. Форматирование (1 000 000)
    const fmt = (num) => Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    const resVal = document.getElementById('resultValue');
    resVal.innerText = fmt(monthlyPayment) + " ₽";

    // Детальное описание
    let desc = document.getElementById('resultDescription');
    if (!desc) {
        desc = document.createElement('p');
        desc.id = 'resultDescription';
        desc.style.textAlign = 'left';
        desc.style.background = '#fff3cd'; // Желтоватый фон предупреждения
        desc.style.padding = '15px';
        desc.style.borderRadius = '10px';
        desc.style.marginTop = '15px';
        resVal.after(desc);
    }

    desc.innerHTML = `
        🏦 <b>Кредит:</b> ${fmt(loanAmount)} ₽<br>
        😱 <b>Переплата банку:</b> ${fmt(overpayment)} ₽<br>
        💰 <b>Всего вы отдадите:</b> ${fmt(totalPayment)} ₽
    `;

    document.getElementById('resultBox').style.display = 'block';
}