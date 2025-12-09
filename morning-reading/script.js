class MorningReadingZoo {
    constructor() {
        // 音频相关
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isListening = false;

        // 应用状态
        this.isPaused = true;  // 初始状态为暂停（未开始）
        this.isStarted = false;  // 标记是否已经开始过
        this.timerInterval = null;
        this.animalGenerationInterval = null;
        // 从localStorage加载计时时间
        this.seconds = parseInt(localStorage.getItem('morningReadingZooTimer') || '0');
        this.lastGenerationTime = 0;

        // 设置
        this.settings = {
            threshold: 15,  // 0-100范围，15适合检测正常朗读声音
            generationSpeed: 2,  // 加快生成速度，提供更快反馈
            selectedAnimals: ['🐶', '🐱', '🐰', '🐻', '🐨', '🦊', '🦁', '🐐', '🐷', '🐸', '🐔', '🐧', '🦆']
        };

        // DOM元素
        this.elements = {
            zooArea: document.getElementById('zooArea'),
            animalsContainer: document.getElementById('animalsContainer'),
            currentVolume: document.getElementById('currentVolume'),
            thresholdSlider: document.getElementById('thresholdSlider'),
            thresholdValue: document.getElementById('thresholdValue'),
            timerDisplay: document.getElementById('timerDisplay'),
            resetTimerBtn: document.getElementById('resetTimerBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeModal: document.getElementById('closeModal'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            animalsSelection: document.getElementById('animalsSelection'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            selectNoneBtn: document.getElementById('selectNoneBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn')
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        // 初始化音频但不开始检测
        this.initializeAudio();
        this.setupKeyboardListener();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 阈值滑块
        this.elements.thresholdSlider.addEventListener('input', (e) => {
            this.settings.threshold = parseInt(e.target.value);
            this.elements.thresholdValue.textContent = e.target.value;
        });

        // 开始/暂停/继续按钮
        this.elements.pauseBtn.addEventListener('click', () => {
            this.toggleState();
        });

        // 复位计时器按钮
        this.elements.resetTimerBtn.addEventListener('click', () => {
            this.resetTimer();
        });

        // 设置按钮
        this.elements.settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });

        // 关闭设置面板
        this.elements.closeModal.addEventListener('click', () => {
            this.hideSettings();
        });

        // 点击面板外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideSettings();
            }
        });

        // 速度滑块
        this.elements.speedSlider.addEventListener('input', (e) => {
            this.elements.speedValue.textContent = e.target.value;
        });

        // 全选/全不选
        this.elements.selectAllBtn.addEventListener('click', () => {
            this.selectAllAnimals(true);
        });

        this.elements.selectNoneBtn.addEventListener('click', () => {
            this.selectAllAnimals(false);
        });

        // 保存/重置设置
        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            this.hideSettings();
        });

        this.elements.resetSettingsBtn.addEventListener('click', () => {
            this.resetSettings();
        });
    }

    // 初始化音频
    async initializeAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.microphone.connect(this.analyser);
            this.isListening = true;
            // 不立即开始音量检测
        } catch (error) {
            console.error('无法访问麦克风:', error);
            alert('请允许使用麦克风以使用此应用');
        }
    }

    // 开始音频捕获检测
    startAudioDetection() {
        if (this.isListening && !this.isPaused) {
            this.checkVolume();
        }
    }

    // 检查音量
    checkVolume() {
        if (!this.isListening || this.isPaused) return;

        // 使用 getByteFrequencyData 获取频率数据来计算音量
        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算平均音量
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // 将值映射到 0-100 的范围，更直观
        const volume = Math.round((average / 255) * 100);

        // 更新音量显示
        this.elements.currentVolume.textContent = volume;

        // 调试输出 - 移除随机限制
        console.log(`音量检测 - 当前: ${volume}, 阈值: ${this.settings.threshold}`);

        // 检查是否超过阈值
        const currentTime = Date.now();
        const timeSinceLastGen = currentTime - this.lastGenerationTime;
        const minInterval = this.settings.generationSpeed * 1000;

        console.log(`检查条件 - 音量超阈值: ${volume > this.settings.threshold}, 时间间隔: ${timeSinceLastGen}ms > ${minInterval}ms`);

        // 当音量超过阈值并且时间间隔足够时生成动物
        if (volume > this.settings.threshold && timeSinceLastGen > minInterval) {
            console.log('✓ 条件满足，生成动物！');
            this.generateAnimal();
            this.lastGenerationTime = currentTime;
        }

        // 如果音量很高，可以稍微缩短等待时间（提供更好的反馈）
        else if (volume > this.settings.threshold * 2 && timeSinceLastGen > minInterval / 2) {
            console.log('✓ 音量很高，加速生成动物！');
            this.generateAnimal();
            this.lastGenerationTime = currentTime;
        }

        // 每100ms检测一次（10Hz），避免过于频繁
        setTimeout(() => this.checkVolume(), 100);
    }

    // 生成动物
    generateAnimal() {
        if (this.settings.selectedAnimals.length === 0) return;

        const animal = this.settings.selectedAnimals[
            Math.floor(Math.random() * this.settings.selectedAnimals.length)
        ];

        const animalElement = document.createElement('div');
        animalElement.className = 'animal';
        animalElement.textContent = animal;

        // 随机大小 (30-60px)
        const size = Math.random() * 30 + 30;
        animalElement.style.fontSize = size + 'px';

        // 随机位置
        const maxX = this.elements.zooArea.offsetWidth - size;
        const maxY = this.elements.zooArea.offsetHeight - size - 100; // 避免底部控制栏
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;

        animalElement.style.left = x + 'px';
        animalElement.style.top = y + 'px';

        // 点击动物时的动画
        animalElement.addEventListener('click', () => {
            animalElement.style.transform = 'scale(1.5) rotate(360deg)';
            setTimeout(() => {
                animalElement.remove();
            }, 300);
        });

        this.elements.animalsContainer.appendChild(animalElement);

        // 限制动物数量
        const animals = this.elements.animalsContainer.querySelectorAll('.animal');
        if (animals.length > 50) {
            animals[0].remove();
        }
    }

    // 切换状态（开始/暂停/继续）
    toggleState() {
        if (!this.isStarted) {
            // 第一次点击：开始
            this.isStarted = true;
            this.isPaused = false;
            this.elements.pauseBtn.textContent = '暂停';
            this.elements.pauseBtn.classList.remove('btn-start');
            this.elements.pauseBtn.classList.add('btn-pause');

            // 开始计时和音量检测
            this.startTimer();
            this.startAudioDetection();

            // 如果之前有保存的时间，询问是否要清除
            if (this.seconds > 0) {
                const usePreviousTime = confirm('检测到之前有未完成的朗读时间，是否继续？\n点击"确定"继续，点击"取消"重新开始');
                if (!usePreviousTime) {
                    this.resetTimer(false);  // 不重新开始计时
                }
            }
        } else if (this.isPaused) {
            // 暂停状态，点击继续
            this.isPaused = false;
            this.elements.pauseBtn.textContent = '暂停';

            // 继续计时和音量检测
            this.startTimer();
            this.startAudioDetection();
        } else {
            // 运行状态，点击暂停
            this.isPaused = true;
            this.elements.pauseBtn.textContent = '继续';

            // 暂停计时和音量检测
            this.stopTimer();
        }
    }

    // 开始计时器
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.updateTimerDisplay();
            // 保存计时时间到localStorage
            localStorage.setItem('morningReadingZooTimer', this.seconds.toString());
        }, 1000);
    }

    // 停止计时器
    stopTimer() {
        clearInterval(this.timerInterval);
    }

    // 复位计时器
    resetTimer(autoStart = true) {
        // 停止当前计时器
        this.stopTimer();

        // 清除所有动物
        this.clearAllAnimals();

        // 重置状态
        this.isStarted = false;
        this.isPaused = true;
        this.seconds = 0;
        this.lastGenerationTime = 0;

        // 更新显示
        this.updateTimerDisplay();
        this.elements.pauseBtn.textContent = '开始';
        this.elements.pauseBtn.classList.remove('btn-pause');
        this.elements.pauseBtn.classList.add('btn-start');

        // 清除localStorage中的计时数据
        localStorage.removeItem('morningReadingZooTimer');

        // 清除音量显示
        this.elements.currentVolume.textContent = '0';
    }

    // 清除所有动物
    clearAllAnimals() {
        const animals = this.elements.animalsContainer.querySelectorAll('.animal');
        animals.forEach(animal => animal.remove());
    }

    // 更新计时器显示
    updateTimerDisplay() {
        const hours = Math.floor(this.seconds / 3600);
        const minutes = Math.floor((this.seconds % 3600) / 60);
        const secs = this.seconds % 60;

        const display =
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(secs).padStart(2, '0');

        this.elements.timerDisplay.textContent = display;
    }

    // 显示设置面板
    showSettings() {
        this.elements.settingsModal.style.display = 'block';

        // 更新UI显示当前设置
        this.elements.speedSlider.value = this.settings.generationSpeed;
        this.elements.speedValue.textContent = this.settings.generationSpeed;

        // 更新动物选择
        const checkboxes = this.elements.animalsSelection.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.settings.selectedAnimals.includes(checkbox.value);
        });
    }

    // 隐藏设置面板
    hideSettings() {
        this.elements.settingsModal.style.display = 'none';
    }

    // 全选/全不选动物
    selectAllAnimals(select) {
        const checkboxes = this.elements.animalsSelection.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    }

    // 保存设置
    saveSettings() {
        // 保存速度设置
        this.settings.generationSpeed = parseInt(this.elements.speedSlider.value);

        // 保存选中的动物
        const checkboxes = this.elements.animalsSelection.querySelectorAll('input[type="checkbox"]:checked');
        this.settings.selectedAnimals = Array.from(checkboxes).map(cb => cb.value);

        // 保存到localStorage
        localStorage.setItem('morningReadingZooSettings', JSON.stringify(this.settings));

        this.updateUI();
    }

    // 重置设置
    resetSettings() {
        this.settings = {
            threshold: 15,  // 0-100范围的默认阈值
            generationSpeed: 2,  // 保持新的默认值
            selectedAnimals: ['🐶', '🐱', '🐰', '🐻', '🐨', '🦊', '🦁', '🐐', '🐷', '🐸', '🐔', '🐧', '🦆']
        };

        localStorage.removeItem('morningReadingZooSettings');
        this.updateUI();
        this.showSettings(); // 重新显示设置面板以更新UI
    }

    // 设置键盘监听器
    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // 防止页面滚动
                console.log('手动生成测试动物');
                this.generateAnimal();
            }
            // 按 't' 键连续生成5个测试动物
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                console.log('批量生成5个测试动物');
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.generateAnimal();
                    }, i * 200);
                }
            }
        });
    }

    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('morningReadingZooSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
    }

    // 更新UI显示
    updateUI() {
        this.elements.thresholdSlider.value = this.settings.threshold;
        this.elements.thresholdValue.textContent = this.settings.threshold;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MorningReadingZoo();
});