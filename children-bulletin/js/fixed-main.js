// 修复版主应用文件 - 功能完整、UI统一的英语小报生成器

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
            gallery: JSON.parse(localStorage.getItem('gallery') || '[]'),
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
        localStorage.setItem('gallery', JSON.stringify(this.state.gallery));
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

    addToGallery(imageUrl, title, vocabulary) {
        const newItem = {
            id: Date.now(),
            imageUrl: imageUrl,
            title: title,
            vocabulary: vocabulary,
            createdAt: new Date().toISOString(),
            theme: this.state.currentTheme?.name || '未知主题',
            scene: this.state.currentScene?.name || '未知场景'
        };

        const newGallery = [newItem, ...this.state.gallery];
        this.setState({ gallery: newGallery });
        return newItem;
    }

    clearGallery() {
        this.setState({ gallery: [] });
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
            startBtn.addEventListener('click', () => this.showSection('themeSelection'));
        }

        // 返回按钮
        const backBtn = document.getElementById('backToTheme');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showSection('themeSelection'));
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
        const galleryBtn = document.getElementById('galleryBtn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showModal('settingsModal'));
        }

        if (galleryBtn) {
            galleryBtn.addEventListener('click', () => this.showModal('galleryModal'));
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

        // 作品库模态框
        const closeGalleryBtn = document.getElementById('closeGalleryBtn');
        const closeGalleryBtn2 = document.getElementById('closeGalleryBtn2');
        const clearGalleryBtn = document.getElementById('clearGalleryBtn');

        [closeGalleryBtn, closeGalleryBtn2].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.hideModal('galleryModal'));
            }
        });

        if (clearGalleryBtn) {
            clearGalleryBtn.addEventListener('click', () => {
                if (confirm('确定要清空作品库吗？此操作不可恢复。')) {
                    this.store.clearGallery();
                    this.renderGallery();
                    this.showToast('作品库已清空');
                }
            });
        }

        // 点击遮罩关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideModal(e.target.id);
            }
        });
    }

    showSection(sectionName) {
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
        }
    }

    handleThemeSelection(themeCard) {
        const themeId = themeCard.dataset.themeId;
        const theme = window.themes.find(t => t.id === themeId);

        if (theme) {
            this.store.selectTheme(theme);
            this.showSection('contentConfig');
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
            
            modal.classList.remove('hidden');

            // 给body添加modal-open类，禁用页面滚动
            document.body.classList.add('modal-open');

            // 设置body样式固定位置，禁用滚动但保持位置
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = `-${scrollX}px`;
            document.body.style.width = '100vw';
            document.body.style.overflow = 'hidden';

            if (modalId === 'galleryModal') {
                this.renderGallery();
            }
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

    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        const emptyGallery = document.getElementById('emptyGallery');

        if (!galleryGrid || !emptyGallery) return;

        const { gallery } = this.store.state;

        if (gallery.length === 0) {
            galleryGrid.classList.add('hidden');
            emptyGallery.classList.remove('hidden');
        } else {
            galleryGrid.classList.remove('hidden');
            emptyGallery.classList.add('hidden');

            const galleryHtml = gallery.map(item => `
                <div class="gallery-item" data-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.title}" />
                    <div class="gallery-item-info">
                        <div class="gallery-item-title">${item.title}</div>
                        <div class="gallery-item-date">${new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('');

            galleryGrid.innerHTML = galleryHtml;
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

        // 这里应该调用AI生成API
        this.showToast('小报生成功能开发中，敬请期待！');
    }
}

// 主题渲染函数
function renderThemes() {
    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid || !window.themes) return;

    const themesHtml = window.themes.map(theme => `
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
            // 加载主题数据
            const response = await fetch('themes.json');
            const data = await response.json();
            window.themes = data.themes;

            // 初始化UI控制器
            this.uiController = new UIController(this.store);

            // 渲染主题
            renderThemes();

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