// ===================== GAMES SECTION =====================
// Five kid-friendly games: Memory Match, Sliding Puzzle, Whack-a-Emoji,
// Tic-Tac-Toe, and Simon Says

// ─── DOM Refs ──────────────────────────────────────────────
const gamesOverlay = document.getElementById('gamesOverlay');
const gamesModal = document.getElementById('gamesModal');
const gamesClose = document.getElementById('gamesClose');
const gamesNavBtn = document.getElementById('gamesNavBtn');
const heroGamesBtn = document.getElementById('heroGamesBtn');
const gameLobby = document.getElementById('gameLobby');
const gameContainer = document.getElementById('gameContainer');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');

// ===================== GAME 1: MEMORY MATCH =====================
const EMOJIS = ['🐶', '🐱', '🐼', '🐸', '🦊', '🐰', '🐨', '🦁', '🐯', '🐮', '🐷', '🐵', '🦄', '🐧', '🐝', '🦋'];

let memoryCards = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryLocked = false;
let memoryMoves = 0;
let memoryTimer = 0;
let memoryInterval = null;

function initMemoryGame() {
    memoryFlipped = [];
    memoryMatched = [];
    memoryLocked = false;
    memoryMoves = 0;
    memoryTimer = 0;
    if (memoryInterval) clearInterval(memoryInterval);

    const shuffledEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, 8);
    memoryCards = [...shuffledEmojis, ...shuffledEmojis]
        .sort(() => Math.random() - 0.5)
        .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));

    renderMemoryBoard();
    document.getElementById('memoryMoves').textContent = '0';
    document.getElementById('memoryTimer').textContent = '0s';
    
    memoryInterval = setInterval(() => {
        memoryTimer++;
        document.getElementById('memoryTimer').textContent = memoryTimer + 's';
    }, 1000);
}

function renderMemoryBoard() {
    const board = document.getElementById('memoryBoard');
    board.innerHTML = memoryCards.map((card, i) => `
        <div class="mem-card ${card.matched ? 'matched' : ''} ${memoryMatched.includes(i) ? 'flipped' : ''}" 
             onclick="flipMemoryCard(${i})" data-index="${i}">
            <div class="mem-card-inner">
                <div class="mem-card-front">❓</div>
                <div class="mem-card-back">${card.emoji}</div>
            </div>
        </div>
    `).join('');
}

function flipMemoryCard(index) {
    if (memoryLocked) return;
    if (memoryMatched.includes(index)) return;
    if (memoryFlipped.includes(index)) return;
    if (memoryFlipped.length >= 2) return;

    memoryFlipped.push(index);
    memoryMatched.push(index);
    renderMemoryBoard();

    if (memoryFlipped.length === 2) {
        memoryMoves++;
        document.getElementById('memoryMoves').textContent = memoryMoves;
        memoryLocked = true;

        const [first, second] = memoryFlipped;
        if (memoryCards[first].emoji === memoryCards[second].emoji) {
            setTimeout(() => {
                memoryFlipped = [];
                memoryLocked = false;
                if (memoryMatched.length === memoryCards.length) {
                    clearInterval(memoryInterval);
                    // Save score
                    const scores = loadScores();
                    if (scores.memory.bestMoves === null || memoryMoves < scores.memory.bestMoves) {
                        scores.memory.bestMoves = memoryMoves;
                        scores.memory.bestTime = memoryTimer;
                        saveScores(scores);
                    }
                    setTimeout(() => {
                        showGameResult('🎉', 'Memory Match Complete! 🏆', `${memoryMoves} moves in ${memoryTimer}s`, true);
                    }, 500);
                }
            }, 600);
        } else {
            setTimeout(() => {
                memoryMatched = memoryMatched.filter(m => m !== first && m !== second);
                memoryFlipped = [];
                memoryLocked = false;
                renderMemoryBoard();
            }, 900);
        }
    }
}

// ===================== GAME 2: SLIDING PUZZLE =====================
let puzzleTiles = [];
let puzzleSize = 3;
let puzzleEmptyIndex = 8;
let puzzleMoves = 0;
let puzzleTimer = 0;
let puzzleInterval = null;

