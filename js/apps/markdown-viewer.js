// Schlenix - Markdown 预览器

class MarkdownViewerApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: 'Markdown 预览器',
            icon: '📝',
            width: 900,
            height: 600,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            currentFile: null,
            markdown: ''
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="markdown-viewer-container">
                <div class="markdown-toolbar">
                    <button class="md-btn-open" title="打开文件">📂 打开</button>
                    <button class="md-btn-save" title="保存">💾 保存</button>
                    <button class="md-btn-export" title="导出HTML">📄 导出HTML</button>
                    <label class="md-btn-upload">
                        📁 本地文件
                        <input type="file" accept=".md,.markdown,.txt" style="display:none" class="md-file-input">
                    </label>
                </div>
                <div class="markdown-editor-container">
                    <div class="markdown-editor-pane">
                        <textarea class="markdown-editor" placeholder="在此输入 Markdown..."></textarea>
                    </div>
                    <div class="markdown-preview-pane">
                        <div class="markdown-preview"></div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const editor = content.querySelector('.markdown-editor');
        const preview = content.querySelector('.markdown-preview');
        const btnOpen = content.querySelector('.md-btn-open');
        const btnSave = content.querySelector('.md-btn-save');
        const btnExport = content.querySelector('.md-btn-export');
        const fileInput = content.querySelector('.md-file-input');

        // 实时预览
        editor.addEventListener('input', () => {
            const instance = this.instances.get(windowId);
            if (instance) {
                instance.markdown = editor.value;
                this.updatePreview(windowId);
            }
        });

        // 打开文件
        btnOpen.addEventListener('click', () => this.openFile(windowId));

        // 本地文件上传
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    editor.value = event.target.result;
                    const instance = this.instances.get(windowId);
                    if (instance) {
                        instance.markdown = event.target.result;
                        instance.currentFile = file.name;
                        this.updatePreview(windowId);
                        notify.success('成功', `已加载 ${file.name}`);
                    }
                };
                reader.readAsText(file);
            }
        });

        // 保存
        btnSave.addEventListener('click', () => this.saveFile(windowId));

        // 导出HTML
        btnExport.addEventListener('click', () => this.exportHTML(windowId));

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

    openFile(windowId) {
        const path = prompt('请输入 Markdown 文件路径：', '/home/user/Documents/readme.md');
        if (!path) return;

        const result = storage.readFile(path);
        if (result.success) {
            const content = windowManager.getWindowContent(windowId);
            const editor = content.querySelector('.markdown-editor');
            editor.value = result.content;

            const instance = this.instances.get(windowId);
            if (instance) {
                instance.markdown = result.content;
                instance.currentFile = path;
                this.updatePreview(windowId);
                notify.success('成功', '文件已打开');
            }
        } else {
            notify.error('错误', result.error);
        }
    }

    saveFile(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const path = instance.currentFile || prompt('请输入保存路径：', '/home/user/Documents/document.md');
        if (!path) return;

        const result = storage.writeFile(path, instance.markdown);
        if (result.success) {
            instance.currentFile = path;
            notify.success('保存成功', '文件已保存');
        } else {
            notify.error('保存失败', result.error);
        }
    }

    exportHTML(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const preview = content.querySelector('.markdown-preview');
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Markdown Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
    </style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.html';
        a.click();
        URL.revokeObjectURL(url);
        
        notify.success('导出成功', 'HTML 文件已下载');
    }

    updatePreview(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const preview = content.querySelector('.markdown-preview');
        preview.innerHTML = this.parseMarkdown(instance.markdown);
    }

    parseMarkdown(markdown) {
        let html = markdown;

        // 代码块
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
        });

        // 行内代码
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // 粗体和斜体
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // 图片
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // 引用
        html = html.replace(/^> (.+)/gim, '<blockquote>$1</blockquote>');

        // 无序列表
        html = html.replace(/^\* (.+)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // 有序列表
        html = html.replace(/^\d+\. (.+)/gim, '<li>$1</li>');

        // 水平线
        html = html.replace(/^---$/gim, '<hr>');

        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (!window.apps) window.apps = {};
window.apps['markdown-viewer'] = new MarkdownViewerApp();