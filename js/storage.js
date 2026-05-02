// Schlenix - 存储管理系统

class StorageManager {
    constructor() {
        this.prefix = 'schlenix_';
        this.init();
    }

    init() {
        // 初始化默认设置
        if (!this.get('settings')) {
            this.set('settings', {
                theme: 'dark',
                wallpaper: 'default',
                language: 'zh-CN',
                animations: true
            });
        }

        // 初始化文件系统
        if (!this.get('filesystem')) {
            this.set('filesystem', this.getDefaultFileSystem());
        }
    }

    getDefaultFileSystem() {
        return {
            '/': {
                type: 'directory',
                created: Date.now(),
                modified: Date.now(),
                children: {
                    'home': {
                        type: 'directory',
                        created: Date.now(),
                        modified: Date.now(),
                        children: {
                            'user': {
                                type: 'directory',
                                created: Date.now(),
                                modified: Date.now(),
                                children: {
                                    'Documents': {
                                        type: 'directory',
                                        created: Date.now(),
                                        modified: Date.now(),
                                        children: {
                                            'welcome.txt': {
                                                type: 'file',
                                                size: 1024,
                                                created: Date.now(),
                                                modified: Date.now(),
                                                content: '欢迎使用 Schlenix！\n\n这是一个基于 Web 技术构建的前端伪操作系统。\n\n您可以：\n- 使用文件管理器浏览文件\n- 在终端中执行命令\n- 使用文本编辑器编辑文件\n- 打开多个应用程序窗口\n\n祝您使用愉快！'
                                            },
                                            'readme.md': {
                                                type: 'file',
                                                size: 2048,
                                                created: Date.now(),
                                                modified: Date.now(),
                                                content: '# Schlenix 操作系统\n\n## 简介\n\n这是一个前端伪操作系统项目。\n\n## 特性\n\n- 完整的桌面环境\n- 窗口管理系统\n- 虚拟文件系统\n- 多个内置应用\n\n## 技术栈\n\n- HTML5\n- CSS3\n- JavaScript\n'
                                            }
                                        }
                                    },
                                    'Downloads': {
                                        type: 'directory',
                                        created: Date.now(),
                                        modified: Date.now(),
                                        children: {}
                                    },
                                    'Pictures': {
                                        type: 'directory',
                                        created: Date.now(),
                                        modified: Date.now(),
                                        children: {}
                                    },
                                    'Music': {
                                        type: 'directory',
                                        created: Date.now(),
                                        modified: Date.now(),
                                        children: {}
                                    },
                                    'Videos': {
                                        type: 'directory',
                                        created: Date.now(),
                                        modified: Date.now(),
                                        children: {}
                                    }
                                }
                            }
                        }
                    },
                    'etc': {
                        type: 'directory',
                        created: Date.now(),
                        modified: Date.now(),
                        children: {
                            'config.json': {
                                type: 'file',
                                size: 512,
                                created: Date.now(),
                                modified: Date.now(),
                                content: '{\n  "theme": "dark",\n  "version": "1.0.0"\n}'
                            }
                        }
                    },
                    'usr': {
                        type: 'directory',
                        created: Date.now(),
                        modified: Date.now(),
                        children: {}
                    },
                    'var': {
                        type: 'directory',
                        created: Date.now(),
                        modified: Date.now(),
                        children: {}
                    }
                }
            }
        };
    }

    // 基础存储操作
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    // 文件系统操作
    getFileSystem() {
        return this.get('filesystem');
    }

    saveFileSystem(fs) {
        return this.set('filesystem', fs);
    }

    // 路径解析
    parsePath(path) {
        return path.split('/').filter(p => p);
    }

