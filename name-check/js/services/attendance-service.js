// 考勤服务
class AttendanceService {
    constructor() {
        this.attendances = [];
        this.sessions = [];
        this.students = [];
        this.loadData();
    }

    /**
     * 加载数据
     */
    loadData() {
        const studentsData = storage.get(DataKeys.STUDENTS, []);
        const attendanceData = storage.get(DataKeys.ATTENDANCE, []);
        const sessionData = storage.get(DataKeys.SESSIONS, []);

        this.students = studentsData.map(data => Student.fromJSON(data));
        this.attendances = attendanceData.map(data => Attendance.fromJSON(data));
        this.sessions = sessionData.map(data => Session.fromJSON(data));
    }

    /**
     * 保存数据
     */
    saveData() {
        console.log('AttendanceService: Saving data, student count:', this.students.length);
        storage.set(DataKeys.STUDENTS, this.students.map(s => s.toJSON()));
        storage.set(DataKeys.ATTENDANCE, this.attendances.map(a => a.toJSON()));
        storage.set(DataKeys.SESSIONS, this.sessions.map(s => s.toJSON()));
        console.log('AttendanceService: Data saved successfully');
    }

    /**
     * 获取当前会话
     * @returns {Session|null} 当前会话
     */
    getCurrentSession() {
        const today = DateUtils.today();
        let session = Session.getByDate(this.sessions, today);

        if (!session) {
            session = Session.create({
                date: today,
                startTime: '08:00',
                endTime: '09:00',
                topic: '常规课程'
            });
            this.sessions.push(session);
            this.saveData();
        }

        return session;
    }

    /**
     * 开始点名
     * @param {Object} options - 选项
     * @returns {Session} 会话
     */
    startAttendance(options = {}) {
        const session = this.getCurrentSession();

        // 更新会话信息
        if (options.startTime) session.startTime = options.startTime;
        if (options.endTime) session.endTime = options.endTime;
        if (options.topic) session.topic = options.topic;

        session.updatedAt = DateUtils.now();
        this.saveData();

        return session;
    }

    /**
     * 记录考勤
     * @param {string} studentId - 学生ID
     * @param {string} status - 状态
     * @param {Object} options - 其他选项
     * @returns {Attendance|null} 考勤记录，如果会话未开始则返回null
     */
    recordAttendance(studentId, status, options = {}) {
        const today = DateUtils.today();
        const session = this.getCurrentSession();

        // 检查考勤会话是否允许记录
        if (!session || !session.canRecordAttendance()) {
            console.warn('考勤会话尚未开始或已暂停/完成，无法记录考勤');
            return null;
        }

        // 检查是否已有记录
        let attendance = this.attendances.find(a =>
            a.studentId === studentId && a.date === today
        );

        if (attendance) {
            // 更新现有记录
            attendance.updateStatus(status, options.tardyMinutes || 0, options.notes || '');
        } else {
            // 创建新记录
            attendance = Attendance.create(studentId, status, {
                checkInTime: options.checkInTime || DateUtils.currentTime(),
                tardyMinutes: options.tardyMinutes || 0,
                notes: options.notes || '',
                recordedBy: options.recordedBy || 'teacher'
            });
            this.attendances.push(attendance);
        }

        // 更新会话统计
        this.updateSessionStats(session);
        this.saveData();

        return attendance;
    }

    /**
     * 批量记录考勤
     * @param {Array} records - 考勤记录数组 [{studentId, status, options}]
     * @returns {boolean} 是否成功
     */
    batchRecordAttendance(records) {
        const today = DateUtils.today();
        const session = this.getCurrentSession();

        // 检查考勤会话是否已开始
        if (!session || !session.isStarted()) {
            console.warn('考勤会话尚未开始，无法记录考勤');
            return false;
        }

        records.forEach(({ studentId, status, options = {} }) => {
            // 检查是否已有记录
            let attendance = this.attendances.find(a =>
                a.studentId === studentId && a.date === today
            );

            if (attendance) {
                attendance.updateStatus(status, options.tardyMinutes || 0, options.notes || '');
            } else {
                attendance = Attendance.create(studentId, status, {
                    checkInTime: options.checkInTime || DateUtils.currentTime(),
                    tardyMinutes: options.tardyMinutes || 0,
                    notes: options.notes || '',
                    recordedBy: options.recordedBy || 'teacher'
                });
                this.attendances.push(attendance);
            }
        });

        // 更新会话统计
        this.updateSessionStats(session);
        this.saveData();

        return true;
    }

    /**
     * 自动记录迟到
     * @param {string} studentId - 学生ID
     * @param {string} checkInTime - 签到时间
     * @returns {Attendance|null} 考勤记录
     */
    autoRecordTardy(studentId, checkInTime) {
        const session = this.getCurrentSession();

        // 检查考勤会话是否已开始
        if (!session || !session.isStarted()) {
            console.warn('考勤会话尚未开始，无法记录考勤');
            return null;
        }

        const tardyMinutes = DateUtils.calculateTardyMinutes(checkInTime, session.startTime);

        if (tardyMinutes > 0) {
            return this.recordAttendance(studentId, AppConfig.attendanceStatus.TARDY, {
                checkInTime: checkInTime,
                tardyMinutes: tardyMinutes
            });
        } else {
            return this.recordAttendance(studentId, AppConfig.attendanceStatus.PRESENT, {
                checkInTime: checkInTime
            });
        }
    }

    /**
     * 更新会话统计
     * @param {Session} session - 会话
     */
    updateSessionStats(session) {
        const dayAttendances = Attendance.getByDate(this.attendances, session.date);
        const stats = Attendance.getStatistics(dayAttendances);
        session.updateAttendanceStats(stats);
    }

