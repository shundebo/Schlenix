// Schlenix - 文件管理器应用

class FileManagerApp {
    constructor() {
        this.currentPath = '/home/user';
        this.fileSystem = this.initFileSystem();
    }

    initFileSystem() {
        return {
            '/': {
                type: 'directory',
                children: {
                    'home': {
                        type: 'directory',
                        children: {
                            'user': {
                                type: 'directory',
                                children: {
                                    'Documents': {
                                        type: 'directory',
                                        children: {
                                            'welcome.txt': { type: 'file', size: 1024, content: '欢迎使用 Schlenix！' },
                                            'readme.md': { type: 'file', size: 2048, content: '# Schlenix 操作系统\n\n这是一个前端伪操作系统项目。' }
                                        }
                                    },
                                    'Downloads': { type: 'directory', children: {} },
                                    'Pictures': {
                                        type: 'directory',
                                        children: {
                                            'wallpaper.png': { type: 'file', size: 524288 }
                                        }
                                    },
                                    'Music': { type: 'directory', children: {} },
                                    'Videos': { type: 'directory', children: {} }
                                }
                            }
                        }
                    },
                    'etc': {
                        type: 'directory',
                        children: {
                            'config.json': { type: 'file', size: 512, content: '{"theme": "dark"}' }
                        }
                    },
                    'usr': { type: 'directory', children: {} },
                    'var': { type: 'directory', children: {} }
                }
            }
        };
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
        const items = this.getItemsAtPath(this.currentPath);
        if (!items) return '<div style="padding: 20px;">路径不存在</div>';

        let html = '';
        for (const [name, item] of Object.entries(items)) {
            const icon = item.type === 'directory' ? '📁' : Utils.getFileIcon(name);
            const size = item.type === 'file' ? Utils.formatFileSize(item.size || 0) : '';
            
            html += `
                <div class="file-item" data-name="${name}" data-type="${item.type}">
                    <span class="file-item-icon">${icon}</span>
                    <span class="file-item-name">${name}</span>
                    <span class="file-item-size">${size}</span>
                </div>
            `;
        }

        return html || '<div style="padding: 20px; color: var(--text-secondary);">此文件夹为空</div>';
    }

    getItemsAtPath(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.fileSystem['/'];

        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                return null;
            }
            current = current.children[part];
        }

        return current.children || {};
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
                const newPath = this.currentPath + '/' + name;
                this.navigateTo(newPath, windowId);
            } else {
                this.openFile(name);
            }
        });

        // 工具栏按钮
        const btnUp = content.querySelector('.fm-btn-up');
        btnUp.addEventListener('click', () => {
            const parts = this.currentPath.split('/').filter(p => p);
            if (parts.length > 0) {
                parts.pop();
                const newPath = '/' + parts.join('/');
                this.navigateTo(newPath || '/home/user', windowId);
            }
        });

        const btnRefresh = content.querySelector('.fm-btn-refresh');
        btnRefresh.addEventListener('click', () => {
            this.navigateTo(this.currentPath, windowId);
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
        const items = this.getItemsAtPath(this.currentPath);
        const file = items[filename];
        
        if (file && file.content) {
            // 使用文本编辑器打开
            if (window.apps && window.apps['text-editor']) {
                window.apps['text-editor'].openWithContent(filename, file.content);
            }
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['file-manager'] = new FileManagerApp();
