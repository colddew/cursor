/**
 * UI控制模块
 */
class UIController {
    constructor() {
        this.panel = document.getElementById('control-panel');
        this.panelToggle = document.getElementById('panel-toggle');
        this.shapeButtons = document.querySelectorAll('.shape-btn');
        this.colorPicker = document.getElementById('particle-color');
        this.colorValue = document.getElementById('color-value');
        this.countSlider = document.getElementById('particle-count');
        this.countValue = document.getElementById('count-value');
        this.speedSlider = document.getElementById('particle-speed');
        this.speedValue = document.getElementById('speed-value');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.handsStatus = document.getElementById('hands-status');
        this.distanceValue = document.getElementById('distance-value');
        this.cameraStatus = document.getElementById('camera-status');
        this.loading = document.getElementById('loading-overlay');

        this.callbacks = { onShapeChange: null, onColorChange: null, onCountChange: null, onSpeedChange: null };
        this.init();
    }

    init() {
        // 面板折叠
        this.panelToggle?.addEventListener('click', () => {
            this.panel.classList.toggle('collapsed');
        });

        // 形状按钮
        this.shapeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.shapeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const shape = btn.dataset.shape;
                if (this.callbacks.onShapeChange) this.callbacks.onShapeChange(shape);
            });
        });

        // 颜色选择
        this.colorPicker?.addEventListener('input', (e) => {
            const color = e.target.value;
            this.colorValue.textContent = color.toUpperCase();
            if (this.callbacks.onColorChange) this.callbacks.onColorChange(color);
        });

        // 粒子数量
        this.countSlider?.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            this.countValue.textContent = count;
            if (this.callbacks.onCountChange) this.callbacks.onCountChange(count);
        });

        // 粒子速度
        this.speedSlider?.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.speedValue.textContent = speed.toFixed(1) + 'x';
            if (this.callbacks.onSpeedChange) this.callbacks.onSpeedChange(speed);
        });

        // 全屏
        this.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
        document.addEventListener('fullscreenchange', () => this.updateFullscreenUI());
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    }

    updateFullscreenUI() {
        const isFs = !!document.fullscreenElement;
        // Icon toggling handled by CSS or separate logic if needed. 
        // For now, simple static icon is fine or we can swap innerHTML.
        // Given user request for just "two icons aligned", static icon is acceptable or 
        // we can implement icon swap later if requested.
        // Current implementation in index.html has static SVG.
    }

    updateGestureStatus(data) {
        if (this.handsStatus) {
            this.handsStatus.textContent = data.handsDetected > 0 ? `${data.handsDetected}只手检测中` : '未检测';
            this.handsStatus.classList.toggle('detected', data.handsDetected > 0);
        }
        if (this.distanceValue) {
            this.distanceValue.textContent = data.handsDetected >= 2 ? data.distance.toFixed(2) : '--';
        }
    }

    setCameraStatus(status, text) {
        if (this.cameraStatus) {
            this.cameraStatus.classList.toggle('active', status === 'active');
            this.cameraStatus.querySelector('span:last-child').textContent = text;
        }
    }

    hideLoading() {
        this.loading?.classList.add('hidden');
    }

    onShapeChange(cb) { this.callbacks.onShapeChange = cb; }
    onColorChange(cb) { this.callbacks.onColorChange = cb; }
    onCountChange(cb) { this.callbacks.onCountChange = cb; }
    onSpeedChange(cb) { this.callbacks.onSpeedChange = cb; }
}

window.UIController = UIController;
