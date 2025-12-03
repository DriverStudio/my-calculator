document.getElementById('btnCalc').addEventListener('click', () => {
    // Используем нашу helper-функцию getNumber из main.js
    const target = getNumber('target');
    const current = getNumber('current');
    const months = getNumber('months');

    if (months <= 0) {
        alert('Укажите корректный срок (больше 0 месяцев)');
        return;
    }

    if (current >= target) {
        document.getElementById('resultBox').style.display = 'block';
        document.getElementById('resultValue').innerText = "Цель достигнута! 🎉";
        document.getElementById('resultDescription').innerText = "У вас уже достаточно средств.";
        return;
    }

    const needed = target - current;
    const monthlyPayment = needed / months;

    // Красивый вывод
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('resultValue').innerText = 
        Math.ceil(monthlyPayment).toLocaleString('ru-RU') + ' ₽ / мес';

    document.getElementById('resultDescription').innerHTML = 
        `Чтобы накопить недостающие <b>${needed.toLocaleString()} ₽</b> за <b>${months} мес.</b><br>` +
        `Это примерно <b>${Math.ceil(monthlyPayment / 30).toLocaleString()} ₽</b> в день.`;
});