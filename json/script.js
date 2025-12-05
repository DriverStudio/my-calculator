const input = document.getElementById('jsonInput');
const treeOutput = document.getElementById('treeOutput');
const statsEl = document.getElementById('stats');
const dragProxy = document.getElementById('dragProxy');

// Menu Elements
const contextMenu = document.getElementById('contextMenu');
const menuKeyInput = document.getElementById('menuKeyInput');
const menuKeyContainer = document.getElementById('menuKeyContainer');

let currentData = null;
let menuTarget = { path: null, isArray: false };
let isDragging = false;
let draggedEl = null;
let draggedPath = null;
let mouseX = 0, mouseY = 0;
let proxyX = 0, proxyY = 0;

const emptyImg = new Image();
emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const placeholder = document.createElement('div');
placeholder.className = 'sortable-placeholder';

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    if (!input.value.trim()) {
        input.value = JSON.stringify({
            "Project": "Super App",
            "Settings": { "Theme": "Dark", "Retries": 3 },
            "Tasks": [
                { "id": 1, "done": false },
                { "id": 2, "done": true }
            ]
        }, null, 4);
    }
    renderTree();

    document.addEventListener('dragover', e => { e.preventDefault(); mouseX=e.clientX; mouseY=e.clientY; });
    document.querySelector('.close-cross').onclick = closeMenu;
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target) && !e.target.closest('.btn-add')) closeMenu();
    });

    document.querySelectorAll('.type-btn').forEach(btn => btn.onclick = () => addItem(btn.dataset.type));
    
    // Allow Enter key to submit creation
    menuKeyInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') addItem('string'); 
    });
    
    document.getElementById('btnFormat').onclick = () => safeRender(true);
    document.getElementById('btnMinify').onclick = () => safeRender(false);
    document.getElementById('btnFix').onclick = fixJSON;
    document.getElementById('btnCopy').onclick = () => navigator.clipboard.writeText(input.value);
    document.getElementById('btnTheme').onclick = toggleTheme;
    
    input.addEventListener('input', () => {
        clearTimeout(window.renderTimer);
        window.renderTimer = setTimeout(renderTree, 500);
    });
});

// === RENDER ===
function safeRender(format) {
    try {
        const parsed = JSON.parse(input.value);
        input.value = JSON.stringify(parsed, null, format ? 4 : 0);
        renderTree();
    } catch(e) {}
}

function renderTree() {
    const raw = input.value.trim();
    if (!raw) return;
    try {
        currentData = JSON.parse(raw);
        treeOutput.innerHTML = '';
        treeOutput.appendChild(createCard(currentData, 'root', []));
        statsEl.innerText = `NODES: ${countNodes(currentData)}`;
    } catch (e) {}
}

function createCard(val, key, path) {
    const isObj = val !== null && typeof val === 'object';
    const isArray = Array.isArray(val);
    const parentIsArray = path.length > 0 && typeof getParent(path) === 'object' && Array.isArray(getParent(path));
    
    const el = document.createElement('div');
    el.className = isObj ? 'json-block expanded' : 'json-row';
    el.dataset.path = JSON.stringify(path);
    
    if (path.length > 0) setupDrag(el, path);

    // --- HEADER GENERATION ---
    const header = document.createElement('div');
    // Header используется для всего: и для объектов, и для строк
    header.className = 'block-header';
    
    // 1. Arrow (only for objects)
    if (isObj) {
        const keys = Object.keys(val);
        if (keys.length > 0) {
            const arrow = document.createElement('span');
            arrow.className = 'toggle-icon';
            arrow.innerHTML = '▶';
            arrow.onclick = (e) => { e.stopPropagation(); el.classList.toggle('expanded'); };
            header.appendChild(arrow);
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'toggle-icon';
            header.appendChild(spacer);
        }
    }

    // 2. Key Name (Editable)
    if (key && key !== 'root') {
        const kSpan = document.createElement('span');
        kSpan.className = 'key-name';
        kSpan.innerText = isObj ? key : key + ':';
        // Only show keys for Objects (arrays don't have named keys)
        if (!parentIsArray) header.appendChild(kSpan); 
    }

    // 3. Value or Meta
    if (isObj) {
        const meta = document.createElement('span');
        meta.className = 'meta-tag';
        meta.innerText = isArray ? `[${Object.keys(val).length}]` : `{${Object.keys(val).length}}`;
        header.appendChild(meta);
    } else {
        const inp = document.createElement('input');
        inp.className = 'editable-val';
        inp.value = val === null ? 'null' : val;
        applyTypeColor(inp, val);
        inp.onchange = (e) => updateVal(path, e.target.value);
        header.appendChild(inp);
    }

    // 4. ACTION GROUP (Edit, Delete, Add)
    if (path.length > 0 || key === 'root') {
        const actions = document.createElement('div');
        actions.className = 'actions-group';
        
        // EDIT KEY (Only if parent is Object and not root)
        if (key !== 'root' && !parentIsArray) {
            const btnEdit = document.createElement('div');
            btnEdit.className = 'action-btn btn-edit';
            btnEdit.innerHTML = '✏️';
            btnEdit.title = "Rename Key";
            // Передаем header элемент напрямую, чтобы избежать поиска по селектору
            btnEdit.onclick = (e) => { 
                e.stopPropagation(); 
                startRename(path, key, header); 
            };
            actions.appendChild(btnEdit);
        }

        // DELETE (Except root)
        if (key !== 'root') {
            const btnDel = document.createElement('div');
            btnDel.className = 'action-btn btn-del';
            btnDel.innerHTML = '🗑️';
            btnDel.title = "Delete Item";
            btnDel.onclick = (e) => { e.stopPropagation(); deleteItem(path); };
            actions.appendChild(btnDel);
        }

        // ADD (Only for Objects/Arrays)
        if (isObj) {
            const btnAdd = document.createElement('div');
            btnAdd.className = 'action-btn btn-add';
            btnAdd.innerHTML = '+';
            btnAdd.title = "Add Child";
            btnAdd.onclick = (e) => { e.stopPropagation(); showMenu(e, path, isArray); };
            actions.appendChild(btnAdd);
        }

        header.appendChild(actions);
    }

    el.appendChild(header);

    if (isObj) {
        const children = document.createElement('div');
        children.className = 'block-children';
        Object.keys(val).forEach(k => {
            children.appendChild(createCard(val[k], isArray ? null : k, [...path, k]));
        });
        el.appendChild(children);
    }
    
    return el;
}

