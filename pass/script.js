document.getElementById('btnCalc').addEventListener('click', generatePassword);

function generatePassword() {
    const length = parseInt(document.getElementById('length').value);
    const hasUpper = document.getElementById('upper').checked;
    const hasLower = document.getElementById('lower').checked;
    const hasNumbers = document.getElementById('numbers').checked;
    const hasSymbols = document.getElementById('symbols').checked;

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let chars = '';
    if (hasUpper) chars += upper;
    if (hasLower) chars += lower;
    if (hasNumbers) chars += numbers;
    if (hasSymbols) chars += symbols;

    if (chars === '') {
        alert('Выберите хотя бы один тип символов!');
        return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }

    const resBox = document.getElementById('resultBox');
    resBox.style.display = 'block';
    
    // Анимация "взлома" (визуальный эффект)
    let counter = 0;
    const interval = setInterval(() => {
        document.getElementById('resultValue').innerText = 
            password.split('').map(x => Math.random() > 0.5 ? x : '*').join('');
        counter++;
        if (counter > 5) {
            clearInterval(interval);
            document.getElementById('resultValue').innerText = password;
        }
    }, 50);
}