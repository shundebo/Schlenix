// Schlenix - 桌面管理器

class Desktop {
    constructor() {
        this.selectedIcon = null;
        this.init();
    }

    init() {
        this.attachDesktopEvents();
        this.attachIconEvents();
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
    }

    attachIconEvents() {
        const icons = document.querySelectorAll('.desktop-icon');

        icons.forEach(icon => {
            // 单击选择
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectIcon(icon);
            });

            // 双击打开
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const appName = icon.dataset.app;
                this.openApp(appName);
            });

            // 右键菜单
            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
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
            case 'settings':
                this.openApp('settings');
                break;
        }
    }
}

// 初始化桌面
const desktop = new Desktop();
