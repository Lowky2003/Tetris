// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 40; // Increased for better visibility
const COLORS = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'S': '#00f000',
    'Z': '#f00000',
    'J': '#0000f0',
    'L': '#f0a000',
    'EMPTY': '#000000',
    'GRID': '#333333'
};

// Tetromino shapes
const SHAPES = {
    'I': [
        [[0, 0, 0, 0],
         [1, 1, 1, 1],
         [0, 0, 0, 0],
         [0, 0, 0, 0]],
        [[0, 0, 1, 0],
         [0, 0, 1, 0],
         [0, 0, 1, 0],
         [0, 0, 1, 0]],
        [[0, 0, 0, 0],
         [0, 0, 0, 0],
         [1, 1, 1, 1],
         [0, 0, 0, 0]],
        [[0, 1, 0, 0],
         [0, 1, 0, 0],
         [0, 1, 0, 0],
         [0, 1, 0, 0]]
    ],
    'O': [
        [[1, 1],
         [1, 1]]
    ],
    'T': [
        [[0, 1, 0],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 1],
         [0, 1, 0]],
        [[0, 0, 0],
         [1, 1, 1],
         [0, 1, 0]],
        [[0, 1, 0],
         [1, 1, 0],
         [0, 1, 0]]
    ],
    'S': [
        [[0, 1, 1],
         [1, 1, 0],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 1],
         [0, 0, 1]]
    ],
    'Z': [
        [[1, 1, 0],
         [0, 1, 1],
         [0, 0, 0]],
        [[0, 0, 1],
         [0, 1, 1],
         [0, 1, 0]]
    ],
    'J': [
        [[1, 0, 0],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 1],
         [0, 1, 0],
         [0, 1, 0]],
        [[0, 0, 0],
         [1, 1, 1],
         [0, 0, 1]],
        [[0, 1, 0],
         [0, 1, 0],
         [1, 1, 0]]
    ],
    'L': [
        [[0, 0, 1],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 0],
         [0, 1, 1]],
        [[0, 0, 0],
         [1, 1, 1],
         [1, 0, 0]],
        [[1, 1, 0],
         [0, 1, 0],
         [0, 1, 0]]
    ]
};

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');

        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.isStarted = false;

        this.currentPiece = null;
        this.nextPieces = []; // Array of next 3 pieces
        this.heldPiece = null; // Piece being held
        this.canHold = true; // Can only hold once per piece drop
        this.holdUsesLeft = 3; // Number of holds remaining

        // Undo system
        this.lastBoardState = null; // Board state before last piece placement
        this.lastPlacedPiece = null; // The piece that was just placed
        this.lastCurrentPiece = null; // The current piece before placement
        this.lastNextPieces = null; // Next pieces queue before placement
        this.lastScore = 0;
        this.lastLines = 0;
        this.lastLevel = 1;
        this.undoUsesLeft = 3; // Number of undos remaining

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.isAnimating = false; // Lock during line clear animation

        // Auto-repeat for held keys
        this.keysPressed = {};
        this.keyRepeatTimers = {};
        this.keyRepeatInterval = 50; // Milliseconds between repeats when holding
        this.keyRepeatDelay = 150; // Initial delay before repeating starts

        // Combo system
        this.combo = 0; // Current combo count
        this.maxCombo = 0; // Highest combo in this game

        // Audio context for sound effects
        this.audioContext = null;
        this.initAudio();

        // Background music
        this.musicEnabled = true; // Default: music is ON
        this.musicOscillators = [];
        this.musicGainNode = null;

        this.init();
    }

    initAudio() {
        try {
            // Create audio context (lazy initialization on first user interaction)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    startBackgroundMusic() {
        if (!this.audioContext || !this.musicEnabled) return;

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Stop any existing music
        this.stopBackgroundMusic();

        // Create gain node for music volume control
        this.musicGainNode = this.audioContext.createGain();
        this.musicGainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Low volume for background
        this.musicGainNode.connect(this.audioContext.destination);

        // Tetris theme melody (simplified version)
        // Notes: E, B, C, D, C, B, A, A, C, E, D, C, B, C, D, E, C, A, A
        const melody = [
            { freq: 659.25, duration: 0.4 }, // E5
            { freq: 493.88, duration: 0.2 }, // B4
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 587.33, duration: 0.4 }, // D5
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 493.88, duration: 0.2 }, // B4
            { freq: 440.00, duration: 0.4 }, // A4
            { freq: 440.00, duration: 0.2 }, // A4
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 659.25, duration: 0.4 }, // E5
            { freq: 587.33, duration: 0.2 }, // D5
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 493.88, duration: 0.6 }, // B4
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 587.33, duration: 0.4 }, // D5
            { freq: 659.25, duration: 0.4 }, // E5
            { freq: 523.25, duration: 0.4 }, // C5
            { freq: 440.00, duration: 0.4 }, // A4
            { freq: 440.00, duration: 0.4 }, // A4
        ];

        let time = this.audioContext.currentTime;
        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);

        // Function to play the melody loop
        const playMelody = (startTime) => {
            let currentTime = startTime;

            melody.forEach(note => {
                const osc = this.audioContext.createOscillator();
                const noteGain = this.audioContext.createGain();

                osc.connect(noteGain);
                noteGain.connect(this.musicGainNode);

                osc.type = 'square';
                osc.frequency.setValueAtTime(note.freq, currentTime);

                // Envelope for smoother notes
                noteGain.gain.setValueAtTime(0, currentTime);
                noteGain.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
                noteGain.gain.linearRampToValueAtTime(0.2, currentTime + note.duration * 0.7);
                noteGain.gain.linearRampToValueAtTime(0, currentTime + note.duration);

                osc.start(currentTime);
                osc.stop(currentTime + note.duration);

                this.musicOscillators.push(osc);

                currentTime += note.duration;
            });

            return currentTime;
        };

        // Play the melody and schedule it to loop
        const scheduleLoop = (startTime) => {
            const nextLoopTime = playMelody(startTime);

            // Schedule next loop
            if (this.musicEnabled) {
                setTimeout(() => {
                    if (this.musicEnabled && !this.gameOver) {
                        scheduleLoop(this.audioContext.currentTime);
                    }
                }, (nextLoopTime - this.audioContext.currentTime) * 1000);
            }
        };

        scheduleLoop(time);
    }

    stopBackgroundMusic() {
        // Stop all music oscillators
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        this.musicOscillators = [];

        // Disconnect gain node
        if (this.musicGainNode) {
            this.musicGainNode.disconnect();
            this.musicGainNode = null;
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const musicBtn = document.getElementById('musicToggleBtn');

        if (this.musicEnabled) {
            musicBtn.classList.remove('muted');
            if (this.isStarted && !this.gameOver) {
                this.startBackgroundMusic();
            }
        } else {
            musicBtn.classList.add('muted');
            this.stopBackgroundMusic();
        }
    }

    playLineClearSound(linesCleared) {
        if (!this.audioContext) return;

        // Resume audio context if it's suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Create different sounds based on number of lines cleared
        if (linesCleared === 1) {
            this.playSingleLineClear(now);
        } else if (linesCleared === 2) {
            this.playDoubleLineClear(now);
        } else if (linesCleared === 3) {
            this.playTripleLineClear(now);
        } else if (linesCleared === 4) {
            this.playTetrisSound(now);
        }
    }

    playSingleLineClear(now) {
        // Glass breaking / block smashing sound - single impact
        this.createBreakingSound(now, 1);
    }

    playDoubleLineClear(now) {
        // Two breaking sounds
        this.createBreakingSound(now, 2);
    }

    playTripleLineClear(now) {
        // Three breaking sounds
        this.createBreakingSound(now, 3);
    }

    playTetrisSound(now) {
        // Big explosion/smashing sound for 4 lines!
        this.createBreakingSound(now, 4);
    }

    createBreakingSound(now, intensity) {
        // Heavy impact/thud sound - the initial hit
        const impact = this.audioContext.createOscillator();
        const impactGain = this.audioContext.createGain();

        impact.connect(impactGain);
        impactGain.connect(this.audioContext.destination);

        impact.type = 'sine';
        impact.frequency.setValueAtTime(150, now);
        impact.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        impactGain.gain.setValueAtTime(0.5 * intensity * 0.25, now);
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        impact.start(now);
        impact.stop(now + 0.15);

        // Deep bass rumble - the crushing force
        const crush = this.audioContext.createOscillator();
        const crushGain = this.audioContext.createGain();

        crush.connect(crushGain);
        crushGain.connect(this.audioContext.destination);

        crush.type = 'triangle';
        crush.frequency.setValueAtTime(60 + intensity * 10, now);
        crush.frequency.linearRampToValueAtTime(40, now + 0.25);

        crushGain.gain.setValueAtTime(0.4 * intensity * 0.25, now);
        crushGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        crush.start(now);
        crush.stop(now + 0.3);

        // Create crumbling noise
        const bufferSize = this.audioContext.sampleRate * 0.4;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Generate heavy crumbling/crushing noise
        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.pow(1 - (i / bufferSize), 1.5);
            // Mix of noise for heavy, chunky sound
            const noise1 = Math.random() * 2 - 1;
            const noise2 = (Math.random() * 2 - 1) * 0.5;
            output[i] = (noise1 + noise2) * decay;
        }

        const crumble = this.audioContext.createBufferSource();
        crumble.buffer = buffer;

        const crumbleGain = this.audioContext.createGain();
        const crumbleFilter = this.audioContext.createBiquadFilter();

        crumble.connect(crumbleFilter);
        crumbleFilter.connect(crumbleGain);
        crumbleGain.connect(this.audioContext.destination);

        // Lower frequency for heavy blocks
        crumbleFilter.type = 'lowpass';
        crumbleFilter.frequency.setValueAtTime(600, now);
        crumbleFilter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        crumbleFilter.Q.setValueAtTime(2, now);

        const crumbleVolume = 0.3 * intensity * 0.25;
        crumbleGain.gain.setValueAtTime(crumbleVolume, now);
        crumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        crumble.start(now + 0.02); // Slight delay after impact

        // Multiple heavy chunks falling - brick debris
        for (let i = 0; i < intensity; i++) {
            const chunk = this.audioContext.createOscillator();
            const chunkGain = this.audioContext.createGain();

            chunk.connect(chunkGain);
            chunkGain.connect(this.audioContext.destination);

            chunk.type = 'square';
            const startFreq = 200 - i * 30;
            chunk.frequency.setValueAtTime(startFreq, now + i * 0.06);
            chunk.frequency.exponentialRampToValueAtTime(startFreq * 0.3, now + i * 0.06 + 0.12);

            chunkGain.gain.setValueAtTime(0.15, now + i * 0.06);
            chunkGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.12);

            chunk.start(now + 0.05 + i * 0.06);
            chunk.stop(now + 0.05 + i * 0.06 + 0.12);
        }
    }

    createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    init() {
        this.updateScore();
        this.draw();

        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Prevent arrow keys and space from scrolling the page
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        }, { passive: false });

        // Mobile control buttons with hold support
        this.setupButtonHold('leftBtn', () => this.movePiece(-1, 0));
        this.setupButtonHold('rightBtn', () => this.movePiece(1, 0));
        this.setupButtonHold('downBtn', () => this.movePiece(0, 1));
        document.getElementById('rotateLeftBtn').addEventListener('click', () => this.rotatePieceCounterClockwise());
        document.getElementById('rotateRightBtn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('dropBtn').addEventListener('click', () => this.hardDrop());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

        // Restart confirmation modal buttons
        document.getElementById('confirmRestartBtn').addEventListener('click', () => this.confirmRestart());
        document.getElementById('cancelRestartBtn').addEventListener('click', () => this.cancelRestart());

        // Music toggle button
        document.getElementById('musicToggleBtn').addEventListener('click', () => this.toggleMusic());

        // Hold and Retrieve buttons
        document.getElementById('holdBtn').addEventListener('click', () => this.holdPiece());
        document.getElementById('retrieveBtn').addEventListener('click', () => this.retrieveHeldPiece());

        // Undo button
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoLastDrop());
        }

        // Show login gate initially
        document.getElementById('loginGate').classList.remove('hidden');
    }

    startGame() {
        if (this.isStarted) return;

        this.isStarted = true;
        this.gameOver = false; // Make sure game is not over
        this.currentPiece = this.createPiece();
        // Initialize the queue with 3 pieces
        this.nextPieces = [
            this.createPiece(),
            this.createPiece(),
            this.createPiece()
        ];
        this.drawNext();
        this.lastTime = performance.now();

        // Hide all gate overlays
        document.getElementById('loginGate').classList.add('hidden');
        document.getElementById('startGameGate').classList.add('hidden');

        // Start background music (default on)
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        }

        requestAnimationFrame((time) => this.update(time));
    }

    createPiece() {
        const pieces = Object.keys(SHAPES);
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            type: type,
            shape: SHAPES[type][0],
            rotation: 0,
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0][0].length / 2),
            y: 0
        };
    }

    handleKeyDown(e) {
        // Prevent key repeat from browser (we'll handle it ourselves)
        if (e.repeat) return;

        // Allow restart at any time during gameplay - show confirmation
        if (e.key === 'r' || e.key === 'R') {
            if (this.isStarted && !this.gameOver) {
                e.preventDefault();
                this.showRestartConfirmation();
                return;
            }
        }

        if (!this.isStarted || this.gameOver || this.isAnimating) return;

        // Allow pause toggle even when paused
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        // Block all other controls when paused
        if (this.paused) return;

        // Mark key as pressed
        this.keysPressed[e.key] = true;

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                this.startKeyRepeat(e.key, () => this.movePiece(-1, 0));
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                this.startKeyRepeat(e.key, () => this.movePiece(1, 0));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                this.startKeyRepeat(e.key, () => this.movePiece(0, 1));
                break;
            case 'ArrowUp':
            case 'x':
            case 'X':
                e.preventDefault();
                this.rotatePiece();
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                this.rotatePieceCounterClockwise();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                this.holdPiece();
                break;
            case 'v':
            case 'V':
                e.preventDefault();
                this.retrieveHeldPiece();
                break;
            case 'u':
            case 'U':
                e.preventDefault();
                this.undoLastDrop();
                break;
        }
    }

    handleKeyUp(e) {
        // Mark key as released
        this.keysPressed[e.key] = false;

        // Stop any repeat timer for this key
        if (this.keyRepeatTimers[e.key]) {
            clearInterval(this.keyRepeatTimers[e.key]);
            delete this.keyRepeatTimers[e.key];
        }
    }

    startKeyRepeat(key, action) {
        // Clear any existing timer for this key
        if (this.keyRepeatTimers[key]) {
            clearInterval(this.keyRepeatTimers[key]);
        }

        // Start repeating after initial delay
        setTimeout(() => {
            if (this.keysPressed[key]) {
                this.keyRepeatTimers[key] = setInterval(() => {
                    if (this.keysPressed[key] && !this.paused && !this.isAnimating) {
                        action();
                    }
                }, this.keyRepeatInterval);
            }
        }, this.keyRepeatDelay);
    }

    setupButtonHold(buttonId, action) {
        const button = document.getElementById(buttonId);
        let holdInterval;
        let holdTimeout;

        const startHold = () => {
            action(); // Execute immediately

            // Start repeating after delay
            holdTimeout = setTimeout(() => {
                holdInterval = setInterval(() => {
                    if (!this.paused && !this.isAnimating) {
                        action();
                    }
                }, this.keyRepeatInterval);
            }, this.keyRepeatDelay);
        };

        const stopHold = () => {
            if (holdTimeout) {
                clearTimeout(holdTimeout);
                holdTimeout = null;
            }
            if (holdInterval) {
                clearInterval(holdInterval);
                holdInterval = null;
            }
        };

        button.addEventListener('mousedown', startHold);
        button.addEventListener('mouseup', stopHold);
        button.addEventListener('mouseleave', stopHold);
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startHold();
        });
        button.addEventListener('touchend', stopHold);
        button.addEventListener('touchcancel', stopHold);
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
            // Resume music when unpausing
            if (this.musicEnabled && this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } else {
            // Pause music when pausing
            if (this.audioContext && this.audioContext.state === 'running') {
                this.audioContext.suspend();
            }
        }
    }

    showRestartConfirmation() {
        // Pause the game while showing confirmation
        if (!this.paused) {
            this.paused = true;
        }

        // Show confirmation modal
        document.getElementById('restartConfirmModal').classList.remove('hidden');
    }

    confirmRestart() {
        // Hide modal
        document.getElementById('restartConfirmModal').classList.add('hidden');

        // Restart the game
        this.restart();
    }

    cancelRestart() {
        // Hide modal
        document.getElementById('restartConfirmModal').classList.add('hidden');

        // Resume the game
        this.paused = false;
        this.lastTime = performance.now();
    }

    movePiece(dx, dy) {
        if (!this.isStarted || this.isAnimating || this.paused) return;

        this.currentPiece.x += dx;
        this.currentPiece.y += dy;

        if (this.collision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;

            if (dy > 0) {
                // Save state BEFORE merging (for undo)
                this.lastBoardState = this.board.map(row => [...row]);
                this.lastScore = this.score;
                this.lastLines = this.lines;
                this.lastLevel = this.level;
                this.lastPlacedPiece = {
                    type: this.currentPiece.type,
                    shape: this.currentPiece.shape,
                    rotation: this.currentPiece.rotation,
                    x: this.currentPiece.x,
                    y: this.currentPiece.y
                };
                // Save the current piece that's about to be replaced
                this.lastCurrentPiece = {
                    type: this.nextPieces[0].type,
                    shape: this.nextPieces[0].shape,
                    rotation: this.nextPieces[0].rotation
                };
                // Save the next pieces queue (deep copy)
                this.lastNextPieces = this.nextPieces.map(p => ({
                    type: p.type,
                    shape: p.shape,
                    rotation: p.rotation
                }));

                this.merge();
                this.clearLines();
                // Get the next piece from the queue and shift the queue
                this.currentPiece = this.nextPieces.shift();
                // Add a new piece to the end of the queue
                this.nextPieces.push(this.createPiece());
                this.drawNext();

                // Allow holding again for the new piece
                this.canHold = true;

                if (this.collision()) {
                    this.endGame();
                }
            }
        }
    }

    rotatePiece() {
        if (!this.isStarted || this.isAnimating || this.paused) return;

        const shapes = SHAPES[this.currentPiece.type];
        const nextRotation = (this.currentPiece.rotation + 1) % shapes.length;
        const previousShape = this.currentPiece.shape;

        this.currentPiece.shape = shapes[nextRotation];
        this.currentPiece.rotation = nextRotation;

        // Wall kick: try adjusting position if rotation causes collision
        if (this.collision()) {
            // Try moving left
            this.currentPiece.x--;
            if (this.collision()) {
                // Try moving right instead
                this.currentPiece.x += 2;
                if (this.collision()) {
                    // Revert rotation if no valid position found
                    this.currentPiece.x--;
                    this.currentPiece.shape = previousShape;
                    this.currentPiece.rotation = (nextRotation - 1 + shapes.length) % shapes.length;
                }
            }
        }
    }

    rotatePieceCounterClockwise() {
        if (!this.isStarted || this.isAnimating || this.paused) return;

        const shapes = SHAPES[this.currentPiece.type];
        const nextRotation = (this.currentPiece.rotation - 1 + shapes.length) % shapes.length;
        const previousShape = this.currentPiece.shape;

        this.currentPiece.shape = shapes[nextRotation];
        this.currentPiece.rotation = nextRotation;

        // Wall kick: try adjusting position if rotation causes collision
        if (this.collision()) {
            // Try moving left
            this.currentPiece.x--;
            if (this.collision()) {
                // Try moving right instead
                this.currentPiece.x += 2;
                if (this.collision()) {
                    // Revert rotation if no valid position found
                    this.currentPiece.x--;
                    this.currentPiece.shape = previousShape;
                    this.currentPiece.rotation = (nextRotation + 1) % shapes.length;
                }
            }
        }
    }

    hardDrop() {
        if (!this.isStarted || this.isAnimating || this.paused) return;

        while (!this.collision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.movePiece(0, 1);
    }

    holdPiece() {
        // C key - Save current block
        if (!this.isStarted || this.isAnimating || this.paused || this.holdUsesLeft <= 0) return;

        // Can only save if no piece is currently held
        if (this.heldPiece !== null) {
            if (window.showToast) {
                showToast('Already have a saved block! Press V to retrieve it.', 'warning');
            }
            return;
        }

        // Save current piece and get next piece
        this.heldPiece = {
            type: this.currentPiece.type,
            shape: SHAPES[this.currentPiece.type][0],
            rotation: 0
        };
        this.currentPiece = this.nextPieces.shift();
        this.nextPieces.push(this.createPiece());

        // Reset current piece position
        this.currentPiece.x = Math.floor(COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;

        // Update displays
        this.drawNext();
        this.drawHold();
        this.updateHoldCounter();

        if (window.showToast) {
            showToast('Block saved! Press V to retrieve it.', 'success');
        }
    }

    retrieveHeldPiece() {
        // V key - Retrieve saved block
        if (!this.isStarted || this.isAnimating || this.paused || !this.canHold || this.holdUsesLeft <= 0) return;

        // Can only retrieve if there's a held piece
        if (this.heldPiece === null) {
            if (window.showToast) {
                showToast('No saved block! Press C to save current block.', 'warning');
            }
            return;
        }

        // Replace current piece with held piece
        this.currentPiece = {
            type: this.heldPiece.type,
            shape: SHAPES[this.heldPiece.type][0],
            rotation: 0,
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[this.heldPiece.type][0][0].length / 2),
            y: 0
        };

        // Clear held piece
        this.heldPiece = null;

        // Decrease hold uses and prevent holding again until piece is placed
        this.holdUsesLeft--;
        this.canHold = false;

        // Update displays
        this.drawHold();
        this.updateHoldCounter();

        if (window.showToast) {
            showToast(`Block retrieved! ${this.holdUsesLeft} uses remaining.`, 'success');
        }
    }

    undoLastDrop() {
        // U key - Undo the last block placement
        if (!this.isStarted || this.isAnimating || this.paused || this.gameOver) return;

        // Check if undo is available
        if (this.undoUsesLeft <= 0) {
            if (window.showToast) {
                showToast('No undo uses remaining!', 'warning');
            }
            return;
        }

        // Check if there's a state to restore
        if (this.lastBoardState === null) {
            if (window.showToast) {
                showToast('Nothing to undo!', 'warning');
            }
            return;
        }

        // Restore the board state (before the piece was placed)
        this.board = this.lastBoardState.map(row => [...row]);
        this.score = this.lastScore;
        this.lines = this.lastLines;
        this.level = this.lastLevel;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

        // Restore the piece that was dropped (so player can place it again)
        this.currentPiece = {
            type: this.lastPlacedPiece.type,
            shape: this.lastPlacedPiece.shape,
            rotation: this.lastPlacedPiece.rotation,
            x: Math.floor(COLS / 2) - Math.floor(this.lastPlacedPiece.shape[0].length / 2),
            y: 0
        };

        // Restore the next pieces queue
        this.nextPieces = this.lastNextPieces.map(p => ({
            type: p.type,
            shape: p.shape,
            rotation: p.rotation,
            x: 0,
            y: 0
        }));

        // Decrement undo uses
        this.undoUsesLeft--;

        // Clear the undo state so user must drop the block again before next undo
        this.lastBoardState = null;
        this.lastPlacedPiece = null;
        this.lastCurrentPiece = null;
        this.lastNextPieces = null;

        // Update displays
        this.updateScore();
        this.updateUndoCounter();
        this.drawNext();

        if (window.showToast) {
            showToast(`Undo successful! ${this.undoUsesLeft} undo${this.undoUsesLeft !== 1 ? 's' : ''} remaining.`, 'success');
        }
    }

    collision() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesToClear = [];

        // Find all complete lines
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }

        if (linesToClear.length > 0) {
            // Lock input during animation
            this.isAnimating = true;

            // Increment combo by number of lines cleared (1 line = 1 combo)
            this.combo += linesToClear.length;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }

            // Play sound effect based on number of lines cleared
            this.playLineClearSound(linesToClear.length);

            // Trigger screen shake based on lines cleared
            this.triggerScreenShake(linesToClear.length);

            // Animate the line clear effect
            this.animateLineClear(linesToClear);

            // Remove lines after animation
            setTimeout(() => {
                linesToClear.forEach(() => {
                    // Find and remove completed lines from top to bottom
                    for (let y = ROWS - 1; y >= 0; y--) {
                        if (this.board[y].every(cell => cell !== 0)) {
                            this.board.splice(y, 1);
                            this.board.unshift(Array(COLS).fill(0));
                        }
                    }
                });

                this.lines += linesToClear.length;

                // Scoring with combo multiplier: 100 for 1 line, 300 for 2, 500 for 3, 800 for 4
                const basePoints = [0, 100, 300, 500, 800][linesToClear.length];
                const comboMultiplier = 1 + (this.combo - linesToClear.length) * 0.1; // Each previous combo line adds 0.1x
                const points = Math.floor(basePoints * this.level * comboMultiplier);
                this.score += points;

                // Show combo notification
                this.showComboNotification(linesToClear.length, comboMultiplier);

                // Level up every 10 lines
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

                this.updateScore();

                // Unlock input after animation
                this.isAnimating = false;
            }, 400); // Wait for animation to complete
        } else {
            // No lines cleared - reset combo immediately
            if (this.combo > 0) {
                this.combo = 0;
                this.updateComboDisplay();
            }
        }
    }

    showComboNotification(linesCleared, multiplier) {
        if (this.combo > linesCleared && window.showToast) {
            const comboText = `${this.combo} Line COMBO! ${multiplier.toFixed(1)}x Score`;
            const lineText = linesCleared === 4 ? 'TETRIS!' : `${linesCleared} Line${linesCleared > 1 ? 's' : ''}`;
            showToast(`${lineText} - ${comboText}`, 'success');
        }

        // Update combo display
        this.updateComboDisplay();
    }

    updateComboDisplay() {
        const comboElement = document.getElementById('combo');
        if (comboElement) {
            if (this.combo > 0) {
                comboElement.textContent = `${this.combo} COMBO`;
                comboElement.style.display = 'block';

                // Add pulse animation
                comboElement.classList.remove('combo-pulse');
                void comboElement.offsetWidth; // Trigger reflow
                comboElement.classList.add('combo-pulse');
            } else {
                comboElement.style.display = 'none';
            }
        }
    }

    triggerScreenShake(linesCleared) {
        const gameBoard = document.querySelector('.game-board');

        // Remove any existing shake classes
        gameBoard.classList.remove('shake-small', 'shake-medium', 'shake-large');

        // Determine shake intensity based on lines cleared
        let shakeClass;
        if (linesCleared === 1) {
            shakeClass = 'shake-small';
        } else if (linesCleared === 2) {
            shakeClass = 'shake-medium';
        } else if (linesCleared === 3) {
            shakeClass = 'shake-medium';
        } else if (linesCleared === 4) {
            shakeClass = 'shake-large'; // Big shake for Tetris!
        }

        // Add the shake class
        if (shakeClass) {
            gameBoard.classList.add(shakeClass);

            // Remove the class after animation completes
            const duration = shakeClass === 'shake-large' ? 600 : shakeClass === 'shake-medium' ? 400 : 300;
            setTimeout(() => {
                gameBoard.classList.remove(shakeClass);
            }, duration);
        }
    }

    animateLineClear(lines) {
        const canvas = this.canvas;
        const canvasRect = canvas.getBoundingClientRect();

        lines.forEach(lineY => {
            // Create line clear effect with multiple animations
            for (let x = 0; x < COLS; x++) {
                const blockX = x * BLOCK_SIZE;
                const blockY = lineY * BLOCK_SIZE;

                // Flash the entire line with a bright white overlay
                this.flashLine(lineY);

                // Create particles from each block
                this.createParticles(blockX, blockY, canvasRect, COLORS[this.board[lineY][x]]);
            }
        });
    }

    flashLine(lineY) {
        // Draw a bright white flash over the entire line
        const y = lineY * BLOCK_SIZE;
        let flashCount = 0;
        const maxFlashes = 3;

        const flash = () => {
            if (flashCount < maxFlashes) {
                // Flash white
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillRect(0, y, COLS * BLOCK_SIZE, BLOCK_SIZE);

                setTimeout(() => {
                    // Flash yellow
                    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                    this.ctx.fillRect(0, y, COLS * BLOCK_SIZE, BLOCK_SIZE);
                    flashCount++;
                    if (flashCount < maxFlashes) {
                        setTimeout(flash, 60);
                    }
                }, 60);
            }
        };
        flash();
    }

    createParticles(blockX, blockY, canvasRect, color) {
        const particleCount = 8; // More particles for better effect
        const gameBoard = this.canvas.parentElement;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'line-clear-particle';
            particle.style.position = 'absolute';
            particle.style.left = (blockX + BLOCK_SIZE / 2) + 'px';
            particle.style.top = (blockY + BLOCK_SIZE / 2) + 'px';
            particle.style.backgroundColor = color;

            // Random direction with more spread
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const velocity = 40 + Math.random() * 40;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            // Random size for variety
            const size = 4 + Math.random() * 6;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            // Add glow effect
            particle.style.boxShadow = `0 0 ${size}px ${color}`;

            gameBoard.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.parentElement.removeChild(particle);
                }
            }, 800);
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    updateHoldCounter() {
        const holdCounter = document.getElementById('holdCounter');
        if (holdCounter) {
            holdCounter.textContent = this.holdUsesLeft;
            // Update button states
            const holdBtn = document.getElementById('holdBtn');
            const retrieveBtn = document.getElementById('retrieveBtn');

            if (this.holdUsesLeft <= 0) {
                // No uses left - disable both buttons
                holdBtn.disabled = true;
                holdBtn.style.opacity = '0.5';
                retrieveBtn.disabled = true;
                retrieveBtn.style.opacity = '0.5';
            } else {
                // Enable save button if no piece is held
                if (this.heldPiece === null) {
                    holdBtn.disabled = false;
                    holdBtn.style.opacity = '1';
                } else {
                    holdBtn.disabled = true;
                    holdBtn.style.opacity = '0.5';
                }

                // Enable retrieve button if piece is held and can retrieve
                if (this.heldPiece !== null && this.canHold) {
                    retrieveBtn.disabled = false;
                    retrieveBtn.style.opacity = '1';
                } else {
                    retrieveBtn.disabled = true;
                    retrieveBtn.style.opacity = '0.5';
                }
            }
        }
    }

    updateUndoCounter() {
        const undoCounter = document.getElementById('undoCounter');
        if (undoCounter) {
            undoCounter.textContent = this.undoUsesLeft;
            // Update button state
            const undoBtn = document.getElementById('undoBtn');
            if (undoBtn) {
                if (this.undoUsesLeft <= 0 || this.lastBoardState === null) {
                    undoBtn.disabled = true;
                    undoBtn.style.opacity = '0.5';
                } else {
                    undoBtn.disabled = false;
                    undoBtn.style.opacity = '1';
                }
            }
        }
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');

        // Stop background music when game ends
        this.stopBackgroundMusic();

        // Save high score to Firebase if user is logged in
        if (window.authManager) {
            window.authManager.saveHighScore(this.score);
        }
    }

    restart() {
        // Check if user is logged in
        if (!window.authManager || !window.authManager.currentUser) {
            showToast('Please login to play!', 'warning');
            document.getElementById('loginGate').classList.remove('hidden');
            return;
        }

        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.isStarted = true;

        this.currentPiece = this.createPiece();
        this.nextPieces = [
            this.createPiece(),
            this.createPiece(),
            this.createPiece()
        ];
        this.heldPiece = null;
        this.canHold = true;
        this.holdUsesLeft = 3;

        // Reset undo system
        this.lastBoardState = null;
        this.lastPlacedPiece = null;
        this.lastCurrentPiece = null;
        this.lastNextPieces = null;
        this.undoUsesLeft = 3;

        // Reset combo system
        this.combo = 0;
        this.maxCombo = 0;

        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('loginGate').classList.add('hidden');
        this.updateScore();
        this.drawNext();
        this.drawHold();
        this.updateHoldCounter();
        this.updateUndoCounter();
        this.updateComboDisplay();
        this.lastTime = performance.now();

        // Restart background music if enabled
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        }

        // Restart the game loop
        requestAnimationFrame((time) => this.update(time));
    }

    update(time = 0) {
        if (!this.gameOver) {
            if (!this.paused && !this.isAnimating) {
                const deltaTime = time - this.lastTime;
                this.lastTime = time;

                this.dropCounter += deltaTime;
                if (this.dropCounter > this.dropInterval) {
                    this.movePiece(0, 1);
                    this.dropCounter = 0;
                }
            } else if (this.isAnimating) {
                // Update lastTime even during animation to prevent time jump
                this.lastTime = time;
            }

            this.draw();
            requestAnimationFrame((time) => this.update(time));
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = COLORS.EMPTY;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = COLORS.GRID;
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }

        // Draw board
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, COLORS[this.board[y][x]]);
                }
            }
        }

        // Draw ghost piece (shadow showing where piece will land)
        if (this.currentPiece) {
            const ghostY = this.getGhostPieceY();
            const shape = this.currentPiece.shape;
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawGhostBlock(
                            this.currentPiece.x + x,
                            ghostY + y,
                            COLORS[this.currentPiece.type]
                        );
                    }
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            const shape = this.currentPiece.shape;
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            COLORS[this.currentPiece.type]
                        );
                    }
                }
            }
        }

        // Draw pause text
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    getGhostPieceY() {
        // Calculate where the current piece will land
        if (!this.currentPiece) return 0;

        let ghostY = this.currentPiece.y;
        const originalY = this.currentPiece.y;

        // Move piece down until collision
        while (!this.collision()) {
            this.currentPiece.y++;
        }
        ghostY = this.currentPiece.y - 1;

        // Restore original position
        this.currentPiece.y = originalY;

        return ghostY;
    }

    drawGhostBlock(x, y, color) {
        // Draw semi-transparent outline of where piece will land
        // Extract RGB from hex color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // Draw with low opacity fill
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Draw border with dashed line effect
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        this.ctx.setLineDash([]); // Reset dash
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Add border for 3D effect
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    }

    drawHold() {
        const size = 25;
        // Clear the canvas completely
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        // Fill with background color
        this.holdCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);

        if (this.heldPiece) {
            const shape = this.heldPiece.shape;
            const offsetX = (this.holdCanvas.width - shape[0].length * size) / 2;
            const offsetY = (this.holdCanvas.height - shape.length * size) / 2;

            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.holdCtx.fillStyle = COLORS[this.heldPiece.type];
                        this.holdCtx.fillRect(offsetX + x * size, offsetY + y * size, size, size);

                        this.holdCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        this.holdCtx.lineWidth = 1;
                        this.holdCtx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);

                        this.holdCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.holdCtx.fillRect(offsetX + x * size, offsetY + y * size, size / 2, size / 2);
                    }
                }
            }
        }
    }

    drawNext() {
        const size = 20; // Smaller size to fit 3 pieces
        // Clear the canvas completely
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        // Fill with background color
        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPieces && this.nextPieces.length > 0) {
            const sectionHeight = this.nextCanvas.height / 3;

            // Draw each of the 3 next pieces
            for (let i = 0; i < 3 && i < this.nextPieces.length; i++) {
                const piece = this.nextPieces[i];
                const shape = piece.shape;
                const sectionY = i * sectionHeight;

                const offsetX = (this.nextCanvas.width - shape[0].length * size) / 2;
                const offsetY = sectionY + (sectionHeight - shape.length * size) / 2;

                // Draw piece with slight transparency for pieces further down the queue
                const opacity = 1 - (i * 0.2);

                for (let y = 0; y < shape.length; y++) {
                    for (let x = 0; x < shape[y].length; x++) {
                        if (shape[y][x]) {
                            // Draw main block with opacity
                            const color = COLORS[piece.type];
                            const r = parseInt(color.slice(1, 3), 16);
                            const g = parseInt(color.slice(3, 5), 16);
                            const b = parseInt(color.slice(5, 7), 16);
                            this.nextCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                            this.nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size, size);

                            this.nextCtx.strokeStyle = `rgba(0, 0, 0, ${0.3 * opacity})`;
                            this.nextCtx.lineWidth = 1;
                            this.nextCtx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);

                            this.nextCtx.fillStyle = `rgba(255, 255, 255, ${0.2 * opacity})`;
                            this.nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size / 2, size / 2);
                        }
                    }
                }

                // Draw separator line between pieces (except after last piece)
                if (i < 2) {
                    this.nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.beginPath();
                    this.nextCtx.moveTo(10, sectionY + sectionHeight);
                    this.nextCtx.lineTo(this.nextCanvas.width - 10, sectionY + sectionHeight);
                    this.nextCtx.stroke();
                }
            }
        }
    }
}

// Create the game instance (but don't start until user logs in)
const game = new Game();

// Make game available globally so auth manager can start it
window.game = game;
