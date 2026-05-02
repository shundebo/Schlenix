// Schlenix - 计算器应用

class CalculatorApp {
    constructor() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '计算器',
            icon: '🔢',
            width: 320,
            height: 420,
            content: this.getContent()
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="calculator-content">
                <div class="calculator-display">${this.currentValue}</div>
                <div class="calculator-buttons">
                    <button class="calculator-btn clear">C</button>
                    <button class="calculator-btn operator">÷</button>
                    <button class="calculator-btn operator">×</button>
                    <button class="calculator-btn operator">−</button>
                    
                    <button class="calculator-btn number" data-value="7">7</button>
                    <button class="calculator-btn number" data-value="8">8</button>
                    <button class="calculator-btn number" data-value="9">9</button>
                    <button class="calculator-btn operator">+</button>
                    
                    <button class="calculator-btn number" data-value="4">4</button>
                    <button class="calculator-btn number" data-value="5">5</button>
                    <button class="calculator-btn number" data-value="6">6</button>
                    <button class="calculator-btn operator">(</button>
                    
                    <button class="calculator-btn number" data-value="1">1</button>
                    <button class="calculator-btn number" data-value="2">2</button>
                    <button class="calculator-btn number" data-value="3">3</button>
                    <button class="calculator-btn operator">)</button>
                    
                    <button class="calculator-btn number" data-value="0">0</button>
                    <button class="calculator-btn number" data-value=".">.</button>
                    <button class="calculator-btn equals">=</button>
                </div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const display = content.querySelector('.calculator-display');
        const buttons = content.querySelectorAll('.calculator-btn');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('number')) {
                    this.handleNumber(button.dataset.value || button.textContent, display);
                } else if (button.classList.contains('operator')) {
                    this.handleOperator(button.textContent, display);
                } else if (button.classList.contains('equals')) {
                    this.handleEquals(display);
                } else if (button.classList.contains('clear')) {
                    this.handleClear(display);
                }
            });
        });
    }

    handleNumber(num, display) {
        if (this.shouldResetDisplay) {
            this.currentValue = num;
            this.shouldResetDisplay = false;
        } else {
            if (this.currentValue === '0' && num !== '.') {
                this.currentValue = num;
            } else if (num === '.' && this.currentValue.includes('.')) {
                return;
            } else {
                this.currentValue += num;
            }
        }
        display.textContent = this.currentValue;
    }

    handleOperator(op, display) {
        if (this.operation && !this.shouldResetDisplay) {
            this.handleEquals(display);
        }
        
        this.previousValue = this.currentValue;
        this.operation = op;
        this.shouldResetDisplay = true;
    }

    handleEquals(display) {
        if (!this.operation || !this.previousValue) return;

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result;

        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '−':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                result = current !== 0 ? prev / current : 'Error';
                break;
            default:
                return;
        }

        this.currentValue = result.toString();
        display.textContent = this.currentValue;
        this.operation = null;
        this.previousValue = '';
        this.shouldResetDisplay = true;
    }

    handleClear(display) {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        display.textContent = this.currentValue;
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['calculator'] = new CalculatorApp();
