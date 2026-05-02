// Schlenix - 番茄钟应用

class PomodoroApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '番茄钟',
            icon: '🍅',
            width: 400,
            height: 500,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            mode: 'work', // work, shortBreak, longBreak
            timeLeft: 25 * 60,
            isRunning: false,
            interval: null,
            workTime: 25,
            shortBreakTime: 5,
            longBreakTime: 15,
            sessionsCompleted: 0,
            totalSessions: 0
        });

        this.attachEvents(windowId);
        this.updateDisplay(windowId);
    }

    getContent() {
        return `
            <div class="pomodoro-container">
                <div class="pomodoro-mode-tabs">
                    <button class="pomo-tab active" data-mode="work">工作</button>
                    <button class="pomo-tab" data-mode="shortBreak">短休息</button>
                    <button class="pomo-tab" data-mode="longBreak">长休息</button>
                </div>
                <div class="pomodoro-timer">
                    <div class="timer-display">25:00</div>
                    <div class="timer-progress">
                        <svg class="progress-ring" width="200" height="200">
                            <circle class="progress-ring-circle" stroke="#4a90d9" stroke-width="8" fill="transparent" r="90" cx="100" cy="100"/>
                        </svg>
                    </div>
                </div>
                <div class="pomodoro-controls">
                    <button class="pomo-btn pomo-start">开始</button>
                    <button class="pomo-btn pomo-reset">重置</button>
                </div>
                <div class="pomodoro-stats">
                    <div class="stat-item">
                        <div class="stat-label">今日完成</div>
                        <div class="stat-value" id="sessions-today">0</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">总计</div>
                        <div class="stat-value" id="sessions-total">0</div>
                    </div>
                </div>
                <div class="pomodoro-settings">
                    <div class="setting-item">
                        <label>工作时长 (分钟)</label>
                        <input type="number" class="setting-work" value="25" min="1" max="60">
                    </div>
                    <div class="setting-item">
                        <label>短休息 (分钟)</label>
                        <input type="number" class="setting-short" value="5" min="1" max="30">
                    </div>
                    <div class="setting-item">
                        <label>长休息 (分钟)</label>
                        <input type="number" class="setting-long" value="15" min="1" max="60">
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const btnStart = content.querySelector('.pomo-start');
        const btnReset = content.querySelector('.pomo-reset');
        const tabs = content.querySelectorAll('.pomo-tab');
        const workInput = content.querySelector('.setting-work');
        const shortInput = content.querySelector('.setting-short');
        const longInput = content.querySelector('.setting-long');

        btnStart.addEventListener('click', () => this.toggleTimer(windowId));
        btnReset.addEventListener('click', () => this.resetTimer(windowId));

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(windowId, mode);
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        workInput.addEventListener('change', (e) => {
            const instance = this.instances.get(windowId);
            if (instance) {
                instance.workTime = parseInt(e.target.value);
                if (instance.mode === 'work' && !instance.isRunning) {
                    instance.timeLeft = instance.workTime * 60;
                    this.updateDisplay(windowId);
                }
            }
        });

        shortInput.addEventListener('change', (e) => {
            const instance = this.instances.get(windowId);
            if (instance) {
                instance.shortBreakTime = parseInt(e.target.value);
                if (instance.mode === 'shortBreak' && !instance.isRunning) {
                    instance.timeLeft = instance.shortBreakTime * 60;
                    this.updateDisplay(windowId);
                }
            }
        });

        longInput.addEventListener('change', (e) => {
            const instance = this.instances.get(windowId);
            if (instance) {
                instance.longBreakTime = parseInt(e.target.value);
                if (instance.mode === 'longBreak' && !instance.isRunning) {
                    instance.timeLeft = instance.longBreakTime * 60;
                    this.updateDisplay(windowId);
                }
            }
        });

        // 加载统计数据
        const stats = storage.get('pomodoro_stats') || { today: 0, total: 0, date: new Date().toDateString() };
        if (stats.date !== new Date().toDateString()) {
            stats.today = 0;
            stats.date = new Date().toDateString();
        }
        content.querySelector('#sessions-today').textContent = stats.today;
        content.querySelector('#sessions-total').textContent = stats.total;

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

    toggleTimer(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        const btnStart = content.querySelector('.pomo-start');

        if (instance.isRunning) {
            clearInterval(instance.interval);
            instance.isRunning = false;
            btnStart.textContent = '继续';
        } else {
            instance.isRunning = true;
            btnStart.textContent = '暂停';
            
            instance.interval = setInterval(() => {
                instance.timeLeft--;
                
                if (instance.timeLeft <= 0) {
                    this.timerComplete(windowId);
                }
                
                this.updateDisplay(windowId);
            }, 1000);
        }
    }

    resetTimer(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        clearInterval(instance.interval);
        instance.isRunning = false;
        
        const btnStart = content.querySelector('.pomo-start');
        btnStart.textContent = '开始';

        if (instance.mode === 'work') {
            instance.timeLeft = instance.workTime * 60;
        } else if (instance.mode === 'shortBreak') {
            instance.timeLeft = instance.shortBreakTime * 60;
        } else {
            instance.timeLeft = instance.longBreakTime * 60;
        }

        this.updateDisplay(windowId);
    }

    switchMode(windowId, mode) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        clearInterval(instance.interval);
        instance.isRunning = false;
        instance.mode = mode;

        const content = windowManager.getWindowContent(windowId);
        const btnStart = content.querySelector('.pomo-start');
        btnStart.textContent = '开始';

        if (mode === 'work') {
            instance.timeLeft = instance.workTime * 60;
        } else if (mode === 'shortBreak') {
            instance.timeLeft = instance.shortBreakTime * 60;
        } else {
            instance.timeLeft = instance.longBreakTime * 60;
        }

        this.updateDisplay(windowId);
    }

    timerComplete(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        clearInterval(instance.interval);
        instance.isRunning = false;

        if (instance.mode === 'work') {
            instance.sessionsCompleted++;
            
            // 更新统计
            const stats = storage.get('pomodoro_stats') || { today: 0, total: 0, date: new Date().toDateString() };
            if (stats.date !== new Date().toDateString()) {
                stats.today = 0;
                stats.date = new Date().toDateString();
            }
            stats.today++;
            stats.total++;
            storage.set('pomodoro_stats', stats);
            
            content.querySelector('#sessions-today').textContent = stats.today;
            content.querySelector('#sessions-total').textContent = stats.total;

            notify.success('番茄钟完成！', '休息一下吧 🎉');
            
            // 自动切换到休息模式
            if (instance.sessionsCompleted % 4 === 0) {
                this.switchMode(windowId, 'longBreak');
                content.querySelectorAll('.pomo-tab').forEach(t => t.classList.remove('active'));
                content.querySelector('[data-mode="longBreak"]').classList.add('active');
            } else {
                this.switchMode(windowId, 'shortBreak');
                content.querySelectorAll('.pomo-tab').forEach(t => t.classList.remove('active'));
                content.querySelector('[data-mode="shortBreak"]').classList.add('active');
            }
        } else {
            notify.info('休息结束', '开始新的番茄钟吧！');
            this.switchMode(windowId, 'work');
            content.querySelectorAll('.pomo-tab').forEach(t => t.classList.remove('active'));
            content.querySelector('[data-mode="work"]').classList.add('active');
        }

        const btnStart = content.querySelector('.pomo-start');
        btnStart.textContent = '开始';
    }

    updateDisplay(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        const minutes = Math.floor(instance.timeLeft / 60);
        const seconds = instance.timeLeft % 60;
        const display = content.querySelector('.timer-display');
        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // 更新进度环
        const circle = content.querySelector('.progress-ring-circle');
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        
        let totalTime;
        if (instance.mode === 'work') {
            totalTime = instance.workTime * 60;
        } else if (instance.mode === 'shortBreak') {
            totalTime = instance.shortBreakTime * 60;
        } else {
            totalTime = instance.longBreakTime * 60;
        }
        
        const progress = (totalTime - instance.timeLeft) / totalTime;
        const offset = circumference * (1 - progress);
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }

    cleanup(windowId) {
        const instance = this.instances.get(windowId);
        if (instance) {
            clearInterval(instance.interval);
            this.instances.delete(windowId);
        }
    }
}

if (!window.apps) window.apps = {};
window.apps['pomodoro'] = new PomodoroApp();