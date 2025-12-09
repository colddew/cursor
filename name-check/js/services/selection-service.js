// 加权随机选择服务
class SelectionService {
    constructor() {
        this.attendanceService = null;
        this.storage = new StorageManager();
        this.selectionHistory = [];
        this.loadHistory();
    }

    /**
     * 初始化服务
     * @param {AttendanceService} attendanceService - 考勤服务
     */
    init(attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * 加载历史记录
     */
    loadHistory() {
        const historyData = this.storage.get('selection_history', []);
        this.selectionHistory = historyData;
    }

    /**
     * 保存历史记录
     */
    saveHistory() {
        this.storage.set('selection_history', this.selectionHistory);
    }

    /**
     * 计算所有学生的权重
     * @param {Array} excludeIds - 排除的学生ID数组
     * @returns {Array} 带权重的学生数组
     */
    calculateWeights(excludeIds = []) {
        const students = this.attendanceService.students
            .filter(s => s.active)
            .filter(s => !excludeIds.includes(s.id));

        const today = DateUtils.today();

        // 获取最近的考勤记录
        const recentAttendances = this.attendanceService.attendances.filter(a => {
            return DateUtils.isWithinRecentDays(a.date, 30);
        });

        // 为每个学生计算权重
        const weightedStudents = students.map(student => {
            const weight = this._calculateStudentWeight(student, recentAttendances);
            return {
                student: student,
                weight: weight,
                weightInfo: this._getWeightInfo(student, recentAttendances)
            };
        });

        return weightedStudents;
    }

    /**
     * 计算单个学生的权重
     * @param {Student} student - 学生对象
     * @param {Array} attendances - 考勤记录
     * @returns {number} 权重值
     */
    _calculateStudentWeight(student, attendances) {
        const settings = AppConfig.attendance;
        let weight = 1; // 基础权重

        // 获取该学生的考勤记录
        const studentAttendances = attendances.filter(a => a.studentId === student.id);

        // 统计迟到次数
        const tardyCount = studentAttendances.filter(a => a.status === 'tardy').length;
        weight += tardyCount * settings.tardyWeightMultiplier;

        // 统计最近迟到的额外权重
        const recentTardyCount = studentAttendances.filter(a => {
            return a.status === 'tardy' && DateUtils.isWithinRecentDays(a.date, settings.recentTardyDays);
        }).length;
        weight += recentTardyCount * settings.recentTardyWeight;

        // 缺勤较多时降低权重（可选）
        const absentCount = studentAttendances.filter(a => a.status === 'absent').length;
        if (absentCount > studentAttendances.length * 0.3) {
            weight *= 0.8; // 降低权重但不完全排除
        }

        // 如果今天已经被选中过，大幅降低权重
        const today = DateUtils.today();
        const todaySelection = this.selectionHistory.find(h => h.date === today);
        if (todaySelection && todaySelection.selectedStudents.includes(student.id)) {
            weight *= 0.1;
        }

        return Math.max(weight, 0.1); // 确保权重至少为0.1
    }

    /**
     * 获取权重详细信息
     * @param {Student} student - 学生对象
     * @param {Array} attendances - 考勤记录
     * @returns {Object} 权重信息
     */
    _getWeightInfo(student, attendances) {
        const settings = AppConfig.attendance;
        const studentAttendances = attendances.filter(a => a.studentId === student.id);

        const tardyCount = studentAttendances.filter(a => a.status === 'tardy').length;
        const recentTardyCount = studentAttendances.filter(a => {
            return a.status === 'tardy' && DateUtils.isWithinRecentDays(a.date, settings.recentTardyDays);
        }).length;

        const todaySelection = this.selectionHistory.find(h => h.date === DateUtils.today());
        const selectedToday = todaySelection && todaySelection.selectedStudents.includes(student.id);

        return {
            baseWeight: 1,
            tardyWeight: tardyCount * settings.tardyWeightMultiplier,
            recentTardyWeight: recentTardyCount * settings.recentTardyWeight,
            penaltyMultiplier: selectedToday ? 0.1 : 1,
            totalTardy: tardyCount,
            recentTardy: recentTardyCount,
            selectedToday: selectedToday
        };
    }

    /**
     * 加权随机选择学生
     * @param {number} count - 选择数量
     * @param {Array} excludeIds - 排除的学生ID数组
     * @returns {Array} 选中的学生数组
     */
    selectStudents(count = 3, excludeIds = []) {
        const weightedStudents = this.calculateWeights(excludeIds);

        if (weightedStudents.length === 0) {
            return [];
        }

        if (count >= weightedStudents.length) {
            // 如果请求数量大于等于可用数量，返回所有学生
            const selected = weightedStudents.map(ws => ws.student);
            this._saveSelection(selected);
            return selected;
        }

        // 使用加权随机算法选择
        const selected = this._weightedRandomSelection(weightedStudents, count);
        this._saveSelection(selected);

        return selected;
    }

    /**
     * 加权随机选择算法
     * @param {Array} weightedStudents - 带权重的学生数组
     * @param {number} count - 选择数量
     * @returns {Array} 选中的学生数组
     */
    _weightedRandomSelection(weightedStudents, count) {
        const selected = [];
        const available = [...weightedStudents];

        // 计算总权重
        let totalWeight = available.reduce((sum, ws) => sum + ws.weight, 0);

        // 归一化权重
        const normalizedWeights = available.map(ws => ({
            student: ws.student,
            probability: ws.weight / totalWeight,
            cumulativeWeight: 0
        }));

        // 计算累积权重
        let cumulative = 0;
        normalizedWeights.forEach(nw => {
            cumulative += nw.probability;
            nw.cumulativeWeight = cumulative;
        });

        // 进行选择
        for (let i = 0; i < count && available.length > 0; i++) {
            const random = Math.random();

            // 找到对应的区间
            for (let j = 0; j < normalizedWeights.length; j++) {
                const nw = normalizedWeights[j];
                if (random <= nw.cumulativeWeight) {
                    selected.push(nw.student);

                    // 从可用列表中移除已选中的学生
                    const index = available.findIndex(ws => ws.student.id === nw.student.id);
                    if (index > -1) {
                        available.splice(index, 1);
                        normalizedWeights.splice(j, 1);
                    }

                    // 重新计算权重
                    if (available.length > 0) {
                        totalWeight = available.reduce((sum, ws) => sum + ws.weight, 0);
                        cumulative = 0;
                        normalizedWeights.forEach(nw => {
                            const ws = available.find(a => a.student.id === nw.student.id);
                            if (ws) {
                                nw.probability = ws.weight / totalWeight;
                                cumulative += nw.probability;
                                nw.cumulativeWeight = cumulative;
                            }
                        });
                    }

                    break;
                }
            }
        }

        return selected;
    }

    /**
     * 保存选择记录
     * @param {Array} selectedStudents - 选中的学生数组
     */
    _saveSelection(selectedStudents) {
        const selection = {
            id: 'selection_' + Date.now(),
            date: DateUtils.today(),
            time: DateUtils.currentTime(),
            selectedStudents: selectedStudents.map(s => s.id),
            selectedStudentNames: selectedStudents.map(s => s.name),
            weightInfo: selectedStudents.map(student => {
                const weightedStudents = this.calculateWeights([student.id]);
                const ws = weightedStudents.find(w => w.student.id === student.id);
                return ws ? ws.weightInfo : null;
            })
        };

        // 添加新记录（每次选择都创建新的历史记录）
        this.selectionHistory.unshift(selection);

        // 只保留最近30天的记录
        this.selectionHistory = this.selectionHistory.filter(h => {
            return DateUtils.isWithinRecentDays(h.date, 30);
        });

        this.saveHistory();
    }

    /**
     * 获取选择历史
     * @param {number} days - 天数
     * @returns {Array} 历史记录
     */
    getSelectionHistory(days = 7) {
        return this.selectionHistory.filter(h => {
            return DateUtils.isWithinRecentDays(h.date, days);
        });
    }

    /**
     * 获取今日选择记录
     * @returns {Object|null} 今日选择记录
     */
    getTodaySelection() {
        return this.selectionHistory.find(h => h.date === DateUtils.today()) || null;
    }

    /**
     * 获取选择统计
     * @param {number} days - 天数
     * @returns {Object} 统计结果
     */
    getSelectionStatistics(days = 30) {
        const history = this.getSelectionHistory(days);
        const studentSelectionCount = {};

        history.forEach(selection => {
            selection.selectedStudentNames.forEach(name => {
                if (!studentSelectionCount[name]) {
                    studentSelectionCount[name] = {
                        count: 0,
                        dates: []
                    };
                }
                studentSelectionCount[name].count++;
                studentSelectionCount[name].dates.push(selection.date);
            });
        });

        // 转换为数组并排序
        const sortedStudents = Object.entries(studentSelectionCount)
            .map(([name, data]) => ({
                name: name,
                count: data.count,
                dates: data.dates
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalSelections: history.length,
            studentSelections: sortedStudents,
            mostSelected: sortedStudents.slice(0, 5),
            leastSelected: sortedStudents.slice(-5).reverse()
        };
    }

    /**
     * 检查学生是否今天已被选中
     * @param {string} studentId - 学生ID
     * @returns {boolean} 是否已选中
     */
    isStudentSelectedToday(studentId) {
        const todaySelection = this.getTodaySelection();
        return todaySelection && todaySelection.selectedStudents.includes(studentId);
    }

    /**
     * 清除历史记录
     * @param {number} days - 保留天数
     */
    clearHistory(days = 30) {
        this.selectionHistory = this.selectionHistory.filter(h => {
            return DateUtils.isWithinRecentDays(h.date, days);
        });
        this.saveHistory();
    }

    /**
     * 导出选择历史
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {string} CSV内容
     */
    exportHistory(startDate, endDate) {
        const filteredHistory = this.selectionHistory.filter(h => {
            if (startDate && h.date < startDate) return false;
            if (endDate && h.date > endDate) return false;
            return true;
        });

        const exportData = [];
        filteredHistory.forEach(selection => {
            selection.selectedStudentNames.forEach((name, index) => {
                exportData.push({
                    date: selection.date,
                    time: selection.time,
                    studentName: name,
                    selectionOrder: index + 1,
                    totalSelected: selection.selectedStudents.length
                });
            });
        });

        const fields = ['date', 'time', 'studentName', 'selectionOrder', 'totalSelected'];

        // 构建CSV
        const csvLines = [fields.join(',')];
        exportData.forEach(row => {
            const values = fields.map(field => {
                const value = row[field] !== undefined ? row[field] : '';
                return `"${value}"`;
            });
            csvLines.push(values.join(','));
        });

        return '\ufeff' + csvLines.join('\n');
    }
}