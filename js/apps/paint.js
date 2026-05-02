// Schlenix - 画板应用

class PaintApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '画板',
            icon: '🎨',
            width: 800,
            height: 600,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            canvas: null,
            ctx: null,
            isDrawing: false,
            lastX: 0,
            lastY: 0,
            currentColor: '#000000',
            currentTool: 'pen',
            lineWidth: 2,
            history: [],
            historyStep: -1
        });

        this.attachEvents(windowId);
        this.initCanvas(windowId);
    }

    getContent() {
        return `
            <div class="paint-container">
                <div class="paint-toolbar">
                    <div class="tool-group">
                        <button class="paint-tool active" data-tool="pen" title="画笔">✏️</button>
                        <button class="paint-tool" data-tool="eraser" title="橡皮擦">🧹</button>
                        <button class="paint-tool" data-tool="line" title="直线">📏</button>
                        <button class="paint-tool" data-tool="rect" title="矩形">▭</button>
                        <button class="paint-tool" data-tool="circle" title="圆形">⭕</button>
                        <button class="paint-tool" data-tool="fill" title="填充">🪣</button>
                    </div>
                    <div class="tool-group">
                        <input type="color" class="paint-color" value="#000000" title="颜色">
                        <input type="range" class="paint-width" min="1" max="20" value="2" title="粗细">
                        <span class="width-display">2px</span>
                    </div>
                    <div class="tool-group">
                        <button class="paint-btn" id="paint-undo" title="撤销">↶</button>
                        <button class="paint-btn" id="paint-redo" title="重做">↷</button>
                        <button class="paint-btn" id="paint-clear" title="清空">🗑️</button>
                    </div>
                    <div class="tool-group">
                        <button class="paint-btn" id="paint-save" title="保存">💾</button>
                        <button class="paint-btn" id="paint-export" title="导出">📥</button>
                        <label class="paint-btn" title="导入图片">
                            📁
                            <input type="file" accept="image/*" style="display:none" class="paint-import">
                        </label>
                    </div>
                </div>
                <div class="paint-canvas-container">
                    <canvas class="paint-canvas" width="760" height="500"></canvas>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const instance = this.instances.get(windowId);
        const canvas = content.querySelector('.paint-canvas');
        const colorPicker = content.querySelector('.paint-color');
        const widthSlider = content.querySelector('.paint-width');
        const widthDisplay = content.querySelector('.width-display');
        const tools = content.querySelectorAll('.paint-tool');
        const btnUndo = content.querySelector('#paint-undo');
        const btnRedo = content.querySelector('#paint-redo');
        const btnClear = content.querySelector('#paint-clear');
        const btnSave = content.querySelector('#paint-save');
        const btnExport = content.querySelector('#paint-export');
        const importInput = content.querySelector('.paint-import');

        // 工具切换
        tools.forEach(tool => {
            tool.addEventListener('click', () => {
                tools.forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                instance.currentTool = tool.dataset.tool;
            });
        });

        // 颜色选择
        colorPicker.addEventListener('input', (e) => {
            instance.currentColor = e.target.value;
        });

        // 线宽调整
        widthSlider.addEventListener('input', (e) => {
            instance.lineWidth = parseInt(e.target.value);
            widthDisplay.textContent = `${e.target.value}px`;
        });

        // 画布事件
        canvas.addEventListener('mousedown', (e) => this.startDrawing(windowId, e));
        canvas.addEventListener('mousemove', (e) => this.draw(windowId, e));
        canvas.addEventListener('mouseup', () => this.stopDrawing(windowId));
        canvas.addEventListener('mouseout', () => this.stopDrawing(windowId));

        // 按钮事件
        btnUndo.addEventListener('click', () => this.undo(windowId));
        btnRedo.addEventListener('click', () => this.redo(windowId));
        btnClear.addEventListener('click', () => this.clearCanvas(windowId));
        btnSave.addEventListener('click', () => this.saveToStorage(windowId));
        btnExport.addEventListener('click', () => this.exportImage(windowId));

        // 导入图片
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        instance.ctx.drawImage(img, 0, 0);
                        this.saveState(windowId);
                        notify.success('成功', '图片已导入');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

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

    initCanvas(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        instance.canvas = content.querySelector('.paint-canvas');
        instance.ctx = instance.canvas.getContext('2d');
        
        // 设置白色背景
        instance.ctx.fillStyle = '#ffffff';
        instance.ctx.fillRect(0, 0, instance.canvas.width, instance.canvas.height);
        
        this.saveState(windowId);
    }

    startDrawing(windowId, e) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.isDrawing = true;
        const rect = instance.canvas.getBoundingClientRect();
        instance.lastX = e.clientX - rect.left;
        instance.lastY = e.clientY - rect.top;

        if (instance.currentTool === 'fill') {
            this.floodFill(windowId, instance.lastX, instance.lastY);
            instance.isDrawing = false;
        }
    }

    draw(windowId, e) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.isDrawing) return;

        const rect = instance.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        instance.ctx.strokeStyle = instance.currentTool === 'eraser' ? '#ffffff' : instance.currentColor;
        instance.ctx.lineWidth = instance.lineWidth;
        instance.ctx.lineCap = 'round';
        instance.ctx.lineJoin = 'round';

        if (instance.currentTool === 'pen' || instance.currentTool === 'eraser') {
            instance.ctx.beginPath();
            instance.ctx.moveTo(instance.lastX, instance.lastY);
            instance.ctx.lineTo(x, y);
            instance.ctx.stroke();
        }

        instance.lastX = x;
        instance.lastY = y;
    }

    stopDrawing(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || !instance.isDrawing) return;

        instance.isDrawing = false;
        this.saveState(windowId);
    }

    floodFill(windowId, x, y) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const imageData = instance.ctx.getImageData(0, 0, instance.canvas.width, instance.canvas.height);
        const targetColor = this.getPixelColor(imageData, x, y);
        const fillColor = this.hexToRgb(instance.currentColor);

        if (this.colorsMatch(targetColor, fillColor)) return;

        const stack = [[Math.floor(x), Math.floor(y)]];
        const visited = new Set();

        while (stack.length > 0) {
            const [px, py] = stack.pop();
            const key = `${px},${py}`;

            if (visited.has(key)) continue;
            if (px < 0 || px >= instance.canvas.width || py < 0 || py >= instance.canvas.height) continue;

            const currentColor = this.getPixelColor(imageData, px, py);
            if (!this.colorsMatch(currentColor, targetColor)) continue;

            visited.add(key);
            this.setPixelColor(imageData, px, py, fillColor);

            stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }

        instance.ctx.putImageData(imageData, 0, 0);
        this.saveState(windowId);
    }

    getPixelColor(imageData, x, y) {
        const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }

    setPixelColor(imageData, x, y, color) {
        const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
        imageData.data[index] = color.r;
        imageData.data[index + 1] = color.g;
        imageData.data[index + 2] = color.b;
        imageData.data[index + 3] = 255;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    colorsMatch(c1, c2) {
        return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
    }

    saveState(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const imageData = instance.canvas.toDataURL();
        instance.history = instance.history.slice(0, instance.historyStep + 1);
        instance.history.push(imageData);
        instance.historyStep++;

        if (instance.history.length > 50) {
            instance.history.shift();
            instance.historyStep--;
        }
    }

    undo(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || instance.historyStep <= 0) return;

        instance.historyStep--;
        this.loadState(windowId, instance.history[instance.historyStep]);
    }

    redo(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance || instance.historyStep >= instance.history.length - 1) return;

        instance.historyStep++;
        this.loadState(windowId, instance.history[instance.historyStep]);
    }

    loadState(windowId, imageData) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const img = new Image();
        img.onload = () => {
            instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height);
            instance.ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    }

    clearCanvas(windowId) {
        if (!confirm('确定要清空画布吗？')) return;

        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.ctx.fillStyle = '#ffffff';
        instance.ctx.fillRect(0, 0, instance.canvas.width, instance.canvas.height);
        this.saveState(windowId);
        notify.success('已清空', '画布已清空');
    }

    saveToStorage(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const imageData = instance.canvas.toDataURL();
        storage.set('paint_saved', imageData);
        notify.success('保存成功', '画作已保存到本地存储');
    }

    exportImage(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `paint-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            notify.success('导出成功', 'PNG 图片已下载');
        });
    }
}

if (!window.apps) window.apps = {};
window.apps['paint'] = new PaintApp();