/**
 * Neon Cyberpunk Tetris Game Engine
 */

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// Tetromino definitions with shapes and colors
const TETROMINOES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0ff',
        glow: 'rgba(0, 240, 255, 0.7)'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.7)'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a855f7',
        glow: 'rgba(168, 85, 247, 0.7)'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.7)'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.7)'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.7)'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f97316',
        glow: 'rgba(249, 115, 22, 0.7)'
    }
};

const PIECE_KEYS = Object.keys(TETROMINOES);

class TetrisGame {
    constructor() {
        this.boardCanvas = document.getElementById('tetrisBoard');
        this.boardCtx = this.boardCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');

        // Set dimensions
        this.boardCanvas.width = COLS * BLOCK_SIZE;
        this.boardCanvas.height = ROWS * BLOCK_SIZE;
        this.nextCanvas.width = 100;
        this.nextCanvas.height = 80;
        this.holdCanvas.width = 100;
        this.holdCanvas.height = 80;

        // UI Elements
        this.scoreElem = document.getElementById('scoreDisplay');
        this.highScoreElem = document.getElementById('highScoreDisplay');
        this.levelElem = document.getElementById('levelDisplay');
        this.linesElem = document.getElementById('linesDisplay');
        this.progressBar = document.getElementById('levelProgress');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalScoreElem = document.getElementById('finalScore');
        this.finalLinesElem = document.getElementById('finalLines');
        this.finalLevelElem = document.getElementById('finalLevel');
        this.soundBtn = document.getElementById('soundBtn');

        // Game State
        this.grid = this.createGrid();
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        // Bag randomizer
        this.bag = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;

        // Visual effects
        this.particles = [];
        this.clearingLines = [];
        this.clearAnimationTimer = 0;

        this.init();
    }

    init() {
        this.highScoreElem.textContent = this.highScore;
        this.reset();
        this.bindEvents();
        this.gameLoop();
    }

    createGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    getPieceFromBag() {
        if (this.bag.length === 0) {
            this.bag = [...PIECE_KEYS];
            // Fisher-Yates shuffle
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        const key = this.bag.pop();
        const data = TETROMINOES[key];
        return {
            key,
            shape: data.shape.map(row => [...row]),
            color: data.color,
            glow: data.glow,
            x: Math.floor(COLS / 2) - Math.ceil(data.shape[0].length / 2),
            y: 0
        };
    }

    reset() {
        this.grid = this.createGrid();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.isGameOver = false;
        this.isPaused = false;
        this.bag = [];
        this.holdPiece = null;
        this.canHold = true;
        this.particles = [];
        this.clearingLines = [];

        this.currentPiece = this.getPieceFromBag();
        this.nextPiece = this.getPieceFromBag();

        this.updateUI();
        this.pauseOverlay.classList.remove('active');
        this.gameOverOverlay.classList.remove('active');
    }

    // Check collisions for piece at (x, y)
    collide(piece, offsetX = 0, offsetY = 0) {
        const shape = piece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = piece.x + c + offsetX;
                    const newY = piece.y + r + offsetY;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    rotateMatrix(matrix) {
        const N = matrix.length;
        const result = Array.from({ length: N }, () => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                result[c][N - 1 - r] = matrix[r][c];
            }
        }
        return result;
    }

    rotate() {
        if (this.isGameOver || this.isPaused || this.clearingLines.length > 0) return;

        const rotatedShape = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotatedShape;

        // Basic wall kicks: try center, then 1 left, 1 right, 2 left, 2 right
        const kicks = [0, -1, 1, -2, 2];
        let kicked = false;

        for (const offset of kicks) {
            if (!this.collide(this.currentPiece, offset, 0)) {
                this.currentPiece.x += offset;
                kicked = true;
                break;
            }
        }

        if (!kicked) {
            // Revert rotation if failed
            this.currentPiece.shape = originalShape;
        } else {
            if (window.soundEffects) window.soundEffects.playRotate();
        }
    }

    move(dir) {
        if (this.isGameOver || this.isPaused || this.clearingLines.length > 0) return;
        if (!this.collide(this.currentPiece, dir, 0)) {
            this.currentPiece.x += dir;
            if (window.soundEffects) window.soundEffects.playMove();
        }
    }

    softDrop() {
        if (this.isGameOver || this.isPaused || this.clearingLines.length > 0) return;
        if (!this.collide(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            this.score += 1;
            this.updateUI();
            if (window.soundEffects) window.soundEffects.playSoftDrop();
        } else {
            this.lockPiece();
        }
        this.dropCounter = 0;
    }

    hardDrop() {
        if (this.isGameOver || this.isPaused || this.clearingLines.length > 0) return;
        let dropDistance = 0;
        while (!this.collide(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.updateUI();
        if (window.soundEffects) window.soundEffects.playHardDrop();
        this.createHardDropDust(this.currentPiece);
        this.lockPiece();
        this.dropCounter = 0;
    }

    hold() {
        if (this.isGameOver || this.isPaused || !this.canHold || this.clearingLines.length > 0) return;

        if (this.holdPiece === null) {
            this.holdPiece = {
                key: this.currentPiece.key,
                color: this.currentPiece.color,
                glow: this.currentPiece.glow,
                shape: TETROMINOES[this.currentPiece.key].shape.map(row => [...row])
            };
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.getPieceFromBag();
        } else {
            const temp = {
                key: this.currentPiece.key,
                color: this.currentPiece.color,
                glow: this.currentPiece.glow,
                shape: TETROMINOES[this.currentPiece.key].shape.map(row => [...row])
            };
            const holdData = TETROMINOES[this.holdPiece.key];
            this.currentPiece = {
                key: this.holdPiece.key,
                color: holdData.color,
                glow: holdData.glow,
                shape: holdData.shape.map(row => [...row]),
                x: Math.floor(COLS / 2) - Math.ceil(holdData.shape[0].length / 2),
                y: 0
            };
            this.holdPiece = temp;
        }

        this.canHold = false;
        if (window.soundEffects) window.soundEffects.playRotate();
        this.drawHoldPreview();
    }

    getGhostY() {
        let ghostY = this.currentPiece.y;
        while (!this.collide(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    lockPiece() {
        const shape = this.currentPiece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const gridY = this.currentPiece.y + r;
                    const gridX = this.currentPiece.x + c;
                    if (gridY < 0) {
                        this.triggerGameOver();
                        return;
                    }
                    this.grid[gridY][gridX] = {
                        color: this.currentPiece.color,
                        glow: this.currentPiece.glow
                    };
                }
            }
        }

        this.canHold = true;
        this.checkLineClears();
    }

    checkLineClears() {
        const linesToClear = [];
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== 0)) {
                linesToClear.push(r);
            }
        }

        if (linesToClear.length > 0) {
            this.clearingLines = linesToClear;
            this.clearAnimationTimer = 12; // Frames of animation

            // Spawn particles
            linesToClear.forEach(r => {
                for (let c = 0; c < COLS; c++) {
                    const cell = this.grid[r][c];
                    if (cell) {
                        this.createExplosionParticles(c * BLOCK_SIZE + BLOCK_SIZE / 2, r * BLOCK_SIZE + BLOCK_SIZE / 2, cell.color);
                    }
                }
            });

            if (window.soundEffects) window.soundEffects.playClear(linesToClear.length);
            this.showComboPopup(linesToClear.length);
        } else {
            this.spawnNext();
        }
    }

    finishLineClear() {
        const linesCount = this.clearingLines.length;

        // Safely filter out cleared rows and prepend new empty rows
        this.grid = this.grid.filter((_, idx) => !this.clearingLines.includes(idx));
        while (this.grid.length < ROWS) {
            this.grid.unshift(Array(COLS).fill(0));
        }

        // Calculate score based on classic Tetris guidelines
        const pointsTable = [0, 100, 300, 500, 800];
        const addedScore = (pointsTable[linesCount] || (linesCount * 200)) * this.level;
        this.score += addedScore;
        this.lines += linesCount;

        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            // Progressive speed formula: decreases interval as level rises
            this.dropInterval = Math.max(80, Math.floor(1000 * Math.pow(0.85, this.level - 1)));
            if (window.soundEffects) window.soundEffects.playLevelUp();
        }

        this.clearingLines = [];
        this.updateUI();
        this.spawnNext();
    }

    spawnNext() {
        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor(COLS / 2) - Math.ceil(this.nextPiece.shape[0].length / 2),
            y: 0
        };
        this.nextPiece = this.getPieceFromBag();

        // Check if new piece immediately collides => Game Over
        if (this.collide(this.currentPiece)) {
            this.triggerGameOver();
        }

