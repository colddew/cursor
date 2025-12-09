// CSV解析工具类
class CSVParser {
    /**
     * 解析CSV内容
     * @param {string} csvText - CSV文本内容
     * @param {Object} options - 解析选项
     * @returns {Array} 解析后的数据数组
     */
    static parse(csvText, options = {}) {
        const {
            delimiter = ',',
            quote = '"',
            escape = '"',
            header = true,
            skipEmptyLines = true,
            trim = true
        } = options;

        if (!csvText || typeof csvText !== 'string') {
            throw new Error('CSV内容不能为空');
        }

        const lines = this._splitLines(csvText);
        if (lines.length === 0) {
            throw new Error('CSV文件为空');
        }

        const result = [];
        let headers = [];

        // 解析表头
        if (header) {
            headers = this._parseLine(lines[0], { delimiter, quote, escape, trim });
            if (headers.some(h => !h)) {
                throw new Error('CSV表头包含空列');
            }
        }

        // 解析数据行
        for (let i = header ? 1 : 0; i < lines.length; i++) {
            const line = lines[i];

            // 跳过空行
            if (skipEmptyLines && !line.trim()) {
                continue;
            }

            const values = this._parseLine(line, { delimiter, quote, escape, trim });

            // 跳过空行
            if (skipEmptyLines && values.every(v => !v)) {
                continue;
            }

            if (header) {
                // 如果列数不匹配，用空值填充
                while (values.length < headers.length) {
                    values.push('');
                }

                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                result.push(row);
            } else {
                result.push(values);
            }
        }

        return result;
    }

    /**
     * 将数据转换为CSV格式
     * @param {Array} data - 数据数组
     * @param {Object} options - 转换选项
     * @returns {string} CSV字符串
     */
    static stringify(data, options = {}) {
        const {
            delimiter = ',',
            quote = '"',
            escape = '"',
            header = true,
            trim = true
        } = options;

        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const lines = [];
        const headers = header ? Object.keys(data[0]) : [];

        // 添加表头
        if (header) {
            lines.push(this._arrayToCSV(headers, { delimiter, quote, escape, trim }));
        }

        // 添加数据行
        data.forEach(row => {
            const values = headers.map(header => row[header] || '');
            lines.push(this._arrayToCSV(values, { delimiter, quote, escape, trim }));
        });

        return lines.join('\n');
    }

    /**
     * 验证CSV文件内容
     * @param {string} csvText - CSV文本内容
     * @param {Array} requiredFields - 必需的字段列表
     * @returns {Object} 验证结果
     */
    static validate(csvText, requiredFields = []) {
        try {
            const data = this.parse(csvText);
            const errors = [];
            const warnings = [];

            // 检查是否有数据
            if (data.length === 0) {
                errors.push('CSV文件没有数据行');
                return { valid: false, errors, warnings };
            }

            // 检查必需字段
            const headers = Object.keys(data[0]);
            requiredFields.forEach(field => {
                if (!headers.includes(field)) {
                    errors.push(`缺少必需字段: ${field}`);
                }
            });

            // 检查每一行的数据
            data.forEach((row, index) => {
                requiredFields.forEach(field => {
                    if (!row[field] || !row[field].trim()) {
                        warnings.push(`第${index + 1}行: ${field}为空`);
                    }
                });
            });

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                rowCount: data.length,
                headers
            };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message],
                warnings: []
            };
        }
    }

    /**
     * 分割CSV文本为行
     * @param {string} text - CSV文本
     * @returns {Array} 行数组
     */
    static _splitLines(text) {
        // 处理不同的换行符
        return text.split(/\r?\n/);
    }

    /**
     * 解析CSV行
     * @param {string} line - CSV行
     * @param {Object} options - 解析选项
     * @returns {Array} 值数组
     */
    static _parseLine(line, options) {
        const { delimiter, quote, escape, trim } = options;
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === quote) {
                if (inQuotes) {
                    if (nextChar === quote) {
                        // 转义的引号
                        currentValue += quote;
                        i += 2;
                    } else {
                        // 结束引号
                        inQuotes = false;
                        i++;
                    }
                } else {
                    // 开始引号
                    inQuotes = true;
                    i++;
                }
            } else if (char === delimiter && !inQuotes) {
                // 字段分隔符
                values.push(trim ? currentValue.trim() : currentValue);
                currentValue = '';
                i++;
            } else {
                // 普通字符
                currentValue += char;
                i++;
            }
        }

        // 添加最后一个值
        values.push(trim ? currentValue.trim() : currentValue);

        return values;
    }

    /**
     * 将数组转换为CSV行
     * @param {Array} values - 值数组
     * @param {Object} options - 转换选项
     * @returns {string} CSV行
     */
    static _arrayToCSV(values, options) {
        const { delimiter, quote, escape } = options;

        return values.map(value => {
            // 转换为字符串
            value = value === null || value === undefined ? '' : String(value);

            // 如果包含分隔符、引号或换行符，需要用引号包围
            if (value.includes(delimiter) || value.includes(quote) || value.includes('\n')) {
                // 转义引号
                value = value.replace(new RegExp(quote, 'g'), escape + quote);
                return quote + value + quote;
            }

            return value;
        }).join(delimiter);
    }

    /**
     * 检测CSV分隔符
     * @param {string} csvText - CSV文本
     * @returns {string} 检测到的分隔符
     */
    static detectDelimiter(csvText) {
        const firstLine = csvText.split('\n')[0];
        const delimiters = [',', ';', '\t', '|'];
        let maxCount = 0;
        let detectedDelimiter = ',';

        delimiters.forEach(delimiter => {
            const count = (firstLine.match(new RegExp('\\' + delimiter, 'g')) || []).length;
            if (count > maxCount) {
                maxCount = count;
                detectedDelimiter = delimiter;
            }
        });

        return detectedDelimiter;
    }

    /**
     * 智能解析CSV（自动检测分隔符）
     * @param {string} csvText - CSV文本
     * @param {Object} options - 解析选项
     * @returns {Array} 解析后的数据
     */
    static smartParse(csvText, options = {}) {
        const detectedDelimiter = this.detectDelimiter(csvText);
        return this.parse(csvText, { ...options, delimiter: detectedDelimiter });
    }
}

// 导出到全局作用域
window.CSVParser = CSVParser;