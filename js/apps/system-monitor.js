// Schlenix - 系统监控应用

class SystemMonitorApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '系统监控',
            icon: '📈',
            width: 600,
            height: 450,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            cpuHistory: Array(60).fill(0),
            memoryHistory: Array(60).fill(0),
            updateInterval: null
        });

        this.attachEvents(windowId);
        this.startMonitoring(windowId);
    }

    getContent() {
        return `
            <div class="monitor-container">
                <div class="monitor-section">
                    <div class="monitor-title">CPU 使用率</div>
                    <canvas class="monitor-chart" id="cpu-chart" width="560" height="120"></canvas>
                    <div class="monitor-value">0%</div>
                </div>
                <div class="monitor-section">
                    <div class="monitor-title">内存使用</div>
                    <canvas class="monitor-chart" id="memory-chart" width="560" height="120"></canvas>
                    <div class="monitor-value">0 MB</div>
                </div>
                <div class="monitor-stats">
                    <div class="stat-item">
                        <span class="stat-label">进程数</span>
                        <span class="stat-value" id="process-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">窗口数</span>
                        <span class="stat-value" id="window-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">运行时间</span>
                        <span class="stat-value" id="uptime">0:00:00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">存储使用</span>
                        <span class="stat-value" id="storage-used">0 KB</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.stopMonitoring(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    startMonitoring(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.updateInterval = setInterval(() => {
            this.updateMonitor(windowId);
        }, 1000);
    }

    stopMonitoring(windowId) {
        const instance = this.instances.get(windowId);
        if (instance && instance.updateInterval) {
            clearInterval(instance.updateInterval);
            this.instances.delete(windowId);
        }
    }

    updateMonitor(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        // 生成模拟数据
        const cpuUsage = Math.random() * 50 + 10;
        const memoryUsage = Math.random() * 500 + 200;

        // 更新历史数据
        instance.cpuHistory.shift();
        instance.cpuHistory.push(cpuUsage);
        instance.memoryHistory.shift();
        instance.memoryHistory.push(memoryUsage);

        // 绘制图表
        this.drawChart('cpu-chart', instance.cpuHistory, '#4a90d9', 100);
        this.drawChart('memory-chart', instance.memoryHistory, '#27ae60', 1000);

        // 更新数值
        const cpuValue = content.querySelector('.monitor-section:nth-child(1) .monitor-value');
        const memValue = content.querySelector('.monitor-section:nth-child(2) .monitor-value');
        if (cpuValue) cpuValue.textContent = `${cpuUsage.toFixed(1)}%`;
        if (memValue) memValue.textContent = `${memoryUsage.toFixed(0)} MB`;

        // 更新统计信息
        this.updateStats(content);
    }

    drawChart(canvasId, data, color, maxValue) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清空画布
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制数据线
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const step = width / (data.length - 1);
        data.forEach((value, index) => {
            const x = index * step;
            const y = height - (value / maxValue) * height;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // 填充区域
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = color + '33';
        ctx.fill();
    }

    updateStats(content) {
        const processCount = content.querySelector('#process-count');
        const windowCount = content.querySelector('#window-count');
        const uptime = content.querySelector('#uptime');
        const storageUsed = content.querySelector('#storage-used');

        if (processCount) processCount.textContent = Math.floor(Math.random() * 20) + 10;
        if (windowCount) windowCount.textContent = windowManager.windows.size;

        if (uptime) {
            const seconds = Math.floor(performance.now() / 1000);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            uptime.textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        if (storageUsed) {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            storageUsed.textContent = `${Math.floor(total / 1024)} KB`;
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['system-monitor'] = new SystemMonitorApp();