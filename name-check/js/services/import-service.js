// 导入服务
class ImportService {
    constructor() {
        this.students = [];
        this.attendanceService = null;
    }

    /**
     * 初始化服务
     * @param {AttendanceService} attendanceService - 考勤服务
     */
    init(attendanceService) {
        this.attendanceService = attendanceService;
        this.students = attendanceService.students;
    }

    /**
     * 解析CSV文件
     * @param {File} file - CSV文件
     * @returns {Promise<Object>} 解析结果
     */
    async parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const csvText = e.target.result;
                    const result = this.parseCSVText(csvText);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 解析CSV文本
     * @param {string} csvText - CSV文本
     * @returns {Object} 解析结果
     */
    parseCSVText(csvText) {
        // 智能解析CSV
        const data = CSVParser.smartParse(csvText);

        if (!data || data.length === 0) {
            throw new Error('CSV文件为空或格式不正确');
        }

        // 分析列映射
        const fieldMapping = this.analyzeFieldMapping(data[0]);

        return {
            data: data,
            fieldMapping: fieldMapping,
            preview: data.slice(0, 5),
            totalRows: data.length
        };
    }

    /**
     * 分析字段映射
     * @param {Object} firstRow - 第一行数据
     * @returns {Object} 字段映射
     */
    analyzeFieldMapping(firstRow) {
        const mapping = {
            name: null,
            studentId: null,
            email: null,
            city: null,
            country: null
        };

        const fields = Object.keys(firstRow);

        // 查找姓名字段
        mapping.name = this.findField(fields, ['name', '姓名', '学生姓名', 'student_name', 'studentname']);

        // 查找学号字段
        mapping.studentId = this.findField(fields, [
            'studentId', 'student_id', '学号', 'id', 'studentid', 'sid'
        ]);

        // 查找邮箱字段
        mapping.email = this.findField(fields, ['email', '邮箱', 'mail', '电子邮箱']);

        // 查找城市字段
        mapping.city = this.findField(fields, ['city', '城市', '市']);

        // 查找国家字段
        mapping.country = this.findField(fields, ['country', '国家', '国籍']);

        return mapping;
    }

    /**
     * 查找匹配的字段
     * @param {Array} fields - 字段列表
     * @param {Array} candidates - 候选字段名
     * @returns {string|null} 匹配的字段名
     */
    findField(fields, candidates) {
        for (const candidate of candidates) {
            const field = fields.find(f =>
                f.toLowerCase() === candidate.toLowerCase() ||
                f.toLowerCase().includes(candidate.toLowerCase())
            );
            if (field) return field;
        }
        return null;
    }

