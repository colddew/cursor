// 主应用入口
class AttendanceApp {
    constructor() {
        this.attendanceService = new AttendanceService();
        this.importService = new ImportService();
        this.exportService = new ExportService();
        this.selectionService = new SelectionService();
        this.earthViewer = null;
        this.currentTab = 'attendance';

        // 初始化组件
        this.rosterManager = null;
        this.attendanceTracker = null;
        this.randomSelector = null;
        this.recordsViewer = null;
        this.exportManager = null;

        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        // 初始化服务
        this.importService.init(this.attendanceService);
        this.exportService.init(this.attendanceService);
        this.selectionService.init(this.attendanceService);

        // 初始化UI
        this.initUI();
        this.initEarthViewer();
        this.initComponents();
        this.bindEvents();

        // 更新UI数据
        await this.updateUI();
        // 初始化学生总数显示
        this.updateStudentCount();

        console.log('课堂点名签到系统已启动');

        // 将组件暴露到全局，供HTML使用
        window.attendanceTracker = this.attendanceTracker;
    }

    /**
     * 初始化组件
     */
    initComponents() {
        this.rosterManager = new RosterManager(this.attendanceService);
        this.attendanceTracker = new AttendanceTracker(this.attendanceService);
        this.recordsViewer = new RecordsViewer(this.attendanceService);
        this.exportManager = new ExportManager(this.exportService);

        // 等待地球查看器初始化后再初始化随机选择器
        if (this.earthViewer) {
            this.randomSelector = new RandomSelector(this.selectionService, this.earthViewer);
        }
    }

