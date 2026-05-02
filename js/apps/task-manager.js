// Schlenix - 任务管理器应用

class TaskManagerApp {
    constructor() {
        this.instances = new Map();
        this.updateInterval = null;
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '任务管理器',
            icon: '📊',
            width: 700,
            height: 500,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            activeTab: 'processes',
            updateInterval: null
        });

        this.attachEvents(windowId);
        this.startAutoUpdate(windowId);
    }

    getContent() {
        return `
            <div class="task-manager-tabs">
                <button class="tm-tab active" data-tab="processes">进程</button>
                <button class="tm-tab" data-tab="performance">性能</button>
                <button class="tm-tab" data-tab="windows">窗口</button>
            </div>
            <div class="task-manager-content">
                ${this.getProcessesTab()}
            </div>
        `;
    }

    getProcessesTab() {
        const processes = this.getProcessList();
        return `
            <div class="tm-tab-content" data-tab="processes">
                <div class="tm-toolbar">
                    <button class="tm-btn-refresh">🔄 刷新</button>
                    <button class="tm-btn-end-task">❌ 结束任务</button>
                </div>
                <table class="tm-process-table">
                    <thead>
                        <tr>
                            <th>进程名称</th>
                            <th>PID</th>
                            <th>CPU</th>
                            <th>内存</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processes.map(p => `
                            <tr data-pid="${p.pid}">
                                <td>${p.icon} ${p.name}</td>
                                <td>${p.pid}</td>
                                <td>${p.cpu}%</td>
                                <td>${p.memory} MB</td>
                                <td><span class="tm-status ${p.status}">${p.statusText}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getPerformanceTab() {
        const stats = this.getSystemStats();
        return `
            <div class="tm-tab-content" data-tab="performance">
                <div class="tm-performance-grid">
                    <div class="tm-perf-card">
                        <div class="tm-perf-title">CPU 使用率</div>
                        <div class="tm-perf-value">${stats.cpu}%</div>
                        <div class="tm-perf-bar">
                            <div class="tm-perf-bar-fill" style="width: ${stats.cpu}%"></div>
                        </div>
                    </div>
                    <div class="tm-perf-card">
                        <div class="tm-perf-title">内存使用</div>
                        <div class="tm-perf-value">${stats.memoryUsed} / ${stats.memoryTotal} GB</div>
                        <div class="tm-perf-bar">
                            <div class="tm-perf-bar-fill" style="width: ${stats.memoryPercent}%"></div>
                        </div>
                    </div>
                    <div class="tm-perf-card">
                        <div class="tm-perf-title">磁盘使用</div>
                        <div class="tm-perf-value">${stats.diskUsed} / ${stats.diskTotal} GB</div>
                        <div class="tm-perf-bar">
                            <div class="tm-perf-bar-fill" style="width: ${stats.diskPercent}%"></div>
                        </div>
                    </div>
                    <div class="tm-perf-card">
                        <div class="tm-perf-title">运行时间</div>
                        <div class="tm-perf-value">${stats.uptime}</div>
                    </div>
                    <div class="tm-perf-card">
                        <div class="tm-perf-title">窗口数量</div>
                        <div class="tm-perf-value">${stats.windowCount}</div>
                    </div>
                    <div class="tm-perf-card">
                        <div class="tm-perf-title">存储使用</div>
                        <div class="tm-perf-value">${stats.storageUsed} KB</div>
                    </div>
                </div>
            </div>
        `;
    }

    getWindowsTab() {
        const windows = Array.from(windowManager.windows.values());
        return `
            <div class="tm-tab-content" data-tab="windows">
                <div class="tm-toolbar">
                    <button class="tm-btn-refresh">🔄 刷新</button>
                    <button class="tm-btn-close-window">❌ 关闭窗口</button>
                </div>
                <table class="tm-process-table">
                    <thead>
                        <tr>
                            <th>窗口标题</th>
                            <th>应用</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${windows.map(w => `
                            <tr data-window-id="${w.id}">
                                <td>${w.icon} ${w.title}</td>
                                <td>${w.icon}</td>
                                <td><span class="tm-status ${w.minimized ? 'minimized' : 'running'}">${w.minimized ? '最小化' : '运行中'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getProcessList() {
        const baseProcesses = [
            { name: 'System', icon: '⚙️', pid: 1, cpu: 2, memory: 128, status: 'running', statusText: '运行中' },
            { name: 'WindowManager', icon: '🪟', pid: 100, cpu: 5, memory: 64, status: 'running', statusText: '运行中' },
            { name: 'Desktop', icon: '🖥️', pid: 101, cpu: 1, memory: 32, status: 'running', statusText: '运行中' },
            { name: 'Taskbar', icon: '📊', pid: 102, cpu: 1, memory: 16, status: 'running', statusText: '运行中' },
        ];

        // 添加当前打开的窗口
        const windows = Array.from(windowManager.windows.values());
        windows.forEach((w, index) => {
            baseProcesses.push({
                name: w.title,
                icon: w.icon,
                pid: 200 + index,
                cpu: Math.floor(Math.random() * 10),
                memory: Math.floor(Math.random() * 100) + 20,
                status: w.minimized ? 'sleeping' : 'running',
                statusText: w.minimized ? '休眠' : '运行中'
            });
        });

        return baseProcesses;
    }

    getSystemStats() {
        const uptime = Math.floor(performance.now() / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        // 计算 LocalStorage 使用量
        let storageUsed = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                storageUsed += localStorage[key].length + key.length;
            }
        }

        return {
            cpu: Math.floor(Math.random() * 30) + 10,
            memoryUsed: 2.4,
            memoryTotal: navigator.deviceMemory || 4,
            memoryPercent: 60,
            diskUsed: 42,
            diskTotal: 100,
            diskPercent: 42,
            uptime: `${hours}h ${minutes}m`,
            windowCount: windowManager.windows.size,
            storageUsed: Math.floor(storageUsed / 1024)
        };
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const instance = this.instances.get(windowId);

        // 标签切换
        content.querySelectorAll('.tm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(windowId, tabName);
            });
        });

        // 刷新按钮
        const btnRefresh = content.querySelector('.tm-btn-refresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                this.refreshContent(windowId);
                notify.success('刷新', '数据已更新');
            });
        }

        // 结束任务按钮
        const btnEndTask = content.querySelector('.tm-btn-end-task');
        if (btnEndTask) {
            btnEndTask.addEventListener('click', () => {
                const selected = content.querySelector('.tm-process-table tbody tr.selected');
                if (selected) {
                    const pid = selected.dataset.pid;
                    notify.info('提示', `进程 PID ${pid} 是系统进程，无法结束`);
                } else {
                    notify.warning('提示', '请先选择一个进程');
                }
            });
        }

        // 关闭窗口按钮
        const btnCloseWindow = content.querySelector('.tm-btn-close-window');
        if (btnCloseWindow) {
            btnCloseWindow.addEventListener('click', () => {
                const selected = content.querySelector('.tm-process-table tbody tr.selected');
                if (selected) {
                    const wid = selected.dataset.windowId;
                    if (wid && wid !== windowId) {
                        windowManager.closeWindow(wid);
                        this.refreshContent(windowId);
                        notify.success('成功', '窗口已关闭');
                    }
                } else {
                    notify.warning('提示', '请先选择一个窗口');
                }
            });
        }

        // 表格行选择
        content.addEventListener('click', (e) => {
            const row = e.target.closest('.tm-process-table tbody tr');
            if (row) {
                content.querySelectorAll('.tm-process-table tbody tr').forEach(r => r.classList.remove('selected'));
                row.classList.add('selected');
            }
        });

        // 窗口关闭时清理
        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.stopAutoUpdate(windowId);
                    this.instances.delete(windowId);
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

        // 更新标签样式
        content.querySelectorAll('.tm-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 更新内容
        const contentArea = content.querySelector('.task-manager-content');
        if (tabName === 'processes') {
            contentArea.innerHTML = this.getProcessesTab();
        } else if (tabName === 'performance') {
            contentArea.innerHTML = this.getPerformanceTab();
        } else if (tabName === 'windows') {
            contentArea.innerHTML = this.getWindowsTab();
        }

        // 重新绑定事件
        this.attachEvents(windowId);
    }

    refreshContent(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;
        this.switchTab(windowId, instance.activeTab);
    }

    startAutoUpdate(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.updateInterval = setInterval(() => {
            this.refreshContent(windowId);
        }, 3000); // 每3秒更新一次
    }

    stopAutoUpdate(windowId) {
        const instance = this.instances.get(windowId);
        if (instance && instance.updateInterval) {
            clearInterval(instance.updateInterval);
            instance.updateInterval = null;
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['task-manager'] = new TaskManagerApp();