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

        this.currentPiece = null;
        this.nextPiece = null;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.init();
    }

    createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    init() {
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.updateScore();
        this.draw();
        this.drawNext();

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
        if (this.gameOver) return;

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
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
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
        let linesCleared = 0;

        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++; // Check this line again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            // Scoring: 100 for 1 line, 300 for 2, 500 for 3, 800 for 4
            const points = [0, 100, 300, 500, 800][linesCleared];
            this.score += points * this.level;

            // Level up every 10 lines
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

            this.updateScore();
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
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.dropCounter = 0;

        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();

        document.getElementById('gameOver').classList.add('hidden');
        this.updateScore();
        this.drawNext();
        this.lastTime = performance.now();
    }

    update(time = 0) {
        if (!this.gameOver) {
            if (!this.paused) {
                const deltaTime = time - this.lastTime;
                this.lastTime = time;

                this.dropCounter += deltaTime;
                if (this.dropCounter > this.dropInterval) {
                    this.movePiece(0, 1);
                    this.dropCounter = 0;
                }
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

// Start the game
const game = new Game();
