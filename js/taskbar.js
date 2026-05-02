// Schlenix - 任务栏管理器

class Taskbar {
    constructor() {
        this.menuOpen = false;
        this.init();
    }

    init() {
        this.initClock();
        this.attachMenuEvents();
    }

    initClock() {
        const clockElement = document.getElementById('clock');
        
        const updateClock = () => {
            clockElement.textContent = Utils.formatTime();
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    attachMenuEvents() {
        const menuButton = document.getElementById('menu-button');
        const menuPanel = document.getElementById('menu-panel');

        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // 点击菜单项
        menuPanel.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const appName = item.dataset.app;
                if (window.apps && window.apps[appName]) {
                    window.apps[appName].open();
                }
                this.closeMenu();
            });
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!menuPanel.contains(e.target) && e.target !== menuButton) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        const menuButton = document.getElementById('menu-button');
        const menuPanel = document.getElementById('menu-panel');
        
        menuPanel.classList.remove('hidden');
        menuButton.classList.add('active');
        this.menuOpen = true;
    }

    closeMenu() {
        const menuButton = document.getElementById('menu-button');
        const menuPanel = document.getElementById('menu-panel');
        
        menuPanel.classList.add('hidden');
        menuButton.classList.remove('active');
        this.menuOpen = false;
    }
}

// 初始化任务栏
const taskbar = new Taskbar();
