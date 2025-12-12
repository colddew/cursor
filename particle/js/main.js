/**
 * 主入口 - 初始化并连接所有模块
 */
(async function () {
    // DOM元素
    const container = document.getElementById('canvas-container');
    const video = document.getElementById('video');
    const gestureCanvas = document.getElementById('gesture-canvas');

    // 初始化UI
    const ui = new UIController();

    // Init color from picker
    const colorPicker = document.getElementById('particle-color');
    const initialColor = colorPicker ? colorPicker.value : 0xff6b9d;

    // 初始化粒子系统
    const particleSystem = new ParticleSystem(container, {
        particleCount: 10000,
        color: initialColor
    });

    // 初始化手势检测
    const gestureDetector = new GestureDetector();
    window.gestureDetector = gestureDetector; // Expose for button

    // Preload Guanyin Image
    if (window.GUANYIN_IMAGE_SRC && window.ShapeGenerator) {
        ShapeGenerator.preloadGuanyin(window.GUANYIN_IMAGE_SRC);
    }

    // Camera Toggle Logic
    const toggleBtn = document.getElementById('camera-toggle-btn');
    const cameraPreview = document.querySelector('.camera-preview');

    if (toggleBtn && cameraPreview) {
        const eyeOpen = toggleBtn.querySelector('.eye-open');
        const eyeClosed = toggleBtn.querySelector('.eye-closed');

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            cameraPreview.classList.toggle('hidden');

            // Toggle icon visibility
            if (cameraPreview.classList.contains('hidden')) {
                toggleBtn.style.opacity = '0.5';
                if (eyeOpen) eyeOpen.style.display = 'none';
                if (eyeClosed) eyeClosed.style.display = 'block';
                if (window.gestureDetector) window.gestureDetector.active = false; // Optional: pause detection
            } else {
                toggleBtn.style.opacity = '1';
                if (eyeOpen) eyeOpen.style.display = 'block';
                if (eyeClosed) eyeClosed.style.display = 'none';
                if (window.gestureDetector) window.gestureDetector.active = true;
            }
        };
    }

    // Patch Fullscreen Logic (Use Document Element to include Video/UI)
    if (ui && ui.toggleFullscreen) {
        ui.toggleFullscreen = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.error(e));
            } else {
                document.exitFullscreen();
            }
        };
    }

    // 连接UI回调
    ui.onShapeChange((shape) => {
        currentSelectedShape = shape;
        // 如果当前是张开状态，立即切换显示
        if (currentState === 'OPEN') {
            particleSystem.setShape(shape);
            // Apply user-selected color if set, otherwise use default
            if (currentUserColor) {
                particleSystem.setColor(currentUserColor);
            }
        }
    });
    let currentUserColor = null; // Track user-selected color
    ui.onColorChange((color) => {
        currentUserColor = color;
        particleSystem.setColor(color);
    });
    ui.onCountChange((count) => particleSystem.setParticleCount(count));
    ui.onSpeedChange((speed) => particleSystem.setSpeed(speed));

    // 状态机变量
    let currentState = 'IDLE'; // IDLE (Drifting), DETECTED (Sphere), OPEN (Heart)
    let currentSelectedShape = 'heart'; // 追踪当前选中的形状
    let stateTimer = null;
    let handLostTimer = null;
    let driftRecoveryTimer = null; // New timer for delayed drift recovery

    // 手势检测回调
    gestureDetector.onResults((data) => {
        ui.updateGestureStatus(data);

        // 如果检测到手
        if (data.handsDetected > 0) {
            // 清除丢失计时器
            if (handLostTimer) {
                clearTimeout(handLostTimer);
                handLostTimer = null;
            }
            // Clear drift recovery timer if hands reappear
            if (driftRecoveryTimer) {
                clearTimeout(driftRecoveryTimer);
                driftRecoveryTimer = null;
                // If we were in the middle of resetting to drift but hands came back, 
                // ensure we are in a valid state (e.g., if we were transitioning to IDLE)
                if (currentState === 'IDLE') {
                    particleSystem.setDriftMode(false); // Prepare for shape
                }
            }

            // 根据状态处理
            if (currentState === 'IDLE') {
                // 状态转移: IDLE -> DISPERSING (初次检测到手，先散开，等待进一步指令)
                // Use the gesture detector's logic (Side C detection)
                const isHandOpen = data.leftHandOpen || data.rightHandOpen;

                if (isHandOpen) {
                    console.log(`👐 手张开：变为 ${currentSelectedShape}`);
                    particleSystem.setShape(currentSelectedShape);
                    // Apply user-selected color if set
                    if (currentUserColor) {
                        particleSystem.setColor(currentUserColor);
                    }
                    currentState = 'OPEN';
                } else {
                    console.log('✊ 手握紧：粒子散开');
                    particleSystem.setShape('drift'); // drift形状即随机全屏分布
                    currentState = 'DISPERSING';
                }
                particleSystem.setDriftMode(false);
            }

            // 在 DISPERSING 或 OPEN 状态下，持续监测手势变化
            if (currentState === 'DISPERSING' || currentState === 'OPEN') {
                // 判断张开程度 (Side C Detection)
                const isHandOpen = data.leftHandOpen || data.rightHandOpen;

                if (isHandOpen && currentState !== 'OPEN') {
                    // 转移: DISPERSING -> OPEN
                    console.log(`👐 手张开：变为 ${currentSelectedShape}`);
                    particleSystem.setShape(currentSelectedShape);
                    // Apply user-selected color if set
                    if (currentUserColor) {
                        particleSystem.setColor(currentUserColor);
                    }
                    currentState = 'OPEN';
                } else if (!isHandOpen && currentState !== 'DISPERSING') {
                    // 转移: OPEN -> DISPERSING (握拳散开)
                    console.log('✊ 手握紧：粒子散开');
                    particleSystem.setShape('drift');
                    currentState = 'DISPERSING';
                }
            }

            // 统一处理缩放
            let scale = 1.0;
            if (data.handsDetected >= 2) {
                scale = mapRange(data.distance, 0.1, 0.7, 0.8, 2.5);
            } else {
                scale = mapRange(data.distance, 0.05, 0.4, 0.8, 1.8);
            }
            particleSystem.setScale(scale);

        } else {
            // 如果手势消失
            if (!handLostTimer && currentState !== 'IDLE') {
                handLostTimer = setTimeout(() => {
                    console.log('🌌 手势消失：先散开，再恢复飘动');

                    // 1. 先让粒子炸开铺满屏幕 (Drift Shape是随机分布)
                    // 保持 driftMode = false，利用 Lerp 插值让粒子飞向随机位置
                    particleSystem.setShape('drift');
                    particleSystem.setDriftMode(false);
                    currentState = 'IDLE';

                    // 2. 等粒子散开得差不多了，再开启向右飘动
                    // 这样就不会出现一坨粒子整体移出屏幕的情况
                    driftRecoveryTimer = setTimeout(() => {
                        console.log('🍃 恢复星空流');
                        particleSystem.setDriftMode(true);
                        driftRecoveryTimer = null;
                    }, 1500); // 1.5秒后恢复流动，给粒子足够时间散开

                    handLostTimer = null;
                }, 200); // 200ms 防抖
            }
        }
    });

    gestureDetector.onStatusChange((status, text) => {
        ui.setCameraStatus(status, text);
    });

    // 启动手势检测
    try {
        await gestureDetector.init(video, gestureCanvas);
        await gestureDetector.start();
    } catch (error) {
        console.error('手势检测初始化失败:', error);
        ui.setCameraStatus('error', '摄像头初始化失败');
    }

    // 隐藏加载动画
    setTimeout(() => ui.hideLoading(), 1500);

    // 工具函数：范围映射
    function mapRange(value, inMin, inMax, outMin, outMax) {
        const clamped = Math.max(inMin, Math.min(inMax, value));
        return ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') ui.toggleFullscreen();
        if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    });

    console.log('🎆 3D粒子系统已启动');
})();
