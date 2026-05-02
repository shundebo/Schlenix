// Schlenix - 贪吃蛇游戏

class SnakeGameApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '贪吃蛇',
            icon: '🐍',
            width: 450,
            height: 520,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            canvas: null,
            ctx: null,
            snake: [{x: 10, y: 10}],
            food: {x: 15, y: 15},
            direction: 'right',
            nextDirection: 'right',
            score: 0,
            gameLoop: null,
            gameOver: false,
            gridSize: 20,
            tileCount: 20
        });

        this.attachEvents(windowId);
        this.initGame(windowId);
    }

    getContent() {
        return `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-score">得分: <span id="score">0</span></div>
                    <div class="game-high-score">最高: <span id="high-score">0</span></div>
                </div>
                <canvas id="game-canvas" width="400" height="400"></canvas>
                <div class="game-controls">
                    <button class="game-btn game-start">开始游戏</button>
                    <button class="game-btn game-pause">暂停</button>
                    <button class="game-btn game-restart">重新开始</button>
                </div>
                <div class="game-instructions">
                    使用方向键 ↑↓←→ 控制蛇的移动
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
        document.addEventListener('keydown', (e) => {
            const instance = this.instances.get(windowId);
            if (!instance || instance.gameOver) return;

            const key = e.key;
            if (key === 'ArrowUp' && instance.direction !== 'down') {
                instance.nextDirection = 'up';
                e.preventDefault();
            } else if (key === 'ArrowDown' && instance.direction !== 'up') {
                instance.nextDirection = 'down';
                e.preventDefault();
            } else if (key === 'ArrowLeft' && instance.direction !== 'right') {
                instance.nextDirection = 'left';
                e.preventDefault();
            } else if (key === 'ArrowRight' && instance.direction !== 'left') {
                instance.nextDirection = 'right';
                e.preventDefault();
            }
        });

        // 窗口关闭时清理
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

        instance.canvas = content.querySelector('#game-canvas');
        instance.ctx = instance.canvas.getContext('2d');

        // 加载最高分
        const highScore = storage.get('snake_high_score') || 0;
        content.querySelector('#high-score').textContent = highScore;

        this.drawGame(windowId);
    }

    startGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || instance.gameLoop) return;

        instance.gameOver = false;
        instance.gameLoop = setInterval(() => this.gameUpdate(windowId), 100);
    }

    pauseGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        if (instance.gameLoop) {
            clearInterval(instance.gameLoop);
            instance.gameLoop = null;
        }
    }

    restartGame(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        this.pauseGame(windowId);

        instance.snake = [{x: 10, y: 10}];
        instance.food = {x: 15, y: 15};
        instance.direction = 'right';
        instance.nextDirection = 'right';
        instance.score = 0;
        instance.gameOver = false;

        content.querySelector('#score').textContent = '0';
        this.drawGame(windowId);
    }

    gameUpdate(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || instance.gameOver) return;

        instance.direction = instance.nextDirection;

        // 移动蛇头
        const head = {...instance.snake[0]};
        
        if (instance.direction === 'up') head.y--;
        else if (instance.direction === 'down') head.y++;
        else if (instance.direction === 'left') head.x--;
        else if (instance.direction === 'right') head.x++;

        // 检查碰撞
        if (head.x < 0 || head.x >= instance.tileCount || 
            head.y < 0 || head.y >= instance.tileCount ||
            instance.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver(windowId);
            return;
        }

        instance.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === instance.food.x && head.y === instance.food.y) {
            instance.score += 10;
            this.updateScore(windowId);
            this.generateFood(windowId);
        } else {
            instance.snake.pop();
        }

        this.drawGame(windowId);
    }

    generateFood(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * instance.tileCount),
                y: Math.floor(Math.random() * instance.tileCount)
            };
        } while (instance.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

        instance.food = newFood;
    }

    drawGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.ctx) return;

        const ctx = instance.ctx;
        const gridSize = instance.gridSize;

        // 清空画布
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, instance.canvas.width, instance.canvas.height);

        // 绘制网格
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= instance.tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, instance.canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(instance.canvas.width, i * gridSize);
            ctx.stroke();
        }

        // 绘制蛇
        instance.snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#27ae60' : '#2ecc71';
            ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
        });

        // 绘制食物
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(instance.food.x * gridSize + 1, instance.food.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    updateScore(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        content.querySelector('#score').textContent = instance.score;

        // 更新最高分
        const highScore = storage.get('snake_high_score') || 0;
        if (instance.score > highScore) {
            storage.set('snake_high_score', instance.score);
            content.querySelector('#high-score').textContent = instance.score;
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
            this.instances.delete(windowId);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['snake-game'] = new SnakeGameApp();