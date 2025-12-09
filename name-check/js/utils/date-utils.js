// 日期工具类
class DateUtils {
    /**
     * 格式化日期
     * @param {Date|string} date - 日期对象或日期字符串
     * @param {string} format - 格式模板
     * @returns {string} 格式化后的日期
     */
    static format(date, format = 'YYYY-MM-DD') {
        if (!date) return '';

        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace(/YYYY/g, year)
            .replace(/MM/g, month)
            .replace(/DD/g, day)
            .replace(/HH/g, hours)
            .replace(/mm/g, minutes)
            .replace(/ss/g, seconds);
    }

    /**
     * 获取今天的日期字符串
     * @returns {string} 今天的日期 (YYYY-MM-DD)
     */
    static today() {
        return this.format(new Date(), 'YYYY-MM-DD');
    }

    /**
     * 获取当前日期时间字符串
     * @returns {string} 当前日期时间 (YYYY-MM-DD HH:mm:ss)
     */
    static now() {
        return this.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    }

    /**
     * 获取当前时间字符串
     * @returns {string} 当前时间 (HH:mm:ss)
     */
    static currentTime() {
        return this.format(new Date(), 'HH:mm:ss');
    }

    /**
     * 计算两个日期之间的天数差
     * @param {Date|string} date1 - 日期1
     * @param {Date|string} date2 - 日期2
     * @returns {number} 天数差
     */
    static daysDiff(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const timeDiff = d2.getTime() - d1.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }

    /**
     * 计算迟到分钟数
     * @param {string} checkInTime - 签到时间
     * @param {string} startTime - 开始时间
     * @returns {number} 迟到分钟数
     */
    static calculateTardyMinutes(checkInTime, startTime) {
        if (!checkInTime || !startTime) return 0;

        const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
        const [startHour, startMinute] = startTime.split(':').map(Number);

        const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
        const startTotalMinutes = startHour * 60 + startMinute;

        const tardyMinutes = checkInTotalMinutes - startTotalMinutes;
        return tardyMinutes > 0 ? tardyMinutes : 0;
    }

    /**
     * 检查是否是迟到的天数范围内
     * @param {Date|string} date - 检查的日期
     * @param {number} days - 天数范围
     * @returns {boolean} 是否在范围内
     */
    static isWithinRecentDays(date, days = 7) {
        const checkDate = new Date(date);
        const today = new Date();

        // 设置时间为午夜来避免时区问题
        checkDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const timeDiff = today.getTime() - checkDate.getTime();
        const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= days;
    }

    /**
     * 获取日期范围内的所有日期
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {string[]} 日期数组
     */
    static getDateRange(startDate, endDate) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        while (start <= end) {
            dates.push(this.format(start, 'YYYY-MM-DD'));
            start.setDate(start.getDate() + 1);
        }

        return dates;
    }

    /**
     * 获取星期几
     * @param {Date|string} date - 日期
     * @returns {string} 星期几
     */
    static getWeekday(date) {
        const d = new Date(date);
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[d.getDay()];
    }

    /**
     * 判断是否是工作日
     * @param {Date|string} date - 日期
     * @returns {boolean} 是否是工作日
     */
    static isWeekday(date) {
        const d = new Date(date);
        const day = d.getDay();
        return day >= 1 && day <= 5;
    }

    /**
     * 获取月份的第一天
     * @param {Date|string|number} year - 年份
     * @param {number} month - 月份 (1-12)
     * @returns {string} 月份的第一天
     */
    static getFirstDayOfMonth(year, month = new Date().getMonth() + 1) {
        if (typeof year === 'object') {
            const date = year;
            year = date.getFullYear();
            month = date.getMonth() + 1;
        } else if (typeof year === 'string') {
            year = parseInt(year);
        }

        return `${year}-${String(month).padStart(2, '0')}-01`;
    }

    /**
     * 获取月份的最后一天
     * @param {Date|string|number} year - 年份
     * @param {number} month - 月份 (1-12)
     * @returns {string} 月份的最后一天
     */
    static getLastDayOfMonth(year, month = new Date().getMonth() + 1) {
        if (typeof year === 'object') {
            const date = year;
            year = date.getFullYear();
            month = date.getMonth() + 1;
        } else if (typeof year === 'string') {
            year = parseInt(year);
        }

        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    /**
     * 验证日期字符串格式
     * @param {string} dateString - 日期字符串
     * @param {string} format - 期望的格式
     * @returns {boolean} 是否有效
     */
    static isValidFormat(dateString, format = 'YYYY-MM-DD') {
        if (format === 'YYYY-MM-DD') {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(dateString)) return false;

            const date = new Date(dateString);
            return !isNaN(date.getTime());
        }

        return false;
    }
}

// 导出到全局作用域
window.DateUtils = DateUtils;