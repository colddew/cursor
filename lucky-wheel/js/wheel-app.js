// 转盘应用主对象
const wheelApp = {
    // 全局变量
    currentTheme: 'dark-theme',
    wheelData: {
        title: '我的幸运转盘',
        options: [],
        theme: 'dark-theme'
    },

    // 主题配置
    themes: {
        'dark-theme': {
            background: '#1a1a1a',
            text: '#ffffff',
            wheelColors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']
        },
        'macaroon-theme': {
            background: '#74b9ff',
            text: '#2d3436',
            wheelColors: ['#ff7675', '#fd79a8', '#fdcb6e', '#55a3ff', '#a29bfe', '#ffeaa7', '#fab1a0', '#ff9ff3']
        },
        'cyberpunk-theme': {
            background: '#0a0a0a',
            text: '#00ffcc',
            wheelColors: ['#00ffff', '#ff00ff', '#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5']
        }
    },

    // 初始化
    init() {
        this.initThemeSelector();
        this.initSaveButton();
        this.collectWheelData();
    },

    // 保存按钮初始化
    initSaveButton() {
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveHTML();
            });
        }
    },

    // 主题选择器初始化
    initThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                themeOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                const selectedTheme = option.dataset.theme;
                document.body.className = selectedTheme;
                this.currentTheme = selectedTheme;

                // 重新收集数据
                this.collectWheelData();
            });
        });
    },

    // 收集转盘数据
    collectWheelData() {
        this.wheelData.title = document.getElementById('wheel-title').value || '我的幸运转盘';
        this.wheelData.theme = this.currentTheme;

        const optionItems = document.querySelectorAll('.option-item');
        this.wheelData.options = [];

        optionItems.forEach(item => {
            const nameInput = item.querySelector('.option-input');
            const weightInput = item.querySelector('.weight-input');

            if (nameInput.value && weightInput.value) {
                this.wheelData.options.push({
                    name: nameInput.value,
                    weight: parseInt(weightInput.value) || 1
                });
            }
        });
    },

    // 添加选项
    addOption() {
        const optionsList = document.getElementById('options-list');
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.innerHTML = `
            <input type="text" class="option-input" placeholder="选项名称">
            <input type="number" class="weight-input" placeholder="权重" value="1" min="1">
            <button class="btn btn-secondary" onclick="wheelApp.removeOption(this)">删除</button>
        `;
        optionsList.appendChild(optionItem);
    },

    // 删除选项
    removeOption(button) {
        const optionItem = button.parentElement;
        optionItem.remove();
    },

    // 权重均分
    equalizeWeights() {
        const weightInputs = document.querySelectorAll('.weight-input');
        weightInputs.forEach(input => {
            input.value = 1;
        });
    },

    // 生成转盘
    generateWheel() {
        this.collectWheelData();

        if (this.wheelData.options.length < 2) {
            this.showMessage('请至少添加2个选项');
            return;
        }

        // 显示模态窗口
        const modal = document.getElementById('game-modal');
        modal.classList.add('show');
        document.body.classList.add('modal-open');

        // 更新标题
        document.getElementById('display-title').textContent = this.wheelData.title;

        // 绘制转盘
        this.drawWheel();

        // 重置状态
        document.getElementById('spin-btn').disabled = false;
        document.getElementById('result-display').textContent = '点击"开始"按钮开始转盘';
    },

    // 绘制转盘
    drawWheel() {
        const wheelGroup = document.getElementById('wheel-group');
        wheelGroup.innerHTML = '';

        const totalWeight = this.wheelData.options.reduce((sum, option) => sum + option.weight, 0);
        const centerX = 0;
        const centerY = 0;
        const radius = 155; // 缩小半径以适应350px的容器

        // 创建一个专门用于旋转的内部容器
        const wheelInner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        wheelInner.setAttribute('id', 'wheel-inner');

        let currentAngle = 0; // 从顶部开始

        this.wheelData.options.forEach((option, index) => {
            const sliceAngle = (option.weight / totalWeight) * 360;
            const endAngle = currentAngle + sliceAngle;

            // 创建扇形路径
            const path = this.createSlicePath(centerX, centerY, radius, currentAngle, endAngle);
            const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            slice.setAttribute('d', path);
            slice.setAttribute('fill', this.themes[this.currentTheme].wheelColors[index % this.themes[this.currentTheme].wheelColors.length]);
            slice.setAttribute('stroke', '#fff');
            slice.setAttribute('stroke-width', '2');
            slice.setAttribute('data-option-index', index);
            wheelInner.appendChild(slice);

            // 添加文字
            const textAngle = currentAngle + sliceAngle / 2;
            const textRadius = radius * 0.65; // 调整文字位置
            // 使用polarToCartesian函数计算正确的文字位置
            const textPos = this.polarToCartesian(centerX, centerY, textRadius, textAngle);
            const textX = textPos.x;
            const textY = textPos.y;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('class', 'wheel-text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = option.name;

            // 设置字体大小，确保文字适合扇形区域
            const fontSize = Math.min(24, Math.max(16, (sliceAngle / 360) * 32));
            text.style.fontSize = fontSize + 'px';

            // 根据主题设置文字颜色
            if (this.currentTheme === 'macaroon-theme') {
                text.style.fill = '#2d3436';
            } else {
                text.style.fill = 'white';
            }
            text.style.fontWeight = 'bold';

            // 确保文字总是可见，无论扇形大小
            text.style.opacity = '1';

            wheelInner.appendChild(text);

            currentAngle = endAngle;
        });

        // 将旋转容器添加到主容器
        wheelGroup.appendChild(wheelInner);
    },

    // 创建扇形路径
    createSlicePath(centerX, centerY, radius, startAngle, endAngle) {
        const start = this.polarToCartesian(centerX, centerY, radius, endAngle);
        const end = this.polarToCartesian(centerX, centerY, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", centerX, centerY,
            "L", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "Z"
        ].join(" ");
    },

    // 极坐标转笛卡尔坐标
    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    },

    // 旋转转盘
    spinWheel() {
        const spinBtn = document.getElementById('spin-btn');
        const wheelGroup = document.getElementById('wheel-group');
        const resultDisplay = document.getElementById('result-display');

        spinBtn.disabled = true;
        resultDisplay.textContent = '转盘旋转中...';

        // 获取当前转盘的旋转角度
        const wheelInner = document.getElementById('wheel-inner');
        const currentRotation = wheelInner ? parseFloat(wheelInner.style.transform.replace('rotate(', '').replace('deg)', '') || 0) : 0;

        // 计算随机结果
        const result = this.calculateWeightedRandom();

        // 计算每个扇形的起始和结束角度
        const totalWeight = this.wheelData.options.reduce((sum, option) => sum + option.weight, 0);
        let accumulatedAngle = 0;
        const sliceAngles = [];

        for (let i = 0; i < this.wheelData.options.length; i++) {
            const sliceAngle = (this.wheelData.options[i].weight / totalWeight) * 360;
            sliceAngles.push({
                start: accumulatedAngle,
                end: accumulatedAngle + sliceAngle,
                center: accumulatedAngle + sliceAngle / 2,
                name: this.wheelData.options[i].name
            });
            accumulatedAngle += sliceAngle;
        }

        // 计算目标扇形的边界位置
        // 箭头在顶部指向下方，所以箭头位置是0度
        // 我们需要让选中的扇形旋转，使其边界对准0度位置
        // 选中的扇形有一个起始角度和结束角度
        // 计算旋转后，哪个边界会更接近0度

        // 固定圈数旋转（6圈）
        const spins = 6;

        // 获取选中的扇形
        const selectedSlice = sliceAngles[result];

        // --- 修复逻辑 ---
        // 指针在顶部 (0度/360度)
        // 目标是将选中扇形的中心移动到 0度
        const targetCenterAngle = selectedSlice.center;

        // 计算当前转盘实际位置的模 (0-360)
        const currentMod = currentRotation % 360;

        // 计算目标位置相对于当前位置还需要转多少度
        // 目标角度是 (360 - targetCenterAngle)
        let dist = (360 - targetCenterAngle) - currentMod;

        // 确保只往顺时针转 (正数)
        while (dist < 0) {
            dist += 360;
        }

        // 加上基础圈数 (6圈)
        const finalRotation = currentRotation + spins * 360 + dist;

        // 调试信息
        console.log('=== 旋转调试信息 ===');
        console.log('当前旋转角度:', currentRotation);
        console.log('选中结果:', this.wheelData.options[result].name);
        console.log('选中扇形中心角度:', selectedSlice.center);
        console.log('目标中心角度（0°）:', 0);
        console.log('当前模值:', currentMod);
        console.log('需要旋转的距离:', dist);
        console.log('最终旋转角度:', finalRotation);
        console.log('所有扇形角度:', sliceAngles);

        // 应用旋转动画 - 只旋转转盘内容，保持位置固定
        if (wheelInner) {
            // 先重置过渡，然后应用旋转
            wheelInner.style.transition = 'none';
            wheelInner.style.transform = 'rotate(' + currentRotation + 'deg)';

            // 强制重绘
            wheelInner.offsetHeight;

            // 设置旋转动画
            wheelInner.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
            wheelInner.style.transform = 'rotate(' + finalRotation + 'deg)';
        }

        // 显示结果
        setTimeout(() => {
            // 计算实际指向的扇形作为验证
            const actualResult = this.getNearestSlice(finalRotation % 360);
            console.log('实际指向的扇形:', actualResult);
            console.log('指针角度（反向计算）:', (360 - finalRotation % 360) % 360);

            // 显示加权随机选择的结果
            resultDisplay.textContent = `恭喜！抽中了：${this.wheelData.options[result].name}`;
            spinBtn.disabled = false;
        }, 4000);
    },

    // 计算加权随机选择
    calculateWeightedRandom() {
        const totalWeight = this.wheelData.options.reduce((sum, option) => sum + option.weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < this.wheelData.options.length; i++) {
            random -= this.wheelData.options[i].weight;
            if (random <= 0) {
                return i;
            }
        }

        return this.wheelData.options.length - 1;
    },

    // 关闭模态窗口
    closeModal() {
        const modal = document.getElementById('game-modal');
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');

        // 保持上次的执行结果，不清理数据
        // 仅隐藏模态窗口即可
    },

    // 保存为独立HTML文件
    saveHTML() {
        const htmlContent = this.generateStandaloneHTML();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // 创建一个临时下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.wheelData.title || '幸运转盘'}_test.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 显示保存成功消息
        this.showMessage('转盘HTML文件已下载！请将文件保存到debug目录');
    },

    // 生成独立的HTML文件内容
    generateStandaloneHTML() {
        const theme = this.themes[this.currentTheme];

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.wheelData.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            ${this.wheelData.theme === 'dark-theme' ? 'background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);' : this.wheelData.theme === 'macaroon-theme' ? 'background: linear-gradient(135deg, #74b9ff 0%, #0984e3 25%, #a29bfe 50%, #6c5ce7 75%, #fd79a8 100%);' : 'background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%);'}
            color: ${theme.text};
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .container {
            text-align: center;
            max-width: 600px;
            width: 100%;
            padding: 20px;
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 30px;
        }

        .wheel-container {
            margin: 30px 0;
        }

        #wheel-svg {
            filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));
            max-width: 100%;
            height: auto;
        }

        .wheel-wrapper {
            position: relative;
            width: 350px;
            height: 350px;
            margin: 0 auto;
        }

        .wheel-pointer {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 30px solid #ff0000;
            z-index: 30;
            filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
        }

        .spin-btn {
            background: #2196F3;
            color: white;
            padding: 15px 40px;
            font-size: 20px;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            margin: 20px 0;
        }

        .spin-btn:hover {
            background: #1976D2;
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(33, 150, 243, 0.4);
        }

        .spin-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        .result-display {
            margin-top: 20px;
            padding: 15px;
            background: rgba(76, 175, 80, 0.1);
            border-radius: 10px;
            text-align: center;
            font-size: 1.2rem;
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .wheel-text {
            font-weight: bold;
            fill: white;
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
        }

        ${this.wheelData.theme === 'macaroon-theme' ? 'body .wheel-text { fill: #2d3436; }' : 'body .wheel-text { fill: white; }'}

        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }

            #wheel-svg {
                width: 300px;
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${this.wheelData.title}</h1>

        <div class="wheel-container">
            <div class="wheel-wrapper">
                <svg id="wheel-svg" width="350" height="350" viewBox="0 0 350 350">
                    <g id="wheel-group" transform="translate(175, 175)">
                        <g id="wheel-inner">
                            <!-- Wheel segments will be drawn here -->
                        </g>
                    </g>
                </svg>
                <div class="wheel-pointer"></div>
            </div>
        </div>

        <button class="spin-btn" id="spin-btn" onclick="spinWheel()">开始</button>

        <div class="result-display" id="result-display">
            点击"开始"按钮开始转盘
        </div>
    </div>

    <script>
        const wheelData = ${JSON.stringify(this.wheelData)};
        const themes = ${JSON.stringify(this.themes)};

        // 全局变量记录旋转角度
        let globalRotation = 0;

        function drawWheel() {
            const wheelInner = document.getElementById('wheel-inner');
            wheelInner.innerHTML = '';

            const totalWeight = wheelData.options.reduce((sum, option) => sum + option.weight, 0);
            const centerX = 0;
            const centerY = 0;
            const radius = 155;

            let currentAngle = 0;

            wheelData.options.forEach((option, index) => {
                const sliceAngle = (option.weight / totalWeight) * 360;
                const endAngle = currentAngle + sliceAngle;

                const path = createSlicePath(centerX, centerY, radius, currentAngle, endAngle);
                const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                slice.setAttribute('d', path);
                slice.setAttribute('fill', themes[wheelData.theme].wheelColors[index % themes[wheelData.theme].wheelColors.length]);
                slice.setAttribute('stroke', '#fff');
                slice.setAttribute('stroke-width', '2');

                const textAngle = currentAngle + sliceAngle / 2;
                const textRadius = radius * 0.65;
                // 使用polarToCartesian计算正确的文字位置
                const textPos = polarToCartesian(centerX, centerY, textRadius, textAngle);
                const textX = textPos.x;
                const textY = textPos.y;

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', textX);
                text.setAttribute('y', textY);
                text.setAttribute('class', 'wheel-text');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = option.name;

                // 设置字体大小，确保文字适合扇形区域
                const fontSize = Math.min(24, Math.max(16, (sliceAngle / 360) * 32));
                text.style.fontSize = fontSize + 'px';

                // 根据主题设置文字颜色
                if (wheelData.theme === 'macaroon-theme') {
                    text.style.fill = '#2d3436';
                } else {
                    text.style.fill = 'white';
                }
                text.style.fontWeight = 'bold';

                wheelInner.appendChild(slice);
                wheelInner.appendChild(text);

                currentAngle = endAngle;
            });
        }

        function createSlicePath(centerX, centerY, radius, startAngle, endAngle) {
            const start = polarToCartesian(centerX, centerY, radius, endAngle);
            const end = polarToCartesian(centerX, centerY, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

            return [
                "M", centerX, centerY,
                "L", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                "Z"
            ].join(" ");
        }

        function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        }

        function spinWheel() {
            const spinBtn = document.getElementById('spin-btn');
            const wheelGroup = document.getElementById('wheel-group');
            const resultDisplay = document.getElementById('result-display');

            spinBtn.disabled = true;
            resultDisplay.textContent = '转盘旋转中...';

            // 获取当前转盘的旋转角度
            const wheelInner = document.getElementById('wheel-inner');
            const currentRotation = wheelInner ? parseFloat(wheelInner.style.transform.replace('rotate(', '').replace('deg)', '') || 0) : 0;

            // 计算随机结果
            const result = calculateWeightedRandom();

            // 计算每个扇形的起始和结束角度
            const totalWeight = wheelData.options.reduce((sum, option) => sum + option.weight, 0);
            let accumulatedAngle = 0;
            const sliceAngles = [];

            for (let i = 0; i < wheelData.options.length; i++) {
                const sliceAngle = (wheelData.options[i].weight / totalWeight) * 360;
                sliceAngles.push({
                    start: accumulatedAngle,
                    end: accumulatedAngle + sliceAngle,
                    center: accumulatedAngle + sliceAngle / 2,
                    name: wheelData.options[i].name
                });
                accumulatedAngle += sliceAngle;
            }

            // 获取选中的扇形
            const selectedSlice = sliceAngles[result];

            // --- 修复逻辑 ---
            // 指针在顶部 (0度/360度)
            // 目标是将选中扇形的中心移动到 0度
            const targetCenterAngle = selectedSlice.center;

            // 计算当前转盘实际位置的模 (0-360)
            const currentMod = currentRotation % 360;

            // 计算目标位置相对于当前位置还需要转多少度
            // 目标角度是 (360 - targetCenterAngle)
            let dist = (360 - targetCenterAngle) - currentMod;

            // 确保只往顺时针转 (正数)
            while (dist < 0) {
                dist += 360;
            }

            // 固定圈数旋转（6圈）
            const spins = 6;
            // 加上基础圈数 (6圈)
            const finalRotation = currentRotation + spins * 360 + dist;

            // 调试信息
            console.log('=== 旋转调试信息 ===');
            console.log('当前旋转角度:', currentRotation);
            console.log('选中结果:', wheelData.options[result].name);
            console.log('选中扇形中心角度:', selectedSlice.center);
            console.log('目标中心角度（0°）:', 0);
            console.log('当前模值:', currentMod);
            console.log('需要旋转的距离:', dist);
            console.log('最终旋转角度:', finalRotation);
            console.log('所有扇形角度:', sliceAngles);

            // 应用旋转动画 - 只旋转转盘内容，保持位置固定
            if (wheelInner) {
                // 先重置过渡，然后应用旋转
                wheelInner.style.transition = 'none';
                wheelInner.style.transform = 'rotate(' + currentRotation + 'deg)';

                // 强制重绘
                wheelInner.offsetHeight;

                // 设置旋转动画
                wheelInner.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
                wheelInner.style.transformOrigin = '0px 0px';
                wheelInner.style.transform = 'rotate(' + finalRotation + 'deg)';
            }

            // 显示结果
            setTimeout(() => {
                // 计算实际指向的扇形作为验证
                const actualResult = getNearestSlice(finalRotation % 360);
                console.log('实际指向的扇形:', actualResult);
                console.log('指针角度（反向计算）:', (360 - finalRotation % 360) % 360);

                // 显示加权随机选择的结果
                resultDisplay.textContent = '恭喜！抽中了：' + wheelData.options[result].name;
                spinBtn.disabled = false;
            }, 4000);
        }

        function calculateWeightedRandom() {
            const totalWeight = wheelData.options.reduce((sum, option) => sum + option.weight, 0);
            let random = Math.random() * totalWeight;

            for (let i = 0; i < wheelData.options.length; i++) {
                random -= wheelData.options[i].weight;
                if (random <= 0) {
                    return i;
                }
            }

            return wheelData.options.length - 1;
        }

        // 初始化
        drawWheel();

        // 计算离箭头最近的扇形
        function getNearestSlice(rotationAngle) {
            // 获取当前配置的扇形角度
            const totalWeight = wheelData.options.reduce((sum, option) => sum + option.weight, 0);
            let accumulatedAngle = 0;
            const sliceAngles = [];

            for (let i = 0; i < wheelData.options.length; i++) {
                const sliceAngle = (wheelData.options[i].weight / totalWeight) * 360;
                sliceAngles.push({
                    start: accumulatedAngle,
                    end: accumulatedAngle + sliceAngle,
                    center: accumulatedAngle + sliceAngle / 2,
                    name: wheelData.options[i].name
                });
                accumulatedAngle += sliceAngle;
            }

            console.log('扇形角度详情:', sliceAngles);

            // 箭头固定在顶部指向下方，所以箭头指向0°位置
            // 当转盘旋转rotationAngle度后，我们需要检查哪个扇形的中心最接近0°

            // 计算旋转后每个扇形中心的位置
            let nearestSlice = '';
            let minDistance = Infinity;

            for (const slice of sliceAngles) {
                // 扇形中心相对于旋转后的位置
                // 转盘顺时针旋转rotationAngle度，所以扇形中心也顺时针移动了rotationAngle度
                // 我们需要计算移动后哪个扇形中心最接近0°
                const adjustedCenter = (slice.center + rotationAngle) % 360;

                // 计算到0°的距离
                let distance = Math.abs(adjustedCenter - 0);

                // 处理跨越0度的情况
                if (distance > 180) {
                    distance = 360 - distance;
                }

                console.log(slice.name + ': 原始中心=' + slice.center + '°, 调整后=' + adjustedCenter.toFixed(1) + '°, 距离=' + distance.toFixed(1) + '°');

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestSlice = slice.name;
                }
            }

            console.log('最近扇形: ' + nearestSlice + ' (距离: ' + minDistance.toFixed(1) + '°)');
            return nearestSlice;
        }
    </script>