    /**
     * 初始化UI
     */
    initUI() {
        // 显示当前日期
        const currentDate = document.getElementById('currentDate');
        if (currentDate) {
            currentDate.textContent = `${DateUtils.format(new Date(), 'YYYY年MM月DD日')} ${DateUtils.getWeekday(new Date())}`;
        }

        // 设置日期输入框的默认值
        const today = DateUtils.today();
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.value = input.id.includes('End') ? today : today;
        });
    }

    /**
     * 初始化地球查看器
     */
    initEarthViewer() {
        const earthContainer = document.querySelector('.selection-earth');
        if (earthContainer) {
            this.earthViewer = new EarthViewer(earthContainer);
            this.earthViewer.setSize(200);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 标签页切换
        this.bindTabNavigation();

        // 考勤相关事件
        this.bindAttendanceEvents();

        // 学生名单相关事件
        this.bindRosterEvents();

        // 随机选择相关事件
        this.bindSelectionEvents();

        // 记录查看相关事件
        this.bindRecordsEvents();

        // 导出相关事件
        this.bindExportEvents();

        // 模态框事件
        this.bindModalEvents();

        // 文件拖放事件
        this.bindDragDropEvents();
    }

    /**
     * 绑定标签页导航
     */
    bindTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;

                // 更新按钮状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 更新内容显示
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabName}-tab`) {
                        content.classList.add('active');
                    }
                });

                this.currentTab = tabName;

                // 刷新对应标签页的数据
                this.refreshTabContent(tabName);
            });
        });
    }

    /**
     * 绑定考勤事件
     */
    bindAttendanceEvents() {
        // 绑定考勤按钮事件（当组件未初始化时使用）
      this.bindAttendanceButtons();

      // 考勤卡片点击事件（动态绑定）
      document.getElementById('attendanceGrid')?.addEventListener('click', (e) => {
          const card = e.target.closest('.attendance-card');
          if (card) {
              const studentId = card.dataset.studentId;
              this.cycleAttendanceStatus(studentId);
          }
      });
    }

    /**
     * 绑定考勤按钮事件
     */
    bindAttendanceButtons() {
      // 移除现有监听器
      document.removeEventListener('click', this.handleAttendanceButtonClick);

      // 绑定新的事件
      this.handleAttendanceButtonClick = (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;

          if (btn.id === 'startAttendance') {
              this.startAttendance();
          } else if (btn.id === 'pauseAttendance') {
              const currentSession = this.attendanceService.getCurrentSession();
              if (currentSession && currentSession.isInProgress()) {
                  currentSession.pauseSession();
                  this.attendanceService.saveData();
                  this.showMessage('点名已暂停', 'success');
                  this.refreshAttendanceTab();
              }
          } else if (btn.id === 'resumeAttendance') {
              const currentSession = this.attendanceService.getCurrentSession();
              if (currentSession && currentSession.isPaused()) {
                  currentSession.startSession();
                  this.attendanceService.saveData();
                  this.showMessage('点名已继续', 'success');
                  this.refreshAttendanceTab();
              }
          } else if (btn.id === 'restartAttendance') {
              if (confirm('确定要重新开始今天的考勤吗？所有记录将被清除。')) {
                  const today = DateUtils.today();
                  this.attendanceService.attendances = this.attendanceService.attendances.filter(a => a.date !== today);

                  const currentSession = this.attendanceService.getCurrentSession();
                  if (currentSession) {
                      currentSession.resetSession();
                      currentSession.startSession();
                      this.attendanceService.saveData();
                      this.showMessage('考勤已重新开始', 'success');
                  }

                  this.refreshAttendanceTab();
              }
          }
      };

      document.addEventListener('click', this.handleAttendanceButtonClick);
    }

    /**
     * 绑定学生名单事件
     */
    bindRosterEvents() {
        // 导入按钮
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportModal();
            });
        }

        // 添加学生按钮
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => {
                this.showAddStudentModal();
            });
        }

        // 清除数据按钮
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.showClearDataConfirm();
            });
        }

        // 搜索框
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.searchStudents(e.target.value);
                }, 300);
            });
        }

        // 学生列表事件（动态绑定）
        document.getElementById('rosterList')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');

            if (editBtn) {
                const studentId = editBtn.dataset.studentId;
                this.editStudent(studentId);
            } else if (deleteBtn) {
                const studentId = deleteBtn.dataset.studentId;
                this.deleteStudent(studentId);
            }
        });

        // 批量操作事件
        this.bindBatchEvents();
    }

    /**
     * 绑定批量操作事件
     */
    bindBatchEvents() {
        // 全选按钮
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                if (this.rosterManager) {
                    this.rosterManager.selectAll(true);
                    this.updateBatchActions();
                }
            });
        }

        // 取消全选按钮
        const deselectAllBtn = document.getElementById('deselectAllBtn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                if (this.rosterManager) {
                    this.rosterManager.selectAll(false);
                    this.updateBatchActions();
                }
            });
        }

        // 批量删除按钮
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', () => {
                this.showBatchDeleteConfirm();
            });
        }

        // 监听复选框变化
        document.getElementById('rosterList')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('student-select-checkbox')) {
                this.updateBatchActions();
            }
        });

        // 模态框中的批量删除确认
        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmBatchDelete') {
                this.confirmBatchDelete();
            }
        });
    }

    /**
     * 绑定随机选择事件
     */
    bindSelectionEvents() {
        // 随机选择按钮
        const selectBtn = document.getElementById('randomSelectBtn');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                this.performRandomSelection();
            });
        }

        // 选择人数变化
        const selectCount = document.getElementById('selectCount');
        if (selectCount) {
            selectCount.addEventListener('change', () => {
                this.updateSelectionPreview();
            });
        }
    }

    /**
     * 绑定记录查看事件
     */
    bindRecordsEvents() {
        // 筛选按钮
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.filterRecords();
            });
        }

        // 日期变化时自动筛选
        const dateInputs = ['startDate', 'endDate'].map(id => document.getElementById(id));
        dateInputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    this.filterRecords();
                });
            }
        });
    }

    /**
     * 绑定导出事件
     */
    bindExportEvents() {
        // 导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('modalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // 点击遮罩关闭
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal();
                }
            });
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // CSV文件输入
        const csvInput = document.getElementById('csvFileInput');
        if (csvInput) {
            csvInput.addEventListener('change', (e) => {
                this.handleCSVFile(e.target.files[0]);
            });
        }
    }

    /**
     * 绑定拖放事件
     */
    bindDragDropEvents() {
        const dropZones = document.querySelectorAll('.drop-zone');

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'text/csv') {
                    this.handleCSVFile(file);
                }
            });

            zone.addEventListener('click', () => {
                document.getElementById('csvFileInput').click();
            });
        });
    }

    /**
     * 更新UI
     */
    async updateUI() {
        // 更新头部统计
        this.updateHeaderStats();
        this.updateExportButtonState();
        this.updateRandomButtonState();

        // 更新当前标签页内容
        this.refreshTabContent(this.currentTab);

        // 更新地球主题
        if (this.earthViewer) {
            const rate = this.attendanceService.getTodayAttendanceRate();
            this.earthViewer.setThemeByAttendanceRate(rate);
        }
    }

    /**
     * 更新头部统计
     */
    updateHeaderStats() {
        // 更新今日出勤率
        const rateElement = document.getElementById('todayAttendanceRate');
        if (rateElement) {
            const rate = this.attendanceService.getTodayAttendanceRate();
            rateElement.textContent = rate > 0 ? `${rate}%` : '-';
        }

        // 更新学生总数
        const totalElement = document.getElementById('totalStudents');
        if (totalElement) {
            totalElement.textContent = this.attendanceService.students.filter(s => s.active).length;
        }
    }

    /**
     * 刷新标签页内容
     * @param {string} tabName - 标签页名称
     */
    refreshTabContent(tabName) {
        switch (tabName) {
            case 'attendance':
                this.refreshAttendanceTab();
                break;
            case 'roster':
                this.refreshRosterTab();
                break;
            case 'random':
                this.refreshRandomTab();
                break;
            case 'records':
                this.refreshRecordsTab();
                break;
            case 'export':
                this.refreshExportTab();
                break;
        }
    }

    /**
     * 刷新考勤标签页
     */
    refreshAttendanceTab() {
        if (this.attendanceTracker) {
            this.attendanceTracker.render();
        } else {
            // 处理组件未初始化的情况
            const grid = document.getElementById('attendanceGrid');
            const buttonContainer = document.getElementById('attendanceButtons');

            if (!grid) return;

            const students = this.attendanceService.getStudentsWithTodayStatus();
            const currentSession = this.attendanceService.getCurrentSession();

            // 渲染按钮
            if (buttonContainer) {
                let buttonsHtml = '';

                if (currentSession) {
                    if (currentSession.isInProgress()) {
                        // 进行中：显示暂停和重新开始两个按钮
                        buttonsHtml += `<button class="btn btn-warning" id="pauseAttendance">暂停点名</button>`;
                        buttonsHtml += `<button class="btn btn-danger" id="restartAttendance">重新开始</button>`;
                    } else if (currentSession.isPaused()) {
                        // 已暂停：显示继续和重新开始两个按钮
                        buttonsHtml += `<button class="btn btn-success" id="resumeAttendance">继续点名</button>`;
                        buttonsHtml += `<button class="btn btn-danger" id="restartAttendance">重新开始</button>`;
                    } else if (currentSession.isCompleted()) {
                        // 已完成：只显示开始按钮
                        buttonsHtml += `<button class="btn btn-primary" id="startAttendance">开始点名</button>`;
                    } else {
                        // 未开始：只显示开始按钮
                        buttonsHtml += `<button class="btn btn-primary" id="startAttendance">开始点名</button>`;
                    }
                } else {
                    // 无会话：只显示开始按钮
                    buttonsHtml += `<button class="btn btn-primary" id="startAttendance">开始点名</button>`;
                }

                buttonContainer.innerHTML = buttonsHtml;

                // 绑定按钮事件
                this.bindAttendanceButtons();
            }

            // 渲染学生列表
            grid.innerHTML = students.map(student => {
                const status = student.todayStatus || 'pending';
                const statusText = status === 'pending' ? '未签到' : AppConfig.statusText[status];
                const statusClass = AppConfig.statusClasses[status] || AppConfig.statusClasses.pending;

                if (!currentSession || currentSession.sessionStatus === 'not_started') {
                    return `
                        <div class="attendance-card no-status" data-student-id="${student.id}">
                            <div class="student-name">${student.name}</div>
                            <div class="student-id">${student.studentId}</div>
                            <div class="attendance-status disabled">
                                请先开始考勤
                            </div>
                        </div>
                    `;
                } else if (currentSession.isPaused()) {
                    return `
                        <div class="attendance-card paused" data-student-id="${student.id}">
                            <div class="student-name">${student.name}</div>
                            <div class="student-id">${student.studentId}</div>
                            <div class="attendance-status">
                                ${statusText}
                            </div>
                            <div class="attendance-status disabled" style="margin-top: 0.5rem;">
                                考勤已暂停
                            </div>
                        </div>
                    `;
                } else if (currentSession.isCompleted()) {
                    return `
                        <div class="attendance-card completed" data-student-id="${student.id}">
                            <div class="student-name">${student.name}</div>
                            <div class="student-id">${student.studentId}</div>
                            <div class="attendance-status ${statusClass}">
                                ${statusText} (已完成)
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="attendance-card ${status}" data-student-id="${student.id}">
                            <div class="student-name">${student.name}</div>
                            <div class="student-id">${student.studentId}</div>
                            <div class="attendance-status-buttons">
                                <button
                                    class="status-btn present ${status === 'present' ? 'active' : ''}"
                                    onclick="window.attendanceTracker?.recordAttendance('${student.id}', 'present')"
                                    title="到场"
                                >✓</button>
                                <button
                                    class="status-btn tardy ${status === 'tardy' ? 'active' : ''}"
                                    onclick="window.attendanceTracker?.recordAttendance('${student.id}', 'tardy')"
                                    title="迟到"
                                >⏰</button>
                                <button
                                    class="status-btn absent ${status === 'absent' ? 'active' : ''}"
                                    onclick="window.attendanceTracker?.recordAttendance('${student.id}', 'absent')"
                                    title="缺勤"
                                >✗</button>
                                <button
                                    class="status-btn excused ${status === 'excused' ? 'active' : ''}"
                                    onclick="window.attendanceTracker?.recordAttendance('${student.id}', 'excused')"
                                    title="请假"
                                >📝</button>
                            </div>
                            <div class="attendance-status ${statusClass}">
                                ${statusText}
                            </div>
                        </div>
                    `;
                }
            }).join('');

            // 如果没有学生，显示提示
            if (students.length === 0) {
                grid.innerHTML = '<div class="empty-state">请先导入学生名单</div>';
            }
        }
    }

    /**
     * 开始点名
     */
    startAttendance() {
        if (!this.attendanceTracker) {
            const session = this.attendanceService.startAttendance({
                startTime: DateUtils.currentTime(),
                topic: '常规课程'
            });
            this.showMessage('点名已开始', 'success');
            this.refreshAttendanceTab();
            return;
        }

        const currentSession = this.attendanceService.getCurrentSession();

        if (currentSession && currentSession.isInProgress()) {
            // 停止点名
            this.attendanceTracker.stopTracking();
            this.showMessage('点名已停止', 'success');
        } else if (currentSession && currentSession.isCompleted()) {
            // 重新开始
            if (confirm('确定要重新开始今天的考勤吗？所有记录将被清除。')) {
                this.attendanceTracker.resetTracking();
                this.attendanceTracker.startTracking();
                this.showMessage('考勤已重新开始', 'success');
            }
        } else {
            // 开始点名
            this.attendanceTracker.startTracking();
            this.showMessage('点名已开始', 'success');
        }

        this.refreshAttendanceTab();
    }

    /**
     * 切换考勤状态
     * @param {string} studentId - 学生ID
     */
    cycleAttendanceStatus(studentId) {
        const today = DateUtils.today();
        const attendance = this.attendanceService.attendances.find(a =>
            a.studentId === studentId && a.date === today
        );

        let newStatus;
        if (!attendance) {
            newStatus = AppConfig.attendanceStatus.PRESENT;
        } else {
            // 状态循环: present -> tardy -> absent -> present
            switch (attendance.status) {
                case AppConfig.attendanceStatus.PRESENT:
                    newStatus = AppConfig.attendanceStatus.TARDY;
                    break;
                case AppConfig.attendanceStatus.TARDY:
                    newStatus = AppConfig.attendanceStatus.ABSENT;
                    break;
                default:
                    newStatus = AppConfig.attendanceStatus.PRESENT;
            }
        }

        this.attendanceService.recordAttendance(studentId, newStatus);
        this.refreshAttendanceTab();
        this.updateHeaderStats();

        // 更新地球主题
        if (this.earthViewer) {
            const rate = this.attendanceService.getTodayAttendanceRate();
            this.earthViewer.setThemeByAttendanceRate(rate);
        }
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success|error|info|warning)
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;

        // 添加到页面
        document.body.appendChild(messageElement);

        // 自动移除
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    /**
     * 显示模态框
     * @param {string} title - 标题
     * @param {string} content - 内容
     */
    showModal(title, content) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalOverlay = document.getElementById('modalOverlay');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        if (modalOverlay) modalOverlay.classList.add('active');
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    }

    /**
     * 刷新其他标签页
     */
    refreshRosterTab() {
        if (this.rosterManager) {
            this.rosterManager.render();
        }
        // 更新学生总数
        this.updateStudentCount();
        // 更新主界面学生总数显示
        const totalElement = document.getElementById('totalStudents');
        if (totalElement) {
            totalElement.textContent = this.attendanceService.students.filter(s => s.active).length;
        }
        // 更新批量操作按钮状态
        this.updateBatchActions();
    }

    /**
     * 更新学生总数显示
     */
    updateStudentCount() {
        const totalElement = document.getElementById('totalStudentCount');
        if (totalElement) {
            const activeCount = this.attendanceService.students.filter(s => s.active).length;
            totalElement.textContent = activeCount;
        }
    }

    /**
     * 更新批量操作按钮状态
     */
    updateBatchActions() {
        const batchActions = document.getElementById('batchActions');
        if (batchActions && this.rosterManager) {
            const hasSelection = this.rosterManager.hasSelectedStudents();
            batchActions.style.display = hasSelection ? 'flex' : 'none';
        }
    }

    /**
     * 更新导出按钮状态
     */
    updateExportButtonState() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            const hasData = this.attendanceService.students.length > 0 ||
                          this.attendanceService.attendances.length > 0 ||
                          this.attendanceService.sessions.length > 0;

            if (hasData) {
                exportBtn.disabled = false;
                exportBtn.classList.remove('btn-secondary');
                exportBtn.classList.add('btn-primary');
            } else {
                exportBtn.disabled = true;
                exportBtn.classList.remove('btn-primary');
                exportBtn.classList.add('btn-secondary');
            }
        }
    }

    /**
     * 更新随机选择按钮状态
     */
    updateRandomButtonState() {
        const randomBtn = document.getElementById('randomSelectBtn');
        if (randomBtn) {
            const hasStudents = this.attendanceService.students.length > 0;

            if (hasStudents) {
                randomBtn.disabled = false;
                randomBtn.classList.remove('btn-secondary');
                randomBtn.classList.add('btn-primary');
                // 更新按钮文本
                randomBtn.innerHTML = '<span class="btn-text">开始随机选择</span><span class="btn-icon">🎲</span>';
            } else {
                randomBtn.disabled = true;
                randomBtn.classList.remove('btn-primary');
                randomBtn.classList.add('btn-secondary');
                // 更新按钮文本
                randomBtn.innerHTML = '<span class="btn-text">暂无学生</span><span class="btn-icon">🎲</span>';
            }
        }
    }

    refreshRandomTab() {
        // 更新随机选择按钮状态
        const randomBtn = document.getElementById('randomSelectBtn');
        if (randomBtn) {
            const hasStudents = this.attendanceService.students.length > 0;
            if (hasStudents) {
                randomBtn.disabled = false;
                randomBtn.classList.remove('btn-secondary');
                randomBtn.classList.add('btn-primary');
                // 更新按钮文本
                randomBtn.innerHTML = '<span class="btn-text">开始随机选择</span><span class="btn-icon">🎲</span>';
            } else {
                randomBtn.disabled = true;
                randomBtn.classList.remove('btn-primary');
                randomBtn.classList.add('btn-secondary');
                // 更新按钮文本
                randomBtn.innerHTML = '<span class="btn-text">暂无学生</span><span class="btn-icon">🎲</span>';
            }
        }

        // 显示选中的学生
        const selectedNames = document.getElementById('selectedNames');
        if (selectedNames) {
            const session = this.attendanceService.getCurrentSession();
            if (session && session.selectedStudents.length > 0) {
                const selectedStudentNames = session.selectedStudents.map(studentId => {
                    const student = this.attendanceService.getStudentById(studentId);
                    return student ? student.name : '';
                }).filter(name => name);

                selectedNames.innerHTML = `
                    <div class="selected-students-title">已选中学生：</div>
                    <div class="selected-students-list">
                        ${selectedStudentNames.map(name => `<span class="selected-student">${name}</span>`).join('')}
                    </div>
                `;
                selectedNames.style.display = 'block';
            } else {
                selectedNames.innerHTML = '';
                selectedNames.style.display = 'none';
            }
        }

        if (this.randomSelector) {
            this.randomSelector.updateHistory();
        }
        // 更新学生总数显示
        const totalElement = document.getElementById('totalStudents');
        if (totalElement) {
            totalElement.textContent = this.attendanceService.students.filter(s => s.active).length;
        }
    }

    refreshRecordsTab() {
        if (this.recordsViewer) {
            this.recordsViewer.render();
        }
        // 更新学生总数显示
        const totalElement = document.getElementById('totalStudents');
        if (totalElement) {
            totalElement.textContent = this.attendanceService.students.filter(s => s.active).length;
        }
    }

    refreshExportTab() {
        // 设置默认日期范围
        const today = DateUtils.today();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = DateUtils.format(thirtyDaysAgo, 'YYYY-MM-DD');

        const exportStartDate = document.getElementById('exportStartDate');
        const exportEndDate = document.getElementById('exportEndDate');

        if (exportStartDate) exportStartDate.value = startDate;
        if (exportEndDate) exportEndDate.value = today;
    }

    /**
     * 显示导入模态框
     */
    showImportModal() {
        const content = `
            <div class="import-modal">
                <div class="drop-zone" id="csvDropZone">
                    <div class="drop-zone-icon">📁</div>
                    <div class="drop-zone-text">
                        拖放CSV文件到这里，或点击选择文件
                    </div>
                    <input type="file" id="csvFileInput" accept=".csv" style="display: none;">
                </div>
                <div class="import-options">
                    <button class="btn btn-secondary" onclick="app.importService.downloadTemplate('students'); return false;">
                        下载模板
                    </button>
                </div>
            </div>
        `;

        this.showModal('导入学生名单', content);

        // 绑定新创建的drop zone事件
        setTimeout(() => {
            this.bindImportModalEvents();
        }, 100);
    }

    /**
     * 绑定导入模态框事件
     */
    bindImportModalEvents() {
        const dropZone = document.getElementById('csvDropZone');
        const fileInput = document.getElementById('csvFileInput');

        if (!dropZone || !fileInput) return;

        // 拖拽事件
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'text/csv') {
                this.handleCSVFile(file);
            } else {
                this.showMessage('请选择CSV文件', 'error');
            }
        });

        // 点击选择文件
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleCSVFile(e.target.files[0]);
        });
    }

    /**
     * 显示添加学生模态框
     */
    showAddStudentModal() {
        if (!this.rosterManager) {
            this.showMessage('组件未初始化', 'error');
            return;
        }

        const content = this.rosterManager.getStudentFormHTML();
        this.showModal('添加学生', content);

        // 绑定表单提交事件
        setTimeout(() => {
            const form = document.getElementById('studentForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleAddStudent(e);
                });
            }
        }, 100);
    }

    /**
     * 处理添加学生
     */
    handleAddStudent(e) {
        const formData = new FormData(e.target);
        const studentData = {
            name: formData.get('studentName') || document.getElementById('studentName').value,
            studentId: formData.get('studentStudentId') || document.getElementById('studentStudentId').value,
            email: formData.get('studentEmail') || document.getElementById('studentEmail').value,
            location: {
                city: formData.get('studentCity') || document.getElementById('studentCity').value,
                country: formData.get('studentCountry') || document.getElementById('studentCountry').value
            }
        };

        try {
            this.rosterManager.addStudent(studentData);
            this.showMessage('学生添加成功', 'success');
            this.closeModal();
            this.refreshRosterTab();
            this.updateHeaderStats();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * 编辑学生
     */
    editStudent(studentId) {
        const student = this.attendanceService.students.find(s => s.id === studentId);
        if (!student) {
            this.showMessage('学生不存在', 'error');
            return;
        }

        const content = this.rosterManager.getStudentFormHTML(student);
        this.showModal('编辑学生', content);

        // 绑定表单提交事件
        setTimeout(() => {
            const form = document.getElementById('studentForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleEditStudent(studentId, e);
                });
            }
        }, 100);
    }

    /**
     * 处理编辑学生
     */
    handleEditStudent(studentId, e) {
        const formData = new FormData(e.target);
        const updateData = {
            name: formData.get('studentName') || document.getElementById('studentName').value,
            studentId: formData.get('studentStudentId') || document.getElementById('studentStudentId').value,
            email: formData.get('studentEmail') || document.getElementById('studentEmail').value,
            location: {
                city: formData.get('studentCity') || document.getElementById('studentCity').value,
                country: formData.get('studentCountry') || document.getElementById('studentCountry').value
            }
        };

        try {
            this.rosterManager.updateStudent(studentId, updateData);
            this.showMessage('学生更新成功', 'success');
            this.closeModal();
            this.refreshRosterTab();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * 删除学生
     */
    deleteStudent(studentId) {
        if (!this.rosterManager) {
            this.showMessage('组件未初始化', 'error');
            return;
        }

        try {
            const success = this.rosterManager.deleteStudent(studentId);
            if (success) {
                this.showMessage('学生删除成功', 'success');
                this.refreshRosterTab();
                this.updateHeaderStats();
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * 显示批量删除确认
     */
    showBatchDeleteConfirm() {
        if (!this.rosterManager) {
            this.showMessage('组件未初始化', 'error');
            return;
        }

        const selectedIds = this.rosterManager.getSelectedStudentIds();
        if (selectedIds.length === 0) {
            this.showMessage('请先选择要删除的学生', 'warning');
            return;
        }

        const content = this.rosterManager.getBatchDeleteConfirmHTML(selectedIds);
        this.showModal('批量删除确认', content);
    }

    /**
     * 确认批量删除
     */
    confirmBatchDelete() {
        if (!this.rosterManager) {
            this.showMessage('组件未初始化', 'error');
            return;
        }

        const checkboxes = document.querySelectorAll('.batch-delete-confirm input[type="checkbox"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);

        if (selectedIds.length === 0) {
            this.showMessage('请选择要删除的学生', 'warning');
            return;
        }

        try {
            const results = this.rosterManager.deleteStudents(selectedIds);

            if (results.success > 0) {
                this.showMessage(`成功删除 ${results.success} 名学生`, 'success');
            }

            if (results.failed > 0) {
                this.showMessage(`${results.failed} 名学生删除失败: ${results.errors.join(', ')}`, 'error');
            }

            this.closeModal();
            this.refreshRosterTab();
            this.updateHeaderStats();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * 搜索学生
     */
    searchStudents(term) {
        if (this.rosterManager) {
            this.rosterManager.search(term);
        }
    }

    /**
     * 执行随机选择
     */
    performRandomSelection() {
        if (this.randomSelector) {
            this.randomSelector.performSelection();
        } else {
            this.showMessage('组件未初始化', 'error');
        }
    }

    /**
     * 更新选择预览
     */
    updateSelectionPreview() {
        // 可以在这里实现选择预览功能
    }

    /**
     * 筛选记录
     */
    filterRecords() {
        if (this.recordsViewer) {
            this.recordsViewer.applyFilter();
        }
    }

    /**
     * 导出数据
     */
    exportData() {
        if (this.exportManager) {
            this.exportManager.export();
        } else {
            this.showMessage('组件未初始化', 'error');
        }
    }

    /**
     * 显示清除数据确认对话框
     */
    showClearDataConfirm() {
        const content = `
            <div class="clear-data-confirm">
                <h3>⚠️ 确认清除所有数据</h3>
                <p>此操作将删除：</p>
                <ul>
                    <li>所有学生信息</li>
                    <li>所有考勤记录</li>
                    <li>所有会话记录</li>
                    <li>所有设置和统计数据</li>
                </ul>
                <p style="color: red; font-weight: bold;">此操作不可恢复！</p>
                <div class="clear-data-actions">
                    <button class="btn btn-secondary" onclick="app.closeModal()">取消</button>
                    <button class="btn btn-danger" onclick="app.clearAllData()">确认清除</button>
                </div>
            </div>
        `;

        this.showModal('清除所有数据', content);
    }

    /**
     * 清除所有数据
     */
    clearAllData() {
        try {
            // 清除所有数据
            this.attendanceService.students = [];
            this.attendanceService.attendances = [];
            this.attendanceService.sessions = [];

            // 重置选择历史记录
            if (this.selectionService) {
                this.selectionService.selectionHistory = [];
                this.selectionService.saveHistory();
            }

            // 直接清除localStorage中的所有相关数据
            storage.storage.removeItem(DataKeys.STUDENTS);
            storage.storage.removeItem(DataKeys.ATTENDANCE);
            storage.storage.removeItem(DataKeys.SESSIONS);
            storage.storage.removeItem(DataKeys.SETTINGS);
            storage.storage.removeItem(DataKeys.CURRENT_SESSION);

            // 清除选择历史记录
            storage.storage.removeItem('selection_history');

            // 保存空数据
            this.attendanceService.saveData();

            // 刷新界面
            this.closeModal();
            this.refreshRosterTab();
            this.updateHeaderStats();
            this.updateExportButtonState();
            this.updateRandomButtonState();

            // 刷新随机点名页面的历史记录
            if (this.randomSelector) {
                this.randomSelector.updateHistory();
            }

            // 切换到学生名单标签页
            const rosterTabBtn = document.querySelector('.tab-btn[data-tab="roster"]');
            if (rosterTabBtn) {
                rosterTabBtn.click();
            }

            this.showMessage('所有数据已清除', 'success');
        } catch (error) {
            this.showMessage('清除数据失败: ' + error.message, 'error');
        }
    }

    /**
     * 处理CSV文件
     */
    async handleCSVFile(file) {
        if (!file || !file.name.endsWith('.csv')) {
            this.showMessage('请选择CSV文件', 'error');
            return;
        }

        try {
            // 解析CSV文件
            const result = await this.importService.parseCSVFile(file);

            // 显示预览对话框
            this.showImportPreview(result);

        } catch (error) {
            this.showMessage('CSV解析失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示导入预览
     */
    showImportPreview(importData) {
        if (!importData || !importData.data) {
            this.showMessage('导入数据格式错误，请检查CSV文件', 'error');
            return;
        }

        const validation = this.importService.validateImportData(importData, importData.fieldMapping);
        const preview = this.importService.previewImportData(importData, importData.fieldMapping);

        const content = `
            <div class="import-preview">
                <h4>导入预览</h4>
                <p>总行数: ${importData.totalRows}</p>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                    注：已存在的学生将被跳过，不会重复添加
                </p>

                ${validation.errors.length > 0 ? `
                    <div class="validation-errors">
                        <h5>错误:</h5>
                        <ul>
                            ${validation.errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${validation.warnings.length > 0 ? `
                    <div class="validation-warnings">
                        <h5>警告:</h5>
                        <ul>
                            ${validation.warnings.map(warn => `<li>${warn}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="preview-table">
                    <table>
                        <thead>
                            <tr>
                                <th>行号</th>
                                <th>姓名</th>
                                <th>学号</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${preview.slice(0, 10).map(row => `
                                <tr>
                                    <td>${row.rowIndex}</td>
                                    <td>${row.name}</td>
                                    <td>${row.studentId}</td>
                                    <td>
                                        ${row.valid ?
                                            '<span class="status-valid">✓ 有效</span>' :
                                            `<span class="status-invalid">✗ ${row.errors.join(', ')}</span>`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="import-actions">
                    <button class="btn btn-secondary" onclick="app.closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="app.confirmImport()">确认导入</button>
                </div>
            </div>
        `;

        // 保存导入数据供确认使用
        this.pendingImportData = importData;

        this.showModal('导入预览', content);
    }

    /**
     * 确认导入
     */
    async confirmImport() {
        if (!this.pendingImportData) {
            this.showMessage('没有待导入的数据', 'error');
            return;
        }

        try {
            console.log('App: Starting import with data:', {
                dataLength: this.pendingImportData?.data?.length || 0,
                fieldMapping: this.pendingImportData?.fieldMapping,
                firstRow: this.pendingImportData?.data?.[0]
            });

            const result = await this.importService.importStudents(
                this.pendingImportData,
                this.pendingImportData.fieldMapping,
                {
                    skipErrors: true,
                    updateExisting: false
                }
            );

            console.log('App: Import result:', result);
            console.log('App: Students after import:', this.attendanceService.students.map(s => s.name));

            this.showMessage(
                `导入完成！成功: ${result.success}, 跳过: ${result.skipped}, 错误: ${result.errors}`,
                result.errors > 0 ? 'warning' : 'success'
            );

            this.closeModal();

            console.log('Import complete - Student count before refresh:', this.attendanceService.students.length);
            console.log('Import complete - All students:', this.attendanceService.students.map(s => ({id: s.id, name: s.name, active: s.active})));

            // Refresh roster tab to show imported students
            console.log('Calling refreshRosterTab...');
            this.refreshRosterTab();
            console.log('refreshRosterTab completed');

            console.log('Import complete - Student count after refresh:', this.attendanceService.students.length);

            // Refresh all tabs to ensure data is updated everywhere
            console.log('Refreshing all tabs...');
            this.refreshTabContent('attendance');
            this.refreshTabContent('roster');
            this.refreshTabContent('random');
            this.refreshTabContent('records');
            this.refreshTabContent('export');

            this.updateHeaderStats();
            this.updateExportButtonState();

            // Clear pending import data
            this.pendingImportData = null;

        } catch (error) {
            this.showMessage('导入失败: ' + error.message, 'error');
        }
    }

    /**
     * 应用启动
     */
    static start() {
        window.addEventListener('DOMContentLoaded', () => {
            window.app = new AttendanceApp();
        });
    }
}

// 启动应用
AttendanceApp.start();