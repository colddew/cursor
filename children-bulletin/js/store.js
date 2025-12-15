// 应用状态管理
class AppStore {
    constructor() {
        // 默认状态
        this.defaultState = {
            // 当前应用状态
            currentSection: 'welcome', // welcome, theme, config, progress, result
            currentTheme: null,         // 当前选择的主题对象
            currentScene: null,        // 当前选择的场景对象

            // 词汇相关
            selectedVocabulary: [],    // 用户选择的词汇列表
            maxVocabulary: 20,         // 最大词汇数量

            // 生成相关
            generationStatus: 'idle', // idle, generating, success, error
            currentWork: null,         // 当前生成的作品
            generationProgress: 0,      // 生成进度 0-100

            // 作品库
            gallery: [],               // 保存的作品列表

            // 设置
            settings: {
                apiKey: '',            // API密钥
                preferences: {
                    defaultTheme: null,
                    defaultScene: null,
                    aspectRatio: '3:4',
                    resolution: '4K',
                    outputFormat: 'png',
                    autoSave: true,      // 自动保存
                    showTutorial: true,  // 显示教程
                    autoDownload: false  // 自动下载
                }
            },

            // UI状态
            showTutorial: true,       // 是否显示教程
            isLoading: false,        // 是否正在加载
            toast: {                   // Toast提示
                visible: false,
                message: '',
                type: 'info'          // info, success, error, warning
            }
        };

        // 初始化状态
        this.state = { ...this.defaultState };
        this.listeners = [];

        // 从本地存储加载数据
        this.loadFromStorage();
    }

    // 订阅状态变化
    subscribe(listener) {
        this.listeners.push(listener);

        // 返回取消订阅函数
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // 获取当前状态
    getState() {
        return { ...this.state };
    }

    // 更新状态
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
        this.saveToStorage();
    }

    // 部分更新状态
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    // 重置状态
    resetState() {
        this.state = { ...this.defaultState };
        this.notifyListeners();
        this.saveToStorage();
    }

