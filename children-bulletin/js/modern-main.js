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
        this.defaultTitles = this.getDefaultTitles();
    }

    loadTemplate() {
        return `请生成一张青少年学英语小报《{{title}}》，竖版 A4，学习小报版式，适合 10-16 岁青少年 看图学英语

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{title}}》
* **风格**：学习小报 / 英语学习报
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{theme}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{theme}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{theme}} 的核心活动
2.  **核心区域 B（配套设施）**：展示相关的工具或物品
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{theme}} 匹配）
* **动作**：正在进行与场景相关的自然互动

# 三、必画物体与单词清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{coreObjects}}

**2. 常见物品/工具：**
{{commonItems}}

**3. 环境与装饰：**
{{environmentItems}}

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：三行制（第一行英文，第二行简体汉字，第三行英语音标）
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读
* **排版**：标签靠近对应的物体，不遮挡主体

# 五、画风参数
* **风格**：青少年绘本 + 英语小报
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines`;
    }

    getDefaultTitles() {
        return {
            'daily-life': {
                home: '温馨家庭',
                neighborhood: '快乐社区'
            },
            'shopping': {
                supermarket: '超市购物',
                market: '市场淘宝'
            },
            'school': {
                classroom: '智慧课堂',
                library: '书香图书馆',
                playground: '活力操场'
            },
            'entertainment': {
                'game-center': '游戏天堂',
                cinema: '电影院奇遇'
            },
            'health': {
                hospital: '健康守护',
                gym: '健身时光',
                'healthy-food': '营养美食'
            },
            'travel': {
                airport: '机场旅程',
                hotel: '温馨酒店',
                attraction: '景点探秘'
            }
        };
    }

    generatePrompt(options = {}) {
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

        const title = customTitle || this.getDefaultTitle(theme.id, scene.id);

        const coreObjects = vocabulary.filter(word => word.category === 'character').map(word => word.english).join(', ');
        const commonItems = vocabulary.filter(word => word.category === 'object').map(word => word.english).join(', ');
        const environmentItems = vocabulary.filter(word => word.category === 'environment').map(word => word.english).join(', ');

        const prompt = this.template
            .replace(/{{title}}/g, title)
            .replace(/{{theme}}/g, scene.name)
            .replace(/{{coreObjects}}/g, coreObjects)
            .replace(/{{commonItems}}/g, commonItems)
            .replace(/{{environmentItems}}/g, environmentItems);

        return prompt;
    }

    getDefaultTitle(themeId, sceneId) {
        if (this.defaultTitles[themeId] && this.defaultTitles[themeId][sceneId]) {
            return this.defaultTitles[themeId][sceneId];
        }

        const themeTitles = [
            '探索世界', '快乐学习', '成长记录', '知识之旅', '趣味英语',
            '学习乐园', '智慧之门', '成长足迹', '英语天地', '学习时光'
        ];

        return themeTitles[Math.floor(Math.random() * themeTitles.length)];
    }
}

