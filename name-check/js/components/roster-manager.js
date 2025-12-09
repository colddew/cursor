// 学生名单管理组件
class RosterManager {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
        this.currentStudents = [];
        this.searchTerm = '';
    }

    /**
     * 渲染学生列表
     */
    render() {
        console.log('RosterManager.render() called');
        const rosterList = document.getElementById('rosterList');
        if (!rosterList) {
            console.error('RosterManager: rosterList element not found');
            return;
        }

        let students = this.attendanceService.students.filter(s => s.active);
        console.log('RosterManager: Found', students.length, 'active students out of', this.attendanceService.students.length, 'total students');
        console.log('RosterManager: All students:', this.attendanceService.students.map(s => ({id: s.id, name: s.name, active: s.active})));

        // 搜索过滤
        if (this.searchTerm) {
            console.log('RosterManager: Applying search term:', this.searchTerm);
            students = Student.search(students, this.searchTerm);
            console.log('RosterManager: Students after search:', students.length);
        } else {
            console.log('RosterManager: No search term applied');
        }

        this.currentStudents = students;

        console.log('RosterManager: Rendering', students.length, 'students');
        const htmlContent = students.map(student => `
            <div class="roster-item">
                <div class="student-checkbox">
                    <input type="checkbox" class="student-select-checkbox" data-student-id="${student.id}">
                </div>
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-id">学号: ${student.studentId}</div>
                    ${student.email ? `<div class="student-email">${student.email}</div>` : ''}
                    ${student.location ? `<div class="student-location">${student.location.city}</div>` : ''}
                </div>
                <div class="roster-item-actions">
                    <button class="btn btn-secondary btn-icon-small btn-edit" data-student-id="${student.id}">编辑</button>
                    <button class="btn btn-danger btn-icon-small btn-delete" data-student-id="${student.id}">删除</button>
                </div>
            </div>
        `).join('');

        console.log('RosterManager: Generated HTML length:', htmlContent.length);
        rosterList.innerHTML = htmlContent;

        if (students.length === 0) {
            console.log('RosterManager: No students found, showing empty state');
            rosterList.innerHTML = '<div class="empty-state">暂无学生数据</div>';
        } else {
            console.log('RosterManager: Successfully rendered', students.length, 'students');
        }
    }

    /**
     * 搜索学生
     * @param {string} term - 搜索词
     */
    search(term) {
        this.searchTerm = term;
        this.render();
    }

    /**
     * 获取选中的学生ID
     * @returns {Array} 学生ID数组
     */
    getSelectedStudentIds() {
        const checkboxes = document.querySelectorAll('.student-select-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.dataset.studentId);
    }

    /**
     * 全选/取消全选
     * @param {boolean} select - 是否全选
     */
    selectAll(select = true) {
        const checkboxes = document.querySelectorAll('.student-select-checkbox');
        checkboxes.forEach(cb => cb.checked = select);
    }

    /**
     * 检查是否有选中的学生
     * @returns {boolean} 是否有选中学生
     */
    hasSelectedStudents() {
        return this.getSelectedStudentIds().length > 0;
    }

    /**
     * 添加学生
     * @param {Object} studentData - 学生数据
     */
    addStudent(studentData) {
        const student = new Student(studentData);
        const validation = student.validate();

        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // 检查学号是否重复
        if (Student.isDuplicateStudentId(this.attendanceService.students, student.studentId)) {
            throw new Error('学号已存在');
        }

        this.attendanceService.students.push(student);
        this.attendanceService.saveData();
        this.render();

        return student;
    }

    /**
     * 编辑学生
     * @param {string} studentId - 学生ID
     * @param {Object} updateData - 更新数据
     */
    updateStudent(studentId, updateData) {
        const index = this.attendanceService.students.findIndex(s => s.id === studentId);
        if (index === -1) {
            throw new Error('学生不存在');
        }

        const student = this.attendanceService.students[index];
        const updatedStudent = student.update(updateData);
        const validation = updatedStudent.validate();

        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // 检查学号是否重复（排除自己）
        if (updateData.studentId &&
            Student.isDuplicateStudentId(this.attendanceService.students, updateData.studentId, studentId)) {
            throw new Error('学号已存在');
        }

        this.attendanceService.students[index] = updatedStudent;
        this.attendanceService.saveData();
        this.render();

        return updatedStudent;
    }

    /**
     * 删除学生
     * @param {string} studentId - 学生ID
     */
    deleteStudent(studentId) {
        const index = this.attendanceService.students.findIndex(s => s.id === studentId);
        if (index === -1) {
            throw new Error('学生不存在');
        }

        // 确认删除
        if (!confirm('确定要删除这个学生吗？相关考勤记录将保留但不会显示。')) {
            return false;
        }

        // 停用学生而不是物理删除
        this.attendanceService.students[index].setActive(false);
        this.attendanceService.saveData();
        this.render();

        return true;
    }

    /**
     * 删除多个学生
     * @param {Array} studentIds - 学生ID数组
     * @returns {Object} 删除结果
     */
    deleteStudents(studentIds) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const studentId of studentIds) {
            try {
                const index = this.attendanceService.students.findIndex(s => s.id === studentId);
                if (index === -1) {
                    results.failed++;
                    results.errors.push(`学生 ${studentId} 不存在`);
                    continue;
                }

                // 停用学生而不是物理删除
                this.attendanceService.students[index].setActive(false);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`删除学生 ${studentId} 失败: ${error.message}`);
            }
        }

        if (results.success > 0) {
            this.attendanceService.saveData();
            this.render();
        }

        return results;
    }

    /**
     * 获取批量删除确认HTML
     * @param {Array} studentIds - 学生ID数组
     * @returns {string} 确认对话框HTML
     */
    getBatchDeleteConfirmHTML(studentIds) {
        const students = this.attendanceService.students.filter(s => studentIds.includes(s.id) && s.active);
        return `
            <div class="batch-delete-confirm">
                <h3>确认批量删除</h3>
                <p>您确定要删除 ${students.length} 个学生吗？相关考勤记录将保留但不会显示。</p>
                <div class="batch-delete-list">
                    ${students.map(s => `
                        <div class="batch-delete-item">
                            <input type="checkbox" id="student_${s.id}" value="${s.id}" checked>
                            <label for="student_${s.id}">${s.name} (${s.studentId})</label>
                        </div>
                    `).join('')}
                </div>
                <div class="batch-delete-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">取消</button>
                    <button type="button" class="btn btn-danger" id="confirmBatchDelete">确认删除</button>
                </div>
            </div>
        `;
    }

    /**
     * 获取学生编辑表单HTML
     * @param {Student|null} student - 学生对象（编辑时传入）
     * @returns {string} 表单HTML
     */
    getStudentFormHTML(student = null) {
        return `
            <form id="studentForm">
                <div class="form-group">
                    <label for="studentName">姓名 *</label>
                    <input type="text" id="studentName" required value="${student ? student.name : ''}">
                </div>
                <div class="form-group">
                    <label for="studentStudentId">学号 *</label>
                    <input type="text" id="studentStudentId" required value="${student ? student.studentId : ''}">
                </div>
                <div class="form-group">
                    <label for="studentEmail">邮箱</label>
                    <input type="email" id="studentEmail" value="${student ? student.email || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="studentCity">城市</label>
                    <input type="text" id="studentCity" value="${student && student.location ? student.location.city || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="studentCountry">国家</label>
                    <input type="text" id="studentCountry" value="${student && student.location ? student.location.country || '' : ''}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">${student ? '更新' : '添加'}</button>
                </div>
            </form>
        `;
    }
}