// 学生数据模型
class Student {
    constructor(data = {}) {
        this.id = data.id || this._generateId();
        this.name = data.name || '';
        this.studentId = data.studentId || '';
        this.email = data.email || '';
        this.location = data.location || null;
        this.metadata = data.metadata || {};
        this.active = data.active !== undefined ? data.active : true;
        this.createdAt = data.createdAt || DateUtils.now();
        this.updatedAt = data.updatedAt || DateUtils.now();
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    _generateId() {
        return 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 验证学生数据
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];

        if (!this.name || !this.name.trim()) {
            errors.push('学生姓名不能为空');
        }

        if (!this.studentId || !this.studentId.trim()) {
            errors.push('学号不能为空');
        }

        if (this.email && !this._isValidEmail(this.email)) {
            errors.push('邮箱格式不正确');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱
     * @returns {boolean} 是否有效
     */
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 更新学生信息
     * @param {Object} data - 更新的数据
     * @returns {Student} 更新后的实例
     */
    update(data) {
        const updatedData = { ...this.toJSON(), ...data };
        updatedData.updatedAt = DateUtils.now();
        return new Student(updatedData);
    }

    /**
     * 获取显示名称
     * @returns {string} 显示名称
     */
    getDisplayName() {
        if (this.name && this.studentId) {
            return `${this.name} (${this.studentId})`;
        }
        return this.name || this.studentId || '未知学生';
    }

    /**
     * 设置地理位置
     * @param {string} city - 城市
     * @param {string} country - 国家
     * @param {Object} coordinates - 坐标 {lat, lng}
     */
    setLocation(city, country = null, coordinates = null) {
        this.location = {
            city: city,
            country: country,
            coordinates: coordinates
        };
        this.updatedAt = DateUtils.now();
    }

    /**
     * 激活/停用学生
     * @param {boolean} active - 是否激活
     */
    setActive(active) {
        this.active = active;
        this.updatedAt = DateUtils.now();
    }

    /**
     * 添加元数据
     * @param {string} key - 键
     * @param {*} value - 值
     */
    addMetadata(key, value) {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata[key] = value;
        this.updatedAt = DateUtils.now();
    }

    /**
     * 获取元数据
     * @param {string} key - 键
     * @param {*} defaultValue - 默认值
     * @returns {*} 元数据值
     */
    getMetadata(key, defaultValue = null) {
        return this.metadata && this.metadata[key] ? this.metadata[key] : defaultValue;
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            studentId: this.studentId,
            email: this.email,
            location: this.location,
            metadata: this.metadata,
            active: this.active,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 从JSON创建学生实例
     * @param {Object} json - JSON对象
     * @returns {Student} 学生实例
     */
    static fromJSON(json) {
        return new Student(json);
    }

    /**
     * 批量从CSV数据创建学生
     * @param {Array} csvData - CSV解析后的数据
     * @param {Object} fieldMapping - 字段映射
     * @returns {Array} 学生数组
     */
    static fromCSV(csvData, fieldMapping = {}) {
        const defaultMapping = {
            name: 'name',
            studentId: 'studentId',
            email: 'email',
            city: 'city',
            country: 'country'
        };

        const mapping = { ...defaultMapping, ...fieldMapping };
        const students = [];

        csvData.forEach(row => {
            const studentData = {
                name: row[mapping.name] || '',
                studentId: row[mapping.studentId] || '',
                email: row[mapping.email] || ''
            };

            // 处理地理位置信息
            if (row[mapping.city]) {
                studentData.location = {
                    city: row[mapping.city],
                    country: row[mapping.country] || null
                };
            }

            // 添加其他字段作为元数据
            Object.keys(row).forEach(key => {
                if (!Object.values(mapping).includes(key)) {
                    studentData.metadata = studentData.metadata || {};
                    studentData.metadata[key] = row[key];
                }
            });

            const student = new Student(studentData);
            if (student.validate().valid) {
                students.push(student);
            }
        });

        return students;
    }

    /**
     * 搜索学生
     * @param {Array} students - 学生列表
     * @param {string} query - 搜索关键词
     * @returns {Array} 匹配的学生列表
     */
    static search(students, query) {
        if (!query || !query.trim()) {
            return students;
        }

        const lowerQuery = query.toLowerCase();
        return students.filter(student => {
            return student.name.toLowerCase().includes(lowerQuery) ||
                   student.studentId.toLowerCase().includes(lowerQuery) ||
                   (student.email && student.email.toLowerCase().includes(lowerQuery));
        });
    }

    /**
     * 按学号排序
     * @param {Array} students - 学生列表
     * @param {boolean} ascending - 是否升序
     * @returns {Array} 排序后的学生列表
     */
    static sortByStudentId(students, ascending = true) {
        return [...students].sort((a, b) => {
            const compare = a.studentId.localeCompare(b.studentId);
            return ascending ? compare : -compare;
        });
    }

    /**
     * 按姓名排序
     * @param {Array} students - 学生列表
     * @param {boolean} ascending - 是否升序
     * @returns {Array} 排序后的学生列表
     */
    static sortByName(students, ascending = true) {
        return [...students].sort((a, b) => {
            const compare = a.name.localeCompare(b.name, 'zh-CN');
            return ascending ? compare : -compare;
        });
    }

    /**
     * 检查学号是否重复
     * @param {Array} students - 学生列表
     * @param {string} studentId - 学号
     * @param {string} excludeId - 排除的学生ID
     * @returns {boolean} 是否重复
     */
    static isDuplicateStudentId(students, studentId, excludeId = null) {
        return students.some(student => {
            if (excludeId && student.id === excludeId) {
                return false;
            }
            return student.studentId === studentId;
        });
    }
}