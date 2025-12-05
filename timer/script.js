/**
 * VISUAL TIMER PRO v2.0
 * Features: Dual-Dial Control, Hourglass Physics, Noise Texture
 */

(function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const display = document.getElementById('display');
    const statusLabel = document.getElementById('statusLabel');
    const btnToggle = document.getElementById('btnToggle');
    const btnReset = document.getElementById('btnReset');
    const dial = document.getElementById('dial');
    
    // === CONFIG ===
    const SIZE = 320;
    const CENTER = SIZE / 2;
    const RADIUS_OUTER = 150; // Минуты
    const RADIUS_INNER = 90;  // Секунды (граница зон)
    
    // Состояние
    let state = {
        mode: 'ring',       
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,    // Общее время старта (для прогресса)
        currentSeconds: 0,  // Текущее оставшееся
        isRunning: false,
        activeZone: null,   // 'minutes' или 'seconds'
        lastTime: 0
    };

    // Частицы для песка и пузырьки для воды
    let particles = [];
    let bubbles = [];

    // --- AUDIO (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playTick() {
        if(state.isRunning) return; // Тикаем только при настройке
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 800;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
        
        if (navigator.vibrate) navigator.vibrate(5);
    }

    function playAlarm() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    }

    // --- LOGIC ---

    function formatTime(totalSec) {
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateDisplay() {
        // При настройке показываем установленное, при беге - оставшееся
        const val = state.isRunning ? Math.ceil(state.currentSeconds) : (state.minutes * 60 + state.seconds);
        display.innerText = formatTime(val);
        btnToggle.innerText = state.isRunning ? '❚❚' : '▶';
        statusLabel.innerText = state.isRunning ? 'FOCUSING...' : (val === 0 ? 'SET TIME' : 'READY');
    }

    // --- RENDERERS ---

    // 1. NEON RING (Dual Dial Visualization)
    function drawRing() {
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, RADIUS_OUTER, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 15;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CENTER, CENTER, RADIUS_INNER - 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 10;
        ctx.stroke();
        
        let minPct, secPct;

        if (state.isRunning) {
            const progress = state.totalSeconds > 0 ? state.currentSeconds / state.totalSeconds : 0;
            minPct = progress;
            secPct = progress; 
        } else {
            minPct = state.minutes / 60;
            secPct = state.seconds / 60;
        }

        if (minPct > 0) drawArc(RADIUS_OUTER, 15, minPct, '#00f3ff');
        if (secPct > 0) drawArc(RADIUS_INNER - 10, 10, secPct, '#ff0055');
    }

    function drawArc(r, w, pct, color) {
        ctx.beginPath();
        const end = -Math.PI / 2 + (Math.PI * 2 * pct);
        ctx.arc(CENTER, CENTER, r, -Math.PI / 2, end);
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        if (!state.isRunning) {
            const kx = CENTER + Math.cos(end) * r;
            const ky = CENTER + Math.sin(end) * r;
            ctx.beginPath(); ctx.arc(kx, ky, w/2 + 2, 0, Math.PI*2);
            ctx.fillStyle = '#fff'; ctx.fill();
        }
    }

    // 2. SAND (Physically Correct Hourglass)
    function drawSand() {
        const total = state.isRunning ? state.totalSeconds : (state.minutes * 60 + state.seconds);
        const current = state.isRunning ? state.currentSeconds : total;
        
        const fillPct = total > 0 ? current / total : 0;
        const emptyPct = 1 - fillPct;

        ctx.save();
        ctx.beginPath(); ctx.arc(CENTER, CENTER, RADIUS_OUTER, 0, Math.PI * 2); ctx.clip();

        // Верхний резервуар (убывает)
        if (fillPct > 0) {
            ctx.fillStyle = '#f6d365';
            ctx.fillRect(0, SIZE * (1-fillPct), SIZE, SIZE * fillPct);
        }

        // Частицы
        if (state.isRunning && current > 0.5) {
            if (Math.random() > 0.5) {
                particles.push({
                    x: CENTER + (Math.random() - 0.5) * 4,
                    y: SIZE * (1-fillPct),
                    v: 3 + Math.random() * 2
                });
            }
        }
        
        ctx.fillStyle = '#fff';
        particles.forEach((p, i) => {
            p.y += p.v;
            ctx.fillRect(p.x, p.y, 2, 2);
            if (p.y > SIZE) particles.splice(i, 1);
        });

        // Горка внизу
        if (emptyPct > 0) {
            const moundHeight = (SIZE * 0.4) * emptyPct;
            ctx.beginPath();
            ctx.moveTo(0, SIZE);
            for(let x=0; x<=SIZE; x+=5) {
                const dist = Math.abs(x - CENTER);
                const y = SIZE - Math.max(0, moundHeight - dist * 0.8);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(SIZE, SIZE);
            ctx.fillStyle = '#e0c050'; 
            ctx.fill();
        }

        ctx.restore();
    }

    // 3. WATER (With Bubbles)
    let wavePhase = 0;
    function drawWater() {
        wavePhase += 0.05;
        const total = state.isRunning ? state.totalSeconds : (state.minutes * 60 + state.seconds);
        const current = state.isRunning ? state.currentSeconds : total;
        const pct = total > 0 ? current / total : 0;

        ctx.save();
        ctx.beginPath(); ctx.arc(CENTER, CENTER, RADIUS_OUTER, 0, Math.PI * 2); ctx.clip();

        if (pct > 0) {
            const h = SIZE * pct;
            const yBase = SIZE - h;

            ctx.beginPath();
            ctx.moveTo(0, SIZE);
            for (let x = 0; x <= SIZE; x += 5) {
                const y = yBase + Math.sin(x * 0.03 + wavePhase) * (5 + (1-pct)*5);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(SIZE, SIZE);
            ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.fill();
            
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.stroke();

            if (state.isRunning && Math.random() > 0.9) {
                bubbles.push({
                    x: Math.random() * SIZE,
                    y: SIZE,
                    r: Math.random() * 3 + 1,
                    v: Math.random() * 2 + 1
                });
            }
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        bubbles.forEach((b, i) => {
            b.y -= b.v;
            b.x += Math.sin(b.y * 0.05) * 0.5;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
            const levelY = SIZE - (SIZE * pct);
            if (b.y < levelY) bubbles.splice(i, 1);
        });

        ctx.restore();
    }

    function render() {
        ctx.clearRect(0, 0, SIZE, SIZE);

        if (state.mode === 'ring') drawRing();
        else if (state.mode === 'sand') drawSand();
        else if (state.mode === 'water') drawWater();

        if (state.isRunning) {
            const now = Date.now();
            const dt = (now - state.lastTime) / 1000;
            state.lastTime = now;
            
            state.currentSeconds -= dt;
            if (state.currentSeconds <= 0) {
                state.currentSeconds = 0;
                state.isRunning = false;
                playAlarm();
            }
            updateDisplay();
        }

        requestAnimationFrame(render);
    }

    // --- INTERACTION ---

    function getInteractionData(e) {
        const rect = dial.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        const dx = x - CENTER;
        const dy = y - CENTER;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy, dx); 
        angle += Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        return { dist, angle };
    }

    function handleStart(e) {
        if (state.isRunning) {
            state.isRunning = false;
            updateDisplay();
            return;
        }
        const { dist } = getInteractionData(e);
        if (dist < RADIUS_INNER) {
            state.activeZone = 'seconds';
        } else if (dist < RADIUS_OUTER + 20) {
            state.activeZone = 'minutes';
        } else {
            state.activeZone = null;
            return;
        }
        handleMove(e);
    }

    function handleMove(e) {
        if (!state.activeZone) return;
        e.preventDefault();
        const { angle } = getInteractionData(e);
        const pct = angle / (Math.PI * 2);
        let oldVal;
        if (state.activeZone === 'minutes') {
            oldVal = state.minutes;
            state.minutes = Math.round(pct * 60);
            if (state.minutes === 60) state.minutes = 0;
            if (oldVal !== state.minutes) playTick();
        } else {
            oldVal = state.seconds;
            state.seconds = Math.round(pct * 60);
            if (state.seconds === 60) state.seconds = 0;
            if (oldVal !== state.seconds) playTick();
        }
        updateDisplay();
    }

    function handleEnd() {
        state.activeZone = null;
    }

    dial.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    dial.addEventListener('touchstart', handleStart, {passive: false});
    window.addEventListener('touchmove', handleMove, {passive: false});
    window.addEventListener('touchend', handleEnd);

    btnToggle.onclick = () => {
        if (state.isRunning) {
            state.isRunning = false;
        } else {
            const total = state.minutes * 60 + state.seconds;
            if (total > 0) {
                if (state.currentSeconds === 0) {
                     state.totalSeconds = total;
                     state.currentSeconds = total;
                }
                state.isRunning = true;
                state.lastTime = Date.now();
            }
        }
        updateDisplay();
    };

    btnReset.onclick = () => {
        state.isRunning = false;
        state.currentSeconds = 0;
        updateDisplay();
    };

    document.querySelectorAll('.mode-opt').forEach(el => {
        el.onclick = () => {
            document.querySelector('.mode-opt.active').classList.remove('active');
            el.classList.add('active');
            state.mode = el.dataset.mode;
        };
    });

    updateDisplay();
    requestAnimationFrame(render);
})();