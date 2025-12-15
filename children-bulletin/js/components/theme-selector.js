// 主题选择组件
class ThemeSelector {
    constructor(container, store, themes) {
        this.container = container;
        this.store = store;
        this.themes = themes;
        this.selectedTheme = null;
        this.selectedScene = null;

        this.init();
    }

    // 初始化组件
    init() {
        this.render();
        this.bindEvents();
    }

    // 渲染组件
    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>选择主题</h2>
                <p class="section-desc">选择一个感兴趣的主题开始创作</p>
            </div>
            <div class="theme-grid" id="themeGrid">
                ${this.renderThemes()}
            </div>
        `;

        // 缓存DOM元素
        this.themeGrid = this.container.querySelector('#themeGrid');
        this.themeCards = this.themeGrid.querySelectorAll('.theme-card');
    }

    // 渲染主题列表
    renderThemes() {
        return this.themes.map(theme => `
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
    }

    // 绑定事件
    bindEvents() {
        // 主题卡片点击事件
        this.themeGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.theme-card');
            if (card) {
                this.handleThemeClick(card);
            }
        });

        // 场景切换事件（如果有场景选择）
        this.themeGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('scene-tag')) {
                e.stopPropagation();
                this.handleSceneClick(e.target);
            }
        });
    }

    // 处理主题点击
    handleThemeClick(card) {
        const themeId = card.dataset.themeId;
        const theme = this.themes.find(t => t.id === themeId);

        if (!theme) return;

        // 更新选中状态
        this.updateSelectedTheme(card);

        // 触发主题选择事件
        if (this.onThemeSelectCallback) {
            this.onThemeSelectCallback(theme);
        }

        // 更新store
        this.store.selectTheme(theme);
    }

    // 处理场景点击
    handleSceneClick(sceneTag) {
        const themeCard = sceneTag.closest('.theme-card');
        const themeId = themeCard.dataset.themeId;
        const sceneName = sceneTag.textContent;

        const theme = this.themes.find(t => t.id === themeId);
        const scene = theme.scenes.find(s => s.name === sceneName);

        if (!scene) return;

        // 更新场景选中状态
        this.updateSelectedScene(sceneTag);

        // 触发场景选择事件
        if (this.onSceneSelectCallback) {
            this.onSceneSelectCallback(scene);
        }

        // 更新store
        this.store.selectScene(scene);
    }

    // 更新主题选中状态
    updateSelectedTheme(selectedCard) {
        // 移除所有选中状态
        this.themeCards.forEach(card => {
            card.classList.remove('selected');
        });

        // 添加选中状态
        selectedCard.classList.add('selected');

        // 存储选中的主题
        const themeId = selectedCard.dataset.themeId;
        this.selectedTheme = this.themes.find(t => t.id === themeId);
    }

    // 更新场景选中状态
    updateSelectedScene(selectedTag) {
        // 移除同主题下所有场景的选中状态
        const themeCard = selectedTag.closest('.theme-card');
        const allSceneTags = themeCard.querySelectorAll('.scene-tag');

        allSceneTags.forEach(tag => {
            tag.classList.remove('selected-scene');
        });

        // 添加选中状态
        selectedTag.classList.add('selected-scene');

        // 存储选中的场景
        this.selectedScene = this.selectedTheme.scenes.find(
            s => s.name === selectedTag.textContent
        );
    }

    // 渲染场景选择器（如果需要）
    renderSceneSelector(theme) {
        if (!theme || theme.scenes.length <= 1) return '';

        return `
            <div class="scene-selector">
                <h4>选择场景：</h4>
                <div class="scene-options">
                    ${theme.scenes.map(scene => `
                        <label class="scene-option">
                            <input type="radio" name="scene" value="${scene.id}"
                                ${scene.id === theme.scenes[0].id ? 'checked' : ''}>
                            <span>${scene.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 高亮推荐主题
    highlightRecommendedThemes() {
        // 可以根据用户偏好或历史记录推荐主题
        const recommendedIds = ['daily-life', 'school'];

        recommendedIds.forEach(id => {
            const card = this.themeGrid.querySelector(`[data-theme-id="${id}"]`);
            if (card) {
                card.classList.add('recommended');
            }
        });
    }

    // 获取当前选中的主题
    getSelectedTheme() {
        return this.selectedTheme;
    }

    // 获取当前选中的场景
    getSelectedScene() {
        return this.selectedScene;
    }

    // 设置选中的主题
    setSelectedTheme(themeId) {
        const card = this.themeGrid.querySelector(`[data-theme-id="${themeId}"]`);
        if (card) {
            this.handleThemeClick(card);
        }
    }

    // 设置选中的场景
    setSelectedScene(sceneId) {
        const theme = this.selectedTheme;
        if (!theme) return;

        const scene = theme.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const sceneTag = this.themeGrid.querySelector(
            `[data-theme-id="${theme.id}"] .scene-tag`
        );

        if (sceneTag && sceneTag.textContent === scene.name) {
            this.handleSceneClick(sceneTag);
        }
    }

    // 重置选择
    resetSelection() {
        this.themeCards.forEach(card => {
            card.classList.remove('selected');
        });

        const allSceneTags = this.themeGrid.querySelectorAll('.scene-tag');
        allSceneTags.forEach(tag => {
            tag.classList.remove('selected-scene');
        });

        this.selectedTheme = null;
        this.selectedScene = null;

        // 重置store中的选择
        this.store.setState({
            currentTheme: null,
            currentScene: null,
            selectedVocabulary: []
        });
    }

    // 过滤主题
    filterThemes(filter) {
        const cards = this.themeGrid.querySelectorAll('.theme-card');

        cards.forEach(card => {
            const theme = this.themes.find(t => t.id === card.dataset.themeId);

            if (this.matchesFilter(theme, filter)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // 检查主题是否匹配过滤条件
    matchesFilter(theme, filter) {
        if (!filter) return true;

        const searchText = filter.toLowerCase();

        // 检查主题名称
        if (theme.name.toLowerCase().includes(searchText)) {
            return true;
        }

        // 检查主题描述
        if (theme.description.toLowerCase().includes(searchText)) {
            return true;
        }

        // 检查场景名称
        if (theme.scenes.some(scene =>
            scene.name.toLowerCase().includes(searchText)
        )) {
            return true;
        }

        return false;
    }

    // 排序主题
    sortThemes(sortBy) {
        const cards = Array.from(this.themeGrid.querySelectorAll('.theme-card'));

        cards.sort((a, b) => {
            const themeA = this.themes.find(t => t.id === a.dataset.themeId);
            const themeB = this.themes.find(t => t.id === b.dataset.themeId);

            switch (sortBy) {
                case 'name':
                    return themeA.name.localeCompare(themeB.name);
                case 'scenes':
                    return themeB.scenes.length - themeA.scenes.length;
                case 'alphabetical':
                    return themeA.name.localeCompare(themeB.name);
                default:
                    return 0;
            }
        });

        // 重新排列卡片
        cards.forEach(card => {
            this.themeGrid.appendChild(card);
        });
    }

    // 添加搜索功能
    addSearch(searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.filterThemes(e.target.value);
        });
    }

    // 添加排序功能
    addSort(select) {
        select.addEventListener('change', (e) => {
            this.sortThemes(e.target.value);
        });
    }

    // 添加事件监听器
    onThemeSelect(callback) {
        this.onThemeSelectCallback = callback;
    }

    onSceneSelect(callback) {
        this.onSceneSelectCallback = callback;
    }
}

// 导出
export default ThemeSelector;