// 词汇编辑器组件
class VocabularyEditor {
    constructor(container, store) {
        this.container = container;
        this.store = store;
        this.maxVocabulary = 20;
        this.currentScene = null;
        this.vocabularyData = [];

        this.init();
    }

    // 初始化组件
    init() {
        this.render();
        this.bindEvents();
        // 延迟更新计数以确保DOM元素已创建
        setTimeout(() => this.updateSelectedCount(), 0);
    }

    // 渲染组件
    render() {
        // 只渲染词汇分类区域，不覆盖整个容器
        const categoriesHtml = this.renderCategories();
        this.vocabularyCategories = this.container.querySelector('.vocabulary-categories');

        if (this.vocabularyCategories) {
            this.vocabularyCategories.innerHTML = categoriesHtml;

            // 缓存DOM元素
            this.selectedCountEl = this.container.querySelector('#selectedCount');
            this.selectAllBtn = this.container.querySelector('#selectAllBtn');
            this.clearAllBtn = this.container.querySelector('#clearAllBtn');
        } else {
            // 如果找不到容器元素，显示错误信息
            this.container.innerHTML = `
                <div class="error-message">
                    无法找到词汇列表容器
                </div>
            `;
        }
    }

    // 渲染词汇分类
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

    // 渲染单个词汇项
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

    // 按类别分组词汇
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

