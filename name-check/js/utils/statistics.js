// 统计工具类
class Statistics {
    /**
     * 计算出勤率
     * @param {Array} attendanceRecords - 考勤记录数组
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {number} 出勤率 (0-100)
     */
    static calculateAttendanceRate(attendanceRecords, startDate, endDate) {
        if (!attendanceRecords || attendanceRecords.length === 0) return 0;

        const filteredRecords = attendanceRecords.filter(record => {
            if (startDate && record.date < startDate) return false;
            if (endDate && record.date > endDate) return false;
            return true;
        });

        const totalRecords = filteredRecords.length;
        const presentRecords = filteredRecords.filter(r => r.status === 'present' || r.status === 'tardy').length;

        return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    }

    /**
     * 计算学生的出勤统计
     * @param {string} studentId - 学生ID
     * @param {Array} attendanceRecords - 考勤记录数组
     * @returns {Object} 统计结果
     */
    static calculateStudentStatistics(studentId, attendanceRecords) {
        const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);

        const stats = {
            total: studentRecords.length,
            present: 0,
            tardy: 0,
            absent: 0,
            excused: 0,
            tardyMinutes: 0,
            attendanceRate: 0,
            recentTardyCount: 0,
            consecutivePresent: 0,
            consecutiveAbsent: 0
        };

        // 计算各种状态的数量
        studentRecords.forEach(record => {
            switch (record.status) {
                case 'present':
                    stats.present++;
                    break;
                case 'tardy':
                    stats.tardy++;
                    stats.tardyMinutes += record.tardyMinutes || 0;
                    break;
                case 'absent':
                    stats.absent++;
                    break;
                case 'excused':
                    stats.excused++;
                    break;
            }

            // 计算最近7天迟到次数
            if (DateUtils.isWithinRecentDays(record.date, 7) && record.status === 'tardy') {
                stats.recentTardyCount++;
            }
        });

        // 计算出勤率
        stats.attendanceRate = stats.total > 0 ?
            Math.round(((stats.present + stats.tardy) / stats.total) * 100) : 0;

        // 计算连续出勤天数
        stats.consecutivePresent = this._calculateConsecutiveDays(studentRecords, ['present', 'tardy']);
        stats.consecutiveAbsent = this._calculateConsecutiveDays(studentRecords, ['absent']);

