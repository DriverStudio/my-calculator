function calculate() {
    const weight = getNumber('input1'); // Берем вес (с учетом пробелов)
    const reps = parseFloat(document.getElementById('input2').value);

    if (!weight || !reps) return;
    if (reps === 1) {
        alert("Если вы сделали 1 раз, это и есть ваш максимум :)");
        // Но все равно покажем
    }

    // Формула Эпли: Вес * (1 + 0.0333 * Повторения)
    const oneRepMax = Math.round(weight * (1 + 0.0333 * reps));

    // Расчет процентов для тренировок (очень полезно для программ)
    const p90 = Math.round(oneRepMax * 0.9);
    const p80 = Math.round(oneRepMax * 0.8);
    const p70 = Math.round(oneRepMax * 0.7);

    const resVal = document.getElementById('resultValue');
    resVal.innerText = oneRepMax + " кг";

    // Детальное описание (Таблица процентов)
    let desc = document.getElementById('resultDescription');
    if (!desc) {
        desc = document.createElement('div'); // div, т.к. внутри будет таблица
        desc.id = 'resultDescription';
        desc.style.marginTop = '20px';
        resVal.after(desc);
    }

    // Рисуем мини-табличку процентов
    desc.innerHTML = `
        <p style="margin-bottom:10px; font-weight:bold; color:#555">Рабочие веса для тренировок:</p>
        <table style="width:100%; font-size:14px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding:5px;">🔥 90% (Сила)</td>
                <td style="text-align:right; font-weight:bold;">${p90} кг</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding:5px;">💪 80% (Масса)</td>
                <td style="text-align:right; font-weight:bold;">${p80} кг</td>
            </tr>
            <tr>
                <td style="padding:5px;">🏃 70% (Выносливость)</td>
                <td style="text-align:right; font-weight:bold;">${p70} кг</td>
            </tr>
        </table>
    `;

    document.getElementById('resultBox').style.display = 'block';
}