    // 通知所有监听器
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('状态监听器错误:', error);
            }
        });
    }

    // 保存到本地存储
    saveToStorage() {
        try {
            const saveData = {
                gallery: this.state.gallery,
                settings: this.state.settings
            };
            localStorage.setItem('bulletin-store', JSON.stringify(saveData));
        } catch (error) {
            console.error('保存状态失败:', error);
        }
    }

    // 从本地存储加载
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('bulletin-store');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.gallery) {
                    this.state.gallery = data.gallery;
                }
                if (data.settings) {
                    this.state.settings = { ...this.state.settings, ...data.settings };
                }
            }
        } catch (error) {
            console.error('加载状态失败:', error);
        }
    }

    // ========== 状态操作方法 ==========

    // 切换页面部分
    showSection(section) {
        this.setState({ currentSection: section });
    }

    // 选择主题
    selectTheme(theme) {
        const scene = theme.scenes[0] || null;
        this.setState({
            currentTheme: theme,
            currentScene: scene,
            selectedVocabulary: this.getInitialVocabulary(theme, scene)
        });
        this.showSection('contentConfig');
    }

    // 选择场景
    selectScene(scene) {
        this.setState({ currentScene: scene });
        // 设置初始词汇并全选（最多20个）
        const initialVocabulary = this.getInitialVocabulary(this.state.currentTheme, scene);
        this.setState({
            selectedVocabulary: initialVocabulary.slice(0, this.state.maxVocabulary)
        });
    }

    // 切换词汇选择
    toggleVocabulary(word) {
        const { selectedVocabulary } = this.state;
        const index = selectedVocabulary.findIndex(v => v.english === word.english);

        if (index > -1) {
            // 已选择，则移除
            const newVocabulary = [...selectedVocabulary];
            newVocabulary.splice(index, 1);
            this.setState({ selectedVocabulary: newVocabulary });
        } else if (selectedVocabulary.length < this.state.maxVocabulary) {
            // 未选择且未达到上限，则添加
            this.setState({
                selectedVocabulary: [...selectedVocabulary, word]
            });
        }
    }

    // 全选词汇
    selectAllVocabulary() {
        const { currentScene } = this.state;
        if (currentScene && currentScene.vocabulary) {
            this.setState({
                selectedVocabulary: [...currentScene.vocabulary].slice(0, this.state.maxVocabulary)
            });
        }
    }

    // 清空词汇选择
    clearAllVocabulary() {
        this.setState({ selectedVocabulary: [] });
    }

    // 开始生成
    startGeneration() {
        this.setState({
            generationStatus: 'generating',
            generationProgress: 0
        });
        // 显示生成进度模态框
        const generationModal = document.getElementById('generationModal');
        if (generationModal) {
            generationModal.classList.remove('hidden');
        }
    }

    // 更新生成进度
    updateGenerationProgress(progress) {
        this.setState({ generationProgress: progress });
    }

    // 生成成功
    generationSuccess(work) {
        this.setState({
            generationStatus: 'success',
            currentWork: work
        });
        // 隐藏生成进度模态框
        const generationModal = document.getElementById('generationModal');
        if (generationModal) {
            generationModal.classList.add('hidden');
        }
        this.showSection('result');
    }

    // 生成失败
    generationError(error) {
        this.setState({
            generationStatus: 'error',
            generationProgress: 0
        });
        // 隐藏生成进度模态框
        const generationModal = document.getElementById('generationModal');
        if (generationModal) {
            generationModal.classList.add('hidden');
        }
        this.showToast(error.message || '生成失败，请重试', 'error');
    }

    // 保存到作品库
    saveToGallery(work) {
        const { gallery } = this.state;
        const newWork = {
            ...work,
            id: this.generateId(),
            createdAt: Date.now()
        };

        this.setState({
            gallery: [newWork, ...gallery]
        });

        this.showToast('作品已保存到作品库', 'success');
    }

    // 从作品库删除
    deleteFromGallery(workId) {
        const { gallery } = this.state;
        const newGallery = gallery.filter(w => w.id !== workId);
        this.setState({ gallery: newGallery });
    }

    // 清空作品库
    clearGallery() {
        if (confirm('确定要清空所有作品吗？此操作不可恢复。')) {
            this.setState({ gallery: [] });
            this.showToast('作品库已清空', 'info');
        }
    }

    // 更新设置
    updateSettings(newSettings) {
        this.setState({
            settings: { ...this.state.settings, ...newSettings }
        });
    }

    // 显示提示
    showToast(message, type = 'info') {
        this.setState({
            toast: {
                visible: true,
                message,
                type
            }
        });

        // 3秒后自动隐藏
        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }

    // 隐藏提示
    hideToast() {
        this.setState({
            toast: {
                visible: false,
                message: '',
                type: 'info'
            }
        });
    }

    // 显示加载中
    showLoading() {
        this.setState({ isLoading: true });
    }

    // 隐藏加载中
    hideLoading() {
        this.setState({ isLoading: false });
    }

    // ========== 辅助方法 ==========

    // 获取初始词汇（按场景）
    getInitialVocabulary(theme, scene = null) {
        if (!theme) return [];

        const targetScene = scene || theme.scenes[0];
        if (!targetScene || !targetScene.vocabulary) return [];

        // 返回前20个词汇
        return targetScene.vocabulary.slice(0, 20);
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 检查是否有API密钥
    hasApiKey() {
        return !!this.state.settings.apiKey;
    }

    // 获取当前标题（如果有自定义标题则使用，否则使用默认标题）
    getCurrentTitle(customTitle) {
        if (customTitle) {
            return customTitle;
        }

        const { currentTheme, currentScene } = this.state;
        if (!currentTheme) return '英语小报';

        // 更丰富的标题前缀和组合
        const titleTemplates = {
            'daily-life': {
                'home': { prefix: '温馨', main: '家园' },
                'family': { prefix: '和睦', main: '家庭' },
                'community': { prefix: '和谐', main: '社区' }
            },
            'shopping': {
                'market': { prefix: '热闹', main: '市场' },
                'mall': { prefix: '时尚', main: '购物' },
                'online': { prefix: '便捷', main: '网购' }
            },
            'school': {
                'classroom': { prefix: '智慧', main: '课堂' },
                'library': { prefix: '书香', main: '学堂' },
                'playground': { prefix: '快乐', main: '校园' }
            },
            'entertainment': {
                'movies': { prefix: '精彩', main: '影院' },
                'music': { prefix: '悦动', main: '音符' },
                'games': { prefix: '欢乐', main: '游戏' }
            },
            'health': {
                'exercise': { prefix: '活力', main: '健身' },
                'nutrition': { prefix: '健康', main: '饮食' },
                'medical': { prefix: '关爱', main: '健康' }
            },
            'travel': {
                'beach': { prefix: '阳光', main: '海滩' },
                'mountain': { prefix: '壮丽', main: '山峰' },
                'city': { prefix: '都市', main: '风情' }
            }
        };

        // 尝试根据主题和场景生成标题
        const themeId = currentTheme.id;
        const sceneId = currentScene?.id;

        if (titleTemplates[themeId] && titleTemplates[themeId][sceneId]) {
            const template = titleTemplates[themeId][sceneId];
            return `${template.prefix}${template.main}`;
        }

        // 如果没有特定场景，使用主题默认标题
        const themeTitles = {
            'daily-life': '温馨家园',
            'shopping': '购物天地',
            'school': '快乐学堂',
            'entertainment': '娱乐时光',
            'health': '健康生活',
            'travel': '旅行世界'
        };

        const themeTitle = themeTitles[themeId] || currentTheme.name;

        // 根据场景添加后缀
        if (currentScene) {
            const sceneSuffixes = {
                'home': '记',
                'family': '情',
                'school': '园',
                'classroom': '里',
                'library': '中',
                'playground': '上'
            };
            const suffix = sceneSuffixes[sceneId] || '记';
            return `${themeTitle}${suffix}`;
        }

        return themeTitle;
    }
}

// 创建全局store实例
const store = new AppStore();

// 导出store
export default store;