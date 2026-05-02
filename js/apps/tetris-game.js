// Schlenix - 俄罗斯方块游戏

class TetrisGameApp {
    constructor() {
        this.instances = new Map();
        this.shapes = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[1,1,1],[0,1,0]], // T
            [[1,1,1],[1,0,0]], // L
            [[1,1,1],[0,0,1]], // J
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]]  // Z
        ];
        this.colors = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '俄罗斯方块',
            icon: '🎮',
            width: 400,
            height: 600,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            canvas: null,
            ctx: null,
            board: Array(20).fill().map(() => Array(10).fill(0)),
            currentPiece: null,
            currentX: 0,
            currentY: 0,
            score: 0,
            level: 1,
            lines: 0,
            gameLoop: null,
            gameOver: false,
            dropCounter: 0,
            dropInterval: 1000,
            lastTime: 0
        });

        this.attachEvents(windowId);
        this.initGame(windowId);
    }

    getContent() {
        return `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-stats">
                        <div>得分: <span id="tetris-score">0</span></div>
                        <div>等级: <span id="tetris-level">1</span></div>
                        <div>行数: <span id="tetris-lines">0</span></div>
                    </div>
                </div>
                <canvas id="tetris-canvas" width="300" height="600"></canvas>
                <div class="game-controls">
                    <button class="game-btn game-start">开始游戏</button>
                    <button class="game-btn game-pause">暂停</button>
                    <button class="game-btn game-restart">重新开始</button>
                </div>
                <div class="game-instructions">
                    ← → 移动 | ↑ 旋转 | ↓ 加速下落 | 空格 直接落下
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const btnStart = content.querySelector('.game-start');
        const btnPause = content.querySelector('.game-pause');
        const btnRestart = content.querySelector('.game-restart');

        btnStart.addEventListener('click', () => this.startGame(windowId));
        btnPause.addEventListener('click', () => this.pauseGame(windowId));
        btnRestart.addEventListener('click', () => this.restartGame(windowId));

        // 键盘控制
        const keyHandler = (e) => {
            const instance = this.instances.get(windowId);
            const window = windowManager.windows.get(windowId);
            if (!instance || instance.gameOver || !instance.gameLoop || !window || windowManager.activeWindow !== windowId) return;

            if (e.key === 'ArrowLeft') {
                this.movePiece(windowId, -1, 0);
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.movePiece(windowId, 1, 0);
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                this.movePiece(windowId, 0, 1);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                this.rotatePiece(windowId);
                e.preventDefault();
            } else if (e.key === ' ') {
                this.dropPiece(windowId);
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', keyHandler);

        // 保存处理器以便清理
        const instance = this.instances.get(windowId);
        if (instance) {
            instance.keyHandler = keyHandler;
        }

        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.cleanup(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    initGame(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        instance.canvas = content.querySelector('#tetris-canvas');
        instance.ctx = instance.canvas.getContext('2d');
        
        this.drawBoard(windowId);
    }

    startGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || instance.gameLoop) return;

        instance.gameOver = false;
        this.spawnPiece(windowId);
        
        const gameLoop = (time = 0) => {
            const deltaTime = time - instance.lastTime;
            instance.lastTime = time;
            instance.dropCounter += deltaTime;

            if (instance.dropCounter > instance.dropInterval) {
                this.movePiece(windowId, 0, 1);
                instance.dropCounter = 0;
            }

            this.drawBoard(windowId);
            instance.gameLoop = requestAnimationFrame(gameLoop);
        };

        instance.gameLoop = requestAnimationFrame(gameLoop);
    }

    pauseGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        if (instance.gameLoop) {
            cancelAnimationFrame(instance.gameLoop);
            instance.gameLoop = null;
        }
    }

    restartGame(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        this.pauseGame(windowId);

        instance.board = Array(20).fill().map(() => Array(10).fill(0));
        instance.score = 0;
        instance.level = 1;
        instance.lines = 0;
        instance.gameOver = false;
        instance.dropCounter = 0;
        instance.dropInterval = 1000;

        content.querySelector('#tetris-score').textContent = '0';
        content.querySelector('#tetris-level').textContent = '1';
        content.querySelector('#tetris-lines').textContent = '0';

        this.drawBoard(windowId);
    }

    spawnPiece(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const shapeIndex = Math.floor(Math.random() * this.shapes.length);
        instance.currentPiece = {
            shape: this.shapes[shapeIndex],
            color: this.colors[shapeIndex]
        };
        instance.currentX = Math.floor((10 - instance.currentPiece.shape[0].length) / 2);
        instance.currentY = 0;

        if (this.checkCollision(windowId, instance.currentPiece.shape, instance.currentX, instance.currentY)) {
            this.gameOver(windowId);
        }
    }

    movePiece(windowId, dx, dy) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.currentPiece) return;

        const newX = instance.currentX + dx;
        const newY = instance.currentY + dy;

        if (!this.checkCollision(windowId, instance.currentPiece.shape, newX, newY)) {
            instance.currentX = newX;
            instance.currentY = newY;
        } else if (dy > 0) {
            this.mergePiece(windowId);
            this.clearLines(windowId);
            this.spawnPiece(windowId);
        }
    }

    rotatePiece(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.currentPiece) return;

        const rotated = instance.currentPiece.shape[0].map((_, i) =>
            instance.currentPiece.shape.map(row => row[i]).reverse()
        );

        if (!this.checkCollision(windowId, rotated, instance.currentX, instance.currentY)) {
            instance.currentPiece.shape = rotated;
        }
    }

    dropPiece(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.currentPiece) return;

        while (!this.checkCollision(windowId, instance.currentPiece.shape, instance.currentX, instance.currentY + 1)) {
            instance.currentY++;
        }
        this.mergePiece(windowId);
        this.clearLines(windowId);
        this.spawnPiece(windowId);
    }

    checkCollision(windowId, shape, x, y) {
        const instance = this.instances.get(windowId);
        if (!instance) return true;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= 10 || newY >= 20) return true;
                    if (newY >= 0 && instance.board[newY][newX]) return true;
                }
            }
        }
        return false;
    }

    mergePiece(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.currentPiece) return;

        instance.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = instance.currentY + y;
                    const boardX = instance.currentX + x;
                    if (boardY >= 0) {
                        instance.board[boardY][boardX] = instance.currentPiece.color;
                    }
                }
            });
        });
    }

    clearLines(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        let linesCleared = 0;
        
        for (let y = instance.board.length - 1; y >= 0; y--) {
            if (instance.board[y].every(cell => cell !== 0)) {
                instance.board.splice(y, 1);
                instance.board.unshift(Array(10).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            instance.lines += linesCleared;
            instance.score += [0, 100, 300, 500, 800][linesCleared] * instance.level;
            instance.level = Math.floor(instance.lines / 10) + 1;
            instance.dropInterval = Math.max(100, 1000 - (instance.level - 1) * 100);

            content.querySelector('#tetris-score').textContent = instance.score;
            content.querySelector('#tetris-level').textContent = instance.level;
            content.querySelector('#tetris-lines').textContent = instance.lines;
        }
    }

    drawBoard(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.ctx) return;

        const ctx = instance.ctx;
        const cellSize = 30;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, instance.canvas.width, instance.canvas.height);

        // 绘制已固定的方块
        instance.board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillStyle = cell;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                }
            });
        });

        // 绘制当前方块
        if (instance.currentPiece) {
            ctx.fillStyle = instance.currentPiece.color;
            instance.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillRect(
                            (instance.currentX + x) * cellSize,
                            (instance.currentY + y) * cellSize,
                            cellSize - 1,
                            cellSize - 1
                        );
                    }
                });
            });
        }

        // 绘制网格
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, 600);
            ctx.stroke();
        }
        for (let i = 0; i <= 20; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(300, i * cellSize);
            ctx.stroke();
        }
    }

    gameOver(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.gameOver = true;
        this.pauseGame(windowId);
        notify.warning('游戏结束', `得分: ${instance.score}`);
    }

    cleanup(windowId) {
        const instance = this.instances.get(windowId);
        if (instance) {
            this.pauseGame(windowId);
            if (instance.keyHandler) {
                document.removeEventListener('keydown', instance.keyHandler);
            }
            this.instances.delete(windowId);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['tetris-game'] = new TetrisGameApp();