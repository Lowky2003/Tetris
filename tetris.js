// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
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

        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.isStarted = false;

        this.currentPiece = null;
        this.nextPiece = null;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.isAnimating = false; // Lock during line clear animation

        this.init();
    }

    createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    init() {
        this.updateScore();
        this.draw();

        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Mobile control buttons
        document.getElementById('leftBtn').addEventListener('click', () => this.movePiece(-1, 0));
        document.getElementById('rightBtn').addEventListener('click', () => this.movePiece(1, 0));
        document.getElementById('downBtn').addEventListener('click', () => this.movePiece(0, 1));
        document.getElementById('rotateLeftBtn').addEventListener('click', () => this.rotatePieceCounterClockwise());
        document.getElementById('rotateRightBtn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('dropBtn').addEventListener('click', () => this.hardDrop());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

        // Show login gate initially
        document.getElementById('loginGate').classList.remove('hidden');
    }

    startGame() {
        if (this.isStarted) return;

        this.isStarted = true;
        this.gameOver = false; // Make sure game is not over
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.drawNext();
        this.lastTime = performance.now();

        // Hide all gate overlays
        document.getElementById('loginGate').classList.add('hidden');
        document.getElementById('startGameGate').classList.add('hidden');

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

    handleKeyPress(e) {
        if (!this.isStarted || this.gameOver || this.isAnimating) return;

        // Allow pause toggle even when paused
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        // Block all other controls when paused
        if (this.paused) return;

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
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
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
        }
    }

    movePiece(dx, dy) {
        if (!this.isStarted || this.isAnimating || this.paused) return;

        this.currentPiece.x += dx;
        this.currentPiece.y += dy;

        if (this.collision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;

            if (dy > 0) {
                this.merge();
                this.clearLines();
                this.currentPiece = this.nextPiece;
                this.nextPiece = this.createPiece();
                this.drawNext();

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
                // Scoring: 100 for 1 line, 300 for 2, 500 for 3, 800 for 4
                const points = [0, 100, 300, 500, 800][linesToClear.length];
                this.score += points * this.level;

                // Level up every 10 lines
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

                this.updateScore();

                // Unlock input after animation
                this.isAnimating = false;
            }, 400); // Wait for animation to complete
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

    endGame() {
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');

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
        this.nextPiece = this.createPiece();

        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('loginGate').classList.add('hidden');
        this.updateScore();
        this.drawNext();
        this.lastTime = performance.now();

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

    drawNext() {
        const size = 30;
        // Clear the canvas completely
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        // Fill with background color
        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            const offsetX = (this.nextCanvas.width - shape[0].length * size) / 2;
            const offsetY = (this.nextCanvas.height - shape.length * size) / 2;

            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.nextCtx.fillStyle = COLORS[this.nextPiece.type];
                        this.nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size, size);

                        this.nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);

                        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size / 2, size / 2);
                    }
                }
            }
        }
    }
}

// Create the game instance (but don't start until user logs in)
const game = new Game();

// Make game available globally so auth manager can start it
window.game = game;