    // 获取路径对应的节点
    getNode(path) {
        const fs = this.getFileSystem();
        if (path === '/') return fs['/'];

        const parts = this.parsePath(path);
        let current = fs['/'];

        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                return null;
            }
            current = current.children[part];
        }

        return current;
    }

    // 获取父节点
    getParentNode(path) {
        const parts = this.parsePath(path);
        if (parts.length === 0) return null;

        parts.pop();
        return this.getNode('/' + parts.join('/'));
    }

    // 创建目录
    mkdir(path) {
        const fs = this.getFileSystem();
        const parts = this.parsePath(path);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNode(parentPath);

        if (!parent) {
            return { success: false, error: '父目录不存在' };
        }

        if (parent.type !== 'directory') {
            return { success: false, error: '父路径不是目录' };
        }

        if (parent.children[name]) {
            return { success: false, error: '目录已存在' };
        }

        parent.children[name] = {
            type: 'directory',
            created: Date.now(),
            modified: Date.now(),
            children: {}
        };

        this.saveFileSystem(fs);
        return { success: true };
    }

    // 创建文件
    touch(path, content = '') {
        const fs = this.getFileSystem();
        const parts = this.parsePath(path);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNode(parentPath);

        if (!parent) {
            return { success: false, error: '父目录不存在' };
        }

        if (parent.type !== 'directory') {
            return { success: false, error: '父路径不是目录' };
        }

        const now = Date.now();
        parent.children[name] = {
            type: 'file',
            size: content.length,
            created: now,
            modified: now,
            content: content
        };

        this.saveFileSystem(fs);
        return { success: true };
    }

    // 读取文件
    readFile(path) {
        const node = this.getNode(path);
        if (!node) {
            return { success: false, error: '文件不存在' };
        }

        if (node.type !== 'file') {
            return { success: false, error: '不是文件' };
        }

        return { success: true, content: node.content };
    }

    // 写入文件
    writeFile(path, content) {
        const node = this.getNode(path);
        if (!node) {
            return this.touch(path, content);
        }

        if (node.type !== 'file') {
            return { success: false, error: '不是文件' };
        }

        node.content = content;
        node.size = content.length;
        node.modified = Date.now();

        const fs = this.getFileSystem();
        this.saveFileSystem(fs);
        return { success: true };
    }

    // 删除文件或目录
    rm(path, recursive = false) {
        const fs = this.getFileSystem();
        const parts = this.parsePath(path);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNode(parentPath);

        if (!parent) {
            return { success: false, error: '父目录不存在' };
        }

        const node = parent.children[name];
        if (!node) {
            return { success: false, error: '文件或目录不存在' };
        }

        if (node.type === 'directory' && !recursive && Object.keys(node.children).length > 0) {
            return { success: false, error: '目录不为空，使用 -r 参数递归删除' };
        }

        delete parent.children[name];
        this.saveFileSystem(fs);
        return { success: true };
    }

    // 移动/重命名
    mv(oldPath, newPath) {
        const fs = this.getFileSystem();
        const node = this.getNode(oldPath);
        
        if (!node) {
            return { success: false, error: '源文件不存在' };
        }

        // 获取源文件名和父目录
        const oldParts = this.parsePath(oldPath);
        const oldName = oldParts.pop();
        const oldParentPath = '/' + oldParts.join('/');
        const oldParent = this.getNode(oldParentPath);

        // 获取目标文件名和父目录
        const newParts = this.parsePath(newPath);
        const newName = newParts.pop();
        const newParentPath = '/' + newParts.join('/');
        const newParent = this.getNode(newParentPath);

        if (!newParent) {
            return { success: false, error: '目标目录不存在' };
        }

        if (newParent.children[newName]) {
            return { success: false, error: '目标文件已存在' };
        }

        // 移动节点
        newParent.children[newName] = node;
        delete oldParent.children[oldName];

        this.saveFileSystem(fs);
        return { success: true };
    }

    // 列出目录内容
    ls(path) {
        const node = this.getNode(path);
        if (!node) {
            return { success: false, error: '目录不存在' };
        }

        if (node.type !== 'directory') {
            return { success: false, error: '不是目录' };
        }

        return { success: true, items: node.children };
    }
}

// 全局存储管理器实例
const storage = new StorageManager();
