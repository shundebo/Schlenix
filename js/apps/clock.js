// Schlenix - 时钟应用

class ClockApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '时钟',
            icon: '🕐',
            width: 500,
            height: 400,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            activeTab: 'clock',
            stopwatchRunning: false,
            stopwatchTime: 0,
            stopwatchInterval: null,
            timerRunning: false,
            timerTime: 0,
            timerInterval: null
        });

        this.attachEvents(windowId);
        this.startClock(windowId);
    }

    getContent() {
        return `
            <div class="clock-tabs">
                <button class="clock-tab active" data-tab="clock">时钟</button>
                <button class="clock-tab" data-tab="stopwatch">秒表</button>
                <button class="clock-tab" data-tab="timer">计时器</button>
            </div>
            <div class="clock-content">
                ${this.getClockTab()}
            </div>
        `;
    }

    getClockTab() {
        return `
            <div class="clock-tab-content" data-tab="clock">
                <div class="clock-display">
                    <div class="clock-time">00:00:00</div>
                    <div class="clock-date">2024年1月1日 星期一</div>
                </div>
                <div class="clock-timezone">
                    <select class="clock-tz-select">
                        <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                        <option value="America/New_York">纽约时间 (UTC-5)</option>
                        <option value="Europe/London">伦敦时间 (UTC+0)</option>
                        <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
                    </select>
                </div>
            </div>
        `;
    }

    getStopwatchTab() {
        return `
            <div class="clock-tab-content" data-tab="stopwatch">
                <div class="stopwatch-display">00:00:00.000</div>
                <div class="stopwatch-controls">
                    <button class="stopwatch-start">开始</button>
                    <button class="stopwatch-reset">重置</button>
                </div>
                <div class="stopwatch-laps"></div>
            </div>
        `;
    }

    getTimerTab() {
        return `
            <div class="clock-tab-content" data-tab="timer">
                <div class="timer-display">00:00:00</div>
                <div class="timer-input">
                    <input type="number" class="timer-hours" min="0" max="23" value="0" placeholder="时">
                    <span>:</span>
                    <input type="number" class="timer-minutes" min="0" max="59" value="5" placeholder="分">
                    <span>:</span>
                    <input type="number" class="timer-seconds" min="0" max="59" value="0" placeholder="秒">
                </div>
                <div class="timer-controls">
                    <button class="timer-start">开始</button>
                    <button class="timer-reset">重置</button>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        // 标签切换
        content.querySelectorAll('.clock-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(windowId, tab.dataset.tab);
            });
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

    switchTab(windowId, tabName) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        instance.activeTab = tabName;

        content.querySelectorAll('.clock-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        const clockContent = content.querySelector('.clock-content');
        if (tabName === 'clock') {
            clockContent.innerHTML = this.getClockTab();
            this.startClock(windowId);
        } else if (tabName === 'stopwatch') {
            clockContent.innerHTML = this.getStopwatchTab();
            this.attachStopwatchEvents(windowId);
        } else if (tabName === 'timer') {
            clockContent.innerHTML = this.getTimerTab();
            this.attachTimerEvents(windowId);
        }
    }

    startClock(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const updateClock = () => {
            const timeEl = content.querySelector('.clock-time');
            const dateEl = content.querySelector('.clock-date');
            if (!timeEl || !dateEl) return;

            const now = new Date();
            const time = now.toLocaleTimeString('zh-CN', { hour12: false });
            const date = now.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
            });

            timeEl.textContent = time;
            dateEl.textContent = date;
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);

        const instance = this.instances.get(windowId);
        if (instance) {
            instance.clockInterval = interval;
        }
    }

    attachStopwatchEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const display = content.querySelector('.stopwatch-display');
        const btnStart = content.querySelector('.stopwatch-start');
        const btnReset = content.querySelector('.stopwatch-reset');
        const lapsContainer = content.querySelector('.stopwatch-laps');

        btnStart.addEventListener('click', () => {
            if (instance.stopwatchRunning) {
                clearInterval(instance.stopwatchInterval);
                instance.stopwatchRunning = false;
                btnStart.textContent = '继续';
                
                // 记录圈数
                const lapTime = this.formatStopwatchTime(instance.stopwatchTime);
                const lapEl = document.createElement('div');
                lapEl.className = 'stopwatch-lap';
                lapEl.textContent = `圈 ${lapsContainer.children.length + 1}: ${lapTime}`;
                lapsContainer.appendChild(lapEl);
            } else {
                instance.stopwatchRunning = true;
                btnStart.textContent = '暂停';
                const startTime = Date.now() - instance.stopwatchTime;
                
                instance.stopwatchInterval = setInterval(() => {
                    instance.stopwatchTime = Date.now() - startTime;
                    display.textContent = this.formatStopwatchTime(instance.stopwatchTime);
                }, 10);
            }
        });

        btnReset.addEventListener('click', () => {
            clearInterval(instance.stopwatchInterval);
            instance.stopwatchRunning = false;
            instance.stopwatchTime = 0;
            display.textContent = '00:00:00.000';
            btnStart.textContent = '开始';
            lapsContainer.innerHTML = '';
        });
    }

    attachTimerEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const display = content.querySelector('.timer-display');
        const btnStart = content.querySelector('.timer-start');
        const btnReset = content.querySelector('.timer-reset');
        const hoursInput = content.querySelector('.timer-hours');
        const minutesInput = content.querySelector('.timer-minutes');
        const secondsInput = content.querySelector('.timer-seconds');

        btnStart.addEventListener('click', () => {
            if (instance.timerRunning) {
                clearInterval(instance.timerInterval);
                instance.timerRunning = false;
                btnStart.textContent = '继续';
            } else {
                if (instance.timerTime === 0) {
                    const hours = parseInt(hoursInput.value) || 0;
                    const minutes = parseInt(minutesInput.value) || 0;
                    const seconds = parseInt(secondsInput.value) || 0;
                    instance.timerTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
                }

                if (instance.timerTime <= 0) {
                    notify.warning('提示', '请设置计时时间');
                    return;
                }

                instance.timerRunning = true;
                btnStart.textContent = '暂停';
                const endTime = Date.now() + instance.timerTime;

                instance.timerInterval = setInterval(() => {
                    instance.timerTime = endTime - Date.now();
                    
                    if (instance.timerTime <= 0) {
                        clearInterval(instance.timerInterval);
                        instance.timerRunning = false;
                        instance.timerTime = 0;
                        display.textContent = '00:00:00';
                        btnStart.textContent = '开始';
                        notify.success('计时结束', '时间到！');
                        return;
                    }

                    display.textContent = this.formatTimerTime(instance.timerTime);
                }, 100);
            }
        });

        btnReset.addEventListener('click', () => {
            clearInterval(instance.timerInterval);
            instance.timerRunning = false;
            instance.timerTime = 0;
            display.textContent = '00:00:00';
            btnStart.textContent = '开始';
        });
    }

    formatStopwatchTime(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    }

    formatTimerTime(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    cleanup(windowId) {
        const instance = this.instances.get(windowId);
        if (instance) {
            if (instance.clockInterval) clearInterval(instance.clockInterval);
            if (instance.stopwatchInterval) clearInterval(instance.stopwatchInterval);
            if (instance.timerInterval) clearInterval(instance.timerInterval);
            this.instances.delete(windowId);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['clock'] = new ClockApp();