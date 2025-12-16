// 修复版主应用文件 - 功能完整、UI统一的英语小报生成器
// 导入必要的类
class NanoBananaAPI {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API密钥不能为空');
        }

        this.apiKey = apiKey;
        this.baseUrl = 'https://api.kie.ai/api/v1';
        this.defaultTimeout = 30000; // 30秒超时
        this.pollInterval = 1000;   // 1秒轮询间隔
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError') {
                throw new Error('网络错误，请检查网络连接');
            }

            throw error;
        }
    }

    // 创建生成任务
    async createTask(prompt, options = {}) {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('提示词不能为空');
        }

        const params = {
            model: 'nano-banana-pro',
            input: {
                prompt: prompt.trim(),
                image_input: [],
                aspect_ratio: options.aspectRatio || '3:4',
                resolution: options.resolution || '4K',
                output_format: options.outputFormat || 'png'
            }
        };

        if (params.input.prompt.length > 10000) {
            throw new Error('提示词长度不能超过10000字符');
        }

        // 记录请求参数
        console.log('=== API Request Details (modern-main.js) ===');
        console.log('URL: POST https://api.kie.ai/api/v1/jobs/createTask');
        console.log('Headers:');
        console.log('  Authorization: Bearer [API_KEY]');
        console.log('  Content-Type: application/json');
        console.log('Body:', JSON.stringify(params, null, 2));
        console.log('Prompt language check:', params.input.prompt.match(/[\u4e00-\u9fff]/) ? 'Contains Chinese characters!' : 'All English characters');
        console.log('=== End of Request Details ===');

        const response = await this.request('/jobs/createTask', {
            method: 'POST',
            body: JSON.stringify(params)
        });

        if (response.code !== 200) {
            throw new Error(response.msg || '创建任务失败');
        }

        if (!response.data || !response.data.taskId) {
            throw new Error('API返回数据格式错误');
        }

        return {
            taskId: response.data.taskId,
            prompt: params.input.prompt,
            options: params.input
        };
    }

    // 查询任务状态
    async getTaskStatus(taskId) {
        if (!taskId) {
            throw new Error('任务ID不能为空');
        }

        const response = await this.request(`/jobs/recordInfo?taskId=${taskId}`, {
            method: 'GET'
        });

        if (response.code !== 200) {
            throw new Error(response.msg || '查询任务状态失败');
        }

        return response.data;
    }

    // 轮询直到任务完成
    async waitForTask(taskId, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        const interval = options.interval || this.pollInterval;
        const startTime = Date.now();

        if (options.onProgress) {
            options.onProgress(0, '开始生成...');
        }

        while (Date.now() - startTime < timeout) {
            try {
                const status = await this.getTaskStatus(taskId);

                let progress = 0;
                let message = '准备中...';

                switch (status.state) {
                    case 'waiting':
                        progress = 10;
                        message = '排队中，请稍候...';
                        break;
                    case 'processing':
                        progress = 50;
                        message = 'AI正在绘画中...';
                        break;
                    case 'success':
                        progress = 100;
                        message = '生成完成！';
                        return {
                            success: true,
                            data: status,
                            progress: 100
                        };
                    case 'fail':
                        progress = 100;
                        message = '生成失败';
                        throw new Error(status.failMsg || '任务执行失败');
                    default:
                        progress = 20;
                        message = '处理中...';
                }

                if (options.onProgress) {
                    options.onProgress(progress, message);
                }

                if (status.state === 'waiting' || status.state === 'processing') {
                    await new Promise(resolve => setTimeout(resolve, interval));
                }

            } catch (error) {
                throw error;
            }
        }

        throw new Error(`任务超时（${timeout / 1000}秒）`);
    }

    // 完整的生成流程
    async generate(prompt, options = {}) {
        try {
            if (options.onProgress) {
                options.onProgress(10, '提交生成任务...');
            }

            const task = await this.createTask(prompt, options);

            const result = await this.waitForTask(task.taskId, {
                timeout: options.timeout,
                interval: options.pollInterval,
                onProgress: options.onProgress
            });

            let imageUrl = null;
            try {
                const resultData = JSON.parse(result.data.resultJson);
                imageUrl = resultData.resultUrls && resultData.resultUrls[0];

                if (!imageUrl) {
                    throw new Error('未找到图片URL');
                }
            } catch (error) {
                throw new Error('解析结果失败');
            }

            return {
                success: true,
                imageUrl,
                taskId: task.taskId,
                prompt: task.prompt,
                data: result.data
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

class PromptGenerator {
    constructor() {
        this.template = this.loadTemplate();
        this.titleTemplates = null;
        this.loadTitleTemplates();
    }

    async loadTitleTemplates() {
        try {
            const response = await fetch('./titles.json');
            const data = await response.json();
            this.titleTemplates = data.titleTemplates;
        } catch (error) {
            console.error('Failed to load title templates:', error);
            // 使用内置的后备标题
            this.titleTemplates = {
                'defaultTitle': '英语学习小报'
            };
        }
    }

    loadTemplate() {
        return `Comic poster: Generate an English learning poster for teenagers titled "{{themeScene}}/{{title}}", vertical A4 layout, educational newspaper style, suitable for 10-16 year olds learning English through pictures.

# I. Title Section (Top)

**Large centered title**: "{{title}}"
* **Style**: Educational newspaper / English learning poster
* **Text requirements**: Large, bold, cartoon handwritten font, colorful gradient outlines (using rainbow colors: red, orange, yellow, green, blue, purple)
* **Decorations**: Add {{themeScene}}/{{title}}-related colorful sticker-style decorations around the title, bright and eye-catching

# II. Main Scene (Center)

The center features a **cartoon illustration of a "{{themeScene}}/{{title}}" scene**:
* **Overall atmosphere**: Bright, warm, positive, engaging
* **Composition**: Clear object boundaries for easy text association, not overcrowded

**Scene zones and core content**:
1. **Core Zone A (Main activities)**: Show key {{themeScene}}/{{title}} activities
2. **Core Zone B (Tools & items)**: Display related equipment and objects
3. **Core Zone C (Environment)**: Show environmental features (walls, signs, etc.)

**Main character**:
* **Character**: 1 cute cartoon character (profession/identity matching {{themeScene}}/{{title}})
* **Action**: Naturally interacting with the scene

# III. Required Objects & Vocabulary List

**Must clearly draw the following objects and leave space for labels**:

**1. Core characters & facilities**:
{{coreObjects}}

**2. Common items/tools**:
{{commonItems}}

**3. Environment & decorations**:
{{environmentItems}}

*(Note: The number of objects in the image is not limited to this, but the above list must be the main focus)*

# IV. Labeling Rules

For each object above, attach educational labels with:
* **Format**: Three-line style (Line 1: English word, Line 2: Chinese characters, Line 3: phonetic symbols)
* **Style**: Colorful sticker style, each label with different vibrant background colors (pink, light blue, light green, yellow, orange), dark text for high contrast
* **Typography**: Fun, playful fonts suitable for children, rounded letters
* **Layout**: Labels positioned near corresponding objects without obscuring the main illustration

# V. Art Style Parameters
* **Style**: Children's picture book + educational poster
* **Color palette**: High saturation, bright, warm tones with rainbow accents (High Saturation, Warm Tone)
* **Text treatment**: All text elements should be colorful with gradient effects, shadows, or outlines to make them pop
* **Quality**: 8k resolution, high detail, vector illustration style, clean lines, professional printing quality`;
    }


    async generatePrompt(options = {}) {
        if (!options.theme || !options.theme.name) {
            throw new Error('主题信息不能为空');
        }

        if (!options.vocabulary || !Array.isArray(options.vocabulary)) {
            throw new Error('词汇列表不能为空');
        }

        const theme = options.theme;
        const scene = options.scene || theme.scenes[0];
        const vocabulary = options.vocabulary;
        const customTitle = options.customTitle || '';

        // 确保标题模板已加载
        if (!this.titleTemplates) {
            await this.loadTitleTemplates();
        }

        // 获取标题
        let title;
        if (customTitle && customTitle.trim()) {
            // 使用自定义标题
            title = customTitle.trim();
        } else {
            // 使用预设标题
            title = this.getTitle(theme, scene);
        }

        // Format vocabulary with English, phonetic, and Chinese
        const formatVocabularyWord = (word) => {
            // Ensure phonetic has slashes on both sides
            let phonetic = word.phonetic || '';
            if (phonetic && !phonetic.startsWith('/')) {
                phonetic = `/${phonetic}`;
            }
            if (phonetic && !phonetic.endsWith('/')) {
                phonetic = `${phonetic}/`;
            }
            return `${word.english} ${phonetic} ${word.chinese}`;
        };

        const coreObjects = vocabulary.filter(word => word.category === 'character').slice(0, 5).map(formatVocabularyWord).join(', ');
        const commonItems = vocabulary.filter(word => word.category === 'object').slice(0, 8).map(formatVocabularyWord).join(', ');
        const environmentItems = vocabulary.filter(word => word.category === 'environment').slice(0, 5).map(formatVocabularyWord).join(', ');

        // 根据prompt.md要求，使用"主题/场景"格式
        const themeSceneFormat = `${scene.name}`;

        const prompt = this.template
            .replace(/{{title}}/g, title)
            .replace(/{{themeScene}}/g, themeSceneFormat)
            .replace(/{{coreObjects}}/g, coreObjects)
            .replace(/{{commonItems}}/g, commonItems)
            .replace(/{{environmentItems}}/g, environmentItems);

        // 检查提示词语言（仅用于调试）
        const hasChinese = prompt.match(/[\u4e00-\u9fff]/);
        if (hasChinese) {
            console.log('Warning: Generated prompt contains Chinese characters (except in vocabulary):', hasChinese);
        }

        return prompt;
    }

    // 获取标题
    getTitle(theme, scene) {
        // 如果标题模板还没加载完成，使用默认格式
        if (!this.titleTemplates) {
            return scene ? `${theme.name}-${scene.name}` : theme.name;
        }

        const themeId = theme.id;
        const sceneId = scene?.id;

        // 尝试获取主题特定的标题
        if (this.titleTemplates[themeId] && this.titleTemplates[themeId][sceneId]) {
            const titles = this.titleTemplates[themeId][sceneId];
            return titles[Math.floor(Math.random() * titles.length)];
        }

        // 如果没有找到特定标题，使用默认标题
        return this.titleTemplates.defaultTitle || '英语学习小报';
    }

}

// 全局状态管理
class AppState {
    constructor() {
        // 尝试从多个位置加载 API key
        let apiKey = localStorage.getItem('apiKey') || '';

        // 如果没有找到，尝试从 bulletin-store 加载
        if (!apiKey) {
            try {
                const bulletinStore = localStorage.getItem('bulletin-store');
                if (bulletinStore) {
                    const data = JSON.parse(bulletinStore);
                    if (data.settings && data.settings.apiKey) {
                        apiKey = data.settings.apiKey;
                        // 同步到旧的位置以保持兼容性
                        localStorage.setItem('apiKey', apiKey);
                    }
                }
            } catch (error) {
                console.error('从 bulletin-store 加载 API key 失败:', error);
            }
        }

        // 加载设置
        let settings = {
            autoSave: true,
            showTutorial: true,
            autoDownload: false
        };

        try {
            const savedSettings = localStorage.getItem('settings');
            if (savedSettings) {
                settings = { ...settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }

        this.state = {
            currentSection: 'welcome',
            currentTheme: null,
            currentScene: null,
            selectedVocabulary: [],
            maxVocabulary: 20,
            generationStatus: 'idle',
            customTitle: '',
            aspectRatio: '4:5',
            resolution: '2K',
            apiKey: apiKey,
            settings: settings
        };
        this.listeners = [];
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
        this.saveToStorage();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    saveToStorage() {
        // 保存 API key
        if (this.state.apiKey) {
            localStorage.setItem('apiKey', this.state.apiKey);
        }

        // 保存设置
        localStorage.setItem('settings', JSON.stringify(this.state.settings));

        // 同时保存到 bulletin-store 以保持一致性
        try {
            const saveData = {
                gallery: this.state.gallery || [],
                settings: {
                    ...this.state.settings,
                    apiKey: this.state.apiKey  // 将 API key 也保存到 bulletin-store
                }
            };
            localStorage.setItem('bulletin-store', JSON.stringify(saveData));
        } catch (error) {
            console.error('保存到 bulletin-store 失败:', error);
        }
    }

    selectTheme(theme) {
        const scene = theme.scenes[0] || null;
        this.setState({
            currentTheme: theme,
            currentScene: scene,
            selectedVocabulary: this.getInitialVocabulary(theme, scene),
            customTitle: ''
        });
    }

    getInitialVocabulary(theme, scene = null) {
        if (!theme) return [];
        const targetScene = scene || theme.scenes[0];
        if (!targetScene || !targetScene.vocabulary) return [];
        return targetScene.vocabulary.slice(0, 20);
    }

    selectAllVocabulary() {
        const { currentScene } = this.state;
        if (currentScene && currentScene.vocabulary) {
            this.setState({
                selectedVocabulary: [...currentScene.vocabulary].slice(0, this.state.maxVocabulary)
            });
        }
    }

    clearAllVocabulary() {
        this.setState({ selectedVocabulary: [] });
    }

    toggleVocabulary(word) {
        const { selectedVocabulary } = this.state;
        const index = selectedVocabulary.findIndex(v => v.english === word.english);

        if (index > -1) {
            const newVocabulary = [...selectedVocabulary];
            newVocabulary.splice(index, 1);
            this.setState({ selectedVocabulary: newVocabulary });
        } else if (selectedVocabulary.length < this.state.maxVocabulary) {
            this.setState({
                selectedVocabulary: [...selectedVocabulary, word]
            });
        }
    }


}


// 词汇编辑器类
class VocabularyEditor {
    constructor(container, store) {
        this.container = container;
        this.store = store;
        this.currentScene = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.updateSelectedCount();
    }

    render() {
        if (!this.currentScene || !this.currentScene.vocabulary || this.currentScene.vocabulary.length === 0) {
            this.container.innerHTML = '<p class="no-vocabulary">该场景暂无词汇数据</p>';
            return;
        }

        const categories = this.groupVocabularyByCategory(this.currentScene.vocabulary);
        const categoryNames = {
            character: '人物角色',
            object: '物品工具',
            environment: '环境设施',
            action: '动作行为'
        };

        const categoriesHtml = Object.entries(categories).map(([category, words]) => `
            <div class="vocabulary-category" data-category="${category}">
                <h4>${categoryNames[category] || category}</h4>
                <div class="word-grid">
                    ${words.map(word => this.renderWordItem(word)).join('')}
                </div>
            </div>
        `).join('');

        this.container.innerHTML = categoriesHtml;
    }

    renderWordItem(word) {
        const isSelected = this.isWordSelected(word);
        const category = word.category || 'object';

        return `
            <div class="word-item ${isSelected ? 'selected' : ''}"
                 data-word="${word.english}"
                 data-category="${category}">
                <div class="word-content">
                    <div class="word-english">${word.english}</div>
                    <div class="word-phonetic">/${word.phonetic}/</div>
                    <div class="word-chinese">${word.chinese}</div>
                </div>
                <button class="toggle-btn">${isSelected ? '✓' : '+'}</button>
            </div>
        `;
    }

    groupVocabularyByCategory(vocabulary) {
        const categories = {
            character: [],
            object: [],
            environment: [],
            action: []
        };

        vocabulary.forEach(word => {
            if (categories.hasOwnProperty(word.category)) {
                categories[word.category].push(word);
            } else {
                categories.object.push(word);
            }
        });

        return categories;
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const wordItem = e.target.closest('.word-item');
            if (wordItem) {
                this.handleWordClick(wordItem);
            }
        });
    }

    handleWordClick(wordItem) {
        const word = {
            english: wordItem.dataset.word,
            phonetic: wordItem.querySelector('.word-phonetic').textContent.replace(/[\/\\]/g, ''),
            chinese: wordItem.querySelector('.word-chinese').textContent,
            category: wordItem.dataset.category
        };

        this.store.toggleVocabulary(word);
        this.updateWordItem(wordItem, word);
        this.updateSelectedCount();
    }

    updateWordItem(wordItem, word) {
        const isSelected = this.isWordSelected(word);
        const toggleBtn = wordItem.querySelector('.toggle-btn');

        if (isSelected) {
            wordItem.classList.add('selected');
            toggleBtn.textContent = '✓';
        } else {
            wordItem.classList.remove('selected');
            toggleBtn.textContent = '+';
        }
    }

    isWordSelected(word) {
        return this.store.state.selectedVocabulary.some(
            w => w.english === word.english
        );
    }

    updateSelectedCount() {
        const count = this.store.state.selectedVocabulary.length;
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    setScene(scene) {
        this.currentScene = scene;
        this.render();
        this.bindEvents();
        this.updateSelectedCount();
    }

    updateUI() {
        const wordItems = this.container.querySelectorAll('.word-item');
        wordItems.forEach(item => {
            const word = {
                english: item.dataset.word,
                phonetic: item.querySelector('.word-phonetic').textContent.replace(/[\/\\]/g, ''),
                chinese: item.querySelector('.word-chinese').textContent,
                category: item.dataset.category
            };

            this.updateWordItem(item, word);
        });
        this.updateSelectedCount();
    }
}

// UI控制器类
class UIController {
    constructor(store) {
        this.store = store;
        this.vocabularyEditor = null;
        this.progressInterval = null; // 用于存储进度模拟的定时器
        this.lastProgress = 0; // 跟踪上一次的进度，确保不会后退
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModalListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        // 欢迎页面开始按钮
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', async () => await this.showSection('welcomeSection'));
        }

        // 返回按钮
        const backBtn = document.getElementById('backToTheme');
        if (backBtn) {
            backBtn.addEventListener('click', async () => await this.showSection('welcomeSection'));
        }

        // 词汇选择按钮
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.store.selectAllVocabulary();
                this.showToast(`已选择 ${this.store.state.selectedVocabulary.length} 个词汇`);
            });
        }

        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.store.clearAllVocabulary();
                this.showToast('已清空所有选择');
            });
        }

        // 头部按钮
        const settingsBtn = document.getElementById('settingsBtn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showModal('settingsModal'));
        }

        // 主题选择事件委托
        document.addEventListener('click', (e) => {
            const themeCard = e.target.closest('.theme-card');
            if (themeCard) {
                this.handleThemeSelection(themeCard);
            }
        });

        // 表单输入
        const customTitleInput = document.getElementById('customTitle');
        const aspectRatioSelect = document.getElementById('aspectRatio');
        const resolutionSelect = document.getElementById('resolution');

        if (customTitleInput) {
            customTitleInput.addEventListener('input', (e) => {
                this.store.setState({ customTitle: e.target.value });
            });
        }

        if (aspectRatioSelect) {
            aspectRatioSelect.addEventListener('change', (e) => {
                this.store.setState({ aspectRatio: e.target.value });
            });
        }

        if (resolutionSelect) {
            resolutionSelect.addEventListener('change', (e) => {
                this.store.setState({ resolution: e.target.value });
            });
        }

        // 生成按钮 - 使用事件委托
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'generateBtn') {
                console.log('Generate button clicked via delegation!');
                console.log('Current section before generation:', this.store.state.currentSection);
                e.preventDefault();
                e.stopPropagation();
                this.handleGeneration();
            }
        });
    }

    setupModalListeners() {
        // 设置模态框
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideModal('settingsModal'));
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => this.hideModal('settingsModal'));
        }

        // 取消生成按钮
        const cancelGenerationBtn = document.getElementById('cancelGenerationBtn');
        if (cancelGenerationBtn) {
            cancelGenerationBtn.addEventListener('click', () => {
                console.log('Cancel generation clicked');
                // 隐藏生成模态框
                const generationModal = document.getElementById('generationModal');
                if (generationModal) {
                    generationModal.classList.add('hidden');
                    document.body.classList.remove('modal-open');
                }
                // 重置状态
                this.store.setState({ generationStatus: 'idle' });
            });
        }

        // 点击遮罩关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideModal(e.target.id);
            }
        });
    }

    async showSection(sectionName) {
        // 隐藏所有section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // 显示目标section
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.remove('hidden');
        }

        this.store.setState({ currentSection: sectionName });

        // 更新内容配置页面
        if (sectionName === 'contentConfig') {
            this.updateThemeDisplay();
            this.initializeVocabularyEditor();
        } else if (sectionName === 'welcomeSection') {
            // 重新渲染主题列表
            await renderThemes();
        }
    }

    async handleThemeSelection(themeCard) {
        const themeId = themeCard.dataset.themeId;
        const theme = window.themes.find(t => t.id === themeId);

        if (theme) {
            this.store.selectTheme(theme);
            await this.showSection('contentConfig');
            this.showToast(`已选择主题：${theme.name}`);
        }
    }

    updateThemeDisplay() {
        const { currentTheme, currentScene } = this.store.state;

        if (!currentTheme) return;

        // 更新主题显示
        const themeIcon = document.getElementById('selectedThemeIcon');
        const themeName = document.getElementById('selectedThemeName');
        const sceneName = document.getElementById('selectedSceneName');
        const defaultTitleDisplay = document.getElementById('defaultTitleDisplay');

        if (themeIcon) themeIcon.textContent = currentTheme.icon;
        if (themeName) themeName.textContent = currentTheme.name;
        if (sceneName) sceneName.textContent = `场景：${currentScene ? currentScene.name : '未知'}`;

        // 更新默认标题
        if (defaultTitleDisplay) {
            // 创建临时的提示词生成器来获取标题
            const tempPromptGenerator = new PromptGenerator();

            // 如果标题模板还未加载，先设置一个默认显示
            if (!tempPromptGenerator.titleTemplates) {
                defaultTitleDisplay.innerHTML = '加载中...';
                // 异步加载后再更新
                tempPromptGenerator.loadTitleTemplates().then(() => {
                    const title = tempPromptGenerator.getTitle(currentTheme, currentScene);
                    defaultTitleDisplay.innerHTML = title;
                });
            } else {
                const title = tempPromptGenerator.getTitle(currentTheme, currentScene);
                defaultTitleDisplay.innerHTML = title;
            }
        }
    }

    initializeVocabularyEditor() {
        const vocabularyContainer = document.querySelector('.vocabulary-categories');
        if (vocabularyContainer && !this.vocabularyEditor) {
            this.vocabularyEditor = new VocabularyEditor(vocabularyContainer.parentElement, this.store);
            this.vocabularyEditor.setScene(this.store.state.currentScene);
        } else if (this.vocabularyEditor) {
            this.vocabularyEditor.setScene(this.store.state.currentScene);
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // 先保存当前滚动位置
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;

            // 将滚动位置保存到body的data属性中，确保hideModal能正确恢复
            document.body.setAttribute('data-scroll-x', scrollX);
            document.body.setAttribute('data-scroll-y', scrollY);

            // 立即显示弹窗
            modal.classList.remove('hidden');

            // 添加transform来抵消body的位移影响
            modal.style.transform = `translate(0, ${scrollY}px)`;
            modal.style.transition = 'transform 0s'; // 禁用过渡动画

            // 给body添加modal-open类，禁用页面滚动
            document.body.classList.add('modal-open');

            // 设置body样式固定位置，禁用滚动但保持位置
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = `-${scrollX}px`;
            document.body.style.width = '100vw';
            document.body.style.overflow = 'hidden';

            console.log(`Modal ${modalId} displayed successfully`);

            // 异常检测：只在模态框完全在视口外时才修复
            setTimeout(() => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    const rect = modal.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const viewportWidth = window.innerWidth;

                    // 只有当模态框完全在视口外时才修复
                    if (rect.bottom < 0 || rect.top > viewportHeight || rect.right < 0 || rect.left > viewportWidth) {
                        console.warn('模态框在视口外，应用修复措施');
                        // 添加修复类，不修改现有 inline style
                        modal.classList.add('modal-force-viewport-fix');
                    }
                }
            }, 50);
        } else {
            console.error(`Modal with id ${modalId} not found`);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            // 清除transform
            modal.style.transform = '';
            modal.style.transition = '';
            // 清理视口修复类
            modal.classList.remove('modal-force-viewport-fix');
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

    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');

            setTimeout(() => {
                toast.classList.add('hidden');
            }, duration);
        }
    }

    saveSettings() {
        const apiKey = document.getElementById('apiKey').value;
        const autoSave = document.getElementById('autoSave').checked;
        const showTutorial = document.getElementById('showTutorial').checked;
        const autoDownload = document.getElementById('autoDownload').checked;

        this.store.setState({
            apiKey: apiKey,
            settings: {
                autoSave: autoSave,
                showTutorial: showTutorial,
                autoDownload: autoDownload
            }
        });

        this.hideModal('settingsModal');
        this.showToast('设置已保存');
    }

    loadSettings() {
        const { apiKey, settings } = this.store.state;

        const apiKeyInput = document.getElementById('apiKey');
        const autoSaveCheck = document.getElementById('autoSave');
        const showTutorialCheck = document.getElementById('showTutorial');
        const autoDownloadCheck = document.getElementById('autoDownload');

        if (apiKeyInput) apiKeyInput.value = apiKey;
        if (autoSaveCheck) autoSaveCheck.checked = settings.autoSave;
        if (showTutorialCheck) showTutorialCheck.checked = settings.showTutorial;
        if (autoDownloadCheck) autoDownloadCheck.checked = settings.autoDownload;
    }



    async showResult(result) {
        // 显示结果页面
        await this.showSection('resultDisplay');

        // 显示结果时，移除高度限制
        document.body.classList.add('result-visible');

        // 更新结果状态
        const imageStatusBadge = document.getElementById('imageStatusBadge');
        const statusText = document.getElementById('statusText');
        const statusIcon = document.getElementById('statusIcon');
        const generatedImage = document.getElementById('generatedImage');
        const resultVocabularyGrid = document.getElementById('resultVocabularyGrid');

        // 获取标题元素
        const resultHeader = document.querySelector('.result-header h2');
        const resultSubtitle = document.querySelector('.result-subtitle');

        if (statusText && generatedImage && resultVocabularyGrid) {
            imageStatusBadge.classList.remove('hidden');

            // 检查是否真正成功 - 即使result.success为true，如果存在任何error信息，也视为失败
            const isActuallySuccess = result.success && !result.error;

            if (isActuallySuccess) {
                // 成功状态
                statusText.textContent = '小报生成成功！';

                // 设置图片并添加加载错误处理
                generatedImage.src = result.imageUrl;
                generatedImage.onerror = function () {
                    console.error('图片加载失败:', result.imageUrl);
                    // 图片加载失败时显示错误提示图片
                    this.src = 'images/error-placeholder.svg';
                    // 更新状态为图片加载失败
                    if (statusText) {
                        statusText.textContent = '图片加载失败';
                    }
                }.bind(generatedImage);

                // 图片加载成功的处理
                generatedImage.onload = function () {
                    console.log('图片加载成功:', result.imageUrl);
                }.bind(generatedImage);

                // 更新标题为成功信息
                if (resultHeader) resultHeader.textContent = '生成完成！';
                if (resultSubtitle) resultSubtitle.textContent = '你的英语小报已经创建成功';
            } else {
                // 失败状态
                // 如果错误信息已经处理过（包含中文），则直接使用；否则进行友好化处理
                let errorMsg = result.error;
                // 检查是否已经是友好化的错误信息
                if (!errorMsg || (errorMsg.includes('access permissions') || errorMsg.includes('Network') || errorMsg.includes('timeout') || errorMsg.includes('API') === false)) {
                    errorMsg = this.getFriendlyErrorMessage(errorMsg);
                }
                // 隐藏图片下方的状态徽章，避免重复显示错误
                imageStatusBadge.classList.add('hidden');
                generatedImage.src = 'images/error-placeholder.svg';

                // 更新标题为错误信息
                if (resultHeader) resultHeader.textContent = '生成失败！';
                if (resultSubtitle) resultSubtitle.textContent = errorMsg;
            }

            // 渲染词汇表
            const vocabularyHtml = result.vocabulary.map(word => `
                <div class="result-word">
                    <div class="result-word-english">${word.english}</div>
                    <div class="result-word-phonetic">/${word.phonetic}/</div>
                    <div class="result-word-chinese">${word.chinese}</div>
                </div>
            `).join('');

            resultVocabularyGrid.innerHTML = vocabularyHtml;
        }

        // 绑定结果页面按钮事件
        this.bindResultPageButtons(result);
    }

    bindResultPageButtons(result) {
        // 创建新的小报按钮
        const createNewBtn = document.getElementById('createNewBtn');
        if (createNewBtn) {
            createNewBtn.addEventListener('click', async () => {
                // 重置状态
                this.resetForNewCreation();
                // 移除结果页面的高度限制
                document.body.classList.remove('result-visible');
                // 直接跳转到主题选择，和第一次进入时的逻辑完全一样
                await this.showSection('welcomeSection');
            });
        }

        // 重新生成按钮
        const regenerateBtn = document.getElementById('regenerateBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                // 调用handleGeneration会自动显示generationModal
                this.handleGeneration();
            });
        }
    }


    async handleGeneration() {
        console.log('handleGeneration called');
        console.log('API Key:', this.store.state.apiKey ? 'exists' : 'missing');
        console.log('Selected vocabulary count:', this.store.state.selectedVocabulary.length);

        if (!this.store.state.apiKey) {
            this.showToast('请先在设置中配置API密钥');
            this.showModal('settingsModal');
            return;
        }

        if (this.store.state.selectedVocabulary.length === 0) {
            this.showToast('请至少选择一个词汇');
            return;
        }

        try {
            // 初始化API和提示生成器
            const api = new NanoBananaAPI(this.store.state.apiKey);
            const promptGenerator = new PromptGenerator();

            // 生成提示词
            const prompt = await promptGenerator.generatePrompt({
                theme: this.store.state.currentTheme,
                scene: this.store.state.currentScene,
                vocabulary: this.store.state.selectedVocabulary,
                customTitle: this.store.state.customTitle
            });

            // 详细日志：记录生成的提示词
            console.log('=== Generated Prompt (modern-main.js) ===');
            console.log('Custom Title:', this.store.state.customTitle || 'None');
            console.log('Theme:', this.store.state.currentTheme);
            console.log('Scene:', this.store.state.currentScene);
            console.log('Vocabulary count:', this.store.state.selectedVocabulary.length);
            console.log('Full prompt length:', prompt.length);
            console.log('Full prompt content:');
            console.log(prompt);
            console.log('Prompt language check:', prompt.match(/[\u4e00-\u9fff]/) ? 'Contains Chinese characters!' : 'All English characters');
            console.log('=== End of Prompt ===');

            // 开始生成并显示模态框
            this.store.setState({
                generationStatus: 'generating',
                generationProgress: 0
            });

            // 显示生成模态框
            console.log('Showing generation modal');
            console.log('Current section:', this.store.state.currentSection);
            console.log('Scroll position before modal:', window.scrollY);

            const modal = document.getElementById('generationModal');
            console.log('Modal element exists:', !!modal);
            console.log('Modal classes before show:', modal?.className);
            console.log('Modal computed style before:', modal ? window.getComputedStyle(modal).position : 'N/A');

            this.showModal('generationModal');

            // 检查模态框是否真的显示了
            setTimeout(() => {
                console.log('Scroll position after modal:', window.scrollY);
                console.log('Modal classes after show:', modal?.className);
                console.log('Body has modal-open class:', document.body.classList.contains('modal-open'));
                console.log('Body position style:', document.body.style.position);
                console.log('Modal computed display after:', modal ? window.getComputedStyle(modal).display : 'N/A');
                console.log('Modal computed position after:', modal ? window.getComputedStyle(modal).position : 'N/A');
                console.log('Modal offsetParent (null means hidden):', modal?.offsetParent);
                console.log('Modal rect (position and size):', modal ? modal.getBoundingClientRect() : 'N/A');
            }, 100);

            // 阶段1：快速完成前两个步骤（准备提示词和提交生成任务）
            console.log('开始生成流程 - 阶段1：准备和提交');

            // 重置进度跟踪
            this.lastProgress = 0;

            // 快速显示10%进度
            this.updateProgress(10, '准备提示词...');
            await this.delay(500);

            // 快速显示30%进度
            this.updateProgress(30, '提交生成任务...');
            await this.delay(500);

            // 阶段2：AI绘画中（这个阶段会根据API调用时间动态调整进度）
            console.log('进入AI绘画阶段');
            let result;
            let apiCallProgress = 30; // 从30%开始

            try {
                // 调用API，同时慢速增长进度
                const apiPromise = api.generate(prompt, {
                    aspectRatio: document.getElementById('aspectRatio')?.value || '3:4',
                    resolution: document.getElementById('resolution')?.value || '2K',
                    outputFormat: document.getElementById('outputFormat')?.value || 'png',
                    timeout: 120000, // 2分钟超时
                    onProgress: (progress, message) => {
                        // 更新进度
                        console.log(`[API] Progress callback: ${progress}% - ${message || 'AI绘画中...'}`);
                        this.updateProgress(progress, message || 'AI绘画中...');
                        apiCallProgress = progress;
                    }
                });

                // 同时启动慢速进度增长
                this.simulateSlowProgress(30, 90, 60000); // 最多60秒

                // 等待API调用完成
                result = await apiPromise;
                console.log('API调用成功:', result);

                // 停止进度模拟
                this.stopSlowProgress();

                // 确保进度至少达到90%
                if (apiCallProgress < 90) {
                    this.updateProgress(90, '优化细节...');
                    await this.delay(200);
                }

            } catch (error) {
                console.error('API调用失败:', error);

                // 停止进度模拟
                this.stopSlowProgress();

                // API失败，快速跳转到错误状态
                result = {
                    success: false,
                    error: error.message || 'API调用失败'
                };

                // 如果进度还在30-90之间，快速跳到90%
                if (apiCallProgress < 90) {
                    this.updateProgress(90, '生成失败，准备返回结果...');
                    await this.delay(300);
                }
            }

            // 阶段3：快速完成最后步骤
            console.log('进入收尾阶段');
            this.updateProgress(95, '渲染图像...');
            await this.delay(300);

            this.updateProgress(100, '生成完成！');
            await this.delay(500);

            if (result.success) {
                // 生成成功
                this.store.setState({
                    generationStatus: 'success',
                    generationProgress: 100
                });

                // 更新模态框
                const modalProgressFill = document.getElementById('modalProgressFill');
                const modalProgressDesc = document.getElementById('modalProgressDesc');
                const modalProgressPercent = document.getElementById('modalProgressPercent');

                if (modalProgressFill) {
                    modalProgressFill.style.width = '100%';
                }

                if (modalProgressDesc) {
                    modalProgressDesc.textContent = '生成完成！';
                }

                if (modalProgressPercent) {
                    modalProgressPercent.textContent = '100%';
                }

                // 延迟关闭模态框并跳转到结果页面
                setTimeout(async () => {
                    this.hideModal('generationModal');

                    // 跳转到结果页面
                    await this.showResult({
                        success: true,
                        imageUrl: result.imageUrl,
                        vocabulary: this.store.state.selectedVocabulary
                    });

                    // 滚动到页面顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 1000);
            } else {
                // 生成失败
                this.store.setState({ generationStatus: 'error' });

                // 更新模态框 - 保持进度，只更新消息
                const modalProgressDesc = document.getElementById('modalProgressDesc');

                if (modalProgressDesc) {
                    modalProgressDesc.textContent = '生成失败';
                }
                // 移除设置百分比，保持当前进度不变

                // 延迟关闭模态框并跳转到结果页面
                setTimeout(async () => {
                    this.hideModal('generationModal');

                    // 跳转到结果页面
                    await this.showResult({
                        success: false,
                        error: result.error,
                        vocabulary: this.store.state.selectedVocabulary
                    });

                    // 滚动到页面顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 1000);
            }
        } catch (error) {
            // 异常处理
            // 清除慢速进度模拟
            this.stopSlowProgress();

            this.store.setState({ generationStatus: 'error' });

            // 更新模态框 - 保持进度，只更新消息
            const modalProgressDesc = document.getElementById('modalProgressDesc');

            if (modalProgressDesc) {
                modalProgressDesc.textContent = '生成失败';
            }
            // 不修改进度条和百分比，保持当前进度

            // 延迟关闭模态框并跳转到结果页面
            setTimeout(async () => {
                const generationModal = document.getElementById('generationModal');
                if (generationModal) {
                    generationModal.classList.add('hidden');
                    document.body.classList.remove('modal-open');
                }

                // 跳转到结果页面
                // 直接使用友好化的错误信息
                const errorMsg = this.getFriendlyErrorMessage(error.message);

                await this.showResult({
                    success: false,
                    error: errorMsg,
                    vocabulary: this.store.state.selectedVocabulary
                });

                // 滚动到页面顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 1000);
        }
    }

    // 获取友好错误信息
    getFriendlyErrorMessage(errorMsg) {
        if (errorMsg.includes('access permissions') || errorMsg.includes('AUTHENTICATION_FAILED')) {
            return 'API密钥错误或无效，请检查设置中的API密钥';
        } else if (errorMsg.includes('网络错误') || errorMsg.includes('Network')) {
            return '网络连接失败，请检查网络设置后重试';
        } else if (errorMsg.includes('超时') || errorMsg.includes('timeout')) {
            return '生成超时，请稍后重试';
        }
        return errorMsg || '小报生成失败，请稍后重试';
    }

    // 重置为新创建
    resetForNewCreation() {
        console.log('resetForNewCreation called');

        // 重置生成相关的状态，但保留用户设置
        this.store.setState({
            generationStatus: 'idle',
            generationProgress: 0,
            currentWork: null,
            currentTheme: null,
            currentScene: null,
            selectedVocabulary: []
        });

        // 清空自定义标题
        const customTitleInput = document.getElementById('customTitle');
        if (customTitleInput) {
            customTitleInput.value = '';
            this.store.setState({ customTitle: '' });
        }
    }

    // 更新进度的辅助方法
    updateProgress(progress, message) {
        // 确保进度是整数
        progress = Math.round(progress);

        // 确保进度不会后退
        if (progress < this.lastProgress) {
            console.log(`[PROGRESS] Ignoring backward progress: ${progress}% < ${this.lastProgress}%`);
            return;
        }

        this.lastProgress = progress;
        console.log(`[PROGRESS] ${progress}% - ${message} - 来源: ${new Error().stack.split('\n')[2]?.trim() || 'unknown'}`);

        this.store.setState({ generationProgress: progress });

        // 更新模态框中的进度条和消息
        const modalProgressFill = document.getElementById('modalProgressFill');
        const modalProgressDesc = document.getElementById('modalProgressDesc');
        const modalProgressPercent = document.getElementById('modalProgressPercent');

        if (modalProgressFill) {
            modalProgressFill.style.width = `${progress}%`;
        }

        if (modalProgressDesc) {
            modalProgressDesc.textContent = message;
        }

        if (modalProgressPercent) {
            modalProgressPercent.textContent = `${progress}%`;
        }

        // 更新进度步骤
        const steps = document.querySelectorAll('#modalProgressSteps .step');
        const activeStep = Math.floor(progress / 20);
        steps.forEach((step, index) => {
            if (index <= activeStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // 延迟辅助方法
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 模拟慢速进度增长（在API调用期间）
    simulateSlowProgress(startProgress, endProgress, maxDuration) {
        const startTime = Date.now();
        const progressRange = endProgress - startProgress;
        let lastProgress = startProgress;

        // 清除之前的定时器（如果存在）
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        this.progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            // 计算当前应该的进度（慢速增长）
            const expectedProgress = Math.min(
                startProgress + (progressRange * elapsed / maxDuration),
                endProgress
            );

            // 只在进度增长时更新，避免后退
            if (expectedProgress > lastProgress) {
                lastProgress = expectedProgress;
                // 确保进度是整数
                const integerProgress = Math.floor(expectedProgress);
                console.log(`[SIMULATE] Updating progress from simulateSlowProgress: ${integerProgress}% (raw: ${expectedProgress}%)`);
                this.updateProgress(integerProgress, 'AI绘画中...');
            }

            // 检查是否应该结束
            if (expectedProgress >= endProgress || elapsed >= maxDuration) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
        }, 1000); // 每1000ms更新一次，模拟慢速增长
    }

    // 停止进度模拟
    stopSlowProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
}

// 主题渲染函数
async function renderThemes() {
    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid) {
        return;
    }

    try {
        // 显示加载提示
        themeGrid.innerHTML = '<div class="loading-themes">正在加载主题数据...</div>';

        // 每次都直接从themes.json加载数据，不依赖全局变量
        const response = await fetch('themes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const themes = data.themes;

        if (!themes || !Array.isArray(themes)) {
            throw new Error('主题数据格式错误');
        }

        // 更新全局变量，以便其他地方使用
        window.themes = themes;
        console.log('主题数据加载成功:', themes.length, '个主题');

        const themesHtml = themes.map(theme => `
            <div class="theme-card" data-theme-id="${theme.id}">
                <div class="theme-icon">${theme.icon}</div>
                <h3>${theme.name}</h3>
                <p>${theme.description}</p>
                <div class="theme-scenes">
                    ${theme.scenes ? theme.scenes.map(scene => `
                        <span class="scene-tag">${scene.name}</span>
                    `).join('') : ''}
                </div>
            </div>
        `).join('');

        themeGrid.innerHTML = themesHtml;
    } catch (error) {
        console.error('加载主题数据失败:', error);
        themeGrid.innerHTML = `
            <div class="error-message">
                <p>加载主题数据失败</p>
                <p>${error.message}</p>
                <button onclick="renderThemes()" class="modern-btn btn-primary">重试</button>
            </div>
        `;
    }
}

// 应用初始化
class App {
    constructor() {
        this.store = new AppState();
        this.uiController = null;
        this.init();
    }

    async init() {
        try {
            // 页面加载时正确隐藏所有模态框
            this.hideAllModalsOnStartup();

            // 加载主题数据
            const response = await fetch('themes.json');
            const data = await response.json();
            window.themes = data.themes;

            // 初始化UI控制器
            this.uiController = new UIController(this.store);

            // 渲染主题
            await renderThemes();

            // 订阅状态变化
            this.store.subscribe((state) => {
                // 状态变化处理
                if (this.uiController && this.uiController.vocabularyEditor) {
                    this.uiController.vocabularyEditor.updateUI();
                }
            });

            console.log('应用初始化成功');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showToast('应用初始化失败，请刷新页面重试');
        }
    }

    hideAllModalsOnStartup() {
        // 在应用启动时正确隐藏所有模态框
        const modals = document.querySelectorAll('.modal-overlay, [id$="Modal"]');
        modals.forEach(modal => {
            modal.classList.add('hidden');
            // 清除任何可能存在的内联样式
            modal.style.display = '';
            modal.style.visibility = '';
            modal.style.opacity = '';
            modal.style.zIndex = '';
        });

        console.log('所有模态框已在启动时隐藏');
    }
}

// 全局函数（为了兼容原有的onclick等事件）
window.selectAllVocabulary = function () {
    if (window.app && window.app.store) {
        window.app.store.selectAllVocabulary();
        window.app.uiController.showToast(`已选择 ${window.app.store.state.selectedVocabulary.length} 个词汇`);
    }
};

window.clearAllVocabulary = function () {
    if (window.app && window.app.store) {
        window.app.store.clearAllVocabulary();
        window.app.uiController.showToast('已清空所有选择');
    }
};

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});