        this.drawNextPreview();
    }

    triggerGameOver() {
        this.isGameOver = true;
        if (window.soundEffects) window.soundEffects.playGameOver();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetris_high_score', this.highScore.toString());
            this.highScoreElem.textContent = this.highScore;
        }

        this.finalScoreElem.textContent = this.score.toLocaleString();
        this.finalLinesElem.textContent = this.lines;
        this.finalLevelElem.textContent = this.level;
        this.gameOverOverlay.classList.add('active');
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseOverlay.classList.add('active');
        } else {
            this.pauseOverlay.classList.remove('active');
            this.lastTime = performance.now();
        }
    }

    createExplosionParticles(x, y, color) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03 + Math.random() * 0.03,
                size: 2.5 + Math.random() * 3,
                color
            });
        }
    }

    createHardDropDust(piece) {
        const shape = piece.shape;
        for (let c = 0; c < shape[0].length; c++) {
            const px = (piece.x + c) * BLOCK_SIZE + BLOCK_SIZE / 2;
            const py = (piece.y + shape.length) * BLOCK_SIZE;
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: px + (Math.random() * 12 - 6),
                    y: py,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -(1 + Math.random() * 2),
                    life: 0.8,
                    decay: 0.05,
                    size: 2 + Math.random() * 2,
                    color: piece.color
                });
            }
        }
    }

    showComboPopup(lines) {
        const labels = {
            1: 'SINGLE! +100',
            2: 'DOUBLE! +300',
            3: 'TRIPLE! +500',
            4: 'TETRIS! +800'
        };
        const text = labels[lines] || `+${lines * 200}`;
        const boardWrapper = document.querySelector('.board-container');

        const popup = document.createElement('div');
        popup.className = 'combo-popup';
        popup.style.color = lines === 4 ? '#00f0ff' : lines === 3 ? '#a855f7' : '#fbbf24';
        popup.style.left = '50%';
        popup.style.top = '40%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.textContent = text;

        boardWrapper.appendChild(popup);
        setTimeout(() => popup.remove(), 900);
    }

    updateUI() {
        this.scoreElem.textContent = this.score.toLocaleString();
        this.levelElem.textContent = this.level;
        this.linesElem.textContent = this.lines;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetris_high_score', this.highScore.toString());
            this.highScoreElem.textContent = this.highScore.toLocaleString();
        }

        const linesInCurrentLevel = this.lines % 10;
        const progressPercent = (linesInCurrentLevel / 10) * 100;
        this.progressBar.style.width = `${progressPercent}%`;
    }

    drawBlock(ctx, x, y, color, glow, isGhost = false) {
        const px = x * BLOCK_SIZE;
        const py = y * BLOCK_SIZE;

        if (isGhost) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            ctx.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            return;
        }

        // Base gradient
        const grad = ctx.createLinearGradient(px, py, px + BLOCK_SIZE, py + BLOCK_SIZE);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#05070f');

        ctx.fillStyle = grad;
        ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        // Highlight bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, 3);
        ctx.fillRect(px + 2, py + 2, 3, BLOCK_SIZE - 4);

        // Dark bevel edge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(px + BLOCK_SIZE - 4, py + 2, 2, BLOCK_SIZE - 4);
        ctx.fillRect(px + 2, py + BLOCK_SIZE - 4, BLOCK_SIZE - 4, 2);

        // Glowing border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    }

    renderGridLines() {
        this.boardCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.boardCtx.lineWidth = 1;

        for (let x = 0; x <= COLS; x++) {
            this.boardCtx.beginPath();
            this.boardCtx.moveTo(x * BLOCK_SIZE, 0);
            this.boardCtx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.boardCtx.stroke();
        }

        for (let y = 0; y <= ROWS; y++) {
            this.boardCtx.beginPath();
            this.boardCtx.moveTo(0, y * BLOCK_SIZE);
            this.boardCtx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.boardCtx.stroke();
        }
    }

    render() {
        // Clear board
        this.boardCtx.fillStyle = '#060812';
        this.boardCtx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

        // Draw grid
        this.renderGridLines();

        // Draw locked grid cells
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                if (cell) {
                    if (this.clearingLines.includes(r)) {
                        // Flash effect on cleared line
                        this.boardCtx.fillStyle = '#ffffff';
                        this.boardCtx.shadowColor = '#00f0ff';
                        this.boardCtx.shadowBlur = 10;
                        this.boardCtx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        this.boardCtx.shadowBlur = 0;
                    } else {
                        this.drawBlock(this.boardCtx, c, r, cell.color, cell.glow);
                    }
                }
            }
        }

        // Draw ghost piece & active piece
        if (this.currentPiece && !this.isGameOver && this.clearingLines.length === 0) {
            const ghostY = this.getGhostY();
            const shape = this.currentPiece.shape;

            // Ghost piece
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.drawBlock(this.boardCtx, this.currentPiece.x + c, ghostY + r, this.currentPiece.color, this.currentPiece.glow, true);
                    }
                }
            }

            // Active piece
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.drawBlock(this.boardCtx, this.currentPiece.x + c, this.currentPiece.y + r, this.currentPiece.color, this.currentPiece.glow, false);
                    }
                }
            }
        }

        // Render & update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.boardCtx.fillStyle = p.color;
            this.boardCtx.globalAlpha = Math.max(0, p.life);
            this.boardCtx.beginPath();
            this.boardCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.boardCtx.fill();
            this.boardCtx.globalAlpha = 1.0;
        }

        // Preview panels
        this.drawNextPreview();
        this.drawHoldPreview();
    }

    drawMiniPiece(ctx, canvas, piece) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!piece) return;

        const shape = piece.shape;
        const miniSize = 18;
        const offsetX = (canvas.width - shape[0].length * miniSize) / 2;
        const offsetY = (canvas.height - shape.length * miniSize) / 2;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const px = offsetX + c * miniSize;
                    const py = offsetY + r * miniSize;

                    ctx.fillStyle = piece.color;
                    ctx.shadowColor = piece.color;
                    ctx.shadowBlur = 6;
                    ctx.fillRect(px + 1, py + 1, miniSize - 2, miniSize - 2);

                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(px + 2, py + 2, miniSize - 4, 2);
                }
            }
        }
    }

    drawNextPreview() {
        this.drawMiniPiece(this.nextCtx, this.nextCanvas, this.nextPiece);
    }

    drawHoldPreview() {
        this.drawMiniPiece(this.holdCtx, this.holdCanvas, this.holdPiece);
    }

    gameLoop(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        if (!this.isPaused && !this.isGameOver) {
            if (this.clearingLines.length > 0) {
                this.clearAnimationTimer--;
                if (this.clearAnimationTimer <= 0) {
                    this.finishLineClear();
                }
            } else {
                this.dropCounter += deltaTime;
                if (this.dropCounter > this.dropInterval) {
                    this.softDrop();
                    this.dropCounter = 0;
                }
            }
        }

        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            const isControlKey = [
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'
            ].includes(e.key) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code);

            if (isControlKey) {
                e.preventDefault();
            }

            if (this.isGameOver) {
                if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
                    this.reset();
                }
                return;
            }

            // Ignore repeat for hard drop to prevent accidental multiple drops
            if ((e.key === ' ' || e.code === 'Space') && e.repeat) {
                return;
            }

            if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
                this.move(-1);
            } else if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
                this.move(1);
            } else if (e.key === 'ArrowUp' || e.code === 'ArrowUp') {
                this.rotate();
            } else if (e.key === 'ArrowDown' || e.code === 'ArrowDown') {
                this.softDrop();
            } else if (e.key === ' ' || e.code === 'Space') {
                this.hardDrop();
            } else if (e.key === 'c' || e.key === 'C' || e.code === 'KeyC' || e.key === 'Shift') {
                this.hold();
            } else if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP' || e.key === 'Escape') {
                this.togglePause();
            }
        });

        // UI Buttons
        document.getElementById('startRestartBtn').addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.reset();
        });

        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                if (window.soundEffects) {
                    const enabled = window.soundEffects.toggle();
                    this.soundBtn.textContent = enabled ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
                    this.soundBtn.classList.toggle('active', enabled);
                }
            });
        }

        // Mobile touch controls
        const touchLeft = document.getElementById('touchLeft');
        const touchRight = document.getElementById('touchRight');
        const touchRotate = document.getElementById('touchRotate');
        const touchDown = document.getElementById('touchDown');
        const touchDrop = document.getElementById('touchDrop');

        if (touchLeft) touchLeft.addEventListener('click', () => this.move(-1));
        if (touchRight) touchRight.addEventListener('click', () => this.move(1));
        if (touchRotate) touchRotate.addEventListener('click', () => this.rotate());
        if (touchDown) touchDown.addEventListener('click', () => this.softDrop());
        if (touchDrop) touchDrop.addEventListener('click', () => this.hardDrop());
    }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.tetris = new TetrisGame();
});
