class LineCalendar {
    constructor() {
        // 复用原有的考试日期数据
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
        
        this.container = document.querySelector('.calendar-line-container');
        this.renderAllMonths();
        this.initCountdown();
        this.initDownloadButtons();
    }

    // 添加倒计时初始化方法
    initCountdown() {
        const countdownElement = document.querySelector('.countdown');
        const examDate = new Date('2025-06-07'); // 高考第一天
        
        const updateCountdown = () => {
            const now = new Date();
            const diffTime = examDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
                countdownElement.textContent = `距离高考还有 ${diffDays} 天`;
            } else if (diffDays === 0) {
                countdownElement.textContent = '今天高考加油！';
            } else {
                countdownElement.textContent = '2025高考已结束';
            }
        };

        // 初始更新
        updateCountdown();
        
        // 每秒更新一次
        setInterval(updateCountdown, 1000);
    }

    // 添加下载功能初始化
    initDownloadButtons() {
        const downloadAllBtn = document.querySelector('.download-all-btn');
        downloadAllBtn.addEventListener('click', () => this.downloadAllMonths());
    }

    // 修改单个月份下载功能
    async downloadMonth(monthElement, monthName) {
        // 临时隐藏下载按钮
        const downloadBtn = monthElement.querySelector('.download-btn');
        downloadBtn.style.display = 'none';
        
        try {
            // 提高图片质量的设置
            const canvas = await html2canvas(monthElement, {
                backgroundColor: '#ffffff',
                scale: 3, // 增加缩放比例，提高清晰度
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 0,
                removeContainer: true,
                // 优化文字渲染
                letterRendering: true,
                // 使用更好的缩放算法
                windowWidth: monthElement.scrollWidth * 3,
                windowHeight: monthElement.scrollHeight * 3
            });
            
            // 使用更高质量的图片格式和设置
            const link = document.createElement('a');
            link.download = `2025年${monthName}日历.png`;
            link.href = canvas.toDataURL('image/png', 1.0); // 使用最高质量设置
            link.click();
        } catch (error) {
            console.error('导出图片失败:', error);
        } finally {
            // 恢复下载按钮显示
            downloadBtn.style.display = 'block';
        }
    }

    // 修改批量下载功能
    async downloadAllMonths() {
        const months = document.querySelectorAll('.month-calendar');
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                          '七月', '八月', '九月', '十月', '十一月', '十二月'];
        
        // 临时隐藏所有下载按钮
        const allButtons = document.querySelectorAll('.download-btn');
        allButtons.forEach(btn => btn.style.display = 'none');
        
        try {
            for (let i = 0; i < months.length; i++) {
                await this.downloadMonth(months[i], monthNames[i]);
                // 添加延时防止浏览器阻止多次下载
                if (i < months.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } finally {
            // 恢复所有下载按钮显示
            allButtons.forEach(btn => btn.style.display = 'block');
        }
    }

    createMonthCalendar(year, month) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-calendar';
        
        // 创建下载按钮容器，使其位于右上角
        const downloadBtnContainer = document.createElement('div');
        downloadBtnContainer.className = 'download-btn-container';
        
        // 创建下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.title = '下载本月';
        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                              '七月', '八月', '九月', '十月', '十一月', '十二月'];
            this.downloadMonth(monthDiv, monthNames[month]);
        };
        
        // 创建下载图标
        const downloadIcon = document.createElement('div');
        downloadIcon.className = 'download-icon';
        downloadBtn.appendChild(downloadIcon);
        
        downloadBtnContainer.appendChild(downloadBtn);
        monthDiv.appendChild(downloadBtnContainer);

        // 月份标题
        const monthNames = ['一　月', '二　月', '三　月', '四　月', '五　月', '六　月',
                          '七　月', '八　月', '九　月', '十　月', '十一月', '十二月'];
        const header = document.createElement('div');
        header.className = 'month-header';
        header.textContent = monthNames[month];

        // 创建日历内容容器
        const calendarContent = document.createElement('div');
        calendarContent.className = 'calendar-content';

        // 星期标题
        const weekdays = document.createElement('div');
        weekdays.className = 'weekdays';
        ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            weekdays.appendChild(dayDiv);
        });

        // 日期网格
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        // 复用原有的日期生成逻辑
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayIndex = firstDay.getDay();
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

        calendarContent.appendChild(weekdays);
        calendarContent.appendChild(daysGrid);
        monthDiv.appendChild(header);
        monthDiv.appendChild(calendarContent);
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
    new LineCalendar();
}); 