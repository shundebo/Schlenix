// Schlenix - 2048 游戏

class Game2048App {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '2048',
            icon: '🎯',
            width: 450,
            height: 550,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            grid: Array(4).fill().map(() => Array(4).fill(0)),
            score: 0,
            bestScore: storage.get('2048_best_score') || 0,
            gameOver: false
        });

        this.attachEvents(windowId);
        this.initGame(windowId);
    }

    getContent() {
        return `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-title">2048</div>
                    <div class="game-scores">
                        <div class="score-box">
                            <div class="score-label">得分</div>
                            <div class="score-value" id="game2048-score">0</div>
                        </div>
                        <div class="score-box">
                            <div class="score-label">最高</div>
                            <div class="score-value" id="game2048-best">0</div>
                        </div>
                    </div>
                </div>
                <div class="game2048-grid" id="game2048-grid"></div>
                <div class="game-controls">
                    <button class="game-btn game-restart">新游戏</button>
                </div>
                <div class="game-instructions">
                    使用方向键 ↑↓←→ 移动方块，相同数字合并
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const btnRestart = content.querySelector('.game-restart');
        btnRestart.addEventListener('click', () => this.restartGame(windowId));

        // 键盘控制
        const keyHandler = (e) => {
            const instance = this.instances.get(windowId);
            const window = windowManager.windows.get(windowId);
            if (!instance || instance.gameOver || !window || windowManager.activeWindow !== windowId) return;

            let moved = false;
            if (e.key === 'ArrowUp') {
                moved = this.move(windowId, 'up');
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                moved = this.move(windowId, 'down');
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                moved = this.move(windowId, 'left');
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                moved = this.move(windowId, 'right');
                e.preventDefault();
            }

            if (moved) {
                this.addRandomTile(windowId);
                this.updateDisplay(windowId);
                this.checkGameOver(windowId);
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
                    const instance = this.instances.get(windowId);
                    if (instance && instance.keyHandler) {
                        document.removeEventListener('keydown', instance.keyHandler);
                    }
                    this.instances.delete(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    initGame(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        content.querySelector('#game2048-best').textContent = instance.bestScore;
        this.addRandomTile(windowId);
        this.addRandomTile(windowId);
        this.updateDisplay(windowId);
    }

    restartGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.grid = Array(4).fill().map(() => Array(4).fill(0));
        instance.score = 0;
        instance.gameOver = false;

        this.addRandomTile(windowId);
        this.addRandomTile(windowId);
        this.updateDisplay(windowId);
    }

    addRandomTile(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (instance.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            instance.grid[cell.x][cell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(windowId, direction) {
        const instance = this.instances.get(windowId);
        if (!instance) return false;

        const oldGrid = JSON.stringify(instance.grid);

        if (direction === 'left') {
            for (let i = 0; i < 4; i++) {
                instance.grid[i] = this.mergeLine(instance.grid[i], windowId);
            }
        } else if (direction === 'right') {
            for (let i = 0; i < 4; i++) {
                instance.grid[i] = this.mergeLine(instance.grid[i].reverse(), windowId).reverse();
            }
        } else if (direction === 'up') {
            for (let j = 0; j < 4; j++) {
                const column = [instance.grid[0][j], instance.grid[1][j], instance.grid[2][j], instance.grid[3][j]];
                const merged = this.mergeLine(column, windowId);
                for (let i = 0; i < 4; i++) {
                    instance.grid[i][j] = merged[i];
                }
            }
        } else if (direction === 'down') {
            for (let j = 0; j < 4; j++) {
                const column = [instance.grid[0][j], instance.grid[1][j], instance.grid[2][j], instance.grid[3][j]];
                const merged = this.mergeLine(column.reverse(), windowId).reverse();
                for (let i = 0; i < 4; i++) {
                    instance.grid[i][j] = merged[i];
                }
            }
        }

        return oldGrid !== JSON.stringify(instance.grid);
    }

    mergeLine(line, windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return line;

        // 移除零
        let newLine = line.filter(cell => cell !== 0);

        // 合并相同的数字
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                instance.score += newLine[i];
                newLine.splice(i + 1, 1);
            }
        }

        // 填充零
        while (newLine.length < 4) {
            newLine.push(0);
        }

        return newLine;
    }

    updateDisplay(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const gridContainer = content.querySelector('#game2048-grid');
        gridContainer.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'game2048-cell';
                const value = instance.grid[i][j];
                
                if (value > 0) {
                    cell.classList.add(`tile-${value}`);
                    cell.textContent = value;
                }
                
                gridContainer.appendChild(cell);
            }
        }

        content.querySelector('#game2048-score').textContent = instance.score;

        if (instance.score > instance.bestScore) {
            instance.bestScore = instance.score;
            storage.set('2048_best_score', instance.bestScore);
            content.querySelector('#game2048-best').textContent = instance.bestScore;
        }
    }

    checkGameOver(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        // 检查是否有空格
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (instance.grid[i][j] === 0) return;
            }
        }

        // 检查是否可以合并
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                if (instance.grid[i][j] === instance.grid[i][j + 1]) return;
            }
        }
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 3; i++) {
                if (instance.grid[i][j] === instance.grid[i + 1][j]) return;
            }
        }

        instance.gameOver = true;
        notify.warning('游戏结束', `得分: ${instance.score}`);
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['2048-game'] = new Game2048App();