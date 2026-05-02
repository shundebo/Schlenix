// Schlenix - 浏览器应用

class BrowserApp {
    constructor() {
        this.currentUrl = 'https://schlen.top';
        this.history = [];
        this.historyIndex = -1;
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '浏览器',
            icon: '🌐',
            width: 900,
            height: 600,
            content: this.getContent()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="browser-toolbar">
                <div class="browser-nav-buttons">
                    <button class="browser-btn-back" title="后退">◀</button>
                    <button class="browser-btn-forward" title="前进">▶</button>
                    <button class="browser-btn-refresh" title="刷新">🔄</button>
                </div>
                <input type="text" class="browser-url-bar" value="${this.currentUrl}">
                <button class="browser-btn-go">前往</button>
            </div>
            <div class="browser-content">
                <iframe class="browser-iframe" src="${this.currentUrl}" sandbox="allow-same-origin allow-scripts"></iframe>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const urlBar = content.querySelector('.browser-url-bar');
        const iframe = content.querySelector('.browser-iframe');
        const btnGo = content.querySelector('.browser-btn-go');
        const btnBack = content.querySelector('.browser-btn-back');
        const btnForward = content.querySelector('.browser-btn-forward');
        const btnRefresh = content.querySelector('.browser-btn-refresh');

        // 前往按钮
        btnGo.addEventListener('click', () => {
            this.navigate(urlBar.value, iframe);
        });

        // URL 栏回车
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(urlBar.value, iframe);
            }
        });

        // 后退
        btnBack.addEventListener('click', () => {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const url = this.history[this.historyIndex];
                urlBar.value = url;
                iframe.src = url;
            }
        });

        // 前进
        btnForward.addEventListener('click', () => {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                const url = this.history[this.historyIndex];
                urlBar.value = url;
                iframe.src = url;
            }
        });

        // 刷新
        btnRefresh.addEventListener('click', () => {
            iframe.src = iframe.src;
        });
    }

    navigate(url, iframe) {
        // 简单的 URL 验证
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        iframe.src = url;
        this.currentUrl = url;
        
        // 添加到历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(url);
        this.historyIndex = this.history.length - 1;
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['browser'] = new BrowserApp();