function changePuzzleSize(size) {
    document.querySelectorAll('.puzzle-size-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.textContent) === size);
    });
    initPuzzle(size);
}

function initPuzzle(size = 3) {
    puzzleSize = size;
    puzzleMoves = 0;
    puzzleTimer = 0;
    if (puzzleInterval) clearInterval(puzzleInterval);
    
    const total = size * size;
    puzzleTiles = Array.from({ length: total - 1 }, (_, i) => i + 1);
    puzzleTiles.push(null);
    
    do {
        puzzleTiles.sort(() => Math.random() - 0.5);
    } while (!isPuzzleSolvable());
    
    puzzleEmptyIndex = puzzleTiles.indexOf(null);
    renderPuzzle();
    document.getElementById('puzzleMoves').textContent = '0';
    document.getElementById('puzzleTimer').textContent = '0s';
    
    puzzleInterval = setInterval(() => {
        puzzleTimer++;
        document.getElementById('puzzleTimer').textContent = puzzleTimer + 's';
    }, 1000);
}

function isPuzzleSolvable() {
    const tiles = puzzleTiles.filter(t => t !== null);
    let inversions = 0;
    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i] > tiles[j]) inversions++;
        }
    }
    if (puzzleSize % 2 === 0) {
        const emptyRowFromBottom = puzzleSize - Math.floor(puzzleEmptyIndex / puzzleSize);
        return (inversions + emptyRowFromBottom) % 2 === 0;
    }
    return inversions % 2 === 0;
}

function renderPuzzle() {
    const board = document.getElementById('puzzleBoard');
    board.style.gridTemplateColumns = `repeat(${puzzleSize}, 1fr)`;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
                    '#F1948A', '#85C1E9', '#82E0AA', '#F8C471', '#D2B4DE', '#A3E4D7', '#FAD7A0', '#A9CCE3', '#ABEBC6',
                    '#F5B7B1', '#AED6F1', '#A9DFBF', '#FADBD8', '#D5F5E3', '#FCF3CF', '#E8DAEF', '#D1F2EB'];
    
    board.innerHTML = puzzleTiles.map((tile, i) => {
        if (tile === null) {
            return `<div class="puzzle-tile puzzle-empty"></div>`;
        }
        return `<div class="puzzle-tile" style="background:${colors[(tile - 1) % colors.length]}" onclick="movePuzzleTile(${i})">${tile}</div>`;
    }).join('');
}

function movePuzzleTile(index) {
    if (index === puzzleEmptyIndex) return;
    const emptyRow = Math.floor(puzzleEmptyIndex / puzzleSize);
    const emptyCol = puzzleEmptyIndex % puzzleSize;
    const tileRow = Math.floor(index / puzzleSize);
    const tileCol = index % puzzleSize;
    if (Math.abs(emptyRow - tileRow) + Math.abs(emptyCol - tileCol) !== 1) return;
    
    puzzleTiles[puzzleEmptyIndex] = puzzleTiles[index];
    puzzleTiles[index] = null;
    puzzleEmptyIndex = index;
    puzzleMoves++;
    document.getElementById('puzzleMoves').textContent = puzzleMoves;
    renderPuzzle();
    
    if (checkPuzzleWin()) {
        clearInterval(puzzleInterval);
        // Save score
        const scores = loadScores();
        const key = String(puzzleSize);
        if (scores.puzzle[key].bestMoves === null || puzzleMoves < scores.puzzle[key].bestMoves) {
            scores.puzzle[key].bestMoves = puzzleMoves;
            scores.puzzle[key].bestTime = puzzleTimer;
            saveScores(scores);
        }
        setTimeout(() => {
            showGameResult('🧩', 'Puzzle Solved! 🏆', `${puzzleMoves} moves in ${puzzleTimer}s`, true);
        }, 400);
    }
}

function checkPuzzleWin() {
    for (let i = 0; i < puzzleTiles.length - 1; i++) {
        if (puzzleTiles[i] !== i + 1) return false;
    }
    return puzzleTiles[puzzleTiles.length - 1] === null;
}

