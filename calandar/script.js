class Calendar {
    constructor() {
        this.examDates = {
            '2025-01-04': '英语四六级考试',
            '2025-06-14': '英语四六级考试',
            '2025-06-07': '浙江省高考 文化课',
            '2025-06-08': '浙江省高考 文化课',
            '2025-06-09': '浙江省高考 文化课',
            '2025-12-21': '研究生考试 政治/英语',
            '2025-12-22': '研究生考试 专业课1',
            '2025-12-23': '研究生考试 专业课2',
            '2025-03-15': '教资笔试',
            '2025-05-18': '教资面试',
            '2025-11-02': '教资笔试',
            '2025-03-23': '计算机等级考试',
            '2025-09-14': '计算机等级考试',
            '2025-01-08': '浙江省艺术统考',
            '2025-01-09': '浙江省艺术统考',
            '2025-02-15': '艺术校考开始',
            '2025-03-20': '艺术校考截止',
            '2025-04-15': '民航招飞初检',
            '2025-05-10': '空军招飞初选',
            '2025-05-20': '海军招飞选拔',
            '2025-04-20': '浙大综合评价报名',
            '2025-05-25': '浙大综合评价考试',
            '2025-03-28': '强基计划报名开始',
            '2025-04-10': '强基计划报名截止',
            '2025-05-11': '强基计划考试',
            '2025-03-10': '体育专业统考',
            '2025-04-08': '体育单招考试',
            '2025-03-01': '高水平运动队测试',
            '2025-03-25': '高水平艺术团考试',
            '2025-04-15': '三位一体综合评价',
            '2025-05-15': '高职提前招生考试'
        };
        
        this.container = document.querySelector('.calendar-grid-container');
        this.renderAllMonths();
    }

    getMonthExams(year, month) {
        const exams = new Set();
        Object.entries(this.examDates).forEach(([date, exam]) => {
            const examDate = new Date(date);
            if (examDate.getFullYear() === year && examDate.getMonth() === month) {
                exams.add(exam);
            }
        });
        return Array.from(exams);
    }

    createMonthCalendar(year, month) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-calendar';
        
        // 添加季度标识
        const quarter = Math.floor(month / 3) + 1;
        monthDiv.setAttribute('data-quarter', quarter);

        // 月份标题
        const monthNames = ['一　月', '二　月', '三　月', '四　月', '五　月', '六　月',
                          '七　月', '八　月', '九　月', '十　月', '十一月', '十二月'];
        const header = document.createElement('div');
        header.className = 'month-header';
        header.textContent = monthNames[month];
        monthDiv.appendChild(header);

        // 星期标题
        const weekdays = document.createElement('div');
        weekdays.className = 'weekdays';
        ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            weekdays.appendChild(dayDiv);
        });
        monthDiv.appendChild(weekdays);

        // 日期网格
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 获取当月第一天是星期几（0-6）
        const firstDayIndex = firstDay.getDay();
        
        // 获取上个月的最后几天
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // 填充上个月的日期
        for (let i = 0; i < firstDayIndex; i++) {
            const dayDiv = document.createElement('div');
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = prevMonthLastDay - firstDayIndex + i + 1;
            dayDiv.appendChild(dateNumber);
            dayDiv.className = 'other-month';
            daysGrid.appendChild(dayDiv);
        }

        // 填充当月日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayDiv = document.createElement('div');
            
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dayDiv.appendChild(dateNumber);

            const currentDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (this.examDates[currentDate]) {
                dayDiv.className = 'exam-day';
                const examInfo = document.createElement('div');
                examInfo.className = 'exam-info';
                examInfo.textContent = this.examDates[currentDate];
                dayDiv.appendChild(examInfo);
            }

            daysGrid.appendChild(dayDiv);
        }

        // 填充下个月的日期
        const remainingDays = 42 - (firstDayIndex + lastDay.getDate());
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = document.createElement('div');
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = i;
            dayDiv.appendChild(dateNumber);
            dayDiv.className = 'other-month';
            daysGrid.appendChild(dayDiv);
        }

        monthDiv.appendChild(daysGrid);
        return monthDiv;
    }

    renderAllMonths() {
        for (let month = 0; month < 12; month++) {
            const monthCalendar = this.createMonthCalendar(2025, month);
            this.container.appendChild(monthCalendar);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
}); 