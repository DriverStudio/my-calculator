const area = document.getElementById('game-area');
const list = document.getElementById('resultsList');

let startTime = 0;
let timer = null;
let state = 'idle'; // idle, waiting, ready

area.addEventListener('mousedown', handleClick);

function handleClick() {
    if (state === 'idle' || state === 'result') {
        // ЗАПУСК ИГРЫ
        state = 'waiting';
        area.className = 'waiting';
        area.innerHTML = '<div>Жди зеленый...</div>';
        
        // Случайная задержка от 1 до 4 секунд
        const delay = Math.floor(Math.random() * 3000) + 1000;
        
        timer = setTimeout(() => {
            state = 'ready';
            area.className = 'ready';
            area.innerHTML = '<div>ЖМИ!</div>';
            startTime = Date.now();
        }, delay);

    } else if (state === 'waiting') {
        // ФАЛЬСТАРТ (нажал слишком рано)
        clearTimeout(timer);
        state = 'idle';
        area.className = '';
        area.style.backgroundColor = '#ffc107'; // Желтый
        area.innerHTML = '<div>Слишком рано! ⚠️</div><div style="font-size:14px">Нажми, чтобы попробовать снова</div>';
    
    } else if (state === 'ready') {
        // УСПЕХ
        const reaction = Date.now() - startTime;
        state = 'result';
        area.className = ''; // Возвращаем синий (по умолчанию)
        area.innerHTML = `<div>${reaction} мс</div><div style="font-size:14px">Неплохо! Нажми еще раз</div>`;
        
        // Добавляем в историю
        const li = document.createElement('li');
        li.innerText = `${reaction} мс`;
        // Выделяем жирным, если супер-результат
        if (reaction < 200) li.style.color = '#28a745'; 
        list.prepend(li);
        
        // Ограничиваем список 5 результатами
        if (list.children.length > 5) list.lastChild.remove();
    }
}