// Schlenix - 文件管理器应用

class FileManagerApp {
    constructor() {
        this.currentPath = '/home/user';
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '文件管理器',
            icon: '📁',
            width: 800,
            height: 500,
            content: this.getContent()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="file-manager-toolbar">
                <button class="fm-btn-back" title="后退">◀</button>
                <button class="fm-btn-forward" title="前进">▶</button>
                <button class="fm-btn-up" title="上级目录">⬆</button>
                <input type="text" class="file-manager-path" value="${this.currentPath}" readonly>
                <button class="fm-btn-refresh" title="刷新">🔄</button>
                <button class="fm-btn-new-folder" title="新建文件夹">📁+</button>
                <button class="fm-btn-new-file" title="新建文件">📄+</button>
            </div>
            <div class="file-manager-content">
                <div class="file-manager-sidebar">
                    <div class="sidebar-item active" data-path="/home/user">
                        <span>🏠</span>
                        <span>主目录</span>
                    </div>
                    <div class="sidebar-item" data-path="/home/user/Documents">
                        <span>📄</span>
                        <span>文档</span>
                    </div>
                    <div class="sidebar-item" data-path="/home/user/Downloads">
                        <span>📥</span>
                        <span>下载</span>
                    </div>
                    <div class="sidebar-item" data-path="/home/user/Pictures">
                        <span>🖼️</span>
                        <span>图片</span>
                    </div>
                    <div class="sidebar-item" data-path="/home/user/Music">
                        <span>🎵</span>
                        <span>音乐</span>
                    </div>
                    <div class="sidebar-item" data-path="/home/user/Videos">
                        <span>🎬</span>
                        <span>视频</span>
                    </div>
                </div>
                <div class="file-list">
                    ${this.renderFileList()}
                </div>
            </div>
        `;
    }

    renderFileList() {
        const result = storage.ls(this.currentPath);
        if (!result.success) {
            return `<div style="padding: 20px; color: var(--text-secondary);">${result.error}</div>`;
        }

        const items = result.items;
        if (!items || Object.keys(items).length === 0) {
            return '<div style="padding: 20px; color: var(--text-secondary);">此文件夹为空</div>';
        }

        let html = '';
        for (const [name, item] of Object.entries(items)) {
            const icon = item.type === 'directory' ? '📁' : Utils.getFileIcon(name);
            const size = item.type === 'file' ? Utils.formatFileSize(item.size || 0) : '';
            const modified = new Date(item.modified).toLocaleString('zh-CN');
            
            html += `
                <div class="file-item" data-name="${name}" data-type="${item.type}">
                    <span class="file-item-icon">${icon}</span>
                    <span class="file-item-name">${name}</span>
                    <span class="file-item-size">${size}</span>
                    <span class="file-item-modified">${modified}</span>
                </div>
            `;
        }

        return html;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        // 侧边栏导航
        content.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.navigateTo(path, windowId);
                
                content.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // 文件列表双击
        content.addEventListener('dblclick', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;

            const name = fileItem.dataset.name;
            const type = fileItem.dataset.type;

            if (type === 'directory') {
                const newPath = this.currentPath === '/' ? '/' + name : this.currentPath + '/' + name;
                this.navigateTo(newPath, windowId);
            } else {
                this.openFile(name);
            }
        });

        // 文件列表右键菜单
        content.addEventListener('contextmenu', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                e.preventDefault();
                this.showFileContextMenu(e.clientX, e.clientY, fileItem.dataset.name, fileItem.dataset.type);
            }
        });

        // 工具栏按钮
        const btnUp = content.querySelector('.fm-btn-up');
        btnUp.addEventListener('click', () => {
            if (this.currentPath === '/') return;
            const parts = this.currentPath.split('/').filter(p => p);
            parts.pop();
            const newPath = '/' + parts.join('/');
            this.navigateTo(newPath || '/', windowId);
        });

        const btnRefresh = content.querySelector('.fm-btn-refresh');
        btnRefresh.addEventListener('click', () => {
            this.navigateTo(this.currentPath, windowId);
            notify.success('刷新', '文件列表已刷新');
        });

        const btnNewFolder = content.querySelector('.fm-btn-new-folder');
        btnNewFolder.addEventListener('click', () => {
            this.createNewFolder(windowId);
        });

        const btnNewFile = content.querySelector('.fm-btn-new-file');
        btnNewFile.addEventListener('click', () => {
            this.createNewFile(windowId);
        });
    }

    navigateTo(path, windowId) {
        this.currentPath = path;
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const pathInput = content.querySelector('.file-manager-path');
        const fileList = content.querySelector('.file-list');

        pathInput.value = path;
        fileList.innerHTML = this.renderFileList();
    }

    openFile(filename) {
        const filePath = this.currentPath === '/' ? '/' + filename : this.currentPath + '/' + filename;
        const result = storage.readFile(filePath);
        
        if (result.success && window.apps && window.apps['text-editor']) {
            window.apps['text-editor'].openWithContent(filename, result.content, filePath);
        } else {
            notify.error('错误', result.error || '无法打开文件');
        }
    }

    showFileContextMenu(x, y, name, type) {
        const items = [
            {
                icon: '📂',
                label: '打开',
                action: () => {
                    if (type === 'directory') {
                        const newPath = this.currentPath === '/' ? '/' + name : this.currentPath + '/' + name;
                        this.navigateTo(newPath, windowManager.activeWindow);
                    } else {
                        this.openFile(name);
                    }
                }
            },
            { separator: true },
            {
                icon: '✏️',
                label: '重命名',
                action: () => this.renameItem(name)
            },
            {
                icon: '🗑️',
                label: '删除',
                action: () => this.deleteItem(name, type)
            }
        ];

        contextMenu.show(x, y, items);
    }

    createNewFolder(windowId) {
        const name = prompt('请输入文件夹名称：', '新建文件夹');
        if (!name) return;

        const newPath = this.currentPath === '/' ? '/' + name : this.currentPath + '/' + name;
        const result = storage.mkdir(newPath);

        if (result.success) {
            notify.success('成功', `文件夹 "${name}" 已创建`);
            this.navigateTo(this.currentPath, windowId);
        } else {
            notify.error('错误', result.error);
        }
    }

    createNewFile(windowId) {
        const name = prompt('请输入文件名称：', 'untitled.txt');
        if (!name) return;

        const newPath = this.currentPath === '/' ? '/' + name : this.currentPath + '/' + name;
        const result = storage.touch(newPath, '');

        if (result.success) {
            notify.success('成功', `文件 "${name}" 已创建`);
            this.navigateTo(this.currentPath, windowId);
        } else {
            notify.error('错误', result.error);
        }
    }

    renameItem(oldName) {
        const newName = prompt('请输入新名称：', oldName);
        if (!newName || newName === oldName) return;

        const oldPath = this.currentPath === '/' ? '/' + oldName : this.currentPath + '/' + oldName;
        const newPath = this.currentPath === '/' ? '/' + newName : this.currentPath + '/' + newName;
        const result = storage.mv(oldPath, newPath);

        if (result.success) {
            notify.success('成功', `已重命名为 "${newName}"`);
            this.navigateTo(this.currentPath, windowManager.activeWindow);
        } else {
            notify.error('错误', result.error);
        }
    }

    deleteItem(name, type) {
        const confirmMsg = type === 'directory' 
            ? `确定要删除文件夹 "${name}" 及其所有内容吗？`
            : `确定要删除文件 "${name}" 吗？`;
        
        if (!confirm(confirmMsg)) return;

        const path = this.currentPath === '/' ? '/' + name : this.currentPath + '/' + name;
        const result = storage.rm(path, true);

        if (result.success) {
            notify.success('成功', `"${name}" 已删除`);
            this.navigateTo(this.currentPath, windowManager.activeWindow);
        } else {
            notify.error('错误', result.error);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['file-manager'] = new FileManagerApp();
