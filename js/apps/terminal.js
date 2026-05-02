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
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // 简单的命令自动补全
                const commands = ['help', 'clear', 'echo', 'date', 'whoami', 'pwd', 'ls', 'cat', 'neofetch', 'about', 'uname', 'uptime', 'free', 'df', 'ps', 'history'];
                const partial = input.value.toLowerCase();
                const matches = commands.filter(cmd => cmd.startsWith(partial));
                if (matches.length === 1) {
                    input.value = matches[0];
                } else if (matches.length > 1) {
                    this.addLine(output, matches.join('  '));
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
                this.addLine(output, '  cd         - 切换目录');
                this.addLine(output, '  ls         - 列出文件');
                this.addLine(output, '  cat        - 显示文件内容');
                this.addLine(output, '  mkdir      - 创建目录');
                this.addLine(output, '  touch      - 创建文件');
                this.addLine(output, '  rm         - 删除文件或目录 (使用 -r 递归删除)');
                this.addLine(output, '  uname      - 显示系统信息');
                this.addLine(output, '  uptime     - 显示系统运行时间');
                this.addLine(output, '  free       - 显示内存使用情况');
                this.addLine(output, '  df         - 显示磁盘使用情况');
                this.addLine(output, '  ps         - 显示进程列表');
                this.addLine(output, '  history    - 显示命令历史');
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
                const lsPath = args[0] || this.currentPath;
                const lsResult = storage.ls(lsPath);
                if (lsResult.success) {
                    const items = Object.entries(lsResult.items).map(([name, item]) => {
                        const icon = item.type === 'directory' ? '📁' : '📄';
                        return `${icon} ${name}`;
                    });
                    if (items.length > 0) {
                        items.forEach(item => this.addLine(output, item));
                    } else {
                        this.addLine(output, '(空目录)');
                    }
                } else {
                    this.addLine(output, `ls: ${lsResult.error}`);
                }
                break;

            case 'cat':
                if (args.length === 0) {
                    this.addLine(output, 'cat: 缺少文件名');
                } else {
                    const catPath = args[0].startsWith('/') ? args[0] : this.currentPath + '/' + args[0];
                    const catResult = storage.readFile(catPath);
                    if (catResult.success) {
                        catResult.content.split('\n').forEach(line => this.addLine(output, line));
                    } else {
                        this.addLine(output, `cat: ${catResult.error}`);
                    }
                }
                break;

            case 'mkdir':
                if (args.length === 0) {
                    this.addLine(output, 'mkdir: 缺少目录名');
                } else {
                    const mkdirPath = args[0].startsWith('/') ? args[0] : this.currentPath + '/' + args[0];
                    const mkdirResult = storage.mkdir(mkdirPath);
                    if (mkdirResult.success) {
                        this.addLine(output, `已创建目录: ${args[0]}`);
                    } else {
                        this.addLine(output, `mkdir: ${mkdirResult.error}`);
                    }
                }
                break;

            case 'touch':
                if (args.length === 0) {
                    this.addLine(output, 'touch: 缺少文件名');
                } else {
                    const touchPath = args[0].startsWith('/') ? args[0] : this.currentPath + '/' + args[0];
                    const touchResult = storage.touch(touchPath);
                    if (touchResult.success) {
                        this.addLine(output, `已创建文件: ${args[0]}`);
                    } else {
                        this.addLine(output, `touch: ${touchResult.error}`);
                    }
                }
                break;

            case 'rm':
                if (args.length === 0) {
                    this.addLine(output, 'rm: 缺少文件名');
                } else {
                    const recursive = args.includes('-r') || args.includes('-rf');
                    const filename = args.find(arg => !arg.startsWith('-'));
                    if (!filename) {
                        this.addLine(output, 'rm: 缺少文件名');
                        break;
                    }
                    const rmPath = filename.startsWith('/') ? filename : this.currentPath + '/' + filename;
                    const rmResult = storage.rm(rmPath, recursive);
                    if (rmResult.success) {
                        this.addLine(output, `已删除: ${filename}`);
                    } else {
                        this.addLine(output, `rm: ${rmResult.error}`);
                    }
                }
                break;

            case 'cd':
                if (args.length === 0) {
                    this.currentPath = '/home/user';
                } else {
                    const newPath = args[0].startsWith('/') ? args[0] : this.currentPath + '/' + args[0];
                    const node = storage.getNode(newPath);
                    if (node && node.type === 'directory') {
                        this.currentPath = newPath;
                    } else {
                        this.addLine(output, `cd: ${args[0]}: 目录不存在`);
                    }
                }
                break;

            case 'uname':
                if (args.includes('-a')) {
                    this.addLine(output, 'Schlenix 1.0.0 WebKit x86_64 GNU/Linux');
                } else {
                    this.addLine(output, 'Schlenix');
                }
                break;

            case 'uptime':
                const uptime = Math.floor(performance.now() / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                this.addLine(output, `up ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                break;

            case 'free':
                const memory = navigator.deviceMemory || 4;
                this.addLine(output, '              total        used        free');
                this.addLine(output, `Mem:          ${memory}GB        2GB         ${memory - 2}GB`);
                break;

            case 'df':
                this.addLine(output, 'Filesystem     Size  Used Avail Use% Mounted on');
                this.addLine(output, '/dev/sda1      100G   42G   58G  42% /');
                this.addLine(output, 'tmpfs          2.0G  1.2M  2.0G   1% /tmp');
                break;

            case 'ps':
                this.addLine(output, '  PID TTY          TIME CMD');
                this.addLine(output, '    1 ?        00:00:01 systemd');
                this.addLine(output, '  123 pts/0    00:00:00 bash');
                this.addLine(output, '  456 pts/0    00:00:00 schlenix');
                break;

            case 'history':
                this.history.forEach((cmd, index) => {
                    this.addLine(output, `  ${index + 1}  ${cmd}`);
                });
                break;

            case 'neofetch':
                this.addLine(output, '       _,met$$$$$gg.          user@schlenix');
                this.addLine(output, '    ,g$$$$$$$$$$$$$$$P.       ---------------');
                this.addLine(output, '  ,g$$P"     """Y$$."."        OS: Schlenix 1.0');
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