// ===================== GAME 3: WHACK-A-EMOJI (with WIN/LOSE goal) =====================
let whackScore = 0;
let whackTimer = 30;
let whackGoal = 20;
let whackInterval = null;
let whackSpawnInterval = null;
let whackActive = false;
const WHACK_EMOJIS = ['🐭', '🐸', '🐛', '🦎', '🐞', '🐌', '🦀', '🐙'];

function initWhackGame() {
    whackScore = 0;
    whackTimer = 30;
    whackGoal = 20;
    whackActive = true;
    if (whackInterval) clearInterval(whackInterval);
    if (whackSpawnInterval) clearInterval(whackSpawnInterval);
    
    // Update goal display
    document.getElementById('whackGoal').textContent = whackGoal;
    updateWhackProgress();
    
    const board = document.getElementById('whackBoard');
    board.innerHTML = Array.from({ length: 9 }, (_, i) => `
        <div class="whack-hole" data-hole="${i}" onclick="whackEmoji(${i})">
            <div class="whack-mole" id="whackMole${i}"></div>
        </div>
    `).join('');
    
    document.getElementById('whackScore').textContent = '0';
    document.getElementById('whackTimerDisplay').textContent = '30s';
    
    whackInterval = setInterval(() => {
        whackTimer--;
        document.getElementById('whackTimerDisplay').textContent = whackTimer + 's';
        if (whackTimer <= 0) {
            endWhackGame();
        }
    }, 1000);
    
    spawnMole();
    whackSpawnInterval = setInterval(spawnMole, 700);
}

function updateWhackProgress() {
    const bar = document.getElementById('whackProgressBar');
    const pct = Math.min(100, (whackScore / whackGoal) * 100);
    bar.style.width = pct + '%';
    bar.textContent = whackScore >= whackGoal ? '✅' : '';
}

function spawnMole() {
    if (!whackActive) return;
    const holeIndex = Math.floor(Math.random() * 9);
    const mole = document.getElementById(`whackMole${holeIndex}`);
    if (!mole || mole.classList.contains('show')) return;
    
    const emoji = WHACK_EMOJIS[Math.floor(Math.random() * WHACK_EMOJIS.length)];
    mole.textContent = emoji;
    mole.classList.add('show');
    
    setTimeout(() => {
        if (mole) {
            mole.classList.remove('show');
            mole.textContent = '';
        }
    }, 800 + Math.random() * 500);
}

function whackEmoji(holeIndex) {
    if (!whackActive) return;
    const mole = document.getElementById(`whackMole${holeIndex}`);
    if (!mole || !mole.classList.contains('show')) return;
    
    whackScore++;
    document.getElementById('whackScore').textContent = whackScore;
    updateWhackProgress();
    
    mole.classList.remove('show');
    mole.textContent = '';
    mole.style.transform = 'scale(1.5)';
    setTimeout(() => { mole.style.transform = ''; }, 200);
    
    // Check if goal reached early (instant win!)
    if (whackScore >= whackGoal) {
        whackActive = false;
        clearInterval(whackInterval);
        clearInterval(whackSpawnInterval);
        hideAllMoles();
        // Save score
        const scores = loadScores();
        if (whackScore > scores.whack.highScore) scores.whack.highScore = whackScore;
        scores.whack.wins++;
        saveScores(scores);
        setTimeout(() => {
            showGameResult('🏆', 'You WIN! 🎉', `Goal ${whackGoal} achieved in ${30 - whackTimer}s!`, true);
        }, 300);
    }
}

function hideAllMoles() {
    for (let i = 0; i < 9; i++) {
        const mole = document.getElementById(`whackMole${i}`);
        if (mole) {
            mole.classList.remove('show');
            mole.textContent = '';
        }
    }
}

function endWhackGame() {
    whackActive = false;
    clearInterval(whackInterval);
    clearInterval(whackSpawnInterval);
    hideAllMoles();
    
    // Save score
    const scores = loadScores();
    if (whackScore > scores.whack.highScore) scores.whack.highScore = whackScore;
    if (whackScore >= whackGoal) scores.whack.wins++;
    else scores.whack.losses++;
    saveScores(scores);
    
    setTimeout(() => {
        if (whackScore >= whackGoal) {
            showGameResult('🏆', 'You WIN! 🎉', `Goal ${whackGoal} achieved! Score: ${whackScore}`, true);
        } else {
            showGameResult('😢', 'You Lose!', `Score: ${whackScore}/${whackGoal} — Try again!`, false);
        }
    }, 500);
}

