// Schlenix - 浏览器应用

class BrowserApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '浏览器',
            icon: '🌐',
            width: 900,
            height: 600,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            tabs: [{
                id: Date.now().toString(),
                title: '新标签页',
                url: 'https://schlen.top',
                history: ['https://schlen.top'],
                historyIndex: 0
            }],
            activeTabId: Date.now().toString()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="browser-tabs-bar">
                <div class="browser-tabs"></div>
                <button class="browser-new-tab" title="新建标签页">+</button>
            </div>
            <div class="browser-toolbar">
                <div class="browser-nav-buttons">
                    <button class="browser-btn-back" title="后退">◀</button>
                    <button class="browser-btn-forward" title="前进">▶</button>
                    <button class="browser-btn-refresh" title="刷新">🔄</button>
                    <button class="browser-btn-home" title="主页">🏠</button>
                </div>
                <input type="text" class="browser-url-bar" placeholder="输入网址或搜索...">
                <button class="browser-btn-go">前往</button>
                <button class="browser-btn-download" title="下载管理">📥</button>
                <button class="browser-btn-bookmarks" title="书签">⭐</button>
            </div>
            <div class="browser-content">
                <iframe class="browser-iframe" sandbox="allow-same-origin allow-scripts allow-downloads"></iframe>
            </div>
            <div class="browser-downloads hidden">
                <div class="downloads-header">
                    <span>下载管理</span>
                    <button class="downloads-close">×</button>
                </div>
                <div class="downloads-list"></div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const instance = this.instances.get(windowId);
        const urlBar = content.querySelector('.browser-url-bar');
        const iframe = content.querySelector('.browser-iframe');
        const btnGo = content.querySelector('.browser-btn-go');
        const btnBack = content.querySelector('.browser-btn-back');
        const btnForward = content.querySelector('.browser-btn-forward');
        const btnRefresh = content.querySelector('.browser-btn-refresh');
        const btnHome = content.querySelector('.browser-btn-home');
        const btnNewTab = content.querySelector('.browser-new-tab');
        const btnDownload = content.querySelector('.browser-btn-download');
        const btnBookmarks = content.querySelector('.browser-btn-bookmarks');

        // 渲染标签页
        this.renderTabs(windowId);

        // 前往按钮
        btnGo.addEventListener('click', () => {
            this.navigate(windowId, urlBar.value);
        });

        // URL 栏回车
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(windowId, urlBar.value);
            }
        });

        // 后退
        btnBack.addEventListener('click', () => this.goBack(windowId));

        // 前进
        btnForward.addEventListener('click', () => this.goForward(windowId));

        // 刷新
        btnRefresh.addEventListener('click', () => this.refresh(windowId));

        // 主页
        btnHome.addEventListener('click', () => this.navigate(windowId, 'https://schlen.top'));

        // 新建标签页
        btnNewTab.addEventListener('click', () => this.createNewTab(windowId));

        // 下载管理
        btnDownload.addEventListener('click', () => this.toggleDownloads(windowId));

        // 书签
        btnBookmarks.addEventListener('click', () => this.showBookmarks(windowId));

        // 下载面板关闭
        const downloadsClose = content.querySelector('.downloads-close');
        downloadsClose.addEventListener('click', () => this.toggleDownloads(windowId));

        // 监听 iframe 加载
        iframe.addEventListener('load', () => {
            try {
                const currentUrl = iframe.contentWindow.location.href;
                if (currentUrl && currentUrl !== 'about:blank') {
                    urlBar.value = currentUrl;
                    this.updateTabTitle(windowId, iframe.contentDocument?.title || '加载中...');
                }
            } catch (e) {
                // 跨域限制
            }
        });

        // 窗口关闭时清理
        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.instances.delete(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    renderTabs(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const tabsContainer = content.querySelector('.browser-tabs');
        tabsContainer.innerHTML = instance.tabs.map(tab => `
            <div class="browser-tab ${tab.id === instance.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
                <span class="tab-title">${tab.title}</span>
                <button class="tab-close" data-tab-id="${tab.id}">×</button>
            </div>
        `).join('');

        // 标签页点击事件
        tabsContainer.querySelectorAll('.browser-tab').forEach(tabEl => {
            tabEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    this.switchTab(windowId, tabEl.dataset.tabId);
                }
            });
        });

        // 标签页关闭事件
        tabsContainer.querySelectorAll('.tab-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(windowId, btn.dataset.tabId);
            });
        });
    }

    createNewTab(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const newTab = {
            id: Date.now().toString(),
            title: '新标签页',
            url: 'about:blank',
            history: ['about:blank'],
            historyIndex: 0
        };

        instance.tabs.push(newTab);
        instance.activeTabId = newTab.id;

        this.renderTabs(windowId);
        this.updateCurrentTab(windowId);
        notify.success('新标签页', '已创建新标签页');
    }

    switchTab(windowId, tabId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.activeTabId = tabId;
        this.renderTabs(windowId);
        this.updateCurrentTab(windowId);
    }

    closeTab(windowId, tabId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        if (instance.tabs.length === 1) {
            notify.warning('提示', '不能关闭最后一个标签页');
            return;
        }

        const tabIndex = instance.tabs.findIndex(t => t.id === tabId);
        instance.tabs.splice(tabIndex, 1);

        if (instance.activeTabId === tabId) {
            instance.activeTabId = instance.tabs[Math.max(0, tabIndex - 1)].id;
        }

        this.renderTabs(windowId);
        this.updateCurrentTab(windowId);
    }

    updateCurrentTab(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const activeTab = instance.tabs.find(t => t.id === instance.activeTabId);
        if (!activeTab) return;

        const urlBar = content.querySelector('.browser-url-bar');
        const iframe = content.querySelector('.browser-iframe');

        urlBar.value = activeTab.url;
        if (activeTab.url !== 'about:blank') {
            iframe.src = activeTab.url;
        }
    }

    navigate(windowId, url) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const activeTab = instance.tabs.find(t => t.id === instance.activeTabId);
        if (!activeTab) return;

        // URL 处理
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes('.') || url.startsWith('localhost')) {
                url = 'https://' + url;
            } else {
                // 搜索
                url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }

        const iframe = content.querySelector('.browser-iframe');
        iframe.src = url;

        activeTab.url = url;
        activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
        activeTab.history.push(url);
        activeTab.historyIndex = activeTab.history.length - 1;

        this.renderTabs(windowId);
    }

    goBack(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const activeTab = instance.tabs.find(t => t.id === instance.activeTabId);
        if (!activeTab || activeTab.historyIndex <= 0) return;

        activeTab.historyIndex--;
        activeTab.url = activeTab.history[activeTab.historyIndex];
        this.updateCurrentTab(windowId);
    }

    goForward(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const activeTab = instance.tabs.find(t => t.id === instance.activeTabId);
        if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;

        activeTab.historyIndex++;
        activeTab.url = activeTab.history[activeTab.historyIndex];
        this.updateCurrentTab(windowId);
    }

    refresh(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const iframe = content.querySelector('.browser-iframe');
        iframe.src = iframe.src;
        notify.info('刷新', '页面正在刷新...');
    }

    updateTabTitle(windowId, title) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const activeTab = instance.tabs.find(t => t.id === instance.activeTabId);
        if (activeTab) {
            activeTab.title = title.substring(0, 20) || '新标签页';
            this.renderTabs(windowId);
        }
    }

    toggleDownloads(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const downloadsPanel = content.querySelector('.browser-downloads');
        downloadsPanel.classList.toggle('hidden');

        if (!downloadsPanel.classList.contains('hidden')) {
            this.loadDownloads(windowId);
        }
    }

    loadDownloads(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const downloads = storage.get('browser_downloads') || [];
        const downloadsList = content.querySelector('.downloads-list');

        if (downloads.length === 0) {
            downloadsList.innerHTML = '<div class="downloads-empty">暂无下载记录</div>';
            return;
        }

        downloadsList.innerHTML = downloads.map(dl => `
            <div class="download-item">
                <div class="download-icon">📄</div>
                <div class="download-info">
                    <div class="download-name">${dl.name}</div>
                    <div class="download-url">${dl.url}</div>
                    <div class="download-date">${new Date(dl.date).toLocaleString('zh-CN')}</div>
                </div>
                <button class="download-open" data-url="${dl.url}">打开</button>
            </div>
        `).join('');

        // 打开下载链接
        downloadsList.querySelectorAll('.download-open').forEach(btn => {
            btn.addEventListener('click', () => {
                window.open(btn.dataset.url, '_blank');
            });
        });
    }

    addDownload(url, name) {
        const downloads = storage.get('browser_downloads') || [];
        downloads.unshift({
            url,
            name: name || url.split('/').pop() || '未命名文件',
            date: Date.now()
        });
        storage.set('browser_downloads', downloads.slice(0, 50)); // 保留最近50条
        notify.success('下载', `已添加到下载列表: ${name}`);
    }

    showBookmarks(windowId) {
        const bookmarks = storage.get('browser_bookmarks') || [
            { name: 'Schlen 官网', url: 'https://schlen.top' },
            { name: 'Google', url: 'https://www.google.com' },
            { name: 'GitHub', url: 'https://github.com' }
        ];

        const bookmarksList = bookmarks.map(bm => `${bm.name}: ${bm.url}`).join('\n');
        const selected = prompt('书签列表（输入网址访问）:\n\n' + bookmarksList, bookmarks[0].url);
        
        if (selected) {
            this.navigate(windowId, selected);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['browser'] = new BrowserApp();
