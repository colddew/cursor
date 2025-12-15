// 主应用入口文件
import store from './store.js';
import NanoBananaAPI from './api.js';
import PromptGenerator from './prompt-generator.js';
import ThemeSelector from './components/theme-selector.js';
import VocabularyEditor from './components/vocabulary-editor.js';

// 初始化应用
class BulletinApp {
    constructor() {
        this.api = null;
        this.promptGenerator = new PromptGenerator();
        this.themeSelector = null;
        this.vocabularyEditor = null;
        this.init();
    }

    // 初始化应用
    async init() {
        // 初始化页面类 - 默认显示欢迎页面
        const headerActions = document.getElementById('headerActionsContainer');
        if (headerActions) {
            headerActions.style.display = 'flex';
        }
        console.log('Initialized app - buttons should show');

        // 加载主题数据
        const themes = await this.loadThemes();

        // 初始化组件
        this.initComponents(themes);

        // 绑定全局事件
        this.bindGlobalEvents();

        // 订阅状态变化
        this.subscribeToStore();

        // 检查API密钥
        this.checkApiKey();

        // 隐藏加载遮罩
        this.hideLoading();

        // 初始化完成后的额外设置
        this.initializeUI();
    }

    // 加载主题数据
    async loadThemes() {
        try {
            const response = await fetch('themes.json');
            if (!response.ok) {
                throw new Error('Failed to load themes');
            }
            const data = await response.json();
            return data.themes;
        } catch (error) {
            console.error('Error loading themes:', error);
            showToast('加载主题失败，请刷新页面重试', 'error');
            return [];
        }
    }

    // 初始化组件
    initComponents(themes) {
        // 初始化主题选择器
        const themeSelection = document.getElementById('themeSelection');
        if (themeSelection) {
            this.themeSelector = new ThemeSelector(themeSelection, store, themes);
            this.themeSelector.onThemeSelect((theme) => {
                this.onThemeSelect(theme);
            });
            this.themeSelector.onSceneSelect((scene) => {
                this.onSceneSelect(scene);
            });
        }

        // 初始化词汇编辑器
        const contentConfig = document.getElementById('contentConfig');
        if (contentConfig) {
            const vocabularyContainer = contentConfig.querySelector('.vocabulary-list');
            if (vocabularyContainer) {
                this.vocabularyEditor = new VocabularyEditor(vocabularyContainer, store);
            }
        }

        // 初始化API（如果有密钥）
        const apiKey = store.state.settings.apiKey;
        if (apiKey) {
            this.api = new NanoBananaAPI(apiKey);
        }
    }

