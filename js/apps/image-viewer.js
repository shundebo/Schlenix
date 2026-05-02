// Schlenix - 图片查看器应用

class ImageViewerApp {
    constructor() {
        this.instances = new Map();
    }

    open(imagePath = null, imageName = null) {
        const windowId = windowManager.createWindow({
            title: imageName ? `图片查看器 - ${imageName}` : '图片查看器',
            icon: '🖼️',
            width: 800,
            height: 600,
            content: this.getContent(imagePath)
        });

        this.instances.set(windowId, {
            currentImage: imagePath,
            imageName: imageName,
            zoom: 100,
            rotation: 0
        });

        this.attachEvents(windowId);
    }

    getContent(imagePath) {
        const imageDisplay = imagePath 
            ? `<img src="${imagePath}" class="image-viewer-img" alt="图片">`
            : '<div class="image-viewer-placeholder">📷<br>请打开图片文件</div>';

        return `
            <div class="image-viewer-toolbar">
                <button class="iv-btn-open" title="打开图片">📂 打开</button>
                <label class="iv-btn-upload" title="本地文件">
                    📁 本地
                    <input type="file" accept="image/*" style="display:none" class="iv-file-input">
                </label>
                <button class="iv-btn-zoom-in" title="放大">🔍+</button>
                <button class="iv-btn-zoom-out" title="缩小">🔍-</button>
                <button class="iv-btn-zoom-reset" title="实际大小">1:1</button>
                <button class="iv-btn-rotate-left" title="向左旋转">↶</button>
                <button class="iv-btn-rotate-right" title="向右旋转">↷</button>
                <button class="iv-btn-fullscreen" title="全屏">⛶</button>
                <span class="iv-zoom-level">100%</span>
            </div>
            <div class="image-viewer-content">
                ${imageDisplay}
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const btnOpen = content.querySelector('.iv-btn-open');
        const fileInput = content.querySelector('.iv-file-input');
        const btnZoomIn = content.querySelector('.iv-btn-zoom-in');
        const btnZoomOut = content.querySelector('.iv-btn-zoom-out');
        const btnZoomReset = content.querySelector('.iv-btn-zoom-reset');
        const btnRotateLeft = content.querySelector('.iv-btn-rotate-left');
        const btnRotateRight = content.querySelector('.iv-btn-rotate-right');
        const btnFullscreen = content.querySelector('.iv-btn-fullscreen');

        btnOpen.addEventListener('click', () => this.openImage(windowId));
        
        // 本地文件上传
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = windowManager.getWindowContent(windowId);
                    const imageContent = content.querySelector('.image-viewer-content');
                    const instance = this.instances.get(windowId);
                    
                    imageContent.innerHTML = `<img src="${event.target.result}" class="image-viewer-img" alt="图片">`;
                    if (instance) {
                        instance.currentImage = event.target.result;
                        instance.zoom = 100;
                        instance.rotation = 0;
                        this.updateTransform(windowId);
                    }
                    notify.success('成功', `已加载 ${file.name}`);
                };
                reader.readAsDataURL(file);
            }
        });
        
        btnZoomIn.addEventListener('click', () => this.zoom(windowId, 10));
        btnZoomOut.addEventListener('click', () => this.zoom(windowId, -10));
        btnZoomReset.addEventListener('click', () => this.resetZoom(windowId));
        btnRotateLeft.addEventListener('click', () => this.rotate(windowId, -90));
        btnRotateRight.addEventListener('click', () => this.rotate(windowId, 90));
        btnFullscreen.addEventListener('click', () => this.toggleFullscreen(windowId));

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

    openImage(windowId) {
        const url = prompt('请输入图片 URL：', 'https://picsum.photos/800/600');
        if (!url) return;

        const instance = this.instances.get(windowId);
        if (!instance) return;

        const content = windowManager.getWindowContent(windowId);
        const imageContent = content.querySelector('.image-viewer-content');
        
        imageContent.innerHTML = `<img src="${url}" class="image-viewer-img" alt="图片">`;
        instance.currentImage = url;
        instance.zoom = 100;
        instance.rotation = 0;
        
        this.updateTransform(windowId);
        notify.success('成功', '图片已加载');
    }

    zoom(windowId, delta) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.zoom = Math.max(10, Math.min(500, instance.zoom + delta));
        this.updateTransform(windowId);
    }

    resetZoom(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.zoom = 100;
        instance.rotation = 0;
        this.updateTransform(windowId);
    }

    rotate(windowId, degrees) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        instance.rotation = (instance.rotation + degrees) % 360;
        this.updateTransform(windowId);
    }

    updateTransform(windowId) {
        const instance = this.instances.get(windowId);
        const content = windowManager.getWindowContent(windowId);
        if (!instance || !content) return;

        const img = content.querySelector('.image-viewer-img');
        const zoomLevel = content.querySelector('.iv-zoom-level');
        
        if (img) {
            img.style.transform = `scale(${instance.zoom / 100}) rotate(${instance.rotation}deg)`;
        }
        
        if (zoomLevel) {
            zoomLevel.textContent = `${instance.zoom}%`;
        }
    }

    toggleFullscreen(windowId) {
        const window = windowManager.windows.get(windowId);
        if (window) {
            windowManager.toggleMaximize(windowId);
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['image-viewer'] = new ImageViewerApp();