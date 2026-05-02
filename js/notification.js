// Schlenix - 通知系统

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // 创建通知容器
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 40px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(options) {
        const notification = {
            id: Date.now() + Math.random(),
            title: options.title || '通知',
            message: options.message || '',
            type: options.type || 'info', // info, success, warning, error
            duration: options.duration || 3000,
            icon: options.icon || this.getDefaultIcon(options.type)
        };

        const notifEl = this.createNotificationElement(notification);
        this.container.appendChild(notifEl);
        this.notifications.push(notification);

        // 动画进入
        setTimeout(() => notifEl.classList.add('show'), 10);

        // 自动关闭
        if (notification.duration > 0) {
            setTimeout(() => this.hide(notification.id), notification.duration);
        }

        return notification.id;
    }

    createNotificationElement(notification) {
        const el = document.createElement('div');
        el.className = `notification notification-${notification.type}`;
        el.dataset.id = notification.id;
        el.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-left: 4px solid ${this.getTypeColor(notification.type)};
            border-radius: 4px;
            padding: 12px 16px;
            min-width: 300px;
            max-width: 400px;
            box-shadow: var(--shadow-lg);
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
        `;

        el.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 20px; flex-shrink: 0;">${notification.icon}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">${notification.title}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); word-wrap: break-word;">${notification.message}</div>
                </div>
                <button style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0; font-size: 18px; line-height: 1;">×</button>
            </div>
        `;

        // 点击关闭
        el.addEventListener('click', () => this.hide(notification.id));

        return el;
    }

    hide(id) {
        const notifEl = this.container.querySelector(`[data-id="${id}"]`);
        if (notifEl) {
            notifEl.style.opacity = '0';
            notifEl.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notifEl.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    getDefaultIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    getTypeColor(type) {
        const colors = {
            info: '#4a90d9',
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        return colors[type] || colors.info;
    }

    success(title, message, duration) {
        return this.show({ title, message, type: 'success', duration });
    }

    error(title, message, duration) {
        return this.show({ title, message, type: 'error', duration });
    }

    warning(title, message, duration) {
        return this.show({ title, message, type: 'warning', duration });
    }

    info(title, message, duration) {
        return this.show({ title, message, type: 'info', duration });
    }
}

// 添加显示动画样式
const style = document.createElement('style');
style.textContent = `
    .notification.show {
        opacity: 1 !important;
        transform: translateX(0) !important;
    }
`;
document.head.appendChild(style);

// 全局通知系统实例
const notify = new NotificationSystem();
