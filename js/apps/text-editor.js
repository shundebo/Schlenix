// Schlenix - 文本编辑器应用

class TextEditorApp {
    constructor() {
        this.instances = new Map(); // 存储每个窗口的状态
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '文本编辑器',
            icon: '📝',
            width: 700,
            height: 500,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            currentFile: null,
            currentFilePath: null,
            modified: false
        });

        this.attachEvents(windowId);
    }

    openWithContent(filename, content, filepath = null) {
        const windowId = windowManager.createWindow({
            title: `文本编辑器 - ${filename}`,
            icon: '📝',
            width: 700,
            height: 500,
            content: this.getContent(content)
        });

        this.instances.set(windowId, {
            currentFile: filename,
            currentFilePath: filepath,
            modified: false
        });

        this.attachEvents(windowId);
    }

    getContent(initialContent = '') {
        return `
            <div class="text-editor-toolbar">
                <button class="te-btn-new" title="新建">📄 新建</button>
                <button class="te-btn-open" title="打开">📂 打开</button>
                <button class="te-btn-save" title="保存">💾 保存</button>
                <button class="te-btn-save-as" title="另存为">💾 另存为</button>
                <span style="flex: 1;"></span>
                <button class="te-btn-undo" title="撤销">↶</button>
                <button class="te-btn-redo" title="重做">↷</button>
            </div>
            <textarea class="text-editor-textarea" placeholder="在此输入文本...">${Utils.escapeHtml(initialContent)}</textarea>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const textarea = content.querySelector('.text-editor-textarea');
        const btnNew = content.querySelector('.te-btn-new');
        const btnOpen = content.querySelector('.te-btn-open');
        const btnSave = content.querySelector('.te-btn-save');
        const btnSaveAs = content.querySelector('.te-btn-save-as');

        // 监听文本变化
        textarea.addEventListener('input', () => {
            const instance = this.instances.get(windowId);
            if (instance) {
                instance.modified = true;
                this.updateTitle(windowId);
            }
        });

        // 新建
        btnNew.addEventListener('click', () => {
            const instance = this.instances.get(windowId);
            if (!instance) return;
            
            if (instance.modified) {
                if (!confirm('当前文档未保存，确定要新建吗？')) {
                    return;
                }
            }
            textarea.value = '';
            instance.currentFile = null;
            instance.currentFilePath = null;
            instance.modified = false;
            this.updateTitle(windowId, '文本编辑器');
        });

        // 打开
        btnOpen.addEventListener('click', () => {
            const instance = this.instances.get(windowId);
            if (!instance) return;
            
            const path = prompt('请输入文件路径：', '/home/user/Documents/welcome.txt');
            if (!path) return;

            const result = storage.readFile(path);
            if (result.success) {
                textarea.value = result.content;
                const parts = path.split('/');
                instance.currentFile = parts[parts.length - 1];
                instance.currentFilePath = path;
                instance.modified = false;
                this.updateTitle(windowId);
                notify.success('成功', `文件 "${instance.currentFile}" 已打开`);
            } else {
                notify.error('错误', result.error);
            }
        });

        // 保存
        btnSave.addEventListener('click', () => {
            this.saveFile(windowId, textarea.value);
        });

        // 另存为
        btnSaveAs.addEventListener('click', () => {
            this.saveFileAs(windowId, textarea.value);
        });

        // Ctrl+S 保存
        textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile(windowId, textarea.value);
            }
        });

        // 窗口关闭时清理实例
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

    saveFile(windowId, content) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        if (!instance.currentFilePath) {
            return this.saveFileAs(windowId, content);
        }

        const result = storage.writeFile(instance.currentFilePath, content);
        if (result.success) {
            instance.modified = false;
            this.updateTitle(windowId);
            notify.success('保存成功', `文件 "${instance.currentFile}" 已保存到 ${instance.currentFilePath}`);
        } else {
            notify.error('保存失败', result.error);
        }
    }

    saveFileAs(windowId, content) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const path = prompt('请输入保存路径：', '/home/user/Documents/untitled.txt');
        if (!path) return;

        const result = storage.writeFile(path, content);
        if (result.success) {
            const parts = path.split('/');
            instance.currentFile = parts[parts.length - 1];
            instance.currentFilePath = path;
            instance.modified = false;
            this.updateTitle(windowId);
            notify.success('保存成功', `文件 "${instance.currentFile}" 已保存到 ${path}`);
        } else {
            notify.error('保存失败', result.error);
        }
    }

    updateTitle(windowId, title = null) {
        const window = windowManager.windows.get(windowId);
        const instance = this.instances.get(windowId);
        if (!window || !instance) return;

        if (title) {
            window.title = title;
        } else {
            const filename = instance.currentFile || '未命名';
            const modified = instance.modified ? ' *' : '';
            window.title = `文本编辑器 - ${filename}${modified}`;
        }

        const titleElement = window.element.querySelector('.window-title-text');
        if (titleElement) {
            titleElement.textContent = window.title;
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['text-editor'] = new TextEditorApp();
