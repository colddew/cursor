// 随机选择器组件
class RandomSelector {
    constructor(selectionService, earthViewer) {
        this.selectionService = selectionService;
        this.earthViewer = earthViewer;
        this.isSelecting = false;
        this.currentSelection = [];

        // Ensure selectedNames container is hidden initially
        this.hideSelectedNames();
    }

    /**
     * 执行随机选择
     */
    async performSelection() {
        if (this.isSelecting) return;

        const countSelect = document.getElementById('selectCount');
        const count = parseInt(countSelect ? countSelect.value : 3);

        // 获取今天已选中的学生
        const todaySelection = this.selectionService.getTodaySelection();
        const excludeIds = todaySelection ? todaySelection.selectedStudents : [];

        this.isSelecting = true;
        this.updateButtonState(true);

        try {
            // 执行地球动画
            if (this.earthViewer) {
                await this.performEarthAnimation();
            }

            // 获取选中的学生
            const selectedStudents = this.selectionService.selectStudents(count, excludeIds);
            this.currentSelection = selectedStudents;

            // 更新当前会话的选中学生
            const attendanceService = window.attendanceService;
            if (attendanceService) {
                const session = attendanceService.getCurrentSession();
                if (session && selectedStudents.length > 0) {
                    session.selectedStudents = selectedStudents.map(s => s.id);
                    attendanceService.saveData();
                }
            }

            // 显示选中的名字
            this.showSelectedNames(selectedStudents);

            // 显示历史记录
            this.updateHistory();

        } catch (error) {
            console.error('选择失败:', error);
            alert('选择失败: ' + error.message);
        } finally {
            this.isSelecting = false;
            this.updateButtonState(false);
        }
    }

    /**
     * 执行地球动画
     * @returns {Promise}
     */
    performEarthAnimation() {
        return new Promise(resolve => {
            if (this.earthViewer) {
                this.earthViewer.performSelectionAnimation(resolve);
            } else {
                setTimeout(resolve, 2000);
            }
        });
    }

    /**
     * 隐藏选中的名字
     */
    hideSelectedNames() {
        const container = document.getElementById('selectedNames');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    }

    /**
     * 显示选中的名字
     * @param {Array} students - 选中的学生数组
     */
    showSelectedNames(students) {
        const container = document.getElementById('selectedNames');
        if (!container) return;

        container.innerHTML = '';

        if (students.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        students.forEach((student, index) => {
            setTimeout(() => {
                const nameElement = document.createElement('div');
                nameElement.className = 'selected-name';
                nameElement.textContent = student.name;
                container.appendChild(nameElement);
            }, index * 200);
        });
    }

    /**
     * 更新历史记录显示
     */
    updateHistory() {
        const historyContainer = document.getElementById('randomHistory');
        if (!historyContainer) return;

        // Ensure selected names are hidden when viewing history
        this.hideSelectedNames();

        const history = this.selectionService.getSelectionHistory(7);

        if (history.length === 0) {
            historyContainer.innerHTML = '<div class="empty-state">暂无历史记录</div>';
            return;
        }

        historyContainer.innerHTML = history.map(record => `
            <div class="history-item">
                <div>
                    <div class="history-names">
                        ${record.selectedStudentNames.map(name =>
                            `<span class="history-name">${name}</span>`
                        ).join('')}
                    </div>
                    <div class="history-date">${record.date} ${record.time}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 更新按钮状态
     * @param {boolean} selecting - 是否正在选择
     */
    updateButtonState(selecting) {
        const button = document.getElementById('randomSelectBtn');
        if (!button) return;

        if (selecting) {
            button.disabled = true;
            button.innerHTML = '<span class="btn-text">选择中...</span><span class="btn-icon">⏳</span>';
        } else {
            button.disabled = false;
            button.innerHTML = '<span class="btn-text">开始随机选择</span><span class="btn-icon">🎲</span>';
        }
    }

    /**
     * 获取选择统计
     */
    getStatistics() {
        return this.selectionService.getSelectionStatistics(30);
    }

    /**
     * 清除历史记录
     */
    clearHistory() {
        if (!confirm('确定要清除历史记录吗？')) {
            return false;
        }

        this.selectionService.clearHistory(30);
        this.updateHistory();

        return true;
    }
}