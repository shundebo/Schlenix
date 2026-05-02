// Schlenix - 主入口文件

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    console.log('Schlenix 操作系统启动中...');
    console.log('Storage:', typeof storage);
    console.log('Notify:', typeof notify);
    console.log('ContextMenu:', typeof contextMenu);
    console.log('WindowManager:', typeof windowManager);
    console.log('Apps:', window.apps);
    
    // 应用保存的设置
    applyStoredSettings();
    
    // 首次启动显示欢迎信息
    const hasSeenWelcome = storage.get('hasSeenWelcome');
    if (!hasSeenWelcome) {
        setTimeout(() => {
            showWelcomeMessage();
            storage.set('hasSeenWelcome', true);
        }, 500);
    }
});

// 应用存储的设置
function applyStoredSettings() {
    const settings = storage.get('settings');
    if (settings) {
        // 应用壁纸
        const desktop = document.getElementById('desktop');
        const wallpapers = {
            'default': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            'blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'purple': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'green': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        };
        desktop.style.background = wallpapers[settings.wallpaper] || wallpapers['default'];
        
        // 应用动画设置
        if (!settings.animations) {
            document.body.style.transition = 'none';
        }
    }
}

// 显示欢迎消息
function showWelcomeMessage() {
    const welcomeWindowId = windowManager.createWindow({
        title: '欢迎使用 Schlenix',
        icon: '👋',
        width: 500,
        height: 300,
        content: `
            <div style="padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">🐧</div>
                <h2 style="margin-bottom: 16px; color: var(--accent-blue);">欢迎使用 Schlenix</h2>
                <p style="margin-bottom: 24px; color: var(--text-secondary); line-height: 1.6;">
                    Schlenix 是 Schlen 联邦共和国的官方操作系统<br>
                    采用类 LXQt 风格的桌面环境设计
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn-start-tour">开始使用</button>
                    <button class="btn-close-welcome">关闭</button>
                </div>
            </div>
        `
    });

    const content = windowManager.getWindowContent(welcomeWindowId);
    if (content) {
        const btnStartTour = content.querySelector('.btn-start-tour');
        const btnCloseWelcome = content.querySelector('.btn-close-welcome');

        btnStartTour.addEventListener('click', () => {
            windowManager.closeWindow(welcomeWindowId);
            startQuickTour();
        });

        btnCloseWelcome.addEventListener('click', () => {
            windowManager.closeWindow(welcomeWindowId);
        });
    }
}

// 快速导览
function startQuickTour() {
    // 依次打开几个应用展示功能
    setTimeout(() => {
        if (window.apps['file-manager']) {
            window.apps['file-manager'].open();
        }
    }, 300);

    setTimeout(() => {
        if (window.apps['terminal']) {
            window.apps['terminal'].open();
        }
    }, 600);

    setTimeout(() => {
        if (window.apps['about']) {
            window.apps['about'].open();
        }
    }, 900);
}

// 全局键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Alt + T: 打开终端
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 't') {
        e.preventDefault();
        if (window.apps['terminal']) {
            window.apps['terminal'].open();
        }
    }

    // Ctrl/Cmd + Alt + F: 打开文件管理器
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'f') {
        e.preventDefault();
        if (window.apps['file-manager']) {
            window.apps['file-manager'].open();
        }
    }

    // Ctrl/Cmd + Alt + B: 打开浏览器
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'b') {
        e.preventDefault();
        if (window.apps['browser']) {
            window.apps['browser'].open();
        }
    }
});

console.log('Schlenix 操作系统已就绪！');
console.log('快捷键:');
console.log('  Ctrl+Alt+T - 打开终端');
console.log('  Ctrl+Alt+F - 打开文件管理器');
console.log('  Ctrl+Alt+B - 打开浏览器');
