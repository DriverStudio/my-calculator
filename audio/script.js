/* audio/script.js */

document.addEventListener('DOMContentLoaded', () => {
    // UI Элементы
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const canvas = document.getElementById('waveform');
    const ctx = canvas.getContext('2d');
    const controlsPanel = document.getElementById('controlsPanel');
    const totalDurationLabel = document.getElementById('totalDurationLabel'); // Новая метка
    
    // Trim Controls
    const trimStartIn = document.getElementById('trimStart');
    const trimEndIn = document.getElementById('trimEnd');
    const startText = document.getElementById('startText');
    const endText = document.getElementById('endText');

    // Effect Controls
    const volRange = document.getElementById('volRange');
    const speedRange = document.getElementById('speedRange');
    const volValue = document.getElementById('volValue');
    const speedValue = document.getElementById('speedValue');
    
    const btnPlay = document.getElementById('btnPlay');
    const btnStop = document.getElementById('btnStop');
    const btnExport = document.getElementById('btnExport');

    // Audio State
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let audioBuffer = null;
    let sourceNode = null;
    let gainNode = null;
    
    let duration = 0;
    let trimStart = 0;
    let trimEnd = 0;

    // 1. ЗАГРУЗКА
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        btnPlay.innerText = "⏳ Загрузка...";
        fileNameDisplay.innerText = file.name;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            // Инициализация значений
            duration = audioBuffer.duration;
            trimStart = 0;
            trimEnd = duration;

            // Обновляем метку общей длительности
            totalDurationLabel.innerText = duration.toFixed(2) + 's';

            // Настройка слайдеров
            trimStartIn.max = duration;
            trimEndIn.max = duration;
            trimStartIn.value = 0;
            trimEndIn.value = duration;
            trimStartIn.step = 0.01; // Более точный шаг
            trimEndIn.step = 0.01;

            updateTrimTexts();
            drawWaveform();
            
            controlsPanel.classList.add('active');
            btnPlay.innerText = "▶️ Play (Preview)";
        } catch (err) {
            alert('Ошибка. Файл поврежден или формат не поддерживается.');
            console.error(err);
            btnPlay.innerText = "▶️ Play";
        }
    });

    // 2. ЛОГИКА ОБРЕЗКИ
    function updateTrimTexts() {
        startText.innerText = parseFloat(trimStart).toFixed(2) + 's';
        endText.innerText = parseFloat(trimEnd).toFixed(2) + 's';
    }

    trimStartIn.addEventListener('input', () => {
        let val = parseFloat(trimStartIn.value);
        if (val >= trimEnd) {
            val = trimEnd - 0.1;
            trimStartIn.value = val;
        }
        trimStart = val;
        updateTrimTexts();
        drawWaveform();
    });

    trimEndIn.addEventListener('input', () => {
        let val = parseFloat(trimEndIn.value);
        if (val <= trimStart) {
            val = trimStart + 0.1;
            trimEndIn.value = val;
        }
        trimEnd = val;
        updateTrimTexts();
        drawWaveform();
    });

    // 3. ОТРИСОВКА ВОЛНЫ
    function drawWaveform() {
        if (!audioBuffer) return;

        const width = canvas.width;
        const height = canvas.height;
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Рисуем волну
        ctx.fillStyle = '#28a745';
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[i * step + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        // Рисуем затемнение (Overlay)
        const startX = (trimStart / duration) * width;
        const endX = (trimEnd / duration) * width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Темнее для лучшего контраста
        
        // Слева
        ctx.fillRect(0, 0, startX, height);
        // Справа
        ctx.fillRect(endX, 0, width - endX, height);

        // Маркеры границ
        ctx.fillStyle = '#fff';
        ctx.fillRect(startX, 0, 2, height);
        ctx.fillRect(endX, 0, 2, height);
    }

    // 4. ЭФФЕКТЫ
    volRange.addEventListener('input', () => {
        volValue.innerText = volRange.value + '%';
        if (gainNode) gainNode.gain.value = volRange.value / 100;
    });

    speedRange.addEventListener('input', () => {
        speedValue.innerText = speedRange.value + 'x';
        if (sourceNode) sourceNode.playbackRate.value = speedRange.value;
    });

    // 5. ВОСПРОИЗВЕДЕНИЕ
    btnPlay.addEventListener('click', () => {
        if (sourceNode) stopAudio();

        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        
        gainNode = audioCtx.createGain();
        
        const speed = parseFloat(speedRange.value);
        sourceNode.playbackRate.value = speed;
        gainNode.gain.value = parseFloat(volRange.value) / 100;

        sourceNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // start(when, offset, duration)
        // Обратите внимание: playDuration не нужно делить на speed для параметра duration метода start()
        const playDuration = trimEnd - trimStart;
        
        sourceNode.start(0, trimStart, playDuration);
        
        btnPlay.innerText = '🔄 Restart Preview';

        sourceNode.onended = () => {
            btnPlay.innerText = '▶️ Play (Preview)';
            sourceNode = null;
        };
    });

    btnStop.addEventListener('click', stopAudio);

    function stopAudio() {
        if (sourceNode) {
            try { sourceNode.stop(); } catch(e){}
            sourceNode = null;
        }
        btnPlay.innerText = '▶️ Play (Preview)';
    }

    // 6. ЭКСПОРТ
    btnExport.addEventListener('click', () => {
        if (!audioBuffer) return;
        
        btnExport.innerText = '⏳ Обработка...';
        
        setTimeout(() => {
            const speed = parseFloat(speedRange.value);
            const vol = parseFloat(volRange.value) / 100;
            
            const rawDuration = trimEnd - trimStart;
            const finalDuration = rawDuration / speed;

            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                finalDuration * audioBuffer.sampleRate,
                audioBuffer.sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speed;

            const gain = offlineCtx.createGain();
            gain.gain.value = vol;

            source.connect(gain);
            gain.connect(offlineCtx.destination);
            
            source.start(0, trimStart, rawDuration);

            offlineCtx.startRendering().then(renderedBuffer => {
                const wavData = bufferToWave(renderedBuffer, renderedBuffer.length);
                const blob = new Blob([wavData], { type: "audio/wav" });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `cut_${Date.now()}.wav`;
                link.click();
                
                btnExport.innerText = '💾 Сохранить обрезанное';
            }).catch(err => {
                console.error(err);
                alert("Ошибка экспорта");
                btnExport.innerText = '💾 Сохранить обрезанное';
            });
        }, 50);
    });

    function bufferToWave(abuffer, len) {
        let numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample,
            offset = 0,
            pos = 0;

        function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
        function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

        setUint32(0x46464952); 
        setUint32(length - 8); 
        setUint32(0x45564157); 
        setUint32(0x20746d66); 
        setUint32(16); 
        setUint16(1); 
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2);
        setUint16(16); 
        setUint32(0x61746164); 
        setUint32(length - pos - 4);

        for(i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while(pos < len) {
            for(i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][pos])); 
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
                view.setInt16(44 + offset, sample, true);
                offset += 2;
            }
            pos++;
        }
        return buffer;
    }
});