// ===================== GAME 4: TIC-TAC-TOE =====================
let tttBoard = [];
let tttPlayer = 'X';
let tttAI = 'O';
let tttGameOver = false;
let tttMoves = 0;

function initTTT() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttPlayer = 'X';
    tttAI = 'O';
    tttGameOver = false;
    tttMoves = 0;
    document.getElementById('tttStatus').textContent = 'Your turn (X)';
    document.getElementById('tttStatus').className = 'ttt-status your-turn';
    renderTTT();
}

function renderTTT() {
    const board = document.getElementById('tttBoard');
    board.innerHTML = tttBoard.map((cell, i) => `
        <div class="ttt-cell" onclick="tttMove(${i})">
            ${cell ? `<span class="ttt-${cell.toLowerCase()}">${cell}</span>` : ''}
        </div>
    `).join('');
}

function tttMove(index) {
    if (tttGameOver || tttBoard[index] !== '') return;
    
    tttBoard[index] = tttPlayer;
    tttMoves++;
    renderTTT();
    
    if (checkTTTWin(tttPlayer)) {
        tttGameOver = true;
        document.getElementById('tttStatus').textContent = '🎉 You Win!';
        document.getElementById('tttStatus').className = 'ttt-status win';
        // Save score
        const scores = loadScores();
        scores.ttt.wins++;
        saveScores(scores);
        setTimeout(() => showGameResult('🏆', 'Tic-Tac-Toe WIN!', 'You beat the AI! 🎉', true), 400);
        return;
    }
    
    if (tttMoves === 9) {
        tttGameOver = true;
        document.getElementById('tttStatus').textContent = "🤝 It's a Draw!";
        document.getElementById('tttStatus').className = 'ttt-status draw';
        // Save score
        const scores = loadScores();
        scores.ttt.draws++;
        saveScores(scores);
        setTimeout(() => showGameResult('🤝', "It's a Draw!", 'Close game! Try again.', false), 400);
        return;
    }
    
    // AI turn
    document.getElementById('tttStatus').textContent = 'AI thinking...';
    document.getElementById('tttStatus').className = 'ttt-status ai-turn';
    setTimeout(tttAIMove, 500);
}

function tttAIMove() {
    if (tttGameOver) return;
    
    // Find best move
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (tttBoard[i] === '') {
            tttBoard[i] = tttAI;
            let score = tttMinimax(tttBoard, 0, false);
            tttBoard[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    if (bestMove === -1) return; // No moves left
    
    tttBoard[bestMove] = tttAI;
    tttMoves++;
    renderTTT();
    
    if (checkTTTWin(tttAI)) {
        tttGameOver = true;
        document.getElementById('tttStatus').textContent = '😢 AI Wins!';
        document.getElementById('tttStatus').className = 'ttt-status lose';
        // Save score
        const scores = loadScores();
        scores.ttt.losses++;
        saveScores(scores);
        setTimeout(() => showGameResult('😢', 'You Lose!', 'AI beat you this time!', false), 400);
        return;
    }
    
    if (tttMoves === 9) {
        tttGameOver = true;
        document.getElementById('tttStatus').textContent = "🤝 It's a Draw!";
        document.getElementById('tttStatus').className = 'ttt-status draw';
        // Save score
        const scores = loadScores();
        scores.ttt.draws++;
        saveScores(scores);
        setTimeout(() => showGameResult('🤝', "It's a Draw!", 'Close game! Try again.', false), 400);
        return;
    }
    
    document.getElementById('tttStatus').textContent = 'Your turn (X)';
    document.getElementById('tttStatus').className = 'ttt-status your-turn';
}

function tttMinimax(board, depth, isMaximizing) {
    if (checkTTTWin(tttAI)) return 10 - depth;
    if (checkTTTWin(tttPlayer)) return depth - 10;
    if (board.every(c => c !== '')) return 0;
    
    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = tttAI;
                best = Math.max(best, tttMinimax(board, depth + 1, false));
                board[i] = '';
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = tttPlayer;
                best = Math.min(best, tttMinimax(board, depth + 1, true));
                board[i] = '';
            }
        }
        return best;
    }
}

