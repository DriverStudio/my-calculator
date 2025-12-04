/* notes/script.js */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('notesContainer');
    const btnAdd = document.getElementById('btnAdd');
    
    // Загрузка из LocalStorage
    let notes = JSON.parse(localStorage.getItem('prisma_notes')) || [];

    // --- ФУНКЦИИ ---

    function save() {
        localStorage.setItem('prisma_notes', JSON.stringify(notes));
    }

    function createNoteElement(note, index) {
        const div = document.createElement('div');
        div.className = 'note-card';
        // Цветной бордюр слева
        div.style.borderLeft = `4px solid ${note.color}`;

        div.innerHTML = `
            <div class="note-header">
                <span>${new Date(note.date).toLocaleDateString()}</span>
                <div class="color-dots">
                    <div class="dot" style="background:#ff6b6b" data-col="#ff6b6b"></div>
                    <div class="dot" style="background:#4ecdc4" data-col="#4ecdc4"></div>
                    <div class="dot" style="background:#ffe66d" data-col="#ffe66d"></div>
                </div>
            </div>
            <textarea class="note-textarea" placeholder="Напишите что-нибудь...">${note.text}</textarea>
            <button class="btn-delete">Удалить</button>
        `;

        // События внутри карточки
        
        // 1. Редактирование текста
        const textarea = div.querySelector('.note-textarea');
        textarea.addEventListener('input', (e) => {
            notes[index].text = e.target.value;
            save();
        });

        // 2. Смена цвета
        div.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const newColor = dot.getAttribute('data-col');
                notes[index].color = newColor;
                div.style.borderLeft = `4px solid ${newColor}`;
                save();
            });
        });

        // 3. Удаление
        div.querySelector('.btn-delete').addEventListener('click', () => {
            if(confirm('Удалить эту заметку?')) {
                notes.splice(index, 1);
                save();
                render();
            }
        });

        return div;
    }

    function render() {
        container.innerHTML = '';
        if (notes.length === 0) {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">
                📝 Доска пуста. Нажмите "+ Создать"
            </div>`;
            return;
        }
        notes.forEach((note, index) => {
            container.appendChild(createNoteElement(note, index));
        });
    }

    // --- СОБЫТИЯ ---

    btnAdd.addEventListener('click', () => {
        const newNote = {
            id: Date.now(),
            text: '',
            date: Date.now(),
            color: '#4ecdc4' // Default Teal
        };
        notes.unshift(newNote); // Добавляем в начало
        save();
        render();
    });

    // Первичный рендер
    render();
});