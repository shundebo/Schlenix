// Schlenix - 桌面管理器

class Desktop {
    constructor() {
        this.selectedIcon = null;
        this.draggedIcon = null;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.init();
    }

    init() {
        this.loadIconPositions();
        this.attachDesktopEvents();
        this.attachIconEvents();
    }

    loadIconPositions() {
        const positions = storage.get('desktop_icon_positions') || {};
        const icons = document.querySelectorAll('.desktop-icon');
        
        icons.forEach(icon => {
            const appName = icon.dataset.app;
            if (positions[appName]) {
                icon.style.position = 'absolute';
                icon.style.left = positions[appName].x + 'px';
                icon.style.top = positions[appName].y + 'px';
            }
        });
    }

    saveIconPosition(appName, x, y) {
        const positions = storage.get('desktop_icon_positions') || {};
        positions[appName] = { x, y };
        storage.set('desktop_icon_positions', positions);
    }

    attachDesktopEvents() {
        const desktop = document.getElementById('desktop');

        // 右键菜单
        desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        // 点击桌面取消选择
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop || e.target === document.getElementById('desktop-icons')) {
                this.deselectIcon();
            }
        });

        // 鼠标移动（拖拽）
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.draggedIcon) {
                e.preventDefault();
                const x = e.clientX - this.dragOffsetX;
                const y = e.clientY - this.dragOffsetY;
                
                // 限制在桌面范围内
                const desktop = document.getElementById('desktop');
                const maxX = desktop.clientWidth - this.draggedIcon.offsetWidth;
                const maxY = desktop.clientHeight - this.draggedIcon.offsetHeight;
                
                const boundedX = Math.max(0, Math.min(x, maxX));
                const boundedY = Math.max(0, Math.min(y, maxY));
                
                this.draggedIcon.style.left = boundedX + 'px';
                this.draggedIcon.style.top = boundedY + 'px';
            }
        });

        // 鼠标释放（停止拖拽）
        document.addEventListener('mouseup', () => {
            if (this.isDragging && this.draggedIcon) {
                const appName = this.draggedIcon.dataset.app;
                const x = parseInt(this.draggedIcon.style.left);
                const y = parseInt(this.draggedIcon.style.top);
                this.saveIconPosition(appName, x, y);
                
                this.isDragging = false;
                this.draggedIcon.style.cursor = 'pointer';
                this.draggedIcon = null;
            }
        });
    }

    attachIconEvents() {
        const icons = document.querySelectorAll('.desktop-icon');

        icons.forEach(icon => {
            // 设置为可定位
            if (!icon.style.position) {
                icon.style.position = 'absolute';
            }

            // 鼠标按下（开始拖拽）
            icon.addEventListener('mousedown', (e) => {
                // 只响应左键
                if (e.button !== 0) return;
                
                e.stopPropagation();
                this.selectIcon(icon);
                
                // 记录拖拽信息
                this.draggedIcon = icon;
                this.dragOffsetX = e.clientX - icon.offsetLeft;
                this.dragOffsetY = e.clientY - icon.offsetTop;
                
                // 延迟启动拖拽，避免误触
                setTimeout(() => {
                    if (this.draggedIcon === icon) {
                        this.isDragging = true;
                        icon.style.cursor = 'move';
                    }
                }, 100);
            });

            // 双击打开
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.isDragging = false;
                this.draggedIcon = null;
                const appName = icon.dataset.app;
                this.openApp(appName);
            });

            // 右键菜单
            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isDragging = false;
                this.draggedIcon = null;
                this.selectIcon(icon);
                this.showIconContextMenu(e.clientX, e.clientY, icon);
            });
        });
    }

    selectIcon(icon) {
        this.deselectIcon();
        icon.classList.add('selected');
        this.selectedIcon = icon;
    }

    deselectIcon() {
        if (this.selectedIcon) {
            this.selectedIcon.classList.remove('selected');
            this.selectedIcon = null;
        }
    }

    openApp(appName) {
        if (window.apps && window.apps[appName]) {
            window.apps[appName].open();
        }
    }

    showContextMenu(x, y) {
        this.removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        menu.innerHTML = `
            <div class="context-menu-item" data-action="refresh">
                <span>🔄</span>
                <span>刷新</span>
            </div>
            <div class="context-menu-item" data-action="reset-icons">
                <span>📍</span>
                <span>重置图标位置</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="settings">
                <span>⚙️</span>
                <span>显示设置</span>
            </div>
        `;

        document.body.appendChild(menu);

        // 点击菜单项
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
                this.removeContextMenu();
            });
        });

        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', () => this.removeContextMenu(), { once: true });
        }, 0);
    }

    showIconContextMenu(x, y, icon) {
        this.removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        const appName = icon.dataset.app;

        menu.innerHTML = `
            <div class="context-menu-item" data-action="open">
                <span>📂</span>
                <span>打开</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="properties">
                <span>ℹ️</span>
                <span>属性</span>
            </div>
        `;

        document.body.appendChild(menu);

        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                if (action === 'open') {
                    this.openApp(appName);
                }
                this.removeContextMenu();
            });
        });

        setTimeout(() => {
            document.addEventListener('click', () => this.removeContextMenu(), { once: true });
        }, 0);
    }

    removeContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    handleContextMenuAction(action) {
        switch (action) {
            case 'refresh':
                location.reload();
                break;
            case 'reset-icons':
                if (confirm('确定要重置所有图标位置吗？')) {
                    storage.remove('desktop_icon_positions');
                    location.reload();
                }
                break;
            case 'settings':
                this.openApp('settings');
                break;
        }
    }
}

// 初始化桌面
const desktop = new Desktop();
