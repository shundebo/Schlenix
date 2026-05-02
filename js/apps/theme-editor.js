// Schlenix - 主题编辑器

class ThemeEditorApp {
    constructor() {
        this.instances = new Map();
        this.defaultThemes = {
            dark: {
                name: '深色主题',
                colors: {
                    '--bg-primary': '#2c3e50',
                    '--bg-secondary': '#34495e',
                    '--bg-hover': '#3d566e',
                    '--text-primary': '#ecf0f1',
                    '--text-secondary': '#bdc3c7',
                    '--accent-blue': '#4a90d9',
                    '--accent-blue-hover': '#5dade2',
                    '--border-color': '#4a5f7f'
                }
            },
            light: {
                name: '浅色主题',
                colors: {
                    '--bg-primary': '#ffffff',
                    '--bg-secondary': '#f5f5f5',
                    '--bg-hover': '#e8e8e8',
                    '--text-primary': '#2c3e50',
                    '--text-secondary': '#7f8c8d',
                    '--accent-blue': '#3498db',
                    '--accent-blue-hover': '#2980b9',
                    '--border-color': '#dcdcdc'
                }
            },
            nord: {
                name: 'Nord 主题',
                colors: {
                    '--bg-primary': '#2e3440',
                    '--bg-secondary': '#3b4252',
                    '--bg-hover': '#434c5e',
                    '--text-primary': '#eceff4',
                    '--text-secondary': '#d8dee9',
                    '--accent-blue': '#88c0d0',
                    '--accent-blue-hover': '#8fbcbb',
                    '--border-color': '#4c566a'
                }
            },
            dracula: {
                name: 'Dracula 主题',
                colors: {
                    '--bg-primary': '#282a36',
                    '--bg-secondary': '#44475a',
                    '--bg-hover': '#6272a4',
                    '--text-primary': '#f8f8f2',
                    '--text-secondary': '#6272a4',
                    '--accent-blue': '#bd93f9',
                    '--accent-blue-hover': '#ff79c6',
                    '--border-color': '#6272a4'
                }
            }
        };
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '主题编辑器',
            icon: '🎨',
            width: 600,
            height: 600,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            currentTheme: this.getCurrentTheme()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="theme-editor-container">
                <div class="theme-presets">
                    <label>预设主题</label>
                    <select class="theme-preset-select">
                        <option value="dark">深色主题</option>
                        <option value="light">浅色主题</option>
                        <option value="nord">Nord 主题</option>
                        <option value="dracula">Dracula 主题</option>
                        <option value="custom">自定义</option>
                    </select>
                </div>
                <div class="theme-colors">
                    <div class="color-item">
                        <label>主背景色</label>
                        <input type="color" class="color-input" data-var="--bg-primary">
                        <input type="text" class="color-text" data-var="--bg-primary">
                    </div>
                    <div class="color-item">
                        <label>次背景色</label>
                        <input type="color" class="color-input" data-var="--bg-secondary">
                        <input type="text" class="color-text" data-var="--bg-secondary">
                    </div>
                    <div class="color-item">
                        <label>悬停背景</label>
                        <input type="color" class="color-input" data-var="--bg-hover">
                        <input type="text" class="color-text" data-var="--bg-hover">
                    </div>
                    <div class="color-item">
                        <label>主文本色</label>
                        <input type="color" class="color-input" data-var="--text-primary">
                        <input type="text" class="color-text" data-var="--text-primary">
                    </div>
                    <div class="color-item">
                        <label>次文本色</label>
                        <input type="color" class="color-input" data-var="--text-secondary">
                        <input type="text" class="color-text" data-var="--text-secondary">
                    </div>
                    <div class="color-item">
                        <label>强调色</label>
                        <input type="color" class="color-input" data-var="--accent-blue">
                        <input type="text" class="color-text" data-var="--accent-blue">
                    </div>
                    <div class="color-item">
                        <label>强调色悬停</label>
                        <input type="color" class="color-input" data-var="--accent-blue-hover">
                        <input type="text" class="color-text" data-var="--accent-blue-hover">
                    </div>
                    <div class="color-item">
                        <label>边框色</label>
                        <input type="color" class="color-input" data-var="--border-color">
                        <input type="text" class="color-text" data-var="--border-color">
                    </div>
                </div>
                <div class="theme-preview">
                    <div class="preview-title">预览</div>
                    <div class="preview-box">
                        <div class="preview-window">
                            <div class="preview-titlebar">
                                <span>示例窗口</span>
                                <div class="preview-controls">
                                    <span>−</span><span>□</span><span>×</span>
                                </div>
                            </div>
                            <div class="preview-content">
                                <button class="preview-button">按钮</button>
                                <p>这是一段示例文本</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="theme-actions">
                    <button class="theme-btn theme-apply">应用主题</button>
                    <button class="theme-btn theme-save">保存主题</button>
                    <button class="theme-btn theme-export">导出主题</button>
                    <button class="theme-btn theme-import">导入主题</button>
                    <button class="theme-btn theme-reset">重置</button>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const presetSelect = content.querySelector('.theme-preset-select');
        const colorInputs = content.querySelectorAll('.color-input');
        const colorTexts = content.querySelectorAll('.color-text');
        const btnApply = content.querySelector('.theme-apply');
        const btnSave = content.querySelector('.theme-save');
        const btnExport = content.querySelector('.theme-export');
        const btnImport = content.querySelector('.theme-import');
        const btnReset = content.querySelector('.theme-reset');

        // 加载当前主题
        this.loadCurrentTheme(windowId);

        // 预设主题切换
        presetSelect.addEventListener('change', (e) => {
            const theme = this.defaultThemes[e.target.value];
            if (theme) {
                this.applyThemeToInputs(windowId, theme.colors);
            }
        });

        // 颜色选择器变化
        colorInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const varName = e.target.dataset.var;
                const textInput = content.querySelector(`.color-text[data-var="${varName}"]`);
                textInput.value = e.target.value;
                this.updatePreview(windowId);
            });
        });

        // 文本输入变化
        colorTexts.forEach(input => {
            input.addEventListener('input', (e) => {
                const varName = e.target.dataset.var;
                const colorInput = content.querySelector(`.color-input[data-var="${varName}"]`);
                colorInput.value = e.target.value;
                this.updatePreview(windowId);
            });
        });

        btnApply.addEventListener('click', () => this.applyTheme(windowId));
        btnSave.addEventListener('click', () => this.saveTheme(windowId));
        btnExport.addEventListener('click', () => this.exportTheme(windowId));
        btnImport.addEventListener('click', () => this.importTheme(windowId));
        btnReset.addEventListener('click', () => this.resetTheme(windowId));

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

    getCurrentTheme() {
        const root = document.documentElement;
        const theme = {};
        const vars = ['--bg-primary', '--bg-secondary', '--bg-hover', '--text-primary', '--text-secondary', '--accent-blue', '--accent-blue-hover', '--border-color'];
        
        vars.forEach(varName => {
            theme[varName] = getComputedStyle(root).getPropertyValue(varName).trim();
        });
        
        return theme;
    }

    loadCurrentTheme(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        this.applyThemeToInputs(windowId, instance.currentTheme);
    }

    applyThemeToInputs(windowId, colors) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        Object.entries(colors).forEach(([varName, value]) => {
            const colorInput = content.querySelector(`.color-input[data-var="${varName}"]`);
            const textInput = content.querySelector(`.color-text[data-var="${varName}"]`);
            if (colorInput && textInput) {
                colorInput.value = value;
                textInput.value = value;
            }
        });

        this.updatePreview(windowId);
    }

    updatePreview(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const previewBox = content.querySelector('.preview-box');
        const colorInputs = content.querySelectorAll('.color-input');
        
        colorInputs.forEach(input => {
            const varName = input.dataset.var;
            const value = input.value;
            previewBox.style.setProperty(varName, value);
        });
    }

    applyTheme(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const root = document.documentElement;
        const colorInputs = content.querySelectorAll('.color-input');
        
        colorInputs.forEach(input => {
            const varName = input.dataset.var;
            const value = input.value;
            root.style.setProperty(varName, value);
        });

        notify.success('主题已应用', '主题已实时应用到系统');
    }

    saveTheme(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const theme = {};
        const colorInputs = content.querySelectorAll('.color-input');
        
        colorInputs.forEach(input => {
            theme[input.dataset.var] = input.value;
        });

        storage.set('custom_theme', theme);
        notify.success('保存成功', '主题已保存');
    }

    exportTheme(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const theme = {};
        const colorInputs = content.querySelectorAll('.color-input');
        
        colorInputs.forEach(input => {
            theme[input.dataset.var] = input.value;
        });

        const themeData = {
            name: '自定义主题',
            version: '1.0',
            colors: theme
        };

        const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schlenix-theme.json';
        a.click();
        URL.revokeObjectURL(url);

        notify.success('导出成功', '主题文件已下载');
    }

    importTheme(windowId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const themeData = JSON.parse(event.target.result);
                        if (themeData.colors) {
                            this.applyThemeToInputs(windowId, themeData.colors);
                            notify.success('导入成功', `已导入主题: ${themeData.name || '未命名'}`);
                        }
                    } catch (error) {
                        notify.error('导入失败', '主题文件格式错误');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    resetTheme(windowId) {
        if (!confirm('确定要重置为默认主题吗？')) return;

        const defaultTheme = this.defaultThemes.dark.colors;
        this.applyThemeToInputs(windowId, defaultTheme);
        
        const root = document.documentElement;
        Object.entries(defaultTheme).forEach(([varName, value]) => {
            root.style.setProperty(varName, value);
        });

        notify.success('重置成功', '已恢复默认主题');
    }
}

if (!window.apps) window.apps = {};
window.apps['theme-editor'] = new ThemeEditorApp();