    /**
     * 获取今日考勤记录
     * @returns {Array} 考勤记录数组
     */
    getTodayAttendance() {
        const today = DateUtils.today();
        return Attendance.getByDate(this.attendances, today);
    }

    /**
     * 获取学生的考勤记录
     * @param {string} studentId - 学生ID
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Array} 考勤记录数组
     */
    getStudentAttendance(studentId, startDate = null, endDate = null) {
        let records = Attendance.getByStudent(this.attendances, studentId);

        if (startDate || endDate) {
            records = Attendance.filterByDateRange(records, startDate, endDate);
        }

        return records.sort((a, b) => b.date.localeCompare(a.date));
    }

    /**
     * 获取日期范围内的考勤记录
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Array} 考勤记录数组
     */
    getAttendanceByDateRange(startDate, endDate) {
        return Attendance.filterByDateRange(this.attendances, startDate, endDate);
    }

    /**
     * 获取今日出勤率
     * @returns {number} 出勤率
     */
    getTodayAttendanceRate() {
        const todayAttendances = this.getTodayAttendance();
        const stats = Attendance.getStatistics(todayAttendances);

        if (stats.total === 0) return 0;
        return Math.round(((stats.present + stats.tardy) / stats.total) * 100);
    }

    /**
     * 获取学生列表及其今日考勤状态
     * @returns {Array} 学生数组
     */
    getStudentsWithTodayStatus() {
        const today = DateUtils.today();
        const todayAttendances = this.getTodayAttendance();
        const attendanceMap = {};

        // 创建考勤状态映射
        todayAttendances.forEach(attendance => {
            attendanceMap[attendance.studentId] = attendance;
        });

        // 为每个学生添加今日状态
        return this.students
            .filter(student => student.active)
            .map(student => {
                const attendance = attendanceMap[student.id];
                return {
                    ...student.toJSON(),
                    todayStatus: attendance ? attendance.status : null,
                    todayAttendance: attendance
                };
            });
    }

    /**
     * 查找缺失的考勤记录
     * @param {string} date - 日期
     * @returns {Array} 学生数组
     */
    findMissingAttendance(date = DateUtils.today()) {
        const dayAttendances = Attendance.getByDate(this.attendances, date);
        const recordedStudentIds = dayAttendances.map(a => a.studentId);

        return this.students
            .filter(student => student.active)
            .filter(student => !recordedStudentIds.includes(student.id));
    }

    /**
     * 获取考勤统计
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Object} 统计结果
     */
    getAttendanceStatistics(startDate = null, endDate = null) {
        let attendances = this.attendances;

        if (startDate || endDate) {
            attendances = Attendance.filterByDateRange(attendances, startDate, endDate);
        }

        const stats = {
            summary: Attendance.getStatistics(attendances),
            byDate: Attendance.groupByDate(attendances),
            byStudent: {},
            trend: Statistics.getAttendanceTrend(attendances, 7)
        };

        // 按学生统计
        this.students.forEach(student => {
            stats.byStudent[student.id] = Statistics.calculateStudentStatistics(
                student.id,
                attendances
            );
        });

        return stats;
    }

    /**
     * 获取迟到统计
     * @param {number} days - 天数
     * @returns {Array} 迟到学生列表
     */
    getTardyStatistics(days = 7) {
        const recentAttendances = this.attendances.filter(a => {
            return DateUtils.isWithinRecentDays(a.date, days) &&
                   a.status === AppConfig.attendanceStatus.TARDY;
        });

        const tardyMap = {};
        recentAttendances.forEach(attendance => {
            if (!tardyMap[attendance.studentId]) {
                tardyMap[attendance.studentId] = {
                    studentId: attendance.studentId,
                    count: 0,
                    totalMinutes: 0,
                    records: []
                };
            }
            tardyMap[attendance.studentId].count++;
            tardyMap[attendance.studentId].totalMinutes += attendance.tardyMinutes || 0;
            tardyMap[attendance.studentId].records.push(attendance);
        });

        // 添加学生信息并排序
        return Object.values(tardyMap)
            .map(tardy => {
                const student = this.students.find(s => s.id === tardy.studentId);
                return {
                    ...tardy,
                    student: student ? student.toJSON() : null
                };
            })
            .filter(tardy => tardy.student)
            .sort((a, b) => b.count - a.count);
    }

    /**
     * 导出考勤数据
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @param {Array} fields - 导出字段
     * @returns {Array} 导出数据
     */
    exportAttendance(startDate, endDate, fields = []) {
        const attendances = this.getAttendanceByDateRange(startDate, endDate);
        const exportData = [];

        attendances.forEach(attendance => {
            const student = this.students.find(s => s.id === attendance.studentId);
            if (!student) return;

            const row = {
                studentId: student.studentId,
                studentName: student.name,
                date: attendance.date,
                status: attendance.getStatusText(),
                checkInTime: attendance.checkInTime,
                tardyMinutes: attendance.tardyMinutes,
                notes: attendance.notes
            };

            // 如果指定了字段，只导出指定字段
            if (fields.length > 0) {
                const filteredRow = {};
                fields.forEach(field => {
                    if (row[field] !== undefined) {
                        filteredRow[field] = row[field];
                    }
                });
                exportData.push(filteredRow);
            } else {
                exportData.push(row);
            }
        });

        return exportData;
    }

    /**
     * 清理旧数据
     * @param {number} days - 保留天数
     */
    cleanupOldData(days = 180) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffDateStr = DateUtils.format(cutoffDate, 'YYYY-MM-DD');

        const originalLength = this.attendances.length;
        this.attendances = this.attendances.filter(a => a.date >= cutoffDateStr);

        // 清理旧的会话
        this.sessions = this.sessions.filter(s => s.date >= cutoffDateStr);

        if (this.attendances.length < originalLength) {
            this.saveData();
        }
    }
}