    /**
     * 验证导入数据
     * @param {Object} importData - 导入数据
     * @param {Object} fieldMapping - 字段映射
     * @returns {Object} 验证结果
     */
    validateImportData(importData, fieldMapping) {
        const errors = [];
        const warnings = [];

        // 检查必需字段
        if (!fieldMapping.name) {
            errors.push('未找到姓名字段');
        }

        if (!fieldMapping.studentId) {
            errors.push('未找到学号字段');
        }

        if (errors.length > 0) {
            return { valid: false, errors, warnings };
        }

        // 检查数据完整性
        if (!importData || !importData.data || !Array.isArray(importData.data)) {
            errors.push('导入数据格式错误');
            return { valid: false, errors, warnings };
        }

        // 检查必需字段
        const requiredFields = [fieldMapping.name, fieldMapping.studentId];

        // 检查数据行
        if (importData.data.length === 0) {
            errors.push('CSV文件没有数据行');
        }

        // 检查每行的必需字段
        importData.data.forEach((row, index) => {
            if (!row[fieldMapping.name] || !row[fieldMapping.name].trim()) {
                errors.push(`第${index + 1}行: 姓名为空`);
            }
            if (!row[fieldMapping.studentId] || !row[fieldMapping.studentId].trim()) {
                errors.push(`第${index + 1}行: 学号为空`);
            }
        });


        // 检查重复学号
        const studentIds = importData.data.map(row => row[fieldMapping.studentId]).filter(Boolean);
        const duplicates = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            warnings.push(`发现重复学号: ${[...new Set(duplicates)].join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            duplicateStudentIds: duplicates
        };
    }

    /**
     * 预览导入数据
     * @param {Object} importData - 导入数据
     * @param {Object} fieldMapping - 字段映射
     * @returns {Array} 预览数据
     */
    previewImportData(importData, fieldMapping) {
        if (!importData || !importData.preview || !Array.isArray(importData.preview)) {
            return [];
        }

        return importData.preview.map((row, index) => {
            const preview = {
                rowIndex: index + 1,
                name: row[fieldMapping.name] || '',
                studentId: row[fieldMapping.studentId] || '',
                email: fieldMapping.email ? (row[fieldMapping.email] || '') : null,
                city: fieldMapping.city ? (row[fieldMapping.city] || '') : null,
                country: fieldMapping.country ? (row[fieldMapping.country] || '') : null,
                valid: true,
                errors: []
            };

            // 验证必填字段
            if (!preview.name) {
                preview.valid = false;
                preview.errors.push('姓名为空');
            }

            if (!preview.studentId) {
                preview.valid = false;
                preview.errors.push('学号为空');
            }

            // 检查学号是否已存在
            if (this.attendanceService) {
                const existingStudent = this.attendanceService.students.find(s =>
                    s.studentId === preview.studentId
                );
                if (existingStudent) {
                    preview.errors.push('学号已存在');
                    preview.existingStudent = existingStudent;
                }
            }

            return preview;
        });
    }

    /**
     * 导入学生数据
     * @param {Object} importData - 导入数据对象
     * @param {Object} fieldMapping - 字段映射
     * @param {Object} options - 导入选项
     * @returns {Promise<Object>} 导入结果
     */
    async importStudents(importData, fieldMapping, options = {}) {
        console.log('ImportService.importStudents called:', {
            importData: !!importData,
            fieldMapping: !!fieldMapping,
            dataLength: importData?.data?.length || 'undefined',
            options: options
        });

        const {
            skipErrors = false,
            updateExisting = false,
            batchSize = 50
        } = options;

        const results = {
            success: 0,
            skipped: 0,
            errors: 0,
            duplicates: 0,
            errorDetails: []
        };

        // 检查数据有效性
        if (!importData || !importData.data || !Array.isArray(importData.data)) {
            throw new Error('导入数据格式错误');
        }

        console.log('ImportService: Starting CSV to Student conversion');
        // 转换CSV数据为学生对象
        const students = Student.fromCSV(importData.data, fieldMapping);
        console.log('ImportService: CSV to Student conversion complete, students count:', students.length);

        // 批量处理
        console.log('ImportService: Starting batch processing');
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);

            for (const student of batch) {
                try {
                    // 检查学号是否已存在
                    const existingIndex = this.attendanceService.students.findIndex(s =>
                        s.studentId === student.studentId
                    );

                    if (existingIndex > -1) {
                        if (updateExisting) {
                            // 更新现有学生
                            this.attendanceService.students[existingIndex] = student;
                            results.success++;
                        } else {
                            // 跳过已存在的学生
                            results.duplicates++;
                        }
                    } else {
                        // 添加新学生
                        this.attendanceService.students.push(student);
                        results.success++;
                    }
                } catch (error) {
                    results.errors++;
                    results.errorDetails.push({
                        student: student.toJSON(),
                        error: error.message
                    });

                    if (!skipErrors) {
                        throw error;
                    }
                }
            }

            // 保存每一批
            console.log('ImportService: Saving batch', i, 'with', batch.length, 'students');
            this.attendanceService.saveData();
        }

        // 更新本地学生列表
        this.students = this.attendanceService.students;

        // 确保数据保存到localStorage
        this.attendanceService.saveData();

        // Debug: Check localStorage directly
        const storedData = localStorage.getItem('attendance_students');
        if (storedData) {
            console.log('ImportService: Stored students count:', JSON.parse(storedData).length);
        } else {
            console.log('ImportService: No stored students found');
        }

        console.log('ImportService: Import complete, results:', results);

        // Debug: Log all students after import
        console.log('All students after import:', this.attendanceService.students.map(s => ({
            id: s.id,
            name: s.name,
            active: s.active,
            studentId: s.studentId
        })));

        return results;
    }

    /**
     * 导入考勤记录
     * @param {File} file - CSV文件
     * @param {Object} fieldMapping - 字段映射
     * @returns {Promise<Object>} 导入结果
     */
    async importAttendance(file, fieldMapping) {
        try {
            const csvText = await this.readTextFile(file);
            const data = CSVParser.smartParse(csvText);

            const results = {
                success: 0,
                errors: 0,
                errorDetails: []
            };

            for (const row of data) {
                try {
                    const studentId = row[fieldMapping.studentId];
                    const date = row[fieldMapping.date] || DateUtils.today();
                    const status = row[fieldMapping.status] || 'present';

                    if (!studentId) {
                        throw new Error('缺少学号');
                    }

                    // 查找学生
                    const student = this.attendanceService.students.find(s => s.studentId === studentId);
                    if (!student) {
                        throw new Error(`未找到学号为 ${studentId} 的学生`);
                    }

                    // 创建考勤记录
                    const attendance = Attendance.create(student.id, status, {
                        checkInTime: row[fieldMapping.checkInTime] || null,
                        tardyMinutes: parseInt(row[fieldMapping.tardyMinutes]) || 0,
                        notes: row[fieldMapping.notes] || ''
                    });

                    attendance.date = date;
                    this.attendanceService.attendances.push(attendance);
                    results.success++;
                } catch (error) {
                    results.errors++;
                    results.errorDetails.push({
                        row: row,
                        error: error.message
                    });
                }
            }

            // 保存数据
            this.attendanceService.saveData();

            return results;
        } catch (error) {
            throw new Error(`导入考勤记录失败: ${error.message}`);
        }
    }

    /**
     * 读取文本文件
     * @param {File} file - 文件
     * @returns {Promise<string>} 文本内容
     */
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));

            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 创建模板CSV
     * @param {string} type - 模板类型 (students|attendance)
     * @returns {string} CSV内容
     */
    createTemplateCSV(type = 'students') {
        if (type === 'students') {
            const headers = ['姓名', '学号', '邮箱', '城市', '国家'];
            const sampleData = [
                ['张三', 'S001', 'zhangsan@example.com', '北京', '中国'],
                ['李四', 'S002', 'lisi@example.com', '上海', '中国'],
                ['王五', 'S003', 'wangwu@example.com', '广州', '中国']
            ];

            return [
                headers.join(','),
                ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
        } else if (type === 'attendance') {
            const headers = ['学号', '日期', '状态', '签到时间', '迟到分钟', '备注'];
            const sampleData = [
                ['S001', DateUtils.today(), 'present', '08:00:00', '0', ''],
                ['S002', DateUtils.today(), 'tardy', '08:05:00', '5', ''],
                ['S003', DateUtils.today(), 'absent', '', '', '请假']
            ];

            return [
                headers.join(','),
                ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
        }

        return '';
    }

    /**
     * 下载模板文件
     * @param {string} type - 模板类型
     */
    downloadTemplate(type = 'students') {
        const csvContent = this.createTemplateCSV(type);
        const filename = type === 'students' ? 'students_template.csv' : 'attendance_template.csv';

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
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
}