</body>
</html>`;
    },

    // 显示消息（替代alert)
    showMessage(message) {
        const resultDisplay = document.getElementById('result-display');
        const originalText = resultDisplay.textContent;
        resultDisplay.textContent = message;
        resultDisplay.style.background = 'rgba(244, 67, 54, 0.1)';

        setTimeout(() => {
            resultDisplay.textContent = originalText;
            resultDisplay.style.background = 'rgba(76, 175, 80, 0.1)';
        }, 3000);
      },

    // 计算离箭头最近的扇形
    getNearestSlice(rotationAngle) {
        // 获取当前配置的扇形角度
        const totalWeight = this.wheelData.options.reduce((sum, option) => sum + option.weight, 0);
        let accumulatedAngle = 0;
        const sliceAngles = [];

        for (let i = 0; i < this.wheelData.options.length; i++) {
            const sliceAngle = (this.wheelData.options[i].weight / totalWeight) * 360;
            sliceAngles.push({
                start: accumulatedAngle,
                end: accumulatedAngle + sliceAngle,
                center: accumulatedAngle + sliceAngle / 2,
                name: this.wheelData.options[i].name
            });
            accumulatedAngle += sliceAngle;
        }

        console.log('扇形角度详情:', sliceAngles);

        // 箭头固定在顶部指向下方，所以箭头指向0°位置
        // 当转盘旋转rotationAngle度后，我们需要检查哪个扇形的中心最接近0°

        // 计算旋转后每个扇形中心的位置
        let nearestSlice = '';
        let minDistance = Infinity;

        for (const slice of sliceAngles) {
            // 扇形中心相对于旋转后的位置
            // 转盘顺时针旋转rotationAngle度，所以扇形中心也顺时针移动了rotationAngle度
            // 我们需要计算移动后哪个扇形中心最接近0°
            const adjustedCenter = (slice.center + rotationAngle) % 360;

            // 计算到0°的距离
            let distance = Math.abs(adjustedCenter - 0);

            // 处理跨越0度的情况
            if (distance > 180) {
                distance = 360 - distance;
            }

            console.log(`${slice.name}: 原始中心=${slice.center}°, 调整后=${adjustedCenter.toFixed(1)}°, 距离=${distance.toFixed(1)}°`);

            if (distance < minDistance) {
                minDistance = distance;
                nearestSlice = slice.name;
            }
        }

        console.log(`最近扇形: ${nearestSlice} (距离: ${minDistance.toFixed(1)}°)`);
        return nearestSlice;
    },

    // 计算两个角度之间的最短距离
    calculateAngleDistance(angle1, angle2) {
        let diff = Math.abs(angle1 - angle2);
        return diff > 180 ? 360 - diff : diff;
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    wheelApp.init();
});

// 点击模态窗口外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('game-modal');
    if (event.target === modal) {
        wheelApp.closeModal();
    }
}