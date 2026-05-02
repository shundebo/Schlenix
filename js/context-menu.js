// Schlenix - 右键菜单系统

class ContextMenu {
    constructor() {
        this.currentMenu = null;
    }

    show(x, y, items) {
        this.hide();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        items.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                if (item.disabled) {
                    menuItem.classList.add('disabled');
                }
                
                menuItem.innerHTML = `
                    <span class="context-menu-icon">${item.icon || ''}</span>
                    <span class="context-menu-text">${item.label}</span>
                    ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
                `;
                
                if (!item.disabled && item.action) {
                    menuItem.addEventListener('click', () => {
                        item.action();
                        this.hide();
                    });
                }
                
                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);
        this.currentMenu = menu;

        // 确保菜单在屏幕内
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - rect.width - 5) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (window.innerHeight - rect.height - 5) + 'px';
        }

        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', () => this.hide(), { once: true });
            document.addEventListener('contextmenu', () => this.hide(), { once: true });
        }, 0);
    }

    hide() {
        if (this.currentMenu) {
            this.currentMenu.remove();
            this.currentMenu = null;
        }
    }
}

// 全局右键菜单实例
let contextMenu;
try {
    contextMenu = new ContextMenu();
    console.log('Context menu initialized successfully');
} catch (e) {
    console.error('Failed to initialize context menu:', e);
    contextMenu = {
        show: () => {},
        hide: () => {}
    };
}
