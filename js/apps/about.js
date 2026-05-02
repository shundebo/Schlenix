// Schlenix - 关于应用

class AboutApp {
    constructor() {
        this.version = '1.0.0';
        this.buildDate = '2024-01-01';
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '关于 Schlenix',
            icon: 'ℹ️',
            width: 500,
            height: 550,
            content: this.getContent()
        });
    }

    getContent() {
        return `
            <div class="about-content">
                <div class="about-logo">🐧</div>
                <div class="about-title">Schlenix</div>
                <div class="about-version">版本 ${this.version}</div>
                <div class="about-description">
                    Schlenix 是一个基于 Web 技术构建的前端伪操作系统，
                    采用类 LXQt 风格的桌面环境设计。
                    这是 Schlen 联邦共和国的官方操作系统。
                </div>
                <div class="about-info">
                    <div class="about-info-item">
                        <span class="about-info-label">版本</span>
                        <span class="about-info-value">${this.version}</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">构建日期</span>
                        <span class="about-info-value">${this.buildDate}</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">内核</span>
                        <span class="about-info-value">WebKit</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">桌面环境</span>
                        <span class="about-info-value">Schlenix Desktop</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">窗口管理器</span>
                        <span class="about-info-value">SchlenWM</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">浏览器引擎</span>
                        <span class="about-info-value">${navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown'}</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">CPU 核心</span>
                        <span class="about-info-value">${navigator.hardwareConcurrency || 'Unknown'}</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">内存</span>
                        <span class="about-info-value">${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown'}</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">屏幕分辨率</span>
                        <span class="about-info-value">${screen.width} × ${screen.height}</span>
                    </div>
                    <div class="about-info-item">
                        <span class="about-info-label">语言</span>
                        <span class="about-info-value">${navigator.language}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['about'] = new AboutApp();