        return stats;
    }

    /**
     * 获取班级总体统计
     * @param {Array} students - 学生列表
     * @param {Array} attendanceRecords - 考勤记录数组
     * @param {string} date - 日期（可选）
     * @returns {Object} 统计结果
     */
    static getClassStatistics(students, attendanceRecords, date = null) {
        const filteredRecords = date ?
            attendanceRecords.filter(r => r.date === date) :
            attendanceRecords;

        const stats = {
            totalStudents: students.length,
            attendanceRate: 0,
            totalRecords: filteredRecords.length,
            presentCount: 0,
            tardyCount: 0,
            absentCount: 0,
            excusedCount: 0,
            averageTardyMinutes: 0,
            topTardyStudents: [],
            attendanceTrend: []
        };

        // 计算各种状态的数量
        filteredRecords.forEach(record => {
            switch (record.status) {
                case 'present':
                    stats.presentCount++;
                    break;
                case 'tardy':
                    stats.tardyCount++;
                    break;
                case 'absent':
                    stats.absentCount++;
                    break;
                case 'excused':
                    stats.excusedCount++;
                    break;
            }
        });

        // 计算出勤率
        if (stats.totalRecords > 0) {
            stats.attendanceRate = Math.round(((stats.presentCount + stats.tardyCount) / stats.totalRecords) * 100);
        }

        // 计算平均迟到分钟数
        const tardyRecords = filteredRecords.filter(r => r.status === 'tardy');
        if (tardyRecords.length > 0) {
            const totalTardyMinutes = tardyRecords.reduce((sum, r) => sum + (r.tardyMinutes || 0), 0);
            stats.averageTardyMinutes = Math.round(totalTardyMinutes / tardyRecords.length);
        }

        // 获取迟到最多的学生
        stats.topTardyStudents = this._getTopTardyStudents(students, attendanceRecords, 5);

        return stats;
    }

    /**
     * 获取出勤趋势
     * @param {Array} attendanceRecords - 考勤记录数组
     * @param {number} days - 天数
     * @returns {Array} 趋势数据
     */
    static getAttendanceTrend(attendanceRecords, days = 7) {
        const trend = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = DateUtils.format(date, 'YYYY-MM-DD');

            const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
            const dayStats = this.getClassStatistics([], dayRecords, dateStr);

            trend.push({
                date: dateStr,
                attendanceRate: dayStats.attendanceRate,
                presentCount: dayStats.presentCount,
                tardyCount: dayStats.tardyCount,
                absentCount: dayStats.absentCount
            });
        }

        return trend;
    }

    /**
     * 计算权重分数（用于随机选择）
     * @param {string} studentId - 学生ID
     * @param {Array} attendanceRecords - 考勤记录数组
     * @param {Object} settings - 设置
     * @returns {number} 权重分数
     */
    static calculateWeight(studentId, attendanceRecords, settings = {}) {
        const {
            tardyWeightMultiplier = 2.5,
            recentTardyDays = 7,
            recentTardyWeight = 0.5,
            baseWeight = 1
        } = settings;

        const stats = this.calculateStudentStatistics(studentId, attendanceRecords);

        let weight = baseWeight;

        // 迟到次数加权
        weight += stats.tardy * tardyWeightMultiplier;

        // 最近迟到额外加权
        weight += stats.recentTardyCount * recentTardyWeight;

        // 缺勤次数较多时降低权重（可选）
        if (stats.absent > stats.present) {
            weight *= 0.5;
        }

        return Math.round(weight * 100) / 100;
    }

    /**
     * 计算连续天数
     * @param {Array} records - 记录数组（按日期排序）
     * @param {Array} targetStatus - 目标状态
     * @returns {number} 连续天数
     */
    static _calculateConsecutiveDays(records, targetStatus) {
        if (!records || records.length === 0) return 0;

        // 按日期排序（最新的在前）
        const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

        let consecutive = 0;
        let currentDate = new Date();

        for (const record of sortedRecords) {
            const recordDate = new Date(record.date);
            const daysDiff = DateUtils.daysDiff(recordDate, currentDate);

            // 检查是否是连续的
            if (daysDiff <= consecutive + 1 && targetStatus.includes(record.status)) {
                consecutive++;
                currentDate = recordDate;
            } else if (daysDiff > consecutive + 1) {
                break;
            }
        }

        return consecutive;
    }

    /**
     * 获取迟到最多的学生
     * @param {Array} students - 学生列表
     * @param {Array} attendanceRecords - 考勤记录数组
     * @param {number} limit - 返回数量限制
     * @returns {Array} 学生统计数组
     */
    static _getTopTardyStudents(students, attendanceRecords, limit = 5) {
        const studentTardyCount = {};

        // 统计每个学生的迟到次数
        attendanceRecords.forEach(record => {
            if (record.status === 'tardy') {
                studentTardyCount[record.studentId] = (studentTardyCount[record.studentId] || 0) + 1;
            }
        });

        // 转换为数组并排序
        const tardyStudents = students
            .map(student => ({
                studentId: student.id,
                name: student.name,
                tardyCount: studentTardyCount[student.id] || 0
            }))
            .filter(s => s.tardyCount > 0)
            .sort((a, b) => b.tardyCount - a.tardyCount)
            .slice(0, limit);

        return tardyStudents;
    }

    /**
     * 生成统计报告
     * @param {Array} students - 学生列表
     * @param {Array} attendanceRecords - 考勤记录数组
     * @param {Object} options - 选项
     * @returns {Object} 报告数据
     */
    static generateReport(students, attendanceRecords, options = {}) {
        const {
            startDate = null,
            endDate = null,
            includeDetails = false
        } = options;

        const filteredRecords = attendanceRecords.filter(record => {
            if (startDate && record.date < startDate) return false;
            if (endDate && record.date > endDate) return false;
            return true;
        });

        const report = {
            summary: this.getClassStatistics(students, filteredRecords),
            studentDetails: [],
            dailyTrend: this.getAttendanceTrend(filteredRecords, 7),
            generatedAt: DateUtils.now()
        };

        // 生成每个学生的详细统计
        if (includeDetails) {
            report.studentDetails = students.map(student => {
                const stats = this.calculateStudentStatistics(student.id, filteredRecords);
                return {
                    ...student,
                    ...stats
                };
            });
        }

        return report;
    }
}

// 导出到全局作用域
window.Statistics = Statistics;