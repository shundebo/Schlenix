// Schlenix - 文本编辑器应用

class TextEditorApp {
    constructor() {
        this.currentFile = null;
        this.modified = false;
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '文本编辑器',
            icon: '📝',
            width: 700,
            height: 500,
            content: this.getContent()
        });

        this.attachEvents(windowId);
    }

    openWithContent(filename, content) {
        const windowId = windowManager.createWindow({
            title: `文本编辑器 - ${filename}`,
            icon: '📝',
            width: 700,
            height: 500,
            content: this.getContent(content)
        });

        this.currentFile = filename;
        this.attachEvents(windowId);
    }

    getContent(initialContent = '') {
        return `
            <div class="text-editor-toolbar">
                <button class="te-btn-new" title="新建">📄 新建</button>
                <button class="te-btn-open" title="打开">📂 打开</button>
                <button class="te-btn-save" title="保存">💾 保存</button>
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

        // 监听文本变化
        textarea.addEventListener('input', () => {
            this.modified = true;
            this.updateTitle(windowId);
        });

        // 新建
        btnNew.addEventListener('click', () => {
            if (this.modified) {
                if (!confirm('当前文档未保存，确定要新建吗？')) {
                    return;
                }
            }
            textarea.value = '';
            this.currentFile = null;
            this.modified = false;
            this.updateTitle(windowId, '文本编辑器');
        });

        // 打开（模拟）
        btnOpen.addEventListener('click', () => {
            alert('打开文件功能：请使用文件管理器双击文本文件打开');
        });

        // 保存（模拟）
        btnSave.addEventListener('click', () => {
            const content = textarea.value;
            if (this.currentFile) {
                alert(`文件 "${this.currentFile}" 已保存（模拟）`);
            } else {
                const filename = prompt('请输入文件名：', 'untitled.txt');
                if (filename) {
                    this.currentFile = filename;
                    alert(`文件 "${filename}" 已保存（模拟）`);
                }
            }
            this.modified = false;
            this.updateTitle(windowId);
        });
    }

    updateTitle(windowId, title = null) {
        const window = windowManager.windows.get(windowId);
        if (!window) return;

        if (title) {
            window.title = title;
        } else {
            const filename = this.currentFile || '未命名';
            const modified = this.modified ? ' *' : '';
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
