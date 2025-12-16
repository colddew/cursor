// 增强功能模块 - 新手教程和图片选择动画

class EnhancedFeatures {
    constructor() {
        this.tutorialStep = 1;
        this.maxTutorialSteps = 4;
        this.showTutorial = false;
        this.store = window.app?.store;
        this.lastSection = null; // 跟踪上一次的section
        this.init();
    }

    init() {
        this.setupTutorialModal();
        this.setupStylePicker();
        this.setupSettingsHandler();
        this.checkFirstVisit();

        // Subscribe to section changes
        if (this.store) {
            this.store.subscribe((state) => {
                // Header visibility is now controlled by main.js
                // 只在section真正改变时打印日志
                if (this.lastSection !== state.currentSection) {
                    console.log('Section changed:', state.currentSection);
                    this.lastSection = state.currentSection;
                }
            });
            this.lastSection = this.store.state.currentSection;
        }
    }

    // 检查是否首次访问
    checkFirstVisit() {
        const hasVisited = localStorage.getItem('hasVisited');
        const showTutorialSetting = localStorage.getItem('showTutorial') !== 'false';

        // 恢复保存的风格
        const savedStyle = localStorage.getItem('selectedThemeStyle');
        if (savedStyle) {
            this.applyThemeStyle(savedStyle);
        }

        // 禁用自动弹窗教程，让用户正常使用系统
        // if (!hasVisited && showTutorialSetting === null || showTutorialSetting === 'true') {
        //     // 延迟显示教程，让用户先看到界面
        //     setTimeout(() => {
        //         this.showTutorialModal();
        //     }, 2000);
        // }
    }