// === ACTIONS LOGIC ===
function getParent(path) {
    let ref = currentData;
    for (let i = 0; i < path.length - 1; i++) ref = ref[path[i]];
    return ref;
}

function deleteItem(path) {
    const parentPath = path.slice(0, -1);
    const key = path[path.length - 1];
    
    let ref = currentData;
    for (let k of parentPath) ref = ref[k];

    if (Array.isArray(ref)) {
        ref.splice(parseInt(key), 1);
    } else {
        delete ref[key];
    }
    saveAndRefresh();
}

// Исправленная функция переименования
function startRename(path, oldKey, headerEl) {
    // Ищем спан внутри переданного хедера
    const keySpan = headerEl.querySelector('.key-name');
    if (!keySpan) return;

    const input = document.createElement('input');
    input.type = 'text';
    // Убираем двоеточие для красоты при редактировании
    input.value = oldKey.replace(/:$/, ''); 
    input.className = 'key-edit-input';
    
    // Заменяем спан на инпут
    keySpan.replaceWith(input);
    input.focus();

    let isSaving = false;

    const save = () => {
        if (isSaving) return; // Prevent double save (Enter + Blur)
        isSaving = true;

        const newKey = input.value.trim();
        // Если ключ изменился и не пустой
        if (newKey && newKey !== oldKey) {
            performRename(path, newKey);
        } else {
            renderTree(); // Просто возвращаем как было
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
    });
    
    input.addEventListener('blur', save);
    input.onclick = (e) => e.stopPropagation();
}

function performRename(path, newKey) {
    const parentPath = path.slice(0, -1);
    const oldKey = path[path.length - 1];
    
    let ref = currentData;
    for (let k of parentPath) ref = ref[k];

    if (Array.isArray(ref)) return; 

    if (ref.hasOwnProperty(newKey)) {
        alert("Ключ с таким именем уже существует!");
        renderTree();
        return;
    }

    // Пересоздаем объект, чтобы сохранить порядок ключей
    const keys = Object.keys(ref);
    const idx = keys.indexOf(oldKey);
    
    const newObj = {};
    keys.forEach((k, i) => {
        if (i === idx) newObj[newKey] = ref[oldKey];
        else newObj[k] = ref[k];
    });

    if (parentPath.length === 0) {
        currentData = newObj;
    } else {
        let pRef = currentData;
        for (let i=0; i<parentPath.length-1; i++) pRef = pRef[parentPath[i]];
        pRef[parentPath[parentPath.length-1]] = newObj;
    }
    saveAndRefresh();
}

// === MENU & ADD ===
function showMenu(e, path, isArray) {
    menuTarget.path = path;
    menuTarget.isArray = isArray;
    
    // Показываем поле ввода ключа ТОЛЬКО если это объект (не массив)
    if (isArray) {
        menuKeyContainer.style.display = 'none';
    } else {
        menuKeyContainer.style.display = 'block';
        menuKeyInput.value = ''; // Очищаем поле
    }

    contextMenu.style.display = 'flex';
    
    let x = e.clientX + 10, y = e.clientY + 5;
    if (x + 220 > window.innerWidth) x -= 230;
    if (y + 300 > window.innerHeight) y = window.innerHeight - 310;
    
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    // Ставим фокус в поле ввода ключа, если оно видно
    if (!isArray) {
        setTimeout(() => menuKeyInput.focus(), 50);
    }
}

function closeMenu() { 
    contextMenu.style.display = 'none'; 
    menuTarget.path = null; 
}

