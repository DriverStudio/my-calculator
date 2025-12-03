// Инициализация переменной для хранения объекта QR
let qrCodeObj = null;

document.getElementById('btnGen').addEventListener('click', generateQR);

// Генерируем QR при нажатии Enter в поле ввода
document.getElementById('qrText').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') generateQR();
});

function generateQR() {
    const text = document.getElementById('qrText').value;
    const container = document.getElementById('qrcode');
    const resultBox = document.getElementById('resultBox');

    if (!text.trim()) {
        alert('Введите текст или ссылку!');
        return;
    }

    // Очищаем предыдущий код
    container.innerHTML = "";
    resultBox.style.display = 'block';

    // Создаем новый QR
    // Используем библиотеку qrcode.js, подключенную в HTML
    qrCodeObj = new QRCode(container, {
        text: text,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

// Генерируем сразу при загрузке (демо)
window.onload = function() {
    generateQR();
};