// 课程会话数据模型
class Session {
    constructor(data = {}) {
        this.id = data.id || this._generateId();
        this.date = data.date || DateUtils.today();
        this.startTime = data.startTime || '08:00';
        this.endTime = data.endTime || '09:00';
        this.topic = data.topic || '';
        this.selectedStudents = data.selectedStudents || [];
        this.sessionStatus = data.sessionStatus || 'not_started'; // not_started, in_progress, paused, completed
        this.attendanceStats = data.attendanceStats || {
            total: 0,
            present: 0,
            tardy: 0,
            absent: 0,
            excused: 0
        };
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || DateUtils.now();
        this.updatedAt = data.updatedAt || DateUtils.now();
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    _generateId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 验证会话数据
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];

        if (!this.date || !DateUtils.isValidFormat(this.date)) {
            errors.push('日期格式不正确');
        }

        if (!this.startTime || !this._isValidTime(this.startTime)) {
            errors.push('开始时间格式不正确');
        }

        if (!this.endTime || !this._isValidTime(this.endTime)) {
            errors.push('结束时间格式不正确');
        }

        if (this.startTime && this.endTime && this.startTime >= this.endTime) {
            errors.push('开始时间必须早于结束时间');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 验证时间格式
     * @param {string} time - 时间字符串
     * @returns {boolean} 是否有效
     */
    _isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    /**
     * 添加选中的学生
     * @param {Array} studentIds - 学生ID数组
     */
    addSelectedStudents(studentIds) {
        const newIds = studentIds.filter(id => !this.selectedStudents.includes(id));
        this.selectedStudents.push(...newIds);
        this.updatedAt = DateUtils.now();
    }

    /**
     * 移除选中的学生
     * @param {string} studentId - 学生ID
     */
    removeSelectedStudent(studentId) {
        const index = this.selectedStudents.indexOf(studentId);
        if (index > -1) {
            this.selectedStudents.splice(index, 1);
            this.updatedAt = DateUtils.now();
        }
    }

    /**
     * 更新考勤统计
     * @param {Object} stats - 统计数据
     */
    updateAttendanceStats(stats) {
        this.attendanceStats = {
            total: stats.total || 0,
            present: stats.present || 0,
            tardy: stats.tardy || 0,
            absent: stats.absent || 0,
            excused: stats.excused || 0
        };
        this.updatedAt = DateUtils.now();
    }

    /**
     * 开始考勤会话
     */
    startSession() {
        this.sessionStatus = 'in_progress';
        this.updatedAt = DateUtils.now();
    }

    /**
     * 完成考勤会话
     */
    completeSession() {
        this.sessionStatus = 'completed';
        this.updatedAt = DateUtils.now();
    }

    /**
     * 检查考勤是否已开始
     * @returns {boolean}
     */
    isStarted() {
        return this.sessionStatus === 'in_progress' || this.sessionStatus === 'completed';
    }

    /**
     * 暂停考勤会话
     */
    pauseSession() {
        this.sessionStatus = 'paused';
        this.updatedAt = DateUtils.now();
    }

    /**
     * 重置考勤会话
     */
    resetSession() {
        this.sessionStatus = 'not_started';
        this.attendanceStats = {
            total: 0,
            present: 0,
            tardy: 0,
            absent: 0,
            excused: 0
        };
        this.updatedAt = DateUtils.now();
    }

    /**
     * 检查考勤是否已开始
     * @returns {boolean}
     */
    isStarted() {
        return this.sessionStatus === 'in_progress' || this.sessionStatus === 'completed';
    }

    /**
     * 检查考勤是否正在进行
     * @returns {boolean}
     */
    isInProgress() {
        return this.sessionStatus === 'in_progress';
    }

    /**
     * 检查考勤是否已完成
     * @returns {boolean}
     */
    isCompleted() {
        return this.sessionStatus === 'completed';
    }

    /**
     * 检查考勤是否已暂停
     * @returns {boolean}
     */
    isPaused() {
        return this.sessionStatus === 'paused';
    }

    /**
     * 检查考勤是否可以进行记录
     * @returns {boolean}
     */
    canRecordAttendance() {
        return this.sessionStatus === 'in_progress';
    }

    /**
     * 计算考勤率
     * @returns {number} 考勤率 (0-100)
     */
    getAttendanceRate() {
        if (this.attendanceStats.total === 0) return 0;
        return Math.round(
            ((this.attendanceStats.present + this.attendanceStats.tardy) /
             this.attendanceStats.total) * 100
        );
    }

    /**
     * 获取会话持续时间（分钟）
     * @returns {number} 持续时间
     */
    getDuration() {
        const start = this._timeToMinutes(this.startTime);
        const end = this._timeToMinutes(this.endTime);
        return end - start;
    }

    /**
     * 将时间转换为分钟数
     * @param {string} time - 时间字符串 (HH:mm)
     * @returns {number} 分钟数
     */
    _timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * 获取显示的时间段
     * @returns {string} 时间段
     */
    getTimeRange() {
        return `${this.startTime} - ${this.endTime}`;
    }

    /**
     * 是否是当前会话
     * @returns {boolean} 是否是当前会话
     */
    isCurrent() {
        const now = new Date();
        const today = DateUtils.today();

        if (this.date !== today) return false;

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = this._timeToMinutes(this.startTime);
        const endMinutes = this._timeToMinutes(this.endTime);

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    /**
     * 是否是过去的会话
     * @returns {boolean} 是否是过去
     */
    isPast() {
        const today = DateUtils.today();
        if (this.date < today) return true;

        if (this.date === today) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const endMinutes = this._timeToMinutes(this.endTime);
            return currentMinutes > endMinutes;
        }

        return false;
    }

    /**
     * 是否是未来的会话
     * @returns {boolean} 是否是未来
     */
    isFuture() {
        const today = DateUtils.today();
        if (this.date > today) return true;

        if (this.date === today) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = this._timeToMinutes(this.startTime);
            return currentMinutes < startMinutes;
        }

        return false;
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            date: this.date,
            startTime: this.startTime,
            endTime: this.endTime,
            topic: this.topic,
            selectedStudents: this.selectedStudents,
            sessionStatus: this.sessionStatus,
            attendanceStats: this.attendanceStats,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 从JSON创建会话实例
     * @param {Object} json - JSON对象
     * @returns {Session} 会话实例
     */
    static fromJSON(json) {
        return new Session(json);
    }

    /**
     * 创建新会话
     * @param {Object} options - 选项
     * @returns {Session} 会话实例
     */
    static create(options = {}) {
        return new Session({
            date: DateUtils.today(),
            startTime: '08:00',
            endTime: '09:00',
            ...options
        });
    }

    /**
     * 获取当天的会话
     * @param {Array} sessions - 会话数组
     * @param {string} date - 日期
     * @returns {Session|null} 会话实例
     */
    static getByDate(sessions, date) {
        return sessions.find(session => session.date === date) || null;
    }

    /**
     * 按日期排序会话
     * @param {Array} sessions - 会话数组
     * @param {boolean} ascending - 是否升序
     * @returns {Array} 排序后的会话数组
     */
    static sortByDate(sessions, ascending = false) {
        return [...sessions].sort((a, b) => {
            const compare = a.date.localeCompare(b.date);
            return ascending ? compare : -compare;
        });
    }

    /**
     * 获取日期范围内的会话
     * @param {Array} sessions - 会话数组
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Array} 会话数组
     */
    static getByDateRange(sessions, startDate, endDate) {
        return sessions.filter(session => {
            if (startDate && session.date < startDate) return false;
            if (endDate && session.date > endDate) return false;
            return true;
        });
    }

    /**
     * 获取最近的会话
     * @param {Array} sessions - 会话数组
     * @param {number} limit - 数量限制
     * @returns {Array} 会话数组
     */
    static getRecent(sessions, limit = 10) {
        return this.sortByDate(sessions).slice(0, limit);
    }

    /**
     * 检查日期是否有会话
     * @param {Array} sessions - 会话数组
     * @param {string} date - 日期
     * @returns {boolean} 是否有会话
     */
    static hasSession(sessions, date) {
        return sessions.some(session => session.date === date);
    }

    /**
     * 获取会话统计
     * @param {Array} sessions - 会话数组
     * @returns {Object} 统计结果
     */
    static getStatistics(sessions) {
        const stats = {
            total: sessions.length,
            thisMonth: 0,
            thisWeek: 0,
            avgAttendanceRate: 0,
            avgSelectedStudents: 0
        };

        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        let totalAttendanceRate = 0;
        let totalSelectedStudents = 0;

        sessions.forEach(session => {
            const sessionDate = new Date(session.date);

            // 本月统计
            if (sessionDate.getMonth() === thisMonth &&
                sessionDate.getFullYear() === thisYear) {
                stats.thisMonth++;
            }

            // 本周统计
            if (sessionDate >= weekStart) {
                stats.thisWeek++;
            }

            totalAttendanceRate += session.getAttendanceRate();
            totalSelectedStudents += session.selectedStudents.length;
        });

        if (stats.total > 0) {
            stats.avgAttendanceRate = Math.round(totalAttendanceRate / stats.total);
            stats.avgSelectedStudents = Math.round(totalSelectedStudents / stats.total);
        }

        return stats;
    }
}