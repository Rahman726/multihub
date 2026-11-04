// ===================== MUSIC PLAYER =====================

function initMusicPlayer() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    const musicBtn = document.createElement('button');
    musicBtn.className = 'music-btn';
    musicBtn.id = 'musicBtn';
    musicBtn.innerHTML = '🎵 Music';
    musicBtn.title = 'Background music';
    
    navActions.insertBefore(musicBtn, navActions.querySelector('.nav-fav-toggle'));
    
    // Create player bar
    const playerBar = document.createElement('div');
    playerBar.className = 'music-player-bar';
    playerBar.id = 'musicPlayerBar';
    playerBar.style.display = 'none';
    playerBar.innerHTML = `
        <div class="music-player-inner">
            <div class="music-info">
                <span class="music-now-playing">🎵 Lo-fi Study</span>
                <span class="music-status" id="musicStatus">Paused</span>
            </div>
            <div class="music-controls">
                <button class="music-control" id="musicPlayBtn">▶</button>
                <input type="range" class="music-volume" id="musicVolume" min="0" max="100" value="30">
                <button class="music-control" id="musicCloseBtn">✕</button>
            </div>
        </div>
    `;
    document.body.appendChild(playerBar);
    
    let audioContext = null;
    let isPlaying = false;
    let gainNode = null;
    let oscillator = null;
    
    musicBtn.addEventListener('click', () => {
        playerBar.style.display = playerBar.style.display === 'none' ? 'block' : 'none';
        if (playerBar.style.display === 'block' && !audioContext) {
            startMusic();
        }
    });
    
    document.getElementById('musicCloseBtn')?.addEventListener('click', () => {
        playerBar.style.display = 'none';
        stopMusic();
    });
    
    document.getElementById('musicPlayBtn')?.addEventListener('click', () => {
        if (isPlaying) {
            stopMusic();
        } else {
            startMusic();
        }
    });
    
    document.getElementById('musicVolume')?.addEventListener('input', (e) => {
        if (gainNode) {
            gainNode.gain.value = e.target.value / 100;
        }
    });
    
    function startMusic() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                gainNode = audioContext.createGain();
                gainNode.gain.value = parseInt(document.getElementById('musicVolume')?.value || '30') / 100;
                gainNode.connect(audioContext.destination);
                
                // Create a simple lo-fi melody using oscillators
                const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];
                let noteIndex = 0;
                
                function playNote() {
                    if (!isPlaying || !audioContext) return;
                    
                    oscillator = audioContext.createOscillator();
                    oscillator.type = 'sine';
                    oscillator.frequency.value = notes[noteIndex % notes.length];
                    
                    const noteGain = audioContext.createGain();
                    noteGain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    oscillator.connect(noteGain);
                    noteGain.connect(gainNode);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                    
                    noteIndex++;
                    setTimeout(playNote, 400);
                }
                
                isPlaying = true;
                document.getElementById('musicPlayBtn').textContent = '⏸';
                document.getElementById('musicStatus').textContent = 'Playing';
                playNote();
            } else {
                isPlaying = true;
                document.getElementById('musicPlayBtn').textContent = '⏸';
                document.getElementById('musicStatus').textContent = 'Playing';
                // Resume context if suspended
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
        } catch (e) {
            console.warn('Music player error:', e);
            showToast('Click anywhere first to enable audio 🎵');
        }
    }
    
    function stopMusic() {
        isPlaying = false;
        if (audioContext) {
            audioContext.suspend();
        }
        document.getElementById('musicPlayBtn').textContent = '▶';
        document.getElementById('musicStatus').textContent = 'Paused';
    }
}
