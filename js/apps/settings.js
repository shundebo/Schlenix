// Schlenix - 系统设置应用

class SettingsApp {
    constructor() {
        this.settings = storage.get('settings') || {
            theme: 'dark',
            wallpaper: 'default',
            language: 'zh-CN',
            animations: true
        };
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '系统设置',
            icon: '⚙️',
            width: 600,
            height: 500,
            content: this.getContent()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="settings-content">
                <div class="settings-section">
                    <div class="settings-section-title">外观</div>
                    <div class="settings-item">
                        <div class="settings-item-label">主题</div>
                        <div class="settings-item-control">
                            <select class="setting-theme">
                                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>深色</option>
                                <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>浅色</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">壁纸</div>
                        <div class="settings-item-control">
                            <select class="setting-wallpaper">
                                <option value="default" ${this.settings.wallpaper === 'default' ? 'selected' : ''}>默认渐变</option>
                                <option value="blue" ${this.settings.wallpaper === 'blue' ? 'selected' : ''}>蓝色</option>
                                <option value="purple" ${this.settings.wallpaper === 'purple' ? 'selected' : ''}>紫色</option>
                                <option value="green" ${this.settings.wallpaper === 'green' ? 'selected' : ''}>绿色</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">动画效果</div>
                        <div class="settings-item-control">
                            <input type="checkbox" class="setting-animations" ${this.settings.animations ? 'checked' : ''}>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">系统</div>
                    <div class="settings-item">
                        <div class="settings-item-label">语言</div>
                        <div class="settings-item-control">
                            <select class="setting-language">
                                <option value="zh-CN" ${this.settings.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
                                <option value="en-US" ${this.settings.language === 'en-US' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">系统信息</div>
                        <div class="settings-item-control">
                            <button class="btn-system-info">查看</button>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">清除所有数据</div>
                        <div class="settings-item-control">
                            <button class="btn-clear-data" style="background: #e74c3c;">清除</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">关于</div>
                    <div class="settings-item">
                        <div class="settings-item-label">版本</div>
                        <div class="settings-item-control">
                            <span>Schlenix 1.0.0</span>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">内核</div>
                        <div class="settings-item-control">
                            <span>WebKit ${navigator.userAgent.match(/AppleWebKit\/([0-9.]+)/)?.[1] || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        // 主题切换
        const themeSelect = content.querySelector('.setting-theme');
        themeSelect.addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.saveSettings();
            this.applyTheme(e.target.value);
        });

        // 壁纸切换
        const wallpaperSelect = content.querySelector('.setting-wallpaper');
        wallpaperSelect.addEventListener('change', (e) => {
            this.settings.wallpaper = e.target.value;
            this.saveSettings();
            this.applyWallpaper(e.target.value);
        });

        // 动画切换
        const animationsCheckbox = content.querySelector('.setting-animations');
        animationsCheckbox.addEventListener('change', (e) => {
            this.settings.animations = e.target.checked;
            this.saveSettings();
            this.applyAnimations(e.target.checked);
        });

        // 语言切换
        const languageSelect = content.querySelector('.setting-language');
        languageSelect.addEventListener('change', (e) => {
            this.settings.language = e.target.value;
            this.saveSettings();
            notify.info('提示', '语言切换需要重新加载页面');
        });

        // 系统信息
        const btnSystemInfo = content.querySelector('.btn-system-info');
        btnSystemInfo.addEventListener('click', () => {
            if (window.apps && window.apps['about']) {
                window.apps['about'].open();
            }
        });

        // 清除数据
        const btnClearData = content.querySelector('.btn-clear-data');
        btnClearData.addEventListener('click', () => {
            if (confirm('确定要清除所有数据吗？这将删除所有文件和设置，并重新加载页面。')) {
                storage.clear();
                notify.warning('数据已清除', '页面将在 2 秒后重新加载');
                setTimeout(() => location.reload(), 2000);
            }
        });
    }

    saveSettings() {
        storage.set('settings', this.settings);
        notify.success('设置已保存', '您的设置已自动保存');
    }

    applyTheme(theme) {
        if (theme === 'light') {
            notify.info('提示', '浅色主题功能开发中...');
        }
    }

    applyWallpaper(wallpaper) {
        const desktop = document.getElementById('desktop');
        const wallpapers = {
            'default': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            'blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'purple': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'green': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        };
        desktop.style.background = wallpapers[wallpaper] || wallpapers['default'];
    }

    applyAnimations(enabled) {
        document.body.style.transition = enabled ? 'all 0.3s ease' : 'none';
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['settings'] = new SettingsApp();

