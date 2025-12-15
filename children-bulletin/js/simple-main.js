// Simple main application without complex imports
class SimpleStore {
    constructor() {
        this.state = {
            currentSection: 'welcome',
            currentTheme: null,
            currentScene: null,
            selectedVocabulary: [],
            maxVocabulary: 20,
            generationStatus: 'idle'
        };
        this.listeners = [];
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
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

    selectTheme(theme) {
        const scene = theme.scenes[0] || null;
        this.setState({
            currentTheme: theme,
            currentScene: scene,
            selectedVocabulary: this.getInitialVocabulary(theme, scene)
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

class SimpleVocabularyEditor {
    constructor(container, store) {
        this.container = container;
        this.store = store;
        this.maxVocabulary = 20;
        this.currentScene = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        setTimeout(() => this.updateSelectedCount(), 0);
    }

    render() {
        const categoriesHtml = this.renderCategories();
        this.container.innerHTML = categoriesHtml;
    }

    renderCategories() {
        if (!this.currentScene || !this.currentScene.vocabulary || this.currentScene.vocabulary.length === 0) {
            return '<p class="no-vocabulary">该场景暂无词汇数据</p>';
        }

        const categories = this.groupVocabularyByCategory(this.currentScene.vocabulary);
        const categoryNames = {
            character: '人物角色',
            object: '物品工具',
            environment: '环境设施',
            action: '动作行为'
        };

        return Object.entries(categories).map(([category, words]) => `
            <div class="vocabulary-category" data-category="${category}">
                <h4>${categoryNames[category] || category}</h4>
                <div class="word-grid">
                    ${words.map(word => this.renderWordItem(word)).join('')}
                </div>
            </div>
        `).join('');
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
            phonetic: wordItem.querySelector('.word-phonetic').textContent.replace(/[\\/]/g, ''),
            chinese: wordItem.querySelector('.word-chinese').textContent,
            category: wordItem.dataset.category
        };

        const isSelected = this.isWordSelected(word);

        if (isSelected) {
            this.unselectWord(word);
            wordItem.classList.remove('selected');
            wordItem.querySelector('.toggle-btn').textContent = '+';
        } else {
            if (this.store.state.selectedVocabulary.length < this.maxVocabulary) {
                this.selectWord(word);
                wordItem.classList.add('selected');
                wordItem.querySelector('.toggle-btn').textContent = '✓';
            } else {
                alert(`最多只能选择 ${this.maxVocabulary} 个词汇`);
            }
        }

        this.updateSelectedCount();
    }

    selectWord(word) {
        const currentSelection = [...this.store.state.selectedVocabulary];
        if (!currentSelection.some(w => w.english === word.english)) {
            currentSelection.push(word);
            this.store.setState({ selectedVocabulary: currentSelection });
        }
    }

    unselectWord(word) {
        const currentSelection = this.store.state.selectedVocabulary.filter(
            w => w.english !== word.english
        );
        this.store.setState({ selectedVocabulary: currentSelection });
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
        setTimeout(() => this.updateSelectedCount(), 0);
    }

    updateUI() {
        const wordItems = this.container.querySelectorAll('.word-item');
        wordItems.forEach(item => {
            const word = {
                english: item.dataset.word,
                phonetic: item.querySelector('.word-phonetic').textContent.replace(/[\\/]/g, ''),
                chinese: item.querySelector('.word-chinese').textContent,
                category: item.dataset.category
            };

            const isSelected = this.isWordSelected(word);
            if (isSelected) {
                item.classList.add('selected');
                const toggleBtn = item.querySelector('.toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '✓';
            } else {
                item.classList.remove('selected');
                const toggleBtn = item.querySelector('.toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '+';
            }
        });
    }
}

// Global functions for buttons
function selectAllVocabulary() {
    window.simpleStore.selectAllVocabulary();
    if (window.simpleVocabularyEditor) {
        window.simpleVocabularyEditor.updateUI();
        window.simpleVocabularyEditor.updateSelectedCount();
    }
    alert(`已选择 ${window.simpleStore.state.selectedVocabulary.length} 个词汇`);
}

function clearAllVocabulary() {
    window.simpleStore.clearAllVocabulary();
    if (window.simpleVocabularyEditor) {
        window.simpleVocabularyEditor.updateUI();
        window.simpleVocabularyEditor.updateSelectedCount();
    }
    alert('已清空所有选择');
}

// Global functions for navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show the selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.remove('hidden');
    }

    // Update breadcrumb if content config
    if (sectionName === 'contentConfig' && window.simpleStore) {
        const theme = window.simpleStore.state.currentTheme;
        const scene = window.simpleStore.state.currentScene;
        if (theme) {
            // Update theme display
            const themeIcon = document.getElementById('selectedThemeIcon');
            const themeName = document.getElementById('selectedThemeName');
            const sceneName = document.getElementById('selectedSceneName');
            const defaultTitleDisplay = document.getElementById('defaultTitleDisplay');

            if (themeIcon) themeIcon.textContent = theme.icon;
            if (themeName) themeName.textContent = theme.name;
            if (sceneName) sceneName.textContent = `场景：${scene ? scene.name : '未知'}`;

            // Update default title with enhanced generation
            if (defaultTitleDisplay) {
                const title = generateTitle(theme, scene);
                defaultTitleDisplay.innerHTML = title;
            }
        }
    }
}

// Make classes globally available
window.SimpleStore = SimpleStore;
window.SimpleVocabularyEditor = SimpleVocabularyEditor;

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing simple application...');

    // Load themes
    fetch('themes.json')
        .then(response => response.json())
        .then(data => {
            window.themes = data.themes;
            console.log('Themes loaded:', window.themes.length);

            // Create simple store
            window.simpleStore = new SimpleStore();

            // Set up start button
            const startBtn = document.getElementById('startBtn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    showSection('themeSelection');
                    renderThemes();
                });
            }

            // Set up theme selection
            document.addEventListener('click', (e) => {
                const themeCard = e.target.closest('.theme-card');
                if (themeCard) {
                    const themeId = themeCard.dataset.themeId;
                    const theme = window.themes.find(t => t.id === themeId);
                    if (theme) {
                        console.log('Theme selected:', theme);
                        window.simpleStore.selectTheme(theme);
                        showSection('contentConfig');

                        // Initialize vocabulary editor after a short delay to ensure DOM is ready
                        setTimeout(() => {
                            const vocabularyContainer = document.querySelector('.vocabulary-categories');
                            console.log('Vocabulary container:', vocabularyContainer);
                            console.log('Current scene:', window.simpleStore.state.currentScene);

                            if (vocabularyContainer && window.SimpleVocabularyEditor) {
                                console.log('Creating vocabulary editor...');
                                window.simpleVocabularyEditor = new window.SimpleVocabularyEditor(
                                    vocabularyContainer,
                                    window.simpleStore
                                );
                                console.log('Vocabulary editor created:', window.simpleVocabularyEditor);
                            }
                        }, 100);
                    }
                }
            });

            // Set up select all and clear buttons
            window.selectAllVocabulary = selectAllVocabulary;
            window.clearAllVocabulary = clearAllVocabulary;

            console.log('Application initialized successfully');
        })
        .catch(error => {
            console.error('Error loading themes:', error);
        });
});

// Enhanced title generation
function generateTitle(theme, scene) {
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

    const themeId = theme.id;
    const sceneId = scene?.id;

    // Try specific template
    if (titleTemplates[themeId] && titleTemplates[themeId][sceneId]) {
        const template = titleTemplates[themeId][sceneId];
        return `${template.prefix}${template.main}`;
    }

    // Fallback theme titles
    const themeTitles = {
        'daily-life': '温馨家园',
        'shopping': '购物天地',
        'school': '快乐学堂',
        'entertainment': '娱乐时光',
        'health': '健康生活',
        'travel': '旅行世界'
    };

    const themeTitle = themeTitles[themeId] || theme.name;

    // Add scene suffix
    if (scene) {
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

// Function to render themes
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