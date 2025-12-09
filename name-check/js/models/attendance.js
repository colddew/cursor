// 考勤记录数据模型
class Attendance {
    constructor(data = {}) {
        this.id = data.id || this._generateId();
        this.studentId = data.studentId || '';
        this.date = data.date || DateUtils.today();
        this.status = data.status || AppConfig.attendanceStatus.PRESENT;
        this.checkInTime = data.checkInTime || DateUtils.currentTime();
        this.tardyMinutes = data.tardyMinutes || 0;
        this.recordedBy = data.recordedBy || 'system';
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || DateUtils.now();
        this.updatedAt = data.updatedAt || DateUtils.now();
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    _generateId() {
        return 'attendance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 验证考勤记录
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];

        if (!this.studentId) {
            errors.push('学生ID不能为空');
        }

        if (!this.date || !DateUtils.isValidFormat(this.date)) {
            errors.push('日期格式不正确');
        }

        if (!Object.values(AppConfig.attendanceStatus).includes(this.status)) {
            errors.push('考勤状态无效');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 更新考勤状态
     * @param {string} status - 新状态
     * @param {number} tardyMinutes - 迟到分钟数
     * @param {string} notes - 备注
     */
    updateStatus(status, tardyMinutes = 0, notes = '') {
        this.status = status;
        this.tardyMinutes = tardyMinutes;
        this.notes = notes;
        this.updatedAt = DateUtils.now();
    }

    /**
     * 设置迟到
     * @param {string} checkInTime - 签到时间
     * @param {string} startTime - 开始时间
     */
    setTardy(checkInTime, startTime) {
        this.status = AppConfig.attendanceStatus.TARDY;
        this.checkInTime = checkInTime;
        this.tardyMinutes = DateUtils.calculateTardyMinutes(checkInTime, startTime);
        this.updatedAt = DateUtils.now();
    }

    /**
     * 获取状态显示文本
     * @returns {string} 状态文本
     */
    getStatusText() {
        return AppConfig.statusText[this.status] || '未知';
    }

    /**
     * 获取状态CSS类
     * @returns {string} CSS类名
     */
    getStatusClass() {
        return AppConfig.statusClasses[this.status] || '';
    }

    /**
     * 是否到场（包括迟到）
     * @returns {boolean} 是否到场
     */
    isPresent() {
        return this.status === AppConfig.attendanceStatus.PRESENT ||
               this.status === AppConfig.attendanceStatus.TARDY;
    }

    /**
     * 是否迟到
     * @returns {boolean} 是否迟到
     */
    isTardy() {
        return this.status === AppConfig.attendanceStatus.TARDY && this.tardyMinutes > 0;
    }

    /**
     * 是否缺勤
     * @returns {boolean} 是否缺勤
     */
    isAbsent() {
        return this.status === AppConfig.attendanceStatus.ABSENT;
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            studentId: this.studentId,
            date: this.date,
            status: this.status,
            checkInTime: this.checkInTime,
            tardyMinutes: this.tardyMinutes,
            recordedBy: this.recordedBy,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 从JSON创建考勤记录实例
     * @param {Object} json - JSON对象
     * @returns {Attendance} 考勤记录实例
     */
    static fromJSON(json) {
        return new Attendance(json);
    }

    /**
     * 创建考勤记录
     * @param {string} studentId - 学生ID
     * @param {string} status - 状态
     * @param {Object} options - 其他选项
     * @returns {Attendance} 考勤记录实例
     */
    static create(studentId, status, options = {}) {
        return new Attendance({
            studentId: studentId,
            status: status,
            ...options
        });
    }

    /**
     * 批量创建考勤记录
     * @param {Array} studentIds - 学生ID数组
     * @param {string} status - 状态
     * @param {Object} options - 其他选项
     * @returns {Array} 考勤记录数组
     */
    static createBatch(studentIds, status, options = {}) {
        return studentIds.map(studentId => {
            return new Attendance({
                studentId: studentId,
                status: status,
                ...options
            });
        });
    }

    /**
     * 按日期分组考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @returns {Object} 按日期分组的记录
     */
    static groupByDate(attendances) {
        const grouped = {};

        attendances.forEach(attendance => {
            const date = attendance.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(attendance);
        });

        return grouped;
    }

    /**
     * 按学生分组考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @returns {Object} 按学生分组的记录
     */
    static groupByStudent(attendances) {
        const grouped = {};

        attendances.forEach(attendance => {
            const studentId = attendance.studentId;
            if (!grouped[studentId]) {
                grouped[studentId] = [];
            }
            grouped[studentId].push(attendance);
        });

        return grouped;
    }

    /**
     * 按状态筛选考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @param {string|Array} status - 状态或状态数组
     * @returns {Array} 筛选后的记录
     */
    static filterByStatus(attendances, status) {
        const statuses = Array.isArray(status) ? status : [status];
        return attendances.filter(attendance =>
            statuses.includes(attendance.status)
        );
    }

    /**
     * 按日期范围筛选考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Array} 筛选后的记录
     */
    static filterByDateRange(attendances, startDate, endDate) {
        return attendances.filter(attendance => {
            if (startDate && attendance.date < startDate) return false;
            if (endDate && attendance.date > endDate) return false;
            return true;
        });
    }

    /**
     * 按学生筛选考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @param {string|Array} studentIds - 学生ID或学生ID数组
     * @returns {Array} 筛选后的记录
     */
    static filterByStudent(attendances, studentIds) {
        const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
        return attendances.filter(attendance =>
            ids.includes(attendance.studentId)
        );
    }

    /**
     * 获取某日期的考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @param {string} date - 日期
     * @returns {Array} 当天的考勤记录
     */
    static getByDate(attendances, date) {
        return attendances.filter(attendance => attendance.date === date);
    }

    /**
     * 获取学生的考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @param {string} studentId - 学生ID
     * @returns {Array} 学生的考勤记录
     */
    static getByStudent(attendances, studentId) {
        return attendances.filter(attendance => attendance.studentId === studentId);
    }

    /**
     * 检查学生某天是否有考勤记录
     * @param {Array} attendances - 考勤记录数组
     * @param {string} studentId - 学生ID
     * @param {string} date - 日期
     * @returns {boolean} 是否有记录
     */
    static hasRecord(attendances, studentId, date) {
        return attendances.some(attendance =>
            attendance.studentId === studentId && attendance.date === date
        );
    }

    /**
     * 查找缺失的考勤记录
     * @param {Array} students - 学生列表
     * @param {Array} attendances - 考勤记录数组
     * @param {string} date - 日期
     * @returns {Array} 缺失的学生ID
     */
    static findMissingRecords(students, attendances, date) {
        const dayAttendances = this.getByDate(attendances, date);
        const recordedStudentIds = dayAttendances.map(a => a.studentId);

        return students
            .filter(student => student.active)
            .filter(student => !recordedStudentIds.includes(student.id))
            .map(student => student.id);
    }

    /**
     * 统计各状态数量
     * @param {Array} attendances - 考勤记录数组
     * @returns {Object} 统计结果
     */
    static getStatistics(attendances) {
        const stats = {
            total: attendances.length,
            present: 0,
            tardy: 0,
            absent: 0,
            excused: 0,
            tardyMinutes: 0
        };

        attendances.forEach(attendance => {
            switch (attendance.status) {
                case AppConfig.attendanceStatus.PRESENT:
                    stats.present++;
                    break;
                case AppConfig.attendanceStatus.TARDY:
                    stats.tardy++;
                    stats.tardyMinutes += attendance.tardyMinutes || 0;
                    break;
                case AppConfig.attendanceStatus.ABSENT:
                    stats.absent++;
                    break;
                case AppConfig.attendanceStatus.EXCUSED:
                    stats.excused++;
                    break;
            }
        });

        return stats;
    }
}