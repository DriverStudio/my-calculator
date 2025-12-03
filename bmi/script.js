function calculate() {
    const weight = parseFloat(document.getElementById('input1').value);
    const height = parseFloat(document.getElementById('input2').value) / 100;
    
    if(!weight || !height) return;

    const bmi = (weight / (height * height)).toFixed(1);
    
    // Логика статусов
    let status = "Норма";
    let color = "#28a745";
    
    if(bmi < 18.5) { status = "Мало"; color = "orange"; }
    else if(bmi > 25) { status = "Много"; color = "red"; }

    const resBox = document.getElementById('resultValue');
    resBox.innerText = bmi;
    resBox.style.color = color;

    // Создаем/обновляем описание для копирования
    let desc = document.getElementById('resultDescription');
    if(!desc) {
        desc = document.createElement('p');
        desc.id = 'resultDescription';
        resBox.after(desc);
    }
    desc.innerHTML = `Вердикт: <b>${status}</b>`;

    document.getElementById('resultBox').style.display = 'block';
}