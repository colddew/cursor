// 导出服务
class ExportService {
    constructor() {
        this.attendanceService = null;
    }

    /**
     * 初始化服务
     * @param {AttendanceService} attendanceService - 考勤服务
     */
    init(attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * 导出学生名单
     * @param {Array} studentIds - 学生ID数组（可选）
     * @param {Array} fields - 导出字段
     * @returns {string} CSV内容
     */
    exportStudents(studentIds = null, fields = AppConfig.export.defaultFields) {
        let students = this.attendanceService.students;

        if (studentIds) {
            students = students.filter(s => studentIds.includes(s.id));
        }

        const exportData = students.map(student => {
            const row = {
                studentId: student.studentId,
                name: student.name,
                email: student.email || '',
                city: student.location ? student.location.city : '',
                country: student.location ? student.location.country : '',
                active: student.active ? '是' : '否',
                createdAt: student.createdAt
            };

            // 添加元数据
            if (student.metadata) {
                Object.keys(student.metadata).forEach(key => {
                    row[key] = student.metadata[key];
                });
            }

            return row;
        });

        return this.toCSV(exportData, fields);
    }

    /**
     * 导出考勤记录
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @param {Array} fields - 导出字段
     * @param {Array} studentIds - 学生ID数组（可选）
     * @returns {string} CSV内容
     */
    exportAttendance(startDate, endDate, fields = AppConfig.export.defaultFields, studentIds = null) {
        const attendances = this.attendanceService.exportAttendance(startDate, endDate, fields);

        // 如果指定了学生，进行筛选
        if (studentIds) {
            const filteredAttendances = [];
            for (const attendance of attendances) {
                const student = this.attendanceService.students.find(s => s.studentId === attendance.studentId);
                if (student && studentIds.includes(student.id)) {
                    filteredAttendances.push(attendance);
                }
            }
            return this.toCSV(filteredAttendances, fields);
        }

        return this.toCSV(attendances, fields);
    }

    /**
     * 导出考勤统计报告
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @param {boolean} includeDetails - 是否包含详细信息
     * @returns {Object} 报告数据
     */
    exportStatisticsReport(startDate, endDate, includeDetails = true) {
        const students = this.attendanceService.students;
        const attendances = this.attendanceService.getAttendanceByDateRange(startDate, endDate);

        const report = Statistics.generateReport(students, attendances, {
            startDate,
            endDate,
            includeDetails
        });

        return report;
    }

    /**
     * 导出完整报告
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @param {string} format - 导出格式 (csv|json)
     * @returns {string} 导出内容
     */
    exportFullReport(startDate, endDate, format = 'csv') {
        if (format === 'json') {
            return this.exportFullReportJSON(startDate, endDate);
        } else {
            return this.exportFullReportCSV(startDate, endDate);
        }
    }

    /**
     * 导出完整报告（CSV格式）
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {string} CSV内容
     */
    exportFullReportCSV(startDate, endDate) {
        const report = this.exportStatisticsReport(startDate, endDate, true);
        const csvLines = [];

        // 添加报告头部
        csvLines.push(`考勤统计报告`);
        csvLines.push(`统计时间: ${startDate} 至 ${endDate}`);
        csvLines.push(`生成时间: ${report.generatedAt}`);
        csvLines.push('');

        // 添加总体统计
        csvLines.push('总体统计');
        csvLines.push('学生总数,出勤率(%)');
        csvLines.push(`${report.summary.totalStudents},${report.summary.attendanceRate}`);
        csvLines.push('');

        // 添加每日统计
        csvLines.push('每日统计');
        csvLines.push('日期,出勤率(%%),到场人数,迟到人数,缺勤人数');

        report.dailyTrend.forEach(day => {
            csvLines.push(
                `${day.date},${day.attendanceRate},${day.presentCount},${day.tardyCount},${day.absentCount}`
            );
        });
        csvLines.push('');

        // 添加学生详细统计
        if (report.studentDetails && report.studentDetails.length > 0) {
            csvLines.push('学生详细统计');
            csvLines.push('学号,姓名,总记录数,到场次数,迟到次数,缺勤次数,请假次数,出勤率(%),迟到总分钟数');

            report.studentDetails.forEach(student => {
                csvLines.push(
                    `${student.studentId},${student.name},${student.total},${student.present},${student.tardy},${student.absent},${student.excused},${student.attendanceRate},${student.tardyMinutes}`
                );
            });
        }

        return csvLines.join('\n');
    }

    /**
     * 导出完整报告（JSON格式）
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {string} JSON内容
     */
    exportFullReportJSON(startDate, endDate) {
        const report = {
            exportInfo: {
                type: 'attendance_report',
                startDate: startDate,
                endDate: endDate,
                generatedAt: DateUtils.now(),
                format: 'json'
            },
            ...this.exportStatisticsReport(startDate, endDate, true)
        };

        return JSON.stringify(report, null, 2);
    }

    /**
     * 导出迟到统计
     * @param {number} days - 天数
     * @returns {string} CSV内容
     */
    exportTardyStatistics(days = 7) {
        const tardyStats = this.attendanceService.getTardyStatistics(days);

        const exportData = tardyStats.map(tardy => ({
            studentId: tardy.student.studentId,
            studentName: tardy.student.name,
            tardyCount: tardy.count,
            totalTardyMinutes: tardy.totalMinutes,
            averageTardyMinutes: tardy.count > 0 ? Math.round(tardy.totalMinutes / tardy.count) : 0,
            recentDates: tardy.records.map(r => r.date).join(', ')
        }));

        const fields = ['studentId', 'studentName', 'tardyCount', 'totalTardyMinutes', 'averageTardyMinutes', 'recentDates'];

        return this.toCSV(exportData, fields);
    }

    /**
     * 导出会话记录
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {string} CSV内容
     */
    exportSessions(startDate, endDate) {
        const sessions = Session.getByDateRange(this.attendanceService.sessions, startDate, endDate);

        const exportData = sessions.map(session => {
            const selectedStudents = session.selectedStudents.map(studentId => {
                const student = this.attendanceService.students.find(s => s.id === studentId);
                return student ? student.name : '';
            }).filter(name => name);

            return {
                date: session.date,
                timeRange: session.getTimeRange(),
                topic: session.topic,
                selectedCount: session.selectedStudents.length,
                selectedStudents: selectedStudents.join('; '),
                attendanceRate: session.getAttendanceRate(),
                totalStudents: session.attendanceStats.total,
                presentCount: session.attendanceStats.present,
                tardyCount: session.attendanceStats.tardy,
                absentCount: session.attendanceStats.absent,
                notes: session.notes
            };
        });

        const fields = [
            'date', 'timeRange', 'topic', 'selectedCount', 'selectedStudents',
            'attendanceRate', 'totalStudents', 'presentCount', 'tardyCount', 'absentCount', 'notes'
        ];

        return this.toCSV(exportData, fields);
    }

    /**
     * 将数据转换为CSV
     * @param {Array} data - 数据数组
     * @param {Array} fields - 字段数组
     * @returns {string} CSV内容
     */
    toCSV(data, fields = null) {
        if (!data || data.length === 0) {
            return '';
        }

        // 如果没有指定字段，使用第一行的所有字段
        if (!fields) {
            fields = Object.keys(data[0]);
        }

        // 添加BOM以支持Excel中文显示
        const BOM = '\ufeff';

        // 构建CSV内容
        const csvLines = [fields.join(',')];

        data.forEach(row => {
            const values = fields.map(field => {
                const value = row[field] !== undefined && row[field] !== null ? row[field] : '';
                // 处理包含逗号、引号或换行符的值
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });

        return BOM + csvLines.join('\n');
    }

    /**
     * 下载文件
     * @param {string} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} type - MIME类型
     */
    downloadFile(content, filename, type = 'text/csv;charset=utf-8') {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * 导出并下载
     * @param {string} type - 导出类型
     * @param {Object} options - 选项
     */
    exportAndDownload(type, options = {}) {
        const now = DateUtils.format(new Date(), 'YYYY-MM-DD_HH-mm-ss');
        let content, filename;

        switch (type) {
            case 'students':
                content = this.exportStudents(options.studentIds, options.fields);
                filename = `students_${now}.csv`;
                break;

            case 'attendance':
                content = this.exportAttendance(
                    options.startDate,
                    options.endDate,
                    options.fields,
                    options.studentIds
                );
                filename = `attendance_${options.startDate}_${options.endDate}.csv`;
                break;

            case 'statistics':
                if (options.format === 'json') {
                    content = this.exportFullReportJSON(options.startDate, options.endDate);
                    filename = `statistics_report_${options.startDate}_${options.endDate}.json`;
                    this.downloadFile(content, filename, 'application/json;charset=utf-8');
                    return;
                } else {
                    content = this.exportFullReportCSV(options.startDate, options.endDate);
                    filename = `statistics_report_${options.startDate}_${options.endDate}.csv`;
                }
                break;

            case 'tardy':
                content = this.exportTardyStatistics(options.days || 7);
                filename = `tardy_statistics_${now}.csv`;
                break;

            case 'sessions':
                content = this.exportSessions(options.startDate, options.endDate);
                filename = `sessions_${options.startDate}_${options.endDate}.csv`;
                break;

            default:
                throw new Error(`不支持的导出类型: ${type}`);
        }

        this.downloadFile(content, filename);
    }

    /**
     * 创建数据备份
     * @returns {Object} 备份数据
     */
    createBackup() {
        return storage.export();
    }

    /**
     * 恢复数据备份
     * @param {Object} backupData - 备份数据
     * @param {boolean} merge - 是否合并
     * @returns {boolean} 是否成功
     */
    restoreBackup(backupData, merge = false) {
        try {
            const success = storage.import(backupData, merge);
            if (success) {
                this.attendanceService.loadData();
            }
            return success;
        } catch (error) {
            console.error('恢复备份失败:', error);
            return false;
        }
    }
}