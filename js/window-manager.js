// Schlenix - 窗口管理器

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndexCounter = 100;
        this.container = document.getElementById('windows-container');
    }

    createWindow(options) {
        const id = Utils.generateId();
        const window = {
            id,
            title: options.title || '未命名窗口',
            icon: options.icon || '📄',
            width: options.width || 600,
            height: options.height || 400,
            x: options.x || 100,
            y: options.y || 100,
            content: options.content || '',
            minimized: false,
            maximized: false,
            element: null
        };

        // 创建窗口元素
        const windowEl = this.createWindowElement(window);
        window.element = windowEl;
        
        this.container.appendChild(windowEl);
        this.windows.set(id, window);
        
        // 居中窗口
        if (!options.x && !options.y) {
            this.centerWindow(id);
        }
        
        this.focusWindow(id);
        this.updateTaskbar();
        
        return id;
    }

    createWindowElement(window) {
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = window.id;
        windowEl.style.width = window.width + 'px';
        windowEl.style.height = window.height + 'px';
        windowEl.style.left = window.x + 'px';
        windowEl.style.top = window.y + 'px';
        windowEl.style.zIndex = this.zIndexCounter++;

        windowEl.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title">
                    <span class="window-icon">${window.icon}</span>
                    <span class="window-title-text">${window.title}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control-btn minimize" title="最小化">−</button>
                    <button class="window-control-btn maximize" title="最大化">□</button>
                    <button class="window-control-btn close" title="关闭">×</button>
                </div>
            </div>
            <div class="window-content">${window.content}</div>
            <div class="window-resize-handle n"></div>
            <div class="window-resize-handle s"></div>
            <div class="window-resize-handle e"></div>
            <div class="window-resize-handle w"></div>
            <div class="window-resize-handle ne"></div>
            <div class="window-resize-handle nw"></div>
            <div class="window-resize-handle se"></div>
            <div class="window-resize-handle sw"></div>
        `;

        this.attachWindowEvents(windowEl, window.id);
        return windowEl;
    }

    attachWindowEvents(windowEl, windowId) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        const minimizeBtn = windowEl.querySelector('.minimize');
        const maximizeBtn = windowEl.querySelector('.maximize');
        const closeBtn = windowEl.querySelector('.close');

        // 点击窗口聚焦
        windowEl.addEventListener('mousedown', () => {
            this.focusWindow(windowId);
        });

        // 窗口右键菜单
        titlebar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showWindowContextMenu(e.clientX, e.clientY, windowId);
        });

        // 拖动窗口
        let isDragging = false;
        let dragStartX, dragStartY, windowStartX, windowStartY;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            const window = this.windows.get(windowId);
            if (window.maximized) return;

            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            windowStartX = windowEl.offsetLeft;
            windowStartY = windowEl.offsetTop;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            windowEl.style.left = (windowStartX + deltaX) + 'px';
            windowEl.style.top = (windowStartY + deltaY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // 双击标题栏最大化
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.toggleMaximize(windowId);
        });

        // 窗口控制按钮
        minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowId));
        maximizeBtn.addEventListener('click', () => this.toggleMaximize(windowId));
        closeBtn.addEventListener('click', () => this.closeWindow(windowId));

        // 调整窗口大小
        this.attachResizeHandlers(windowEl, windowId);
    }

    attachResizeHandlers(windowEl, windowId) {
        const handles = windowEl.querySelectorAll('.window-resize-handle');
        
        handles.forEach(handle => {
            let isResizing = false;
            let startX, startY, startWidth, startHeight, startLeft, startTop;
            const direction = handle.className.split(' ')[1];

            handle.addEventListener('mousedown', (e) => {
                const window = this.windows.get(windowId);
                if (window.maximized) return;

                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = windowEl.offsetWidth;
                startHeight = windowEl.offsetHeight;
                startLeft = windowEl.offsetLeft;
                startTop = windowEl.offsetTop;

                e.preventDefault();
                e.stopPropagation();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (direction.includes('e')) {
                    windowEl.style.width = Math.max(300, startWidth + deltaX) + 'px';
                }
                if (direction.includes('w')) {
                    const newWidth = Math.max(300, startWidth - deltaX);
                    windowEl.style.width = newWidth + 'px';
                    windowEl.style.left = (startLeft + startWidth - newWidth) + 'px';
                }
                if (direction.includes('s')) {
                    windowEl.style.height = Math.max(200, startHeight + deltaY) + 'px';
                }
                if (direction.includes('n')) {
                    const newHeight = Math.max(200, startHeight - deltaY);
                    windowEl.style.height = newHeight + 'px';
                    windowEl.style.top = (startTop + startHeight - newHeight) + 'px';
                }
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
            });
        });
    }

    focusWindow(windowId) {
        if (this.activeWindow === windowId) return;

        // 移除之前的活动状态
        if (this.activeWindow) {
            const prevWindow = this.windows.get(this.activeWindow);
            if (prevWindow && prevWindow.element) {
                prevWindow.element.classList.remove('active');
            }
        }

        // 设置新的活动窗口
        const window = this.windows.get(windowId);
        if (window && window.element) {
            window.element.classList.add('active');
            window.element.style.zIndex = this.zIndexCounter++;
            this.activeWindow = windowId;
            this.updateTaskbar();
        }
    }

    minimizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.minimized = true;
        window.element.style.display = 'none';
        
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }
        
        this.updateTaskbar();
    }

    restoreWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.minimized = false;
        window.element.style.display = 'flex';
        this.focusWindow(windowId);
    }

    toggleMaximize(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.maximized = !window.maximized;
        
        if (window.maximized) {
            window.element.classList.add('maximized');
        } else {
            window.element.classList.remove('maximized');
        }
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.element.remove();
        this.windows.delete(windowId);
        
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }
        
        this.updateTaskbar();
    }

    centerWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        const desktop = document.getElementById('desktop');
        const x = (desktop.offsetWidth - window.width) / 2;
        const y = (desktop.offsetHeight - window.height) / 2;

        window.element.style.left = Math.max(0, x) + 'px';
        window.element.style.top = Math.max(0, y) + 'px';
    }

    showWindowContextMenu(x, y, windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        const items = [
            {
                icon: '↕️',
                label: window.maximized ? '还原' : '最大化',
                action: () => this.toggleMaximize(windowId)
            },
            {
                icon: '−',
                label: '最小化',
                action: () => this.minimizeWindow(windowId)
            },
            { separator: true },
            {
                icon: '×',
                label: '关闭',
                shortcut: 'Alt+F4',
                action: () => this.closeWindow(windowId)
            }
        ];

        contextMenu.show(x, y, items);
    }

    updateTaskbar() {
        const taskbarWindows = document.getElementById('taskbar-windows');
        taskbarWindows.innerHTML = '';

        this.windows.forEach((window, id) => {
            const item = document.createElement('div');
            item.className = 'taskbar-window-item';
            if (this.activeWindow === id && !window.minimized) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <span class="taskbar-window-icon">${window.icon}</span>
                <span class="taskbar-window-title">${window.title}</span>
            `;
            
            item.addEventListener('click', () => {
                if (window.minimized) {
                    this.restoreWindow(id);
                } else if (this.activeWindow === id) {
                    this.minimizeWindow(id);
                } else {
                    this.focusWindow(id);
                }
            });

            // 任务栏项目右键菜单
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showWindowContextMenu(e.clientX, e.clientY, id);
            });
            
            taskbarWindows.appendChild(item);
        });
    }

    getWindowContent(windowId) {
        const window = this.windows.get(windowId);
        return window ? window.element.querySelector('.window-content') : null;
    }
}

// 全局窗口管理器实例
const windowManager = new WindowManager();