    // 绑定事件
    bindEvents() {
        // 词汇项点击
        if (this.vocabularyCategories) {
            this.vocabularyCategories.addEventListener('click', (e) => {
                const wordItem = e.target.closest('.word-item');
                if (wordItem) {
                    this.handleWordClick(wordItem);
                }
            });
        }

        // 全选按钮
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => {
                this.selectAll();
            });
        }

        // 清空按钮
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => {
                this.clearAll();
            });
        }
    }

    // 处理词汇点击
    handleWordClick(wordItem) {
        const word = {
            english: wordItem.dataset.word,
            phonetic: wordItem.querySelector('.word-phonetic').textContent.replace(/[\/]/g, ''),
            chinese: wordItem.querySelector('.word-chinese').textContent,
            category: wordItem.dataset.category
        };

        // 切换选择状态
        const isSelected = this.isWordSelected(word);

        if (isSelected) {
            // 取消选择
            this.unselectWord(word);
            wordItem.classList.remove('selected');
            wordItem.querySelector('.toggle-btn').textContent = '+';
        } else {
            // 选择词汇
            if (this.store.state.selectedVocabulary.length < this.maxVocabulary) {
                this.selectWord(word);
                wordItem.classList.add('selected');
                wordItem.querySelector('.toggle-btn').textContent = '✓';
            } else {
                // 达到上限，提示用户
                this.showToast(`最多只能选择 ${this.maxVocabulary} 个词汇`);
            }
        }

        // 更新计数
        this.updateSelectedCount();
    }

    // 选择词汇
    selectWord(word) {
        const currentSelection = [...this.store.state.selectedVocabulary];

        // 避免重复选择
        if (!currentSelection.some(w => w.english === word.english)) {
            currentSelection.push(word);
            this.store.setState({ selectedVocabulary: currentSelection });
        }
    }

    // 取消选择词汇
    unselectWord(word) {
        const currentSelection = this.store.state.selectedVocabulary.filter(
            w => w.english !== word.english
        );
        this.store.setState({ selectedVocabulary: currentSelection });
    }

    // 检查词汇是否已选择
    isWordSelected(word) {
        return this.store.state.selectedVocabulary.some(
            w => w.english === word.english
        );
    }

    // 全选词汇
    selectAll() {
        this.store.selectAllVocabulary();
        this.updateUI();
        this.updateSelectedCount();

        this.showToast(`已选择 ${this.store.state.selectedVocabulary.length} 个词汇`);
    }

    // 清空所有选择
    clearAll() {
        this.store.clearAllVocabulary();
        this.updateUI();
        this.updateSelectedCount();

        this.showToast('已清空所有选择');
    }

    // 更新选中计数
    updateSelectedCount() {
        if (this.selectedCountEl) {
            const count = this.store.state.selectedVocabulary.length;
            this.selectedCountEl.textContent = count;
        }
    }

    // 更新UI
    updateUI() {
        if (!this.vocabularyCategories) return;

        const wordItems = this.vocabularyCategories.querySelectorAll('.word-item');

        wordItems.forEach(item => {
            const word = {
                english: item.dataset.word,
                phonetic: item.querySelector('.word-phonetic').textContent.replace(/[\/]/g, ''),
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

    // 设置当前场景
    setScene(scene) {
        this.currentScene = scene;
        this.render();
        this.bindEvents();
        // 延迟更新以确保DOM已渲染
        setTimeout(() => this.updateSelectedCount(), 0);
    }

    // 获取已选择的词汇
    getSelectedVocabulary() {
        return [...this.store.state.selectedVocabulary];
    }

    // 设置选中的词汇
    setSelectedVocabulary(vocabulary) {
        this.store.setState({ selectedVocabulary: vocabulary });
        this.updateUI();
        this.updateSelectedCount();
    }

    // 添加搜索功能
    addSearch(searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.filterVocabulary(e.target.value);
        });
    }

    // 过滤词汇
    filterVocabulary(searchText) {
        const wordItems = this.vocabularyCategories.querySelectorAll('.word-item');
        const searchLower = searchText.toLowerCase();

        wordItems.forEach(item => {
            const english = item.dataset.word.toLowerCase();
            const chinese = item.querySelector('.word-chinese').textContent.toLowerCase();

            if (english.includes(searchLower) || chinese.includes(searchLower)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 排序词汇
    sortVocabulary(sortBy) {
        const categories = this.vocabularyCategories.querySelectorAll('.vocabulary-category');

        categories.forEach(categoryEl => {
            const wordGrid = categoryEl.querySelector('.word-grid');
            const wordItems = Array.from(wordGrid.children);

            wordItems.sort((a, b) => {
                switch (sortBy) {
                    case 'english':
                        return a.dataset.word.localeCompare(b.dataset.word);
                    case 'chinese':
                        return a.querySelector('.word-chinese').textContent.localeCompare(
                            b.querySelector('.word-chinese').textContent
                        );
                    case 'category':
                        return a.dataset.category.localeCompare(b.dataset.category);
                    default:
                        return 0;
                }
            });

            // 重新排列
            wordItems.forEach(item => wordGrid.appendChild(item));
        });
    }

    // 随机打乱词汇
    shuffleVocabulary() {
        const categories = this.vocabularyCategories.querySelectorAll('.vocabulary-category');

        categories.forEach(categoryEl => {
            const wordGrid = categoryEl.querySelector('.word-grid');
            const wordItems = Array.from(wordGrid.children);

            // Fisher-Yates shuffle
            for (let i = wordItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                wordGrid.appendChild(wordItems[j]);
            }
        });
    }

    // 导出词汇列表
    exportVocabulary() {
        const vocabulary = this.store.state.selectedVocabulary;
        const data = vocabulary.map(v => ({
            english: v.english,
            chinese: v.chinese,
            phonetic: v.phonetic
        }));

        // 创建下载
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vocabulary-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('词汇列表已导出');
    }

    // 显示提示信息
    showToast(message, type = 'info') {
        // 创建或更新toast
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast show ${type}`;

        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 添加拖拽排序支持（可选）
    enableDragSort() {
        // 实现拖拽排序逻辑
        // 需要引入拖拽库或自己实现
        console.log('Drag sort not implemented yet');
    }

    // 获取词汇统计
    getVocabularyStats() {
        const vocabulary = this.store.state.selectedVocabulary;
        const totalVocabulary = this.currentScene ? this.currentScene.vocabulary.length : 0;

        const categories = this.groupVocabularyByCategory(vocabulary);

        return {
            selected: vocabulary.length,
            total: totalVocabulary,
            percentage: totalVocabulary > 0 ? Math.round((vocabulary.length / totalVocabulary) * 100) : 0,
            byCategory: Object.keys(categories).map(category => ({
                name: category,
                count: categories[category].length
            }))
        };
    }
}

// 导出
export default VocabularyEditor;