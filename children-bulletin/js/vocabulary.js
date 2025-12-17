// 词汇选择功能文件
// 实现词汇的选择、计数、全选/清空等功能

// 立即执行的初始化函数
(function() {
    // console.log('正在初始化词汇选择功能...'); // 静默初始化

    // 等待DOM加载完成
    function waitForDOM() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeVocabularyFix);
        } else {
            initializeVocabularyFix();
        }
    }

    let isInitializing = false; // 防止重复初始化

    function initializeVocabularyFix() {
        if (isInitializing) {
            console.log('词汇功能正在初始化中，跳过重复调用');
            return;
        }

        isInitializing = true;
        console.log('DOM已加载，开始初始化词汇功能');

        // 查找词汇容器或父容器
        let vocabularyContainer = document.querySelector('.vocabulary-categories');
        let parentContainer = vocabularyContainer ? vocabularyContainer.parentElement : null;

        if (!vocabularyContainer && !parentContainer) {
            console.log('未找到词汇容器，尝试查找词汇列表...');
            const vocabularyList = document.getElementById('vocabularyList');
            if (vocabularyList) {
                parentContainer = vocabularyList;
                console.log('找到词汇列表容器');
            }
        }

        if (!vocabularyContainer && !parentContainer) {
            console.log('仍未找到词汇容器，等待2秒后重试...');
            isInitializing = false;
            setTimeout(initializeVocabularyFix, 2000);
            return;
        }

        const targetContainer = vocabularyContainer || parentContainer;
        console.log('找到目标容器，应用修复');

        // 检查是否已经修复过
        if (targetContainer.getAttribute('data-vocabulary-fixed') === 'true') {
            console.log('容器已修复，跳过重复修复');
            isInitializing = false;
            return;
        }

        // 移除可能存在的事件监听器
        targetContainer.removeEventListener('click', handleVocabularyClick);

        // 添加新的事件监听器，使用捕获阶段
        targetContainer.addEventListener('click', handleVocabularyClick, true);

        // 标记已修复
        targetContainer.setAttribute('data-vocabulary-fixed', 'true');

        // 初始化词汇状态
        setTimeout(() => {
            updateAllVocabularyItems();
            isInitializing = false;
        }, 100);
    }

    function handleVocabularyClick(event) {
        // 查找词汇项
        const wordItem = event.target.closest('.word-item');
        const toggleBtn = event.target.closest('.toggle-btn');

        if (wordItem || toggleBtn) {
            console.log('检测到词汇点击');
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const targetItem = wordItem || toggleBtn.closest('.word-item');
            if (targetItem) {
                toggleVocabularySelection(targetItem);
            }
        }
    }

    function toggleVocabularySelection(wordItem) {
        console.log('切换词汇选择状态');

        const word = {
            english: wordItem.dataset.word,
            phonetic: wordItem.querySelector('.word-phonetic')?.textContent?.replace(/[\/\\]/g, '') || '',
            chinese: wordItem.querySelector('.word-chinese')?.textContent || '',
            category: wordItem.dataset.category || 'object'
        };

        console.log('处理词汇:', word);

        // 检查是否使用全局应用状态
        if (window.app && window.app.store) {
            const currentSelection = window.app.store.state.selectedVocabulary;
            const isSelected = currentSelection.some(w => w.english === word.english);

            console.log('当前选中状态:', isSelected);

            if (isSelected) {
                // 取消选择
                const newSelection = currentSelection.filter(w => w.english !== word.english);
                window.app.store.setState({ selectedVocabulary: newSelection });
                console.log('已取消选择');
            } else {
                // 添加选择
                if (currentSelection.length < 20) {
                    const newSelection = [...currentSelection, word];
                    window.app.store.setState({ selectedVocabulary: newSelection });
                    console.log('已添加选择');
                } else {
                    alert('最多只能选择20个词汇');
                    return;
                }
            }

            // 更新UI
            updateVocabularyItemUI(wordItem);
            updateVocabularyCount();

        } else {
            // 后备方案：直接操作DOM
            console.log('使用后备方案');
            const isSelected = wordItem.classList.contains('selected');

            if (isSelected) {
                wordItem.classList.remove('selected');
                const toggleBtn = wordItem.querySelector('.toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '+';
            } else {
                const currentSelected = document.querySelectorAll('.word-item.selected').length;
                if (currentSelected >= 20) {
                    alert('最多只能选择20个词汇');
                    return;
                }
                wordItem.classList.add('selected');
                const toggleBtn = wordItem.querySelector('.toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '✓';
            }

            updateVocabularyCount();
        }

        // 添加视觉反馈
        wordItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            wordItem.style.transform = '';
        }, 150);
    }

    function updateVocabularyItemUI(wordItem) {
        const word = {
            english: wordItem.dataset.word
        };

        if (window.app && window.app.store) {
            const isSelected = window.app.store.state.selectedVocabulary.some(w => w.english === word.english);
            const toggleBtn = wordItem.querySelector('.toggle-btn');

            if (isSelected) {
                wordItem.classList.add('selected');
                if (toggleBtn) toggleBtn.textContent = '✓';
            } else {
                wordItem.classList.remove('selected');
                if (toggleBtn) toggleBtn.textContent = '+';
            }
        }
    }

    function updateVocabularyCount() {
        const countElement = document.getElementById('selectedCount');
        if (!countElement) return;

        let count = 0;

        if (window.app && window.app.store) {
            count = window.app.store.state.selectedVocabulary.length;
        } else {
            // 后备方案：计算DOM中的选中项
            count = document.querySelectorAll('.word-item.selected').length;
        }

        countElement.textContent = count;
        console.log('更新词汇计数:', count);
    }

    function updateAllVocabularyItems() {
        const wordItems = document.querySelectorAll('.word-item');
        console.log('更新所有词汇项，数量:', wordItems.length);

        wordItems.forEach(item => {
            updateVocabularyItemUI(item);
        });

        updateVocabularyCount();

        // 调整词汇容器高度
        adjustVocabularyContainerHeight();
    }

    function adjustVocabularyContainerHeight() {
        const vocabularyCard = document.querySelector('.config-card:has(.vocabulary-categories)');
        if (vocabularyCard) {
            const categories = vocabularyCard.querySelector('.vocabulary-categories');
            if (categories) {
                // 获取词汇卡片的可用高度
                const cardStyle = window.getComputedStyle(vocabularyCard);
                const cardHeight = vocabularyCard.offsetHeight;
                const cardPaddingTop = parseInt(cardStyle.paddingTop);
                const cardPaddingBottom = parseInt(cardStyle.paddingBottom);
                const controlsHeight = vocabularyCard.querySelector('.vocabulary-controls')?.offsetHeight || 80;
                const availableHeight = cardHeight - cardPaddingTop - cardPaddingBottom - controlsHeight - 20; // 20px buffer

                // 设置最大高度
                categories.style.maxHeight = `${Math.min(availableHeight, 280)}px`;
            }
        }
    }

    // 全选功能修复
    window.fixSelectAll = function() {
        console.log('执行全选修复');

        const wordItems = document.querySelectorAll('.word-item');
        const selectedWords = [];

        wordItems.forEach((item, index) => {
            if (index < 20) { // 最多选择20个
                const word = {
                    english: item.dataset.word,
                    phonetic: item.querySelector('.word-phonetic')?.textContent?.replace(/[\/\\]/g, '') || '',
                    chinese: item.querySelector('.word-chinese')?.textContent || '',
                    category: item.dataset.category || 'object'
                };

                selectedWords.push(word);

                // 更新UI
                item.classList.add('selected');
                const toggleBtn = item.querySelector('.toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '✓';
            }
        });

        // 更新状态
        if (window.app && window.app.store) {
            window.app.store.setState({ selectedVocabulary: selectedWords });
        }

        updateVocabularyCount();

        // 显示Toast提示而不是alert
        if (window.app && window.app.uiController) {
            window.app.uiController.showToast(`已选择 ${selectedWords.length} 个词汇`);
        } else {
            console.log(`已选择 ${selectedWords.length} 个词汇`);
        }
    };

    // 清空功能修复
    window.fixClearAll = function() {
        console.log('执行清空修复');

        const wordItems = document.querySelectorAll('.word-item');

        wordItems.forEach(item => {
            item.classList.remove('selected');
            const toggleBtn = item.querySelector('.toggle-btn');
            if (toggleBtn) toggleBtn.textContent = '+';
        });

        // 更新状态
        if (window.app && window.app.store) {
            window.app.store.setState({ selectedVocabulary: [] });
            window.app.uiController.showToast('已清空所有选择');
        }

        updateVocabularyCount();
    };

    // 重新绑定按钮事件
    function rebindButtonEvents() {
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');

        if (selectAllBtn) {
            console.log('重新绑定全选按钮');
            selectAllBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.fixSelectAll();
            };
        }

        if (clearAllBtn) {
            console.log('重新绑定清空按钮');
            clearAllBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.fixClearAll();
            };
        }
    }

    // 监听页面变化，重新绑定事件
    function observePageChanges() {
        let isProcessing = false; // 防止重复处理

        const observer = new MutationObserver((mutations) => {
            if (isProcessing) return;

            let shouldReinitialize = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 检查添加的节点
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查是否添加了词汇相关元素
                            if (node.classList && node.classList.contains('word-item')) {
                                shouldReinitialize = true;
                            } else if (node.querySelector && node.querySelector('.word-item')) {
                                shouldReinitialize = true;
                            }
                        }
                    });

                    // 检查移除的节点
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && node.classList.contains('word-item')) {
                                shouldReinitialize = true;
                            }
                        }
                    });
                }
            });

            if (shouldReinitialize) {
                isProcessing = true;
                console.log('检测到词汇元素变化，重新绑定事件');
                setTimeout(() => {
                    initializeVocabularyFix();
                    rebindButtonEvents();
                    isProcessing = false;
                }, 200);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // 修复词汇容器的辅助函数
    function fixVocabularyContainer() {
        const containers = document.querySelectorAll('.vocabulary-categories:not([data-vocabulary-fixed="true"])');
        containers.forEach(container => {
            // 移除可能存在的事件监听器
            container.removeEventListener('click', handleVocabularyClick);
            // 添加新的事件监听器，使用捕获阶段
            container.addEventListener('click', handleVocabularyClick, true);
            // 标记已修复
            container.setAttribute('data-vocabulary-fixed', 'true');
            console.log('已修复并标记词汇容器');
        });
    }

    // 更智能的轮询检查
    function smartPolling() {
        let checkCount = 0;
        const maxChecks = 5; // 进一步减少到5次（10秒）

        const intervalId = setInterval(() => {
            checkCount++;

            // 检查是否有未修复的词汇容器且已有词汇项
            const unfixedContainers = document.querySelectorAll('.vocabulary-categories:not([data-vocabulary-fixed="true"])');
            const hasWordItems = document.querySelector('.word-item');

            // 只有在找到词汇项且有未修复容器时才修复
            if (unfixedContainers.length > 0 && hasWordItems) {
                console.log('发现未修复的词汇容器，进行修复');
                fixVocabularyContainer();
                rebindButtonEvents();
            }

            // 如果没有未修复容器、找到词汇项或者超时，停止轮询
            if (unfixedContainers.length === 0 || hasWordItems || checkCount >= maxChecks) {
                clearInterval(intervalId);
                console.log('智能轮询结束，检查次数:', checkCount);
            }
        }, 2000); // 每2秒检查一次
    }

    // 开始执行
    // console.log('词汇选择功能初始化完成');
    waitForDOM();
    rebindButtonEvents();

    const observer = observePageChanges();
    smartPolling();

    console.log('词汇选择修复已应用');
})();