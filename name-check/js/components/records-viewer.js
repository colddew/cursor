// 考勤记录查看器组件
class RecordsViewer {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
        this.currentFilter = {
            startDate: null,
            endDate: null
        };
    }

    /**
     * 渲染记录表格
     */
    render() {
        this.updateStatistics();
        this.updateTable();
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        const attendances = this.getFilteredAttendances();
        const stats = Attendance.getStatistics(attendances);

        // 更新平均值勤率
        const avgRateElement = document.getElementById('avgAttendanceRate');
        if (avgRateElement) {
            avgRateElement.textContent = stats.total > 0 ? `${Math.round(((stats.present + stats.tardy) / stats.total) * 100)}%` : '-';
        }

        // 更新迟到次数
        const tardyElement = document.getElementById('totalTardyCount');
        if (tardyElement) {
            tardyElement.textContent = stats.tardy;
        }

        // 更新缺勤次数
        const absentElement = document.getElementById('totalAbsentCount');
        if (absentElement) {
            absentElement.textContent = stats.absent;
        }
    }

    /**
     * 更新表格
     */
    updateTable() {
        const tbody = document.getElementById('recordsTableBody');
        if (!tbody) return;

        const attendances = this.getFilteredAttendances();

        if (attendances.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无记录</td></tr>';
            return;
        }

        tbody.innerHTML = attendances.map(attendance => {
            const student = this.attendanceService.students.find(s => s.id === attendance.studentId);
            const studentName = student ? student.name : '未知学生';
            const studentId = student ? student.studentId : attendance.studentId;

            return `
                <tr>
                    <td>${attendance.date}</td>
                    <td>${studentName}</td>
                    <td><span class="attendance-status ${AppConfig.statusClasses[attendance.status]}">${attendance.getStatusText()}</span></td>
                    <td>${attendance.checkInTime || '-'}</td>
                    <td>${attendance.tardyMinutes > 0 ? `${attendance.tardyMinutes}分钟` : '-'}</td>
                    <td>${attendance.notes || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * 获取过滤后的考勤记录
     */
    getFilteredAttendances() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;

        return this.attendanceService.getAttendanceByDateRange(startDate, endDate);
    }

    /**
     * 应用筛选
     */
    applyFilter() {
        this.render();
    }

    /**
     * 导出当前筛选的记录
     */
    exportCurrentFilter() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;

        if (!startDate || !endDate) {
            alert('请选择日期范围');
            return;
        }

        const attendances = this.attendanceService.getAttendanceByDateRange(startDate, endDate);
        const exportData = attendances.map(attendance => {
            const student = this.attendanceService.students.find(s => s.id === attendance.studentId);
            return {
                日期: attendance.date,
                学号: student ? student.studentId : attendance.studentId,
                姓名: student ? student.name : '未知学生',
                状态: attendance.getStatusText(),
                签到时间: attendance.checkInTime || '-',
                迟到分钟: attendance.tardyMinutes || 0,
                备注: attendance.notes || ''
            };
        });

        // 下载CSV
        const csvContent = this.toCSV(exportData);
        this.downloadFile(csvContent, `attendance_records_${startDate}_${endDate}.csv`);
    }

    /**
     * 转换为CSV
     */
    toCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvLines = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${value}"`;
            });
            csvLines.push(values.join(','));
        });

        return '\ufeff' + csvLines.join('\n');
    }

    /**
     * 下载文件
     */
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }
}