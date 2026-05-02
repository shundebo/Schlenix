// Schlenix - 扫雷游戏

class MinesweeperGameApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '扫雷',
            icon: '💣',
            width: 450,
            height: 550,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            rows: 10,
            cols: 10,
            mines: 15,
            board: [],
            revealed: [],
            flagged: [],
            gameOver: false,
            gameWon: false,
            firstClick: true,
            timer: 0,
            timerInterval: null
        });

        this.attachEvents(windowId);
        this.initGame(windowId);
    }

    getContent() {
        return `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-info">
                        <div>💣 <span id="mines-count">15</span></div>
                        <div>⏱️ <span id="timer">0</span></div>
                    </div>
                    <select class="difficulty-select">
                        <option value="easy">简单 (10x10, 15雷)</option>
                        <option value="medium">中等 (12x12, 25雷)</option>
                        <option value="hard">困难 (15x15, 40雷)</option>
                    </select>
                </div>
                <div class="minesweeper-board" id="minesweeper-board"></div>
                <div class="game-controls">
                    <button class="game-btn game-restart">新游戏</button>
                </div>
                <div class="game-instructions">
                    左键点击翻开 | 右键插旗 | 数字表示周围雷数
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId)
        if (!content) return;

        const btnRestart = content.querySelector('.game-restart');
        const difficultySelect = content.querySelector('.difficulty-select');

        btnRestart.addEventListener('click', () => this.restartGame(windowId));
        
        difficultySelect.addEventListener('change', (e) => {
            const instance = this.instances.get(windowId);
            if (!instance) return;

            const difficulty = e.target.value;
            if (difficulty === 'easy') {
                instance.rows = 10;
                instance.cols = 10;
                instance.mines = 15;
            } else if (difficulty === 'medium') {
                instance.rows = 12;
                instance.cols = 12;
                instance.mines = 25;
            } else if (difficulty === 'hard') {
                instance.rows = 15;
                instance.cols = 15;
                instance.mines = 40;
            }
            this.restartGame(windowId);
        });

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
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.board = Array(instance.rows).fill().map(() => Array(instance.cols).fill(0));
        instance.revealed = Array(instance.rows).fill().map(() => Array(instance.cols).fill(false));
        instance.flagged = Array(instance.rows).fill().map(() => Array(instance.cols).fill(false));
        instance.gameOver = false;
        instance.gameWon = false;
        instance.firstClick = true;
        instance.timer = 0;

        this.updateDisplay(windowId);
    }

    restartGame(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        if (instance.timerInterval) {
            clearInterval(instance.timerInterval);
            instance.timerInterval = null;
        }

        this.initGame(windowId);
    }

    placeMines(windowId, excludeRow, excludeCol) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        let minesPlaced = 0;
        while (minesPlaced < instance.mines) {
            const row = Math.floor(Math.random() * instance.rows);
            const col = Math.floor(Math.random() * instance.cols);

            if (instance.board[row][col] !== -1 && 
                !(row === excludeRow && col === excludeCol)) {
                instance.board[row][col] = -1;
                minesPlaced++;

                // 更新周围数字
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const newRow = row + i;
                        const newCol = col + j;
                        if (newRow >= 0 && newRow < instance.rows && 
                            newCol >= 0 && newCol < instance.cols &&
                            instance.board[newRow][newCol] !== -1) {
                            instance.board[newRow][newCol]++;
                        }
                    }
                }
            }
        }
    }

    revealCell(windowId, row, col) {
        const instance = this.instances.get(windowId);
        if (!instance || instance.gameOver || instance.gameWon) return;

        if (instance.firstClick) {
            instance.firstClick = false;
            this.placeMines(windowId, row, col);
            this.startTimer(windowId);
        }

        if (instance.revealed[row][col] || instance.flagged[row][col]) return;

        instance.revealed[row][col] = true;

        if (instance.board[row][col] === -1) {
            this.gameOver(windowId, false);
            return;
        }

        if (instance.board[row][col] === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < instance.rows && 
                        newCol >= 0 && newCol < instance.cols) {
                        this.revealCell(windowId, newRow, newCol);
                    }
                }
            }
        }

        this.updateDisplay(windowId);
        this.checkWin(windowId);
    }

    toggleFlag(windowId, row, col) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content || instance.gameOver || instance.gameWon) return;

        if (instance.revealed[row][col]) return;

        instance.flagged[row][col] = !instance.flagged[row][col];
        
        const flaggedCount = instance.flagged.flat().filter(f => f).length;
        content.querySelector('#mines-count').textContent = instance.mines - flaggedCount;
        
        this.updateDisplay(windowId);
    }

    updateDisplay(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const board = content.querySelector('#minesweeper-board');
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${instance.cols}, 30px)`;

        for (let i = 0; i < instance.rows; i++) {
            for (let j = 0; j < instance.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'mine-cell';

                if (instance.revealed[i][j]) {
                    cell.classList.add('revealed');
                    if (instance.board[i][j] === -1) {
                        cell.textContent = '💣';
                        cell.classList.add('mine');
                    } else if (instance.board[i][j] > 0) {
                        cell.textContent = instance.board[i][j];
                        cell.classList.add(`number-${instance.board[i][j]}`);
                    }
                } else if (instance.flagged[i][j]) {
                    cell.textContent = '🚩';
                    cell.classList.add('flagged');
                } else {
                    cell.addEventListener('click', () => this.revealCell(windowId, i, j));
                    cell.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        this.toggleFlag(windowId, i, j);
                    });
                }

                board.appendChild(cell);
            }
        }
    }

    startTimer(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        instance.timerInterval = setInterval(() => {
            instance.timer++;
            content.querySelector('#timer').textContent = instance.timer;
        }, 1000);
    }

    checkWin(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        let revealedCount = 0;
        for (let i = 0; i < instance.rows; i++) {
            for (let j = 0; j < instance.cols; j++) {
                if (instance.revealed[i][j]) revealedCount++;
            }
        }

        if (revealedCount === instance.rows * instance.cols - instance.mines) {
            this.gameOver(windowId, true);
        }
    }

    gameOver(windowId, won) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.gameOver = !won;
        instance.gameWon = won;

        if (instance.timerInterval) {
            clearInterval(instance.timerInterval);
            instance.timerInterval = null;
        }

        // 显示所有地雷
        for (let i = 0; i < instance.rows; i++) {
            for (let j = 0; j < instance.cols; j++) {
                if (instance.board[i][j] === -1) {
                    instance.revealed[i][j] = true;
                }
            }
        }

        this.updateDisplay(windowId);

        if (won) {
            notify.success('胜利！', `用时 ${instance.timer} 秒`);
        } else {
            notify.warning('游戏结束', '踩到地雷了！');
        }
    }

    cleanup(windowId) {
        const instance = this.instances.get(windowId);
        if (instance) {
            if (instance.timerInterval) {
                clearInterval(instance.timerInterval);
            }
            this.instances.delete(windowId);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['minesweeper-game'] = new MinesweeperGameApp();