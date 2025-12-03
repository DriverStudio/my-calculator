function calculate() {
    // 1. Получаем данные
    const spend = getNumber('input1');
    const revenue = getNumber('input2');
    
    // Проверка на ошибки
    if (!spend || !revenue) {
        alert("Пожалуйста, заполните оба поля (расход и доход)");
        return;
    }

    // 2. Считаем ROAS (Доход / Расход * 100)
    const roas = ((revenue / spend) * 100).toFixed(2);
    
    // 3. Считаем Чистую Прибыль (Доход - Расход)
    const profit = (revenue - spend).toFixed(0);

    // 4. Логика цветов и статусов
    let status = "";
    let color = "";
    let emoji = "";

    if (roas < 100) {
        status = "Вы работаете в МИНУС 🛑";
        color = "#dc3545"; // Красный
        emoji = "💸";
    } else if (roas >= 100 && roas < 200) {
        status = "Работа на грани (Окупается слабо) ⚠️";
        color = "#fd7e14"; // Оранжевый
        emoji = "😐";
    } else if (roas >= 200 && roas < 400) {
        status = "Хороший результат! ✅";
        color = "#28a745"; // Зеленый
        emoji = "👍";
    } else {
        status = "ОТЛИЧНАЯ СВЯЗКА! Масштабируйте! 🚀";
        color = "#218838"; // Темно-зеленый
        emoji = "🔥";
    }

    // 5. Вывод результатов
    const resVal = document.getElementById('resultValue');
    resVal.innerText = roas + "%";
    resVal.style.color = color;

    // Формируем детальное описание
    let desc = document.getElementById('resultDescription');
    if (!desc) {
        desc = document.createElement('p');
        desc.id = 'resultDescription';
        desc.style.lineHeight = "1.6"; // Чуть больше воздуха между строками
        resVal.after(desc);
    }

    desc.innerHTML = `
        Статус: <b>${status}</b><br>
        Чистая прибыль: <b>${profit} ₽</b> ${emoji}
    `;

    document.getElementById('resultBox').style.display = 'block';
}