    // 绑定全局事件
    bindGlobalEvents() {
        // 点击遮罩关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId === 'settingsModal') {
                    this.hideSettingsModal();
                } else if (modalId === 'galleryModal') {
                    this.hideGalleryModal();
                }
            }
        });

        // 开始按钮
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.showSection('themeSelection');
            });
        }

        // 返回主题选择
        const backToTheme = document.getElementById('backToTheme');
        if (backToTheme) {
            backToTheme.addEventListener('click', () => {
                this.showSection('themeSelection');
            });
        }

        // 生成按钮
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateBulletin();
            });
        }

        // 生成新按钮
        const createNewBtn = document.getElementById('createNewBtn');
        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => {
                this.resetAndStart();
            });
        }

        // 重新生成按钮
        const regenerateBtn = document.getElementById('regenerateBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.regenerateBulletin();
            });
        }

        // 下载按钮
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadImage();
            });
        }

        // 保存到作品库
        const saveToGalleryBtn = document.getElementById('saveToGalleryBtn');
        if (saveToGalleryBtn) {
            saveToGalleryBtn.addEventListener('click', () => {
                this.saveToGallery();
            });
        }

        // 设置相关
        this.bindSettingsEvents();

        // 作品库相关
        this.bindGalleryEvents();

        // Toast相关
        this.bindToastEvents();
    }

    // 绑定设置相关事件
    bindSettingsEvents() {
        // 设置按钮
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // 关闭设置
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }

        // 取消设置
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }

        // 保存设置
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // API密钥输入
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
            // 加载保存的API密钥
            apiKeyInput.value = store.state.settings.apiKey || '';

            // 实时验证
            apiKeyInput.addEventListener('input', () => {
                const isValid = apiKeyInput.value.length >= 10;
                apiKeyInput.style.borderColor = isValid ? '#4ECDC4' : '#FF6B6B';
            });
        }
    }

    // 绑定作品库相关事件
    bindGalleryEvents() {
        // 作品库按钮
        const galleryBtn = document.getElementById('galleryBtn');
        if (galleryBtn) {
            galleryBtn.addEventListener('click', () => {
                this.showGalleryModal();
            });
        }

        // 关闭作品库
        const closeGalleryBtns = document.querySelectorAll('#closeGalleryBtn, #closeGalleryBtn2');
        closeGalleryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideGalleryModal();
            });
        });

        // 清空作品库
        const clearGalleryBtn = document.getElementById('clearGalleryBtn');
        if (clearGalleryBtn) {
            clearGalleryBtn.addEventListener('click', () => {
                store.clearGallery();
            });
        }
    }

    // 绑定Toast事件
    bindToastEvents() {
        const toast = document.getElementById('toast');
        if (toast) {
            // 点击隐藏toast
            toast.addEventListener('click', () => {
                toast.classList.remove('show');
            });
        }
    }

    // 订阅状态变化
    subscribeToStore() {
        store.subscribe((state) => {
            this.onStateChange(state);
        });
    }

    // 状态变化处理
    onStateChange(state) {
        // 更新词汇编辑器
        if (this.vocabularyEditor && state.currentScene) {
            this.vocabularyEditor.setScene(state.currentScene);
        }

        // 更新词汇计数
        this.updateVocabularyCount();

        // 处理生成进度
        if (state.generationStatus === 'generating') {
            this.updateGenerationProgress(state.generationProgress);
        }

        // 处理生成结果
        if (state.generationStatus === 'success' && state.currentWork) {
            this.showResult(state.currentWork);
        }

        // 处理生成错误
        if (state.generationStatus === 'error') {
            this.showError('生成失败，请重试');
        }

        // 自动下载
        if (state.generationStatus === 'success' &&
            state.settings.preferences.autoDownload &&
            state.currentWork) {
            setTimeout(() => {
                this.downloadImage();
            }, 1000);
        }
    }

    // 主题选择处理
    onThemeSelect(theme) {
        // 切换到内容配置页面
        this.showSection('contentConfig');

        // 更新主题显示
        this.updateThemeDisplay();

        // 更新词汇编辑器
        if (this.vocabularyEditor && theme.scenes[0]) {
            this.vocabularyEditor.setScene(theme.scenes[0]);
        }

        store.showToast(`已选择主题：${theme.name}`, 'success');
    }

    // 场景选择处理
    onSceneSelect(scene) {
        // 更新主题显示（标题可能随场景变化）
        this.updateThemeDisplay();

        store.showToast(`已选择场景：${scene.name}`, 'info');
    }

    // 生成小报
    async generateBulletin() {
        // 验证选择
        if (!store.state.currentTheme) {
            store.showToast('请先选择主题', 'error');
            return;
        }

        if (store.state.selectedVocabulary.length === 0) {
            store.showToast('请至少选择一个词汇', 'error');
            return;
        }

        if (!store.state.settings.apiKey) {
            store.showToast('请先在设置中配置API密钥', 'error');
            this.showSettingsModal();
            return;
        }

        // 初始化API
        if (!this.api) {
            this.api = new NanoBananaAPI(store.state.settings.apiKey);
        }

        // 获取标题
        const customTitle = document.getElementById('customTitle')?.value || '';
        const title = store.getCurrentTitle(customTitle);

        // 生成提示词
        const prompt = this.promptGenerator.generatePrompt({
            theme: store.state.currentTheme,
            scene: store.state.currentScene,
            vocabulary: store.state.selectedVocabulary,
            customTitle: customTitle
        });

        // 开始生成
        store.startGeneration();

        try {
            // 调用API生成图片
            const result = await this.api.generate(prompt, {
                aspectRatio: document.getElementById('aspectRatio')?.value || '3:4',
                resolution: document.getElementById('resolution')?.value || '4K',
                outputFormat: 'png',
                timeout: 30000,
                pollInterval: 1000,
                onProgress: (progress, message) => {
                    store.updateGenerationProgress(progress);
                }
            });

            if (result.success) {
                // 创建作品对象
                const work = {
                    id: Date.now().toString(),
                    title: title,
                    theme: store.state.currentTheme.name,
                    scene: store.state.currentScene?.name || '',
                    content: {
                        mainTitle: title,
                        prompt: prompt,
                        vocabulary: store.state.selectedVocabulary
                    },
                    imageUrl: result.imageUrl,
                    settings: {
                        aspectRatio: document.getElementById('aspectRatio')?.value || '3:4',
                        resolution: document.getElementById('resolution')?.value || '4K',
                        style: 'cartoon'
                    },
                    generatedAt: Date.now()
                };

                // 生成成功
                store.generationSuccess(work);

                // 自动保存
                if (store.state.settings.preferences.autoSave) {
                    store.saveToGallery(work);
                }

            } else {
                // 生成失败
                store.generationError(new Error(result.error));
            }

        } catch (error) {
            store.generationError(error);
        }
    }

    // 重新生成
    regenerateBulletin() {
        if (store.state.currentWork) {
            // 使用相同的参数重新生成
            store.setState({ currentWork: null });
            store.startGeneration();
            this.generateBulletin();
        }
    }

    // 显示结果
    showResult(work) {
        const resultSection = document.getElementById('resultDisplay');
        const generatedImage = document.getElementById('generatedImage');
        const resultVocabularyGrid = document.getElementById('resultVocabularyGrid');

        // 显示图片
        if (generatedImage) {
            generatedImage.src = work.imageUrl;
        }

        // 显示词汇表
        if (resultVocabularyGrid && work.content.vocabulary) {
            resultVocabularyGrid.innerHTML = work.content.vocabulary.map(word => `
                <div class="result-word">
                    <div class="result-word-english">${word.english}</div>
                    <div class="result-word-phonetic">/${word.phonetic}/</div>
                    <div class="result-word-chinese">${word.chinese}</div>
                </div>
            `).join('');
        }

        // 切换到结果页面
        this.showSection('resultDisplay');

        // 滚动到顶部
        resultSection.scrollTop = 0;
    }

    // 更新主题显示
    updateThemeDisplay() {
        const themeDisplay = document.getElementById('selectedThemeDisplay');
        if (!themeDisplay || !store.state.currentTheme) return;

        const themeIcon = document.getElementById('selectedThemeIcon');
        const themeName = document.getElementById('selectedThemeName');
        const sceneName = document.getElementById('selectedSceneName');
        const defaultThemeName = document.getElementById('defaultThemeName');

        // 设置主题信息
        themeIcon.textContent = store.state.currentTheme.icon || '📚';
        themeName.textContent = store.state.currentTheme.name;

        // 设置场景信息
        if (store.state.currentScene) {
            sceneName.textContent = `场景：${store.state.currentScene.name}`;
        } else {
            sceneName.textContent = '';
        }

        // 设置默认标题
        const defaultTitle = store.getCurrentTitle();
        defaultThemeName.textContent = defaultTitle;
    }

    // 显示进度
    updateGenerationProgress(progress) {
        const progressBar = document.getElementById('modalProgressFill');
        const progressPercent = document.getElementById('modalProgressPercent');
        const progressSteps = document.querySelectorAll('#modalProgressSteps .step');

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (progressPercent) {
            progressPercent.textContent = `${Math.round(progress)}%`;
        }

        // 更新步骤
        const stepIndex = Math.floor(progress / 20);
        progressSteps.forEach((step, index) => {
            if (index <= stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // 下载图片
    downloadImage() {
        if (!store.state.currentWork || !store.state.currentWork.imageUrl) {
            store.showToast('没有可下载的图片', 'error');
            return;
        }

        const link = document.createElement('a');
        link.href = store.state.currentWork.imageUrl;
        link.download = `${store.state.currentWork.title}-${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        store.showToast('图片下载已开始', 'success');
    }

    // 保存到作品库
    saveToGallery() {
        if (!store.state.currentWork) {
            store.showToast('没有可保存的作品', 'error');
            return;
        }

        store.saveToGallery(store.state.currentWork);
    }

    // 显示设置弹窗
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            // 先保存当前滚动位置
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;

            // 将滚动位置保存到body的data属性中，确保hideModal能正确恢复
            document.body.setAttribute('data-scroll-x', scrollX);
            document.body.setAttribute('data-scroll-y', scrollY);

            // 将页面滚动到顶部，确保模态框显示在视口中央
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // 立即显示弹窗
            modal.classList.remove('hidden');

            // 给body添加modal-open类，禁用页面滚动
            document.body.classList.add('modal-open');

            // 设置body样式固定位置，禁用滚动但保持位置
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = `-${scrollX}px`;
            document.body.style.width = '100vw';
            document.body.style.overflow = 'hidden';
        }
    }

    // 隐藏设置弹窗
    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // 先从data属性中获取保存的滚动位置
        const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
        const scrollX = parseInt(document.body.getAttribute('data-scroll-x') || '0', 10);

        // 移除body的modal-open类
        document.body.classList.remove('modal-open');

        // 恢复body的样式
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // 清理data属性
        document.body.removeAttribute('data-scroll-x');
        document.body.removeAttribute('data-scroll-y');

        // 恢复滚动位置
        window.scrollTo(scrollX, scrollY);
    }

    // 保存设置
    saveSettings() {
        const apiKey = document.getElementById('apiKey')?.value || '';
        const autoSave = document.getElementById('autoSave')?.checked ?? true;
        const showTutorial = document.getElementById('showTutorial')?.checked ?? true;
        const autoDownload = document.getElementById('autoDownload')?.checked ?? false;

        // 更新设置
        store.updateSettings({
            apiKey: apiKey,
            preferences: {
                ...store.state.settings.preferences,
                autoSave,
                showTutorial,
                autoDownload
            }
        });

        // 更新API实例
        if (apiKey) {
            try {
                this.api = new NanoBananaAPI(apiKey);
                store.showToast('设置已保存', 'success');
                this.hideSettingsModal();
            } catch (error) {
                store.showToast('API密钥格式错误', 'error');
            }
        } else {
            store.showToast('请输入API密钥', 'error');
        }
    }

    // 显示作品库弹窗
    showGalleryModal() {
        const modal = document.getElementById('galleryModal');
        const galleryGrid = document.getElementById('galleryGrid');
        const emptyGallery = document.getElementById('emptyGallery');

        if (modal) {
            // 先保存当前滚动位置
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;

            // 将滚动位置保存到body的data属性中，确保hideModal能正确恢复
            document.body.setAttribute('data-scroll-x', scrollX);
            document.body.setAttribute('data-scroll-y', scrollY);

            // 将页面滚动到顶部，确保模态框显示在视口中央
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // 立即显示弹窗
            modal.classList.remove('hidden');

            // 给body添加modal-open类，禁用页面滚动
            document.body.classList.add('modal-open');

            // 设置body样式固定位置，禁用滚动但保持位置
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = `-${scrollX}px`;
            document.body.style.width = '100vw';
            document.body.style.overflow = 'hidden';
        }

        // 渲染作品库
        if (galleryGrid && emptyGallery) {
            if (store.state.gallery.length === 0) {
                galleryGrid.style.display = 'none';
                emptyGallery.style.display = 'block';
            } else {
                galleryGrid.style.display = 'grid';
                emptyGallery.style.display = 'none';
                this.renderGallery();
            }
        }
    }

    // 隐藏作品库弹窗
    hideGalleryModal() {
        const modal = document.getElementById('galleryModal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // 先从data属性中获取保存的滚动位置
        const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
        const scrollX = parseInt(document.body.getAttribute('data-scroll-x') || '0', 10);

        // 移除body的modal-open类
        document.body.classList.remove('modal-open');

        // 恢复body的样式
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // 清理data属性
        document.body.removeAttribute('data-scroll-x');
        document.body.removeAttribute('data-scroll-y');

        // 恢复滚动位置
        window.scrollTo(scrollX, scrollY);
    }

    // 渲染作品库
    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;

        galleryGrid.innerHTML = store.state.gallery.map(work => `
            <div class="gallery-item" data-work-id="${work.id}">
                <img src="${work.imageUrl}" alt="${work.title}">
                <div class="gallery-item-info">
                    <div class="gallery-item-title">${work.title}</div>
                    <div class="gallery-item-date">
                        ${new Date(work.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定点击事件
        galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const workId = item.dataset.workId;
                const work = store.state.gallery.find(w => w.id === workId);
                if (work) {
                    // 显示作品详情（可以扩展为新页面）
                    window.open(work.imageUrl, '_blank');
                }
            });
        });
    }

    // 切换页面部分
    showSection(sectionName) {
        // 更新 store 中的当前部分
        store.showSection(sectionName);

        // 移除所有页面类
        document.body.classList.remove('page-welcome', 'page-content-config', 'page-result-display');

        // 隐藏所有部分
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // 显示指定部分
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.remove('hidden');

            // 更新页面类名
            if (sectionName === 'welcome') {
                document.body.classList.add('page-welcome');
            } else if (sectionName === 'contentConfig') {
                document.body.classList.add('page-content-config');
            } else if (sectionName === 'resultDisplay') {
                document.body.classList.add('page-result-display');
            }

            // 确保header按钮在所有页面都显示
            const headerActions = document.getElementById('headerActionsContainer');
            if (headerActions) {
                headerActions.style.display = 'flex';
                console.log('Header buttons displayed on:', sectionName);
            }

            // 如果是内容配置页面，确保主题显示更新
            if (sectionName === 'contentConfig') {
                // 延迟执行以确保DOM已更新
                setTimeout(() => {
                    this.updateThemeDisplay();

                    // 确保词汇选择状态正确
                    if (this.vocabularyEditor && store.state.currentScene) {
                        this.vocabularyEditor.setScene(store.state.currentScene);
                        this.vocabularyEditor.updateSelectedCount();
                    }
                }, 100);
            }
        }
    }

    // 重置并开始
    resetAndStart() {
        store.resetState();
        this.showSection('themeSelection');
    }

    // 检查API密钥
    checkApiKey() {
        if (!store.state.settings.apiKey) {
            setTimeout(() => {
                if (store.state.currentSection === 'welcome') {
                    this.showSettingsModal();
                }
            }, 1000);
        }
    }

    // 显示加载中
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    // 隐藏加载中
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // 初始化UI
    initializeUI() {
        // 确保词汇计数显示正确
        this.updateVocabularyCount();

        // 如果当前在内容配置页面，更新主题显示
        if (store.state.currentSection === 'contentConfig') {
            this.updateThemeDisplay();
        }
    }

    // 更新词汇计数
    updateVocabularyCount() {
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = store.state.selectedVocabulary.length;
        }
    }

    // 显示错误
    showError(message) {
        store.showToast(message, 'error');
    }
}

// 全局函数
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new BulletinApp();
});

// 导出
export default BulletinApp;