function addItem(type) {
    if (!menuTarget.path) return;
    
    let val;
    switch(type) {
        case 'string': val = "New Value"; break;
        case 'number': val = 0; break;
        case 'boolean': val = false; break;
        case 'null': val = null; break;
        case 'object': val = {}; break; // Создаем пустой словарь
        case 'array': val = []; break;
    }

    let ref = currentData;
    // Идем к целевому объекту/массиву
    for (let k of menuTarget.path) ref = ref[k];

    if (menuTarget.isArray) {
        ref.push(val);
    } else {
        // Если добавляем в объект, берем имя ключа из инпута
        const key = menuKeyInput.value.trim() || "newKey";
        if (ref.hasOwnProperty(key)) { 
            alert("Такой ключ уже есть!"); 
            return; 
        }
        ref[key] = val;
    }
    
    saveAndRefresh();
    closeMenu();
}

// === DRAG & DROP ===
function setupDrag(el, path) {
    el.draggable = true;
    el.addEventListener('dragstart', (e) => {
        if (e.target.closest('.action-btn') || e.target.closest('.toggle-icon') || e.target.tagName === 'INPUT') {
            e.preventDefault(); return;
        }
        e.stopPropagation();
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        isDragging = true; draggedEl = el; draggedPath = path;
        el.classList.add('dragging-source');
        
        dragProxy.innerHTML = '';
        const clone = el.cloneNode(true);
        if (clone.querySelector('.block-children')) clone.querySelector('.block-children').remove();
        dragProxy.appendChild(clone);
        dragProxy.style.display = 'block';
        proxyX = e.clientX; proxyY = e.clientY;
        requestAnimationFrame(dragLoop);
    });
    el.addEventListener('dragend', () => {
        isDragging = false; el.classList.remove('dragging-source');
        dragProxy.style.display = 'none';
        if (placeholder.parentNode) placeholder.remove();
        draggedEl = null;
    });
    el.addEventListener('dragover', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!draggedEl || el === draggedEl || el.contains(draggedEl) || el.parentNode !== draggedEl.parentNode) return;
        const box = el.getBoundingClientRect();
        if (e.clientY < box.top + box.height/2) el.parentNode.insertBefore(placeholder, el);
        else el.parentNode.insertBefore(placeholder, el.nextSibling);
    });
}
treeOutput.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedPath || !placeholder.parentNode) return;
    const siblings = Array.from(placeholder.parentNode.children);
    let newIndex = 0;
    for (let sib of siblings) {
        if (sib === placeholder) break;
        if (sib !== draggedEl && (sib.classList.contains('json-block') || sib.classList.contains('json-row'))) newIndex++;
    }
    const parentPath = draggedPath.slice(0, -1);
    const oldKey = draggedPath[draggedPath.length - 1];
    let ref = currentData;
    for (let k of parentPath) ref = ref[k];

    if (Array.isArray(ref)) {
        const [item] = ref.splice(parseInt(oldKey), 1);
        ref.splice(newIndex, 0, item);
    } else {
        const keys = Object.keys(ref);
        const [k] = keys.splice(keys.indexOf(oldKey), 1);
        keys.splice(newIndex, 0, k);
        const newObj = {};
        keys.forEach(key => newObj[key] = ref[key]);
        if (parentPath.length === 0) currentData = newObj;
        else {
            let pRef = currentData;
            for (let i=0; i<parentPath.length-1; i++) pRef = pRef[parentPath[i]];
            pRef[parentPath[parentPath.length-1]] = newObj;
        }
    }
    saveAndRefresh();
});

// === UTILS ===
function dragLoop() {
    if (!isDragging) return;
    proxyX += (mouseX - proxyX) * 0.4; proxyY += (mouseY - proxyY) * 0.4;
    dragProxy.style.transform = `translate(${proxyX + 15}px, ${proxyY + 10}px)`;
    requestAnimationFrame(dragLoop);
}
function updateVal(path, valStr) {
    let val = valStr;
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val === 'null') val = null;
    else if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val);
    let ref = currentData;
    for (let i=0; i<path.length-1; i++) ref = ref[path[i]];
    ref[path[path.length-1]] = val;
    saveAndRefresh();
}
function saveAndRefresh() { input.value = JSON.stringify(currentData, null, 4); renderTree(); }
function fixJSON() {
    let t = input.value.replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    input.value = t; safeRender(true);
}
function applyTypeColor(el, val) {
    el.classList.remove('val-string','val-number','val-bool','val-null');
    if (typeof val === 'string') el.classList.add('val-string');
    else if (typeof val === 'number') el.classList.add('val-number');
    else if (typeof val === 'boolean') el.classList.add('val-bool');
    else el.classList.add('val-null');
}
function countNodes(obj) {
    let count = 1;
    if (typeof obj === 'object' && obj !== null) Object.values(obj).forEach(v => count += countNodes(v));
    return count;
}
function toggleTheme() {
    const body = document.body;
    body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}