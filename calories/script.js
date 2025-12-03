function calculate() {
    const gender = document.getElementById('gender').value;
    const age = parseFloat(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const activity = parseFloat(document.getElementById('activity').value);

    if (!age || !weight || !height) return;

    // 1. Считаем BMR (Базовый обмен веществ)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    
    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    // 2. Умножаем на активность
    const tdee = Math.round(bmr * activity);

    // 3. Считаем дефицит
    const loseWeight = tdee - 400; // Комфортное похудение
    const fastLose = tdee - 800;   // Быстрое (но опасное)

    const resVal = document.getElementById('resultValue');
    resVal.innerText = tdee + " ккал";

    // Детальное описание
    let desc = document.getElementById('resultDescription');
    if (!desc) {
    desc = document.createElement('p');
    desc.id = 'resultDescription';
    desc.className = 'result-desc'; // <--- Вся магия теперь здесь
    resVal.after(desc);
    }

    desc.innerHTML = `
        🍰 <b>Чтобы вес стоял:</b> ${tdee} ккал<br>
        🏃‍♂️ <b>Чтобы худеть:</b> <span style="color:#28a745; font-weight:bold">${loseWeight} ккал</span><br>
        🚀 <b>Экстремальное похудение:</b> ${fastLose} ккал
    `;

    document.getElementById('resultBox').style.display = 'block';
}