function checkTTTWin(player) {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return wins.some(w => w.every(i => tttBoard[i] === player));
}

// ===================== GAME 5: SIMON SAYS =====================
let simonSequence = [];
let simonPlayerIndex = 0;
let simonRound = 0;
let simonActive = false;
let simonInputLocked = false;
const SIMON_COLORS = ['green', 'red', 'yellow', 'blue'];
const SIMON_EMOJIS = ['🟢', '🔴', '🟡', '🔵'];

function initSimon() {
    simonSequence = [];
    simonPlayerIndex = 0;
    simonRound = 0;
    simonActive = true;
    simonInputLocked = true;
    
    document.getElementById('simonRound').textContent = '1';
    document.getElementById('simonStatus').textContent = 'Watch the pattern... 👀';
    document.getElementById('simonStatus').className = 'simon-status watching';
    
    // Reset all lights
    SIMON_COLORS.forEach(c => {
        const el = document.getElementById(`simon-${c}`);
        if (el) el.classList.remove('active');
    });
    
    // Start after a brief delay
    setTimeout(() => {
        simonAddStep();
        simonPlaySequence();
    }, 800);
}

function simonAddStep() {
    const next = Math.floor(Math.random() * 4);
    simonSequence.push(next);
    simonRound = simonSequence.length;
    document.getElementById('simonRound').textContent = simonRound;
}

function simonPlaySequence() {
    simonInputLocked = true;
    document.getElementById('simonStatus').textContent = 'Watch the pattern... 👀';
    document.getElementById('simonStatus').className = 'simon-status watching';
    
    let i = 0;
    function showNext() {
        if (i >= simonSequence.length) {
            simonInputLocked = false;
            simonPlayerIndex = 0;
            document.getElementById('simonStatus').textContent = 'Your turn! Repeat it 🎯';
            document.getElementById('simonStatus').className = 'simon-status your-turn';
            return;
        }
        
        const colorIndex = simonSequence[i];
        const el = document.getElementById(`simon-${SIMON_COLORS[colorIndex]}`);
        if (el) {
            el.classList.add('active');
            playSimonSound(colorIndex);
            setTimeout(() => {
                el.classList.remove('active');
                i++;
                setTimeout(showNext, 200);
            }, 500);
        } else {
            i++;
            setTimeout(showNext, 200);
        }
    }
    setTimeout(showNext, 300);
}

function playSimonSound(index) {
    // Visual flash instead of sound
    const colors = ['#4CAF50', '#F44336', '#FFEB3B', '#2196F3'];
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 999;
        background: ${colors[index]}; opacity: 0.1;
        animation: fadeOut 0.3s ease;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
}

function simonColorClick(colorIndex) {
    if (simonInputLocked || !simonActive) return;
    
    const el = document.getElementById(`simon-${SIMON_COLORS[colorIndex]}`);
    if (el) {
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 200);
    }
    
    // Check if correct
    if (colorIndex === simonSequence[simonPlayerIndex]) {
        simonPlayerIndex++;
        
        // Check if round complete
        if (simonPlayerIndex >= simonSequence.length) {
            document.getElementById('simonStatus').textContent = '✅ Correct! Next round...';
            document.getElementById('simonStatus').className = 'simon-status correct';
            
            if (simonRound >= 10) {
                simonActive = false;
                // Save score
                const scores = loadScores();
                if (simonRound > scores.simon.bestRound) scores.simon.bestRound = simonRound;
                scores.simon.wins++;
                saveScores(scores);
                setTimeout(() => {
                    showGameResult('🏆', 'Simon Says WIN! 🎉', `You completed ${simonRound} rounds!`, true);
                }, 600);
                return;
            }
            
            setTimeout(() => {
                simonAddStep();
                simonPlaySequence();
            }, 800);
        }
    } else {
        // Wrong!
        simonActive = false;
        document.getElementById('simonStatus').textContent = `😢 Game Over! You reached round ${simonRound}`;
        document.getElementById('simonStatus').className = 'simon-status lose';
        
        // Flash red
        document.querySelectorAll('.simon-color').forEach(el => {
            el.style.background = '#ff0000';
            setTimeout(() => {
                el.style.background = '';
            }, 500);
        });
        
        // Save score
        const scores = loadScores();
        if (simonRound > scores.simon.bestRound) scores.simon.bestRound = simonRound;
        saveScores(scores);
        
        setTimeout(() => {
            const msg = simonRound >= 5 ? 'Great memory!' : 'Keep practicing!';
            showGameResult('😢', `Game Over! Round ${simonRound}`, msg, simonRound >= 5);
        }, 800);
    }
}