// 全局状态管理
class AppState {
    constructor() {
        this.state = {
            currentSection: 'welcome',
            currentTheme: null,
            currentScene: null,
            selectedVocabulary: [],
            maxVocabulary: 20,
            generationStatus: 'idle',
            customTitle: '',
            aspectRatio: '4:5',
            resolution: '4K',
            apiKey: localStorage.getItem('apiKey') || '',

            settings: {
                autoSave: true,
                showTutorial: true,
                autoDownload: false
            }
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
        localStorage.setItem('settings', JSON.stringify(this.state.settings));
        if (this.state.apiKey) {
            localStorage.setItem('apiKey', this.state.apiKey);
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

// 增强的标题生成系统
function generateTitle(theme, scene) {
    const titleTemplates = {
        'daily-life': {
            'home': ['温馨家园', '我的小屋', '家的港湾', '幸福之家'],
            'family': ['和睦家庭', '亲情时光', '家人的爱', '家庭欢乐'],
            'community': ['和谐社区', '邻里之间', '社区生活', '我们的社区']
        },
        'shopping': {
            'market': ['热闹市场', '市集风情', '购物街', '市场百态'],
            'mall': ['时尚购物', '购物中心', '商场漫游', '购物天堂'],
            'online': ['便捷网购', '线上购物', '网购时代', '鼠标生活']
        },
        'school': {
            'classroom': ['智慧课堂', '学习时光', '课堂点滴', '知识海洋'],
            'library': ['书香学堂', '图书馆奇遇', '读书之乐', '知识宝库'],
            'playground': ['快乐校园', '课间时光', '校园生活', '青春足迹']
        },
        'entertainment': {
            'movies': ['精彩影院', '电影世界', '银幕故事', '光影时光'],
            'music': ['悦动音符', '音乐之声', '旋律之美', '节拍青春'],
            'games': ['欢乐游戏', '游戏王国', '娱乐时光', '玩乐天地']
        },
        'health': {
            'exercise': ['活力健身', '运动人生', '健康生活', '活力四射'],
            'nutrition': ['健康饮食', '营养美食', '均衡膳食', '饮食之道'],
            'medical': ['关爱健康', '健康守护', '医疗知识', '身心健康']
        },
        'travel': {
            'beach': ['阳光海滩', '海边度假', '沙滩时光', '海洋之旅'],
            'mountain': ['壮丽山峰', '登山之旅', '山川秀美', '高峰体验'],
            'city': ['都市风情', '城市漫步', '都市印象', '城市之光']
        }
    };

    const themeId = theme.id;
    const sceneId = scene?.id;

    // 根据主题和场景选择标题
    if (titleTemplates[themeId] && titleTemplates[themeId][sceneId]) {
        const titles = titleTemplates[themeId][sceneId];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    // 主题后备标题
    const themeTitles = [
        '探索世界', '快乐学习', '成长记录', '知识之旅', '趣味英语',
        '学习乐园', '智慧之门', '成长足迹', '英语天地', '学习时光'
    ];

    return themeTitles[Math.floor(Math.random() * themeTitles.length)];
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
            startBtn.addEventListener('click', async () => await this.showSection('themeSelection'));
        }

        // 返回按钮
        const backBtn = document.getElementById('backToTheme');
        if (backBtn) {
            backBtn.addEventListener('click', async () => await this.showSection('themeSelection'));
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

        // 生成按钮
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleGeneration());
        }
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
        } else if (sectionName === 'themeSelection') {
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
            const title = generateTitle(currentTheme, currentScene);
            defaultTitleDisplay.innerHTML = title;
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

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
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
        
        // 更新结果状态
        const imageStatusBadge = document.getElementById('imageStatusBadge');
        const statusText = document.getElementById('statusText');
        const statusIcon = document.getElementById('statusIcon');
        const generatedImage = document.getElementById('generatedImage');
        const resultVocabularyGrid = document.getElementById('resultVocabularyGrid');
        
        if (imageStatusBadge && statusText && statusIcon && generatedImage && resultVocabularyGrid) {
            imageStatusBadge.classList.remove('hidden');
            
            // 检查是否真正成功 - 即使result.success为true，如果存在任何error信息，也视为失败
            const isActuallySuccess = result.success && !result.error;
            
            if (isActuallySuccess) {
                // 成功状态
                imageStatusBadge.className = 'image-status-badge success';
                statusIcon.textContent = '✓';
                statusText.textContent = '小报生成成功！';
                generatedImage.src = result.imageUrl;
            } else {
                // 失败状态
                imageStatusBadge.className = 'image-status-badge error';
                statusIcon.textContent = '✗';
                // 清理错误信息，移除可能的HTML标签或不完整文本
                let errorMsg = result.error || '小报生成失败，请稍后重试';
                // 检查是否包含"✗"并移除
                errorMsg = errorMsg.replace(/✗/g, '');
                // 根据错误类型提供更友好的错误信息
                if (errorMsg.includes('You do')) {
                    errorMsg = 'API密钥错误或无效，请检查设置中的API密钥';
                } else if (errorMsg.includes('网络错误') || errorMsg.includes('Network')) {
                    errorMsg = '网络连接失败，请检查网络设置后重试';
                } else if (errorMsg.includes('超时') || errorMsg.includes('timeout')) {
                    errorMsg = '生成超时，请稍后重试';
                }
                statusText.textContent = errorMsg;
                generatedImage.src = 'images/default-bulletin.svg';
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
                // 返回主题选择页面，但保留当前状态（不清除词汇选择）
                await this.showSection('themeSelection');
                // 不再调用clearAllVocabulary，这样会保留之前的选择
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
            const prompt = promptGenerator.generatePrompt({
                theme: this.store.state.currentTheme,
                scene: this.store.state.currentScene,
                vocabulary: this.store.state.selectedVocabulary,
                customTitle: this.store.state.customTitle
            });

            // 开始生成并显示模态框
            this.store.setState({ 
                generationStatus: 'generating', 
                generationProgress: 0 
            });
            
            // 显示生成模态框
            const generationModal = document.getElementById('generationModal');
            if (generationModal) {
                generationModal.classList.remove('hidden');
            }

            // 调用API生成图片
            const result = await api.generate(prompt, {
                aspectRatio: this.store.state.aspectRatio,
                resolution: this.store.state.resolution,
                onProgress: (progress, message) => {
                    // 更新进度
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
                }
            });
            
            // 调试：打印API调用结果
            console.log('API调用结果:', result);

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
                    const generationModal = document.getElementById('generationModal');
                    if (generationModal) {
                        generationModal.classList.add('hidden');
                    }
                    
                    // 跳转到结果页面
                    await this.showResult({
                        success: true,
                        imageUrl: result.imageUrl,
                        vocabulary: this.store.state.selectedVocabulary
                    });
                }, 1000);
            } else {
                // 生成失败
                this.store.setState({ generationStatus: 'error' });
                
                // 更新模态框
                const modalProgressDesc = document.getElementById('modalProgressDesc');
                const modalProgressPercent = document.getElementById('modalProgressPercent');
                
                if (modalProgressDesc) {
                    modalProgressDesc.textContent = '生成失败';
                }
                
                if (modalProgressPercent) {
                    modalProgressPercent.textContent = '0%';
                }

                // 延迟关闭模态框并跳转到结果页面
                setTimeout(async () => {
                    const generationModal = document.getElementById('generationModal');
                    if (generationModal) {
                        generationModal.classList.add('hidden');
                    }
                    
                    // 跳转到结果页面
                    await this.showResult({
                        success: false,
                        error: result.error,
                        vocabulary: this.store.state.selectedVocabulary
                    });
                }, 1000);
            }
        } catch (error) {
            // 异常处理
            this.store.setState({ generationStatus: 'error' });
            
            // 更新模态框
            const modalProgressFill = document.getElementById('modalProgressFill');
            const modalProgressDesc = document.getElementById('modalProgressDesc');
            const modalProgressPercent = document.getElementById('modalProgressPercent');
            
            if (modalProgressFill) {
                modalProgressFill.style.width = '0%';
            }
            
            if (modalProgressDesc) {
                modalProgressDesc.textContent = '生成失败';
            }
            
            if (modalProgressPercent) {
                modalProgressPercent.textContent = '0%';
            }

            // 延迟关闭模态框并跳转到结果页面
            setTimeout(async () => {
                const generationModal = document.getElementById('generationModal');
                if (generationModal) {
                    generationModal.classList.add('hidden');
                }
                
                // 跳转到结果页面
                await this.showResult({
                    success: false,
                    error: error.message,
                    vocabulary: this.store.state.selectedVocabulary
                });
            }, 1000);
        }
    }
}

// 主题渲染函数
async function renderThemes() {
    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid) return;

    try {
        // 每次都直接从themes.json加载数据，不依赖全局变量
        const response = await fetch('themes.json');
        const data = await response.json();
        const themes = data.themes;
        
        // 更新全局变量，以便其他地方使用
        window.themes = themes;

        const themesHtml = themes.map(theme => `
            <div class="theme-card" data-theme-id="${theme.id}">
                <div class="theme-icon">${theme.icon}</div>
                <h3>${theme.name}</h3>
                <p>${theme.description}</p>
                <div class="theme-scenes">
                    ${theme.scenes.map(scene => `
                        <span class="scene-tag">${scene.name}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');

        themeGrid.innerHTML = themesHtml;
    } catch (error) {
        console.error('加载主题数据失败:', error);
        return;
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
window.selectAllVocabulary = function() {
    if (window.app && window.app.store) {
        window.app.store.selectAllVocabulary();
        window.app.uiController.showToast(`已选择 ${window.app.store.state.selectedVocabulary.length} 个词汇`);
    }
};

window.clearAllVocabulary = function() {
    if (window.app && window.app.store) {
        window.app.store.clearAllVocabulary();
        window.app.uiController.showToast('已清空所有选择');
    }
};

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});