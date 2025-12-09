// 考勤跟踪组件
class AttendanceTracker {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
        this.currentSession = null;
        this.isTracking = false;
    }

    /**
     * 开始考勤跟踪
     */
    startTracking() {
        // 获取今日会话
        this.currentSession = this.attendanceService.getCurrentSession();
        if (!this.currentSession) {
            this.currentSession = this.attendanceService.startAttendance({
                startTime: DateUtils.currentTime(),
                topic: '常规课程'
            });
        }

        // 开始考勤会话
        this.currentSession.startSession();
        this.isTracking = true;
        this.attendanceService.saveData();
        this.render();
    }

    /**
     * 暂停考勤跟踪
     */
    pauseTracking() {
        if (this.currentSession && this.currentSession.isInProgress()) {
            this.currentSession.pauseSession();
            this.attendanceService.saveData();
        }
        this.isTracking = false;
        this.render();
    }

    /**
     * 停止考勤跟踪（已废弃，请使用 pauseTracking）
     * @deprecated
     */
    stopTracking() {
        this.pauseTracking();
    }

    /**
     * 重置考勤跟踪
     */
    resetTracking() {
        if (!confirm('确定要重置今日考勤吗？所有记录将被清除。')) {
            return false;
        }

        const today = DateUtils.today();
        this.attendanceService.attendances = this.attendanceService.attendances.filter(a => a.date !== today);

        // 重置今日会话
        this.currentSession = this.attendanceService.getCurrentSession();
        if (this.currentSession) {
            this.currentSession.resetSession();
        }

        this.attendanceService.saveData();
        this.isTracking = false;
        this.render();

        return true;
    }

    /**
     * 记录考勤
     * @param {string} studentId - 学生ID
     * @param {string} status - 状态
     * @param {Object} options - 选项
     */
    recordAttendance(studentId, status, options = {}) {
        const attendance = this.attendanceService.recordAttendance(studentId, status, options);
        this.render();
        return attendance;
    }

    /**
     * 批量记录考勤
     * @param {Array} records - 考勤记录
     */
    batchRecord(records) {
        this.attendanceService.batchRecordAttendance(records);
        this.render();
    }

    /**
     * 渲染考勤网格
     */
    render() {
        const grid = document.getElementById('attendanceGrid');
        if (!grid) return;

        const students = this.attendanceService.getStudentsWithTodayStatus();
        const currentSession = this.attendanceService.getCurrentSession();

        grid.innerHTML = students.map(student => {
            const status = student.todayStatus || 'pending';
            const statusText = status === 'pending' ? '未签到' : AppConfig.statusText[status];
            const statusClass = AppConfig.statusClasses[status] || AppConfig.statusClasses.pending;

            // 根据会话状态显示不同的UI
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
                // 进行中，显示状态按钮
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

        // 更新按钮容器
        const buttonContainer = document.getElementById('attendanceButtons');
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
        }

        // 绑定按钮事件
        this.bindButtonEvents();
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        // 移除所有已绑定的事件
        document.removeEventListener('click', this.handleAttendanceButtonClick);

        // 绑定新的事件
        this.handleAttendanceButtonClick = (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.id === 'startAttendance') {
                this.startTracking();
            } else if (btn.id === 'pauseAttendance') {
                this.pauseTracking();
            } else if (btn.id === 'resumeAttendance') {
                this.resumeTracking();
            } else if (btn.id === 'restartAttendance') {
                if (confirm('确定要重新开始今天的考勤吗？所有记录将被清除。')) {
                    this.resetTracking();
                    this.startTracking();
                }
            }
        };

        document.addEventListener('click', this.handleAttendanceButtonClick);
    }

    /**
     * 继续考勤跟踪
     */
    resumeTracking() {
        if (this.currentSession) {
            this.currentSession.startSession();
            this.isTracking = true;
            this.attendanceService.saveData();
            this.render();
        }
    }

    /**
     * 获取考勤统计
     */
    getStatistics() {
        const attendances = this.attendanceService.getTodayAttendance();
        return Attendance.getStatistics(attendances);
    }

    /**
     * 重置今日考勤
     * @deprecated 请使用 resetTracking()
     */
    reset() {
        return this.resetTracking();
    }
}