// Schlenix - 终端应用

class TerminalApp {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.currentPath = '/home/user';
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '终端',
            icon: '💻',
            width: 700,
            height: 450,
            content: this.getContent()
        });

        this.attachEvents(windowId);
        this.focusInput(windowId);
    }

    getContent() {
        return `
            <div class="terminal-content">
                <div class="terminal-output">
                    <div class="terminal-line">Schlenix Terminal v1.0</div>
                    <div class="terminal-line">输入 'help' 查看可用命令</div>
                    <div class="terminal-line"></div>
                </div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt">user@schlenix:~$</span>
                    <input type="text" class="terminal-input" autocomplete="off" spellcheck="false">
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const input = content.querySelector('.terminal-input');
        const output = content.querySelector('.terminal-output');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    this.executeCommand(command, output);
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                }
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    input.value = '';
                }
            }
        });
    }

    executeCommand(command, output) {
        // 显示命令
        this.addLine(output, `<span class="terminal-prompt">user@schlenix:~$</span> ${command}`);

        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                this.addLine(output, '可用命令:');
                this.addLine(output, '  help       - 显示此帮助信息');
                this.addLine(output, '  clear      - 清空终端');
                this.addLine(output, '  echo       - 输出文本');
                this.addLine(output, '  date       - 显示当前日期时间');
                this.addLine(output, '  whoami     - 显示当前用户');
                this.addLine(output, '  pwd        - 显示当前路径');
                this.addLine(output, '  ls         - 列出文件');
                this.addLine(output, '  cat        - 显示文件内容');
                this.addLine(output, '  neofetch   - 显示系统信息');
                this.addLine(output, '  about      - 关于 Schlenix');
                break;

            case 'clear':
                output.innerHTML = '';
                return;

            case 'echo':
                this.addLine(output, args.join(' '));
                break;

            case 'date':
                this.addLine(output, new Date().toString());
                break;

            case 'whoami':
                this.addLine(output, 'user');
                break;

            case 'pwd':
                this.addLine(output, this.currentPath);
                break;

            case 'ls':
                this.addLine(output, 'Documents  Downloads  Pictures  Music  Videos');
                break;

            case 'cat':
                if (args.length === 0) {
                    this.addLine(output, 'cat: 缺少文件名');
                } else {
                    this.addLine(output, `cat: ${args[0]}: 文件不存在`);
                }
                break;

            case 'neofetch':
                this.addLine(output, '       _,met$$$$$gg.          user@schlenix');
                this.addLine(output, '    ,g$$$$$$$$$$$$$$$P.       ---------------');
                this.addLine(output, '  ,g$$P"     """Y$$.".        OS: Schlenix 1.0');
                this.addLine(output, ' ,$$P\'              `$$$.     Kernel: WebKit');
                this.addLine(output, '\',$$P       ,ggs.     `$$b:   Uptime: ' + Math.floor(performance.now() / 1000) + ' seconds');
                this.addLine(output, ' `d$$\'     ,$P"\'   .    $$$    Shell: schsh');
                this.addLine(output, '  $$P      d$\'     ,    $$P    DE: Schlenix Desktop');
                this.addLine(output, '  $$:      $$.   -    ,d$$\'    WM: SchlenWM');
                this.addLine(output, '  $$;      Y$b._   _,d$P\'      Terminal: Schlenix Terminal');
                this.addLine(output, '  Y$$.    `.`"Y$$$$P"\'         CPU: ' + navigator.hardwareConcurrency + ' cores');
                this.addLine(output, '  `$$b      "-.__              Memory: ' + (navigator.deviceMemory || 'Unknown') + ' GB');
                break;

            case 'about':
                this.addLine(output, 'Schlenix - 前端伪操作系统');
                this.addLine(output, '版本: 1.0.0');
                this.addLine(output, '基于 Web 技术构建的类 LXQt 风格桌面环境');
                break;

            default:
                this.addLine(output, `${cmd}: 命令未找到`);
                break;
        }

        this.addLine(output, '');
    }

    addLine(output, text) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    focusInput(windowId) {
        setTimeout(() => {
            const content = windowManager.getWindowContent(windowId);
            if (content) {
                const input = content.querySelector('.terminal-input');
                if (input) input.focus();
            }
        }, 100);
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['terminal'] = new TerminalApp();
