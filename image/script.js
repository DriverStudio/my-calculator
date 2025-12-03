const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const qualityRange = document.getElementById('qualityRange');
const qualityVal = document.getElementById('qualityVal');
const previewBox = document.getElementById('previewBox');

let currentFile = null;
let currentFormat = 'image/jpeg';

// === 1. DRAG & DROP UI ===
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

['dragleave', 'drop'].forEach(type => {
    dropZone.addEventListener(type, () => dropZone.classList.remove('drag-over'));
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

// === 2. ОБРАБОТКА ФАЙЛА ===
function handleFile(file) {
    if (!file.type.startsWith('image/')) return alert('Только картинки!');
    currentFile = file;
    
    // Показываем оригинал
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imgOriginal').src = e.target.result;
        document.getElementById('sizeOriginal').innerText = formatBytes(file.size);
        processImage(); // Сразу запускаем сжатие
    };
    reader.readAsDataURL(file);
    previewBox.style.display = 'flex';
}

// === 3. ДВИЖОК СЖАТИЯ (CANVAS) ===
function processImage() {
    if (!currentFile) return;

    const quality = parseInt(qualityRange.value) / 100;
    qualityVal.innerText = `${qualityRange.value}%`;

    const img = new Image();
    img.src = document.getElementById('imgOriginal').src;
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Магия конвертации
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            document.getElementById('imgResult').src = url;
            
            // Статистика
            document.getElementById('sizeResult').innerText = formatBytes(blob.size);
            
            const savings = ((currentFile.size - blob.size) / currentFile.size * 100).toFixed(1);
            document.getElementById('sizeSavings').innerText = savings > 0 ? `-${savings}%` : '+0%';
            
            // Ссылка на скачивание
            const link = document.getElementById('downloadLink');
            link.href = url;
            link.download = `compressed_${Date.now()}.${currentFormat.split('/')[1]}`;
            
        }, currentFormat, quality);
    };
}

// === 4. УТИЛИТЫ ===
window.setFormat = (fmt) => {
    currentFormat = fmt;
    document.getElementById('formatLabel').innerText = fmt.split('/')[1].toUpperCase();
    processImage();
};

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

qualityRange.addEventListener('input', processImage);