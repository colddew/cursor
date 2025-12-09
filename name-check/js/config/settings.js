// 应用配置
window.AppConfig = {
    // 数据存储配置
    storage: {
        prefix: 'attendance_system_',
        version: '1.0.0',
        // 数据过期时间（毫秒），0表示永不过期
        expiration: 0
    },

    // 考勤设置
    attendance: {
        // 迟到阈值（分钟）
        tardyThreshold: 5,
        // 迟到学生权重倍数
        tardyWeightMultiplier: 2.5,
        // 最近迟到天数的额外权重
        recentTardyDays: 7,
        // 最近迟到额外权重
        recentTardyWeight: 0.5
    },

    // 默认导出字段
    export: {
        defaultFields: ['name', 'studentId', 'date', 'status', 'tardyMinutes', 'notes'],
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss'
    },

    // 随机选择配置
    selection: {
        defaultCount: 3,
        animationDuration: 2000,
        preventSameDaySelection: true
    },

    // 日期格式配置
    dateFormats: {
        display: 'YYYY年MM月DD日',
        storage: 'YYYY-MM-DD',
        dateTime: 'YYYY-MM-DD HH:mm:ss'
    },

    // UI配置
    ui: {
        pageSize: 20,
        debounceDelay: 300,
        animationDuration: 300
    },

    // 考勤状态
    attendanceStatus: {
        PRESENT: 'present',
        TARDY: 'tardy',
        ABSENT: 'absent',
        EXCUSED: 'excused'
    },

    // 状态显示文本
    statusText: {
        present: '到场',
        tardy: '迟到',
        absent: '缺勤',
        excused: '请假'
    },

    // 状态对应的CSS类
    statusClasses: {
        present: 'status-present',
        tardy: 'status-tardy',
        absent: 'status-absent',
        excused: 'status-excused',
        pending: 'status-pending'
    }
};

// 数据键名常量
window.DataKeys = {
    STUDENTS: 'students',
    ATTENDANCE: 'attendance',
    SESSIONS: 'sessions',
    SETTINGS: 'settings',
    CURRENT_SESSION: 'current_session'
};

// 错误消息
window.ErrorMessages = {
    STORAGE_FULL: '存储空间已满',
    INVALID_CSV: 'CSV文件格式不正确',
    DUPLICATE_STUDENT: '学生已存在',
    STUDENT_NOT_FOUND: '未找到该学生',
    NETWORK_ERROR: '网络错误',
    PERMISSION_DENIED: '权限不足'
};

// 成功消息
window.SuccessMessages = {
    IMPORT_SUCCESS: '导入成功',
    SAVE_SUCCESS: '保存成功',
    DELETE_SUCCESS: '删除成功',
    EXPORT_SUCCESS: '导出成功'
};