    setupTutorialModal() {
        const tutorialModal = document.getElementById('tutorialModal');
        const prevBtn = document.getElementById('prevTutorialBtn');
        const nextBtn = document.getElementById('nextTutorialBtn');
        const skipBtn = document.getElementById('skipTutorialBtn');

        if (!tutorialModal) return;

        // 更新教程步骤显示
        this.updateTutorialStep = () => {
            const steps = tutorialModal.querySelectorAll('.tutorial-step');
            const dots = tutorialModal.querySelectorAll('.dot');

            steps.forEach((step, index) => {
                step.classList.toggle('active', index + 1 === this.tutorialStep);
            });

            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index + 1 === this.tutorialStep);
            });

            // 更新按钮状态
            prevBtn.disabled = this.tutorialStep === 1;
            nextBtn.textContent = this.tutorialStep === this.maxTutorialSteps ? '开始使用' : '下一步';

            // 更新进度条
            const progressFill = tutorialModal.querySelector('.progress-fill');
            const progress = (this.tutorialStep / this.maxTutorialSteps) * 100;
            progressFill.style.width = `${progress}%`;
        };

        // 下一步
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.tutorialStep < this.maxTutorialSteps) {
                    this.tutorialStep++;
                    this.updateTutorialStep();
                } else {
                    // 完成教程
                    this.hideTutorialModal();
                    localStorage.setItem('hasVisited', 'true');
                }
            });
        }

        // 上一步
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.tutorialStep > 1) {
                    this.tutorialStep--;
                    this.updateTutorialStep();
                }
            });
        }

        // 跳过教程
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.hideTutorialModal();
                localStorage.setItem('hasVisited', 'true');
            });
        }
    }

    showTutorialModal() {
        const modal = document.getElementById('tutorialModal');
        if (!modal) return;

        this.tutorialStep = 1;
        this.updateTutorialStep();

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    hideTutorialModal() {
        const modal = document.getElementById('tutorialModal');
        if (!modal) return;

        modal.classList.remove('show');
        modal.classList.add('hide');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.classList.remove('hide');
            document.body.style.overflow = '';
        }, 300);
    }

    setupStylePicker() {
        const overlay = document.getElementById('themeStyleOverlay');
        const styleBtn = document.getElementById('themeStyleBtn');

        if (!overlay) return;

        const options = overlay.querySelectorAll('.style-option');
        const confirmBtn = document.getElementById('confirmStylePicker');
        const cancelBtn = document.getElementById('cancelStylePicker');

        // 绑定风格选择
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // 确认选择
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const selected = overlay.querySelector('.style-option.selected');
                if (selected) {
                    const style = selected.dataset.style;
                    this.applyThemeStyle(style);
                    localStorage.setItem('selectedThemeStyle', style);
                    this.hideStylePicker();
                }
            });
        }

        // 取消选择
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideStylePicker();
            });
        }

        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideStylePicker();
            }
        });
    }

    showStylePicker(button) {
        // 使用统一的 showModal 方法，确保在视口中央显示
        if (window.app && window.app.uiController) {
            window.app.uiController.showModal('themeStyleOverlay');
        }

        // 恢复之前的选择
        const overlay = document.getElementById('themeStyleOverlay');
        if (overlay) {
            const savedStyle = localStorage.getItem('selectedThemeStyle') || 'default';
            overlay.querySelectorAll('.style-option').forEach(option => {
                option.classList.toggle('selected', option.dataset.style === savedStyle);
            });
        }
    }

    hideStylePicker() {
        // 使用统一的 hideModal 方法
        if (window.app && window.app.uiController) {
            window.app.uiController.hideModal('themeStyleOverlay');
        }
    }

    applyThemeStyle(style) {
        // 移除所有主题样式表
        document.querySelectorAll('style[data-theme]').forEach(el => el.remove());

        // 根据选择的主题动态添加样式
        const themeStyles = {
            default: `
                :root {
                  --primary: #667eea;
                  --secondary: #764ba2;
                  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                }
                .icon-btn {
                  background: rgba(255, 255, 255, 0.9);
                  color: #333;
                  border-radius: 20px;
                }
                .icon-btn:hover {
                  background: white;
                  color: #667eea;
                }
            `,
            dark: `
                :root {
                  --primary: #1a202c;
                  --secondary: #2d3748;
                  --gradient-primary: linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%);
                  --bg-primary: #1a202c;
                  --text-primary: #f7fafc;
                  --text-secondary: #e2e8f0;
                }
                body {
                  background: #0f1419;
                  color: #f7fafc;
                }
                .icon-btn {
                  background: rgba(30, 30, 30, 0.9);
                  color: #f7fafc;
                  border-radius: 20px;
                }
                .icon-btn:hover {
                  background: rgba(26, 32, 44, 0.9);
                  color: #00ffff;
                }
            `,
            cyber: `
                :root {
                  --primary: #00ffff;
                  --secondary: #ff00ff;
                  --gradient-primary: linear-gradient(135deg, #00ffff 0%, #ff00ff 50%, #ffff00 100%);
                }
                body {
                  background: #0a0a0a;
                  color: #00ffff;
                }
                .icon-btn {
                  background: rgba(0, 255, 255, 0.1);
                  border: 1px solid rgba(0, 255, 255, 0.3);
                  color: #00ffff;
                  border-radius: 20px;
                }
                .icon-btn:hover {
                  background: rgba(0, 255, 255, 0.2);
                  border-color: #00ffff;
                  color: #ffffff;
                  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                }
            `,
            macaron: `
                :root {
                  --primary: #FF6B9D;
                  --secondary: #4ECDC4;
                  --gradient-primary: linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 50%, #FFE66D 100%);
                }
                body {
                  background: linear-gradient(135deg, #B3E5FF 0%, #FFB3D1 50%, #B3FFD9 100%);
                }
                .icon-btn {
                  background: rgba(255, 255, 255, 0.8);
                  border: 2px solid #FF6B9D;
                  color: #FF6B9D;
                  border-radius: 20px;
                }
                .icon-btn:hover {
                  background: #FF6B9D;
                  color: white;
                  transform: scale(1.05);
                }
            `,
            apple: `
                :root {
                  --primary: #007AFF;
                  --secondary: #5856D6;
                  --gradient-primary: linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #FF2D92 100%);
                }
                body {
                  background: #f2f2f7;
                  color: #1d1d1f;
                }
                .icon-btn {
                  background: rgba(255, 255, 255, 0.9);
                  border: 1px solid rgba(0, 122, 255, 0.2);
                  color: #007AFF;
                  border-radius: 20px;
                }
                .icon-btn:hover {
                  background: #007AFF;
                  color: white;
                  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
                }
            `,
            ocean: `
                :root {
                  --primary: #0077be;
                  --secondary: #00a8cc;
                  --gradient-primary: linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #00d4ff 100%);
                }
                body {
                  background: linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #00d4ff 100%);
                }
                .icon-btn {
                  background: rgba(255, 255, 255, 0.9);
                  border: 1px solid rgba(0, 119, 190, 0.3);
                  color: #0077be;
                  border-radius: 20px;
                }
                .icon-btn:hover {
                  background: rgba(0, 119, 190, 0.9);
                  color: white;
                  box-shadow: 0 4px 12px rgba(0, 119, 190, 0.4);
                }
            `
        };

        if (themeStyles[style]) {
            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-theme', style);
            styleElement.textContent = themeStyles[style];
            document.head.appendChild(styleElement);
        }
    }

    setupSettingsHandler() {
        // 获取按钮
        const settingsBtn = document.getElementById('settingsBtn');
        const themeStyleBtn = document.getElementById('themeStyleBtn');
        const galleryBtn = document.getElementById('galleryBtn');

        // 绑定主题风格按钮点击事件
        if (themeStyleBtn) {
            themeStyleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showStylePicker(themeStyleBtn);
            });
        }

        // 设置和作品库按钮由 modern-main.js 处理，这里不再重复绑定

        // 确保应用初始化后再恢复保存的主题风格
        setTimeout(() => {
            const savedStyle = localStorage.getItem('selectedThemeStyle');
            if (savedStyle) {
                this.applyThemeStyle(savedStyle);
            }
        }, 200);

        // 设置模态框背景点击关闭
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideSettingsModal();
                }
            });
        }

        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');

        // 设置API密钥可见性切换
        const toggleApiKeyBtn = document.getElementById('toggleApiKeyVisibility');
        if (toggleApiKeyBtn) {
            toggleApiKeyBtn.addEventListener('click', () => {
                this.toggleApiKeyVisibility();
            });
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveSettings();
            });
        }

        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
            });
        }

        // 设置作品库模态框背景点击关闭
        const galleryModal = document.getElementById('galleryModal');
        if (galleryModal) {
            galleryModal.addEventListener('click', (e) => {
                if (e.target === galleryModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideGalleryModal();
                }
            });
        }

        // 绑定作品库关闭按钮事件
        const closeGalleryBtn = document.getElementById('closeGalleryBtn');
        const closeGalleryBtn2 = document.getElementById('closeGalleryBtn2');
        const clearGalleryBtn = document.getElementById('clearGalleryBtn');

        [closeGalleryBtn, closeGalleryBtn2].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.hideGalleryModal());
            }
        });

        if (clearGalleryBtn) {
            clearGalleryBtn.addEventListener('click', () => {
                if (confirm('确定要清空作品库吗？此操作不可恢复。')) {
                    if (window.app && window.app.store) {
                        window.app.store.clearGallery();
                        this.showToast('作品库已清空');
                    }
                }
            });
        }
    }

    // 使用modern-main.js中的模态框方法
    showGalleryModal() {
        if (window.app && window.app.uiController) {
            window.app.uiController.showModal('galleryModal');
        }
    }

    hideGalleryModal() {
        if (window.app && window.app.uiController) {
            window.app.uiController.hideModal('galleryModal');
        }
    }

    showSettingsModal() {
        // 加载当前设置（包括密钥可见性状态）
        this.loadSettings();
        
        if (window.app && window.app.uiController) {
            window.app.uiController.showModal('settingsModal');
        }
    }

    hideSettingsModal() {
        // 关闭时自动隐藏密钥并关闭眼睛图标
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.getElementById('toggleApiKeyVisibility');

        if (apiKeyInput && toggleBtn) {
            // 确保密钥被隐藏
            apiKeyInput.type = 'password';
            toggleBtn.classList.remove('show-api-key');
            toggleBtn.title = '显示密钥';

            // 保存隐藏状态到localStorage
            localStorage.setItem('apiKeyVisible', 'false');
        }
        
        if (window.app && window.app.uiController) {
            window.app.uiController.hideModal('settingsModal');
        }
    }

    loadSettings() {
        // 加载显示教程设置
        const showTutorialCheck = document.getElementById('showTutorial');
        if (showTutorialCheck) {
            showTutorialCheck.checked = localStorage.getItem('showTutorial') !== 'false';
        }

        // 默认确保密钥是隐藏状态
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.getElementById('toggleApiKeyVisibility');

        if (apiKeyInput && toggleBtn) {
            // 设置为默认隐藏状态
            apiKeyInput.type = 'password';
            toggleBtn.classList.remove('show-api-key');
            toggleBtn.title = '显示密钥';
        }
    }

    saveSettings() {
        // 调用modern-main.js中的saveSettings函数来保存API密钥和其他设置
        if (window.modernUI && window.modernUI.saveSettings) {
            // 传递skipCloseModal=true，让modern-main.js处理所有保存
            window.modernUI.saveSettings(true);
            // 关闭模态框
            this.hideSettingsModal();
        } else {
            // 如果modernUI不可用，直接保存API密钥到localStorage
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput) {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    localStorage.setItem('apiKey', apiKey);
                } else {
                    localStorage.removeItem('apiKey');
                }
            }

            // 保存显示教程设置
            const showTutorialCheck = document.getElementById('showTutorial');
            if (showTutorialCheck) {
                localStorage.setItem('showTutorial', showTutorialCheck.checked);
            }

            // 关闭模态框
            this.hideSettingsModal();

            // 显示提示
            this.showToast('设置已保存');
        }
    }

    showToast(message, duration = 3000) {
        // 创建临时toast提示
        const tempToast = document.createElement('div');
        tempToast.className = 'toast';
        tempToast.textContent = message;
        tempToast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 9999;
            animation: slideInUp 0.3s ease-out;
        `;

        document.body.appendChild(tempToast);

        setTimeout(() => {
            tempToast.remove();
        }, duration);
    }

    // 切换API密钥可见性
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.getElementById('toggleApiKeyVisibility');

        if (!apiKeyInput || !toggleBtn) return;

        if (apiKeyInput.type === 'password') {
            // 切换为明文显示
            apiKeyInput.type = 'text';
            toggleBtn.classList.add('show-api-key');
            toggleBtn.title = '隐藏密钥';
        } else {
            // 切换为密文显示
            apiKeyInput.type = 'password';
            toggleBtn.classList.remove('show-api-key');
            toggleBtn.title = '显示密钥';
        }
        // 注意：不再保存到localStorage，因为关闭时会自动隐藏
    }
}

// 添加必要的CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* 模态框过渡动画 */
    .modal-overlay.show {
        animation: slideInUp 0.3s ease-out;
    }

    .modal-overlay.hide {
        animation: slideInUp 0.3s ease-out reverse;
    }

    /* SVG图标动画 */
    .header-actions .icon-btn {
        position: relative;
        overflow: visible;
        padding: 4px !important;
        min-width: 36px;
        min-height: 36px;
    }

    .header-actions .icon-btn svg {
        transition: all 0.3s ease;
        transform-origin: center;
        width: 20px !important;
        height: 20px !important;
    }

    .header-actions .icon-btn:hover svg {
        transform: rotate(15deg) scale(1.1);
    }

    /* 设置按钮齿轮动画 */
    .header-actions #settingsBtn svg .gear-teeth {
        animation: rotate 3s linear infinite;
        transform-origin: center;
    }

    /* 主题按钮光晕动画 */
    .header-actions #themeStyleBtn svg .sun-rays {
        animation: pulse 2s ease-in-out infinite;
    }

    /* 作品库按钮图片动画 */
    .header-actions #galleryBtn svg .photo-frame {
        transition: all 0.3s ease;
    }

    .header-actions #galleryBtn:hover svg .photo-frame {
        transform: scale(1.05);
    }

    .header-actions #galleryBtn svg .photo-dot {
        animation: float 3s ease-in-out infinite;
    }

    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
`;

document.head.appendChild(style);

// 初始化增强功能
window.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保 modern-main.js 已经完成初始化
    setTimeout(() => {
        window.enhancedFeatures = new EnhancedFeatures();
        console.log('Enhanced features initialized');
    }, 100);
});