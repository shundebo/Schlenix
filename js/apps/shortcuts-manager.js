// Schlenix - 快捷方式管理器应用

class ShortcutsManagerApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '快捷方式管理器',
            icon: '⌨️',
            width: 600,
            height: 500,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            shortcuts: this.loadShortcuts()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="shortcuts-container">
                <div class="shortcuts-header">
                    <h3>系统快捷键</h3>
                    <button class="shortcuts-add-btn">➕ 添加快捷键</button>
                </div>
                <div class="shortcuts-list"></div>
                <div class="shortcuts-footer">
                    <button class="shortcuts-reset-btn">🔄 恢复默认</button>
                    <button class="shortcuts-save-btn">💾 保存设置</button>
                </div>
            </div>
        `;
    }

    loadShortcuts() {
        const saved = storage.get('custom_shortcuts');
        if (saved) return saved;

        return [
            { key: 'Ctrl+Alt+T', action: 'terminal', name: '打开终端', enabled: true },
            { key: 'Ctrl+Alt+F', action: 'file-manager', name: '打开文件管理器', enabled: true },
            { key: 'Ctrl+Alt+B', action: 'browser', name: '打开浏览器', enabled: true },
            { key: 'Ctrl+Alt+N', action: 'notepad', name: '打开记事本', enabled: true },
            { key: 'Ctrl+Alt+M', action: 'task-manager', name: '打开任务管理器', enabled: true },
            { key: 'Ctrl+Alt+I', action: 'image-viewer', name: '打开图片查看器', enabled: true },
            { key: 'Ctrl+Alt+C', action: 'clock', name: '打开时钟', enabled: true },
            { key: 'Ctrl+Alt+W', action: 'weather', name: '打开天气', enabled: true },
            { key: 'Ctrl+Alt+P', action: 'music-player', name: '打开音乐播放器', enabled: true },
            { key: 'Ctrl+Alt+S', action: 'system-monitor', name: '打开系统监控', enabled: true }
        ];
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const addBtn = content.querySelector('.shortcuts-add-btn');
        const resetBtn = content.querySelector('.shortcuts-reset-btn');
        const saveBtn = content.querySelector('.shortcuts-save-btn');

        this.renderShortcuts(windowId);

        addBtn.addEventListener('click', () => this.addShortcut(windowId));
        resetBtn.addEventListener('click', () => this.resetShortcuts(windowId));
        saveBtn.addEventListener('click', () => this.saveShortcuts(windowId));

        // 窗口关闭时清理
        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.instances.delete(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    renderShortcuts(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const list = content.querySelector('.shortcuts-list');
        list.innerHTML = instance.shortcuts.map((shortcut, index) => `
            <div class="shortcut-item ${shortcut.enabled ? '' : 'disabled'}">
                <div class="shortcut-info">
                    <div class="shortcut-key">${shortcut.key}</div>
                    <div class="shortcut-name">${shortcut.name}</div>
                </div>
                <div class="shortcut-actions">
                    <button class="shortcut-toggle" data-index="${index}">
                        ${shortcut.enabled ? '✓' : '✗'}
                    </button>
                    <button class="shortcut-edit" data-index="${index}">✏️</button>
                    <button class="shortcut-delete" data-index="${index}">🗑️</button>
                </div>
            </div>
        `).join('');

        // 绑定事件
        list.querySelectorAll('.shortcut-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                instance.shortcuts[index].enabled = !instance.shortcuts[index].enabled;
                this.renderShortcuts(windowId);
            });
        });

        list.querySelectorAll('.shortcut-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.editShortcut(windowId, index);
            });
        });

        list.querySelectorAll('.shortcut-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (confirm('确定要删除这个快捷键吗？')) {
                    instance.shortcuts.splice(index, 1);
                    this.renderShortcuts(windowId);
                }
            });
        });
    }

    addShortcut(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const key = prompt('请输入快捷键（例如：Ctrl+Alt+X）：');
        if (!key) return;

        const name = prompt('请输入快捷键名称：');
        if (!name) return;

        const action = prompt('请输入应用 ID（例如：terminal）：');
        if (!action) return;

        instance.shortcuts.push({
            key: key,
            action: action,
            name: name,
            enabled: true
        });

        this.renderShortcuts(windowId);
        notify.success('成功', '快捷键已添加');
    }

    editShortcut(windowId, index) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const shortcut = instance.shortcuts[index];
        const newKey = prompt('修改快捷键：', shortcut.key);
        if (newKey) shortcut.key = newKey;

        const newName = prompt('修改名称：', shortcut.name);
        if (newName) shortcut.name = newName;

        this.renderShortcuts(windowId);
        notify.success('成功', '快捷键已更新');
    }

    resetShortcuts(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        if (!confirm('确定要恢复默认快捷键设置吗？')) return;

        storage.remove('custom_shortcuts');
        instance.shortcuts = this.loadShortcuts();
        this.renderShortcuts(windowId);
        notify.success('成功', '已恢复默认设置');
    }

    saveShortcuts(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        storage.set('custom_shortcuts', instance.shortcuts);
        notify.success('保存成功', '快捷键设置已保存');
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['shortcuts-manager'] = new ShortcutsManagerApp();