// ===================== RESULT MODAL =====================
function showGameResult(icon, title, subtitle, isWin) {
    const modal = document.getElementById('gameResultModal');
    document.getElementById('gameResultIcon').textContent = icon;
    document.getElementById('gameResultTitle').textContent = title;
    document.getElementById('gameResultTitle').style.color = isWin ? '#4CAF50' : '#F44336';
    document.getElementById('gameResultSubtitle').textContent = subtitle;
    modal.classList.add('open');
    createConfetti(isWin);
}

function closeGameResult() {
    document.getElementById('gameResultModal').classList.remove('open');
    document.getElementById('gameResultTitle').style.color = '';
}

function playAgain() {
    closeGameResult();
    const currentGame = document.querySelector('.game-content:not(.hidden)');
    if (currentGame) {
        const gameType = currentGame.id;
        if (gameType === 'memoryGame') initMemoryGame();
        else if (gameType === 'puzzleGame') initPuzzle();
        else if (gameType === 'whackGame') initWhackGame();
        else if (gameType === 'tttGame') initTTT();
        else if (gameType === 'simonGame') initSimon();
    }
}

// ===================== CONFETTI =====================
function createConfetti(isWin = true) {
    const container = document.getElementById('gameResultModal');
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#F7DC6F', '#FF9FF3'];
    const count = isWin ? 60 : 15;
    
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
            position: fixed;
            width: ${6 + Math.random() * 8}px;
            height: ${6 + Math.random() * 8}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -20px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
            transform: rotate(${Math.random() * 360}deg);
        `;
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// ===================== SCORE SYSTEM (localStorage) =====================
const SCORE_KEY = 'photostore_game_scores';

function getDefaultScores() {
    return {
        memory: { bestMoves: null, bestTime: null },
        puzzle: { '3': { bestMoves: null, bestTime: null }, '4': { bestMoves: null, bestTime: null }, '5': { bestMoves: null, bestTime: null } },
        whack: { highScore: 0, wins: 0, losses: 0 },
        ttt: { wins: 0, losses: 0, draws: 0 },
        simon: { bestRound: 0, wins: 0 }
    };
}

function loadScores() {
    try {
        const data = localStorage.getItem(SCORE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Merge with defaults to handle missing keys
            const defaults = getDefaultScores();
            for (const key in defaults) {
                if (!(key in parsed)) parsed[key] = defaults[key];
                else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
                    for (const sub in defaults[key]) {
                        if (!(sub in parsed[key])) parsed[key][sub] = defaults[key][sub];
                    }
                }
            }
            return parsed;
        }
    } catch (e) {
        console.warn('Failed to load scores:', e);
    }
    return getDefaultScores();
}

function saveScores(scores) {
    try {
        localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    } catch (e) {
        console.warn('Failed to save scores:', e);
    }
}

function displayScores() {
    const scores = loadScores();
    
    // Memory
    const memEl = document.getElementById('score-memory');
    if (scores.memory.bestMoves !== null) {
        memEl.textContent = `${scores.memory.bestMoves} moves`;
        memEl.style.color = '#4ECDC4';
    } else {
        memEl.textContent = '--';
        memEl.style.color = '';
    }
    
    // Puzzle (use 3x3 as default)
    const puzEl = document.getElementById('score-puzzle');
    if (scores.puzzle['3'].bestMoves !== null) {
        puzEl.textContent = `${scores.puzzle['3'].bestMoves} moves`;
        puzEl.style.color = '#45B7D1';
    } else {
        puzEl.textContent = '--';
        puzEl.style.color = '';
    }
    
    // Whack
    const whackEl = document.getElementById('score-whack');
    if (scores.whack.highScore > 0) {
        whackEl.textContent = `${scores.whack.highScore} pts (${scores.whack.wins}W)`;
        whackEl.style.color = '#f5576c';
    } else {
        whackEl.textContent = '--';
        whackEl.style.color = '';
    }
    
    // Tic-Tac-Toe
    const tttEl = document.getElementById('score-ttt');
    if (scores.ttt.wins > 0 || scores.ttt.losses > 0) {
        tttEl.textContent = `${scores.ttt.wins}W / ${scores.ttt.losses}L`;
        tttEl.style.color = scores.ttt.wins >= scores.ttt.losses ? '#4ECDC4' : '#FF6B6B';
    } else {
        tttEl.textContent = '--';
        tttEl.style.color = '';
    }
    
    // Simon
    const simonEl = document.getElementById('score-simon');
    if (scores.simon.bestRound > 0) {
        simonEl.textContent = `Round ${scores.simon.bestRound} (${scores.simon.wins}W)`;
        simonEl.style.color = '#FFEB3B';
    } else {
        simonEl.textContent = '--';
        simonEl.style.color = '';
    }
}

function resetAllScores() {
    if (confirm('🗑️ Sare scores delete kar dein? Yeh wapas nahi aayenge!')) {
        saveScores(getDefaultScores());
        displayScores();
        if (typeof showToast === 'function') showToast('Scores reset!');
    }
}

// ===================== GAME LOBBY =====================
function showLobby() {
    gameContainer.classList.add('hidden');
    gameLobby.classList.remove('hidden');
    backToLobbyBtn.classList.add('hidden');
    stopAllGames();
    displayScores(); // Show updated scores
}

function stopAllGames() {
    if (memoryInterval) clearInterval(memoryInterval);
    if (puzzleInterval) clearInterval(puzzleInterval);
    if (whackInterval) clearInterval(whackInterval);
    if (whackSpawnInterval) clearInterval(whackSpawnInterval);
    whackActive = false;
    simonActive = false;
    tttGameOver = true;
}

function trackGamePlayed(gameType) {
    if (typeof trackEvent === 'function') {
        trackEvent('game_played', { game: gameType });
    }
}

function startGame(gameType) {
    trackGamePlayed(gameType);
    gameLobby.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    backToLobbyBtn.classList.remove('hidden');
    
    document.querySelectorAll('.game-content').forEach(el => el.classList.add('hidden'));
    
    const gameEl = document.getElementById(gameType + 'Game');
    if (gameEl) {
        gameEl.classList.remove('hidden');
        if (gameType === 'memory') initMemoryGame();
        else if (gameType === 'puzzle') initPuzzle();
        else if (gameType === 'whack') initWhackGame();
        else if (gameType === 'ttt') initTTT();
        else if (gameType === 'simon') initSimon();
    }
}

// ===================== MODAL OPEN/CLOSE =====================
function openGames() {
    gamesOverlay.style.display = 'block';
    gamesModal.style.display = 'block';
    gamesModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    showLobby();
}

function closeGames() {
    gamesOverlay.style.display = 'none';
    gamesModal.style.display = 'none';
    gamesModal.classList.remove('open');
    document.body.style.overflow = '';
    stopAllGames();
}

// ===================== EVENT LISTENERS =====================
document.addEventListener('DOMContentLoaded', () => {
    gamesNavBtn?.addEventListener('click', openGames);
    gamesClose?.addEventListener('click', closeGames);
    gamesOverlay?.addEventListener('click', closeGames);
    backToLobbyBtn?.addEventListener('click', showLobby);
    document.getElementById('closeResultBtn')?.addEventListener('click', closeGameResult);
    document.getElementById('playAgainBtn')?.addEventListener('click', playAgain);
});

// Note: heroGamesBtn click is handled in init.js

function initGames() {
    console.log('🎮 Games loaded!');
}
