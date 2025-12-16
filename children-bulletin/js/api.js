// Nano Banana Pro API 集成
class NanoBananaAPI {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API密钥不能为空');
        }

        this.apiKey = apiKey;
        this.baseUrl = 'https://api.kie.ai/api/v1';
        this.defaultTimeout = 30000; // 30秒超时
        this.pollInterval = 1000;   // 1秒轮询间隔
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new NanoBananaAPIError(
                    errorData.msg || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorData.code
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof NanoBananaAPIError) {
                throw error;
            }

            if (error.name === 'TypeError') {
                throw new NanoBananaAPIError('网络错误，请检查网络连接', 0, 'NETWORK_ERROR');
            }

            throw new NanoBananaAPIError(error.message, 0, 'UNKNOWN_ERROR');
        }
    }

    // 创建生成任务
    async createTask(prompt, options = {}) {
        // 验证必需参数
        if (!prompt || typeof prompt !== 'string') {
            throw new NanoBananaAPIError('提示词不能为空', 0, 'INVALID_PROMPT');
        }

        // 构建请求参数
        const params = {
            model: 'nano-banana-pro',
            input: {
                prompt: prompt.trim(),
                image_input: [],
                aspect_ratio: options.aspectRatio || '3:4',
                resolution: options.resolution || '4K',
                output_format: options.outputFormat || 'png'
            }
        };

        // 添加可选参数
        if (options.callBackUrl) {
            params.callBackUrl = options.callBackUrl;
        }

        // 验证提示词长度
        if (params.input.prompt.length > 10000) {
            throw new NanoBananaAPIError('提示词长度不能超过10000字符', 0, 'PROMPT_TOO_LONG');
        }

        const response = await this.request('/jobs/createTask', {
            method: 'POST',
            body: JSON.stringify(params)
        });

        // 验证响应
        if (response.code !== 200) {
            throw new NanoBananaAPIError(response.msg || '创建任务失败', response.code);
        }

        if (!response.data || !response.data.taskId) {
            throw new NanoBananaAPIError('API返回数据格式错误', 0, 'INVALID_RESPONSE');
        }

        return {
            taskId: response.data.taskId,
            prompt: params.input.prompt,
            options: params.input
        };
    }

    // 查询任务状态
    async getTaskStatus(taskId) {
        if (!taskId) {
            throw new NanoBananaAPIError('任务ID不能为空', 0, 'INVALID_TASK_ID');
        }

        const response = await this.request(`/jobs/recordInfo?taskId=${taskId}`, {
            method: 'GET'
        });

        if (response.code !== 200) {
            throw new NanoBananaAPIError(response.msg || '查询任务状态失败', response.code);
        }

        return response.data;
    }

    // 轮询直到任务完成
    async waitForTask(taskId, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        const interval = options.interval || this.pollInterval;
        const startTime = Date.now();

        // 显示初始状态
        if (options.onProgress) {
            options.onProgress(0, '开始生成...');
        }

        while (Date.now() - startTime < timeout) {
            try {
                const status = await this.getTaskStatus(taskId);

                // 计算进度（简化版）
                let progress = 0;
                let message = '准备中...';

                switch (status.state) {
                    case 'waiting':
                        progress = 10;
                        message = '排队中，请稍候...';
                        break;
                    case 'processing':
                        progress = 50;
                        message = 'AI正在绘画中...';
                        break;
                    case 'success':
                        progress = 100;
                        message = '生成完成！';
                        return {
                            success: true,
                            data: status,
                            progress: 100
                        };
                    case 'fail':
                        progress = 100;
                        message = '生成失败';
                        throw new NanoBananaAPIError(
                            status.failMsg || '任务执行失败',
                            0,
                            'TASK_FAILED'
                        );
                    default:
                        progress = 20;
                        message = '处理中...';
                }

                // 更新进度
                if (options.onProgress) {
                    options.onProgress(progress, message);
                }

                // 如果任务还在处理中，等待下一次轮询
                if (status.state === 'waiting' || status.state === 'processing') {
                    await new Promise(resolve => setTimeout(resolve, interval));
                }

            } catch (error) {
                if (error instanceof NanoBananaAPIError) {
                    throw error;
                }
                throw new NanoBananaAPIError('轮询任务状态时发生错误', 0, 'POLL_ERROR');
            }
        }

        throw new NanoBananaAPIError(`任务超时（${timeout / 1000}秒）`, 0, 'TIMEOUT');
    }

    // 完整的生成流程
    async generateImage(prompt, options = {}) {
        try {
            // 创建任务
            if (options.onProgress) {
                options.onProgress(10, '提交生成任务...');
            }

            const task = await this.createTask(prompt, options);

            // 等待任务完成
            const result = await this.waitForTask(task.taskId, {
                timeout: options.timeout,
                interval: options.pollInterval,
                onProgress: options.onProgress
            });

            // 解析结果
            let imageUrl = null;
            try {
                const resultData = JSON.parse(result.data.resultJson);
                imageUrl = resultData.resultUrls && resultData.resultUrls[0];

                if (!imageUrl) {
                    throw new Error('未找到图片URL');
                }
            } catch (error) {
                throw new NanoBananaAPIError('解析结果失败', 0, 'PARSE_ERROR');
            }

            return {
                success: true,
                imageUrl,
                taskId: task.taskId,
                prompt: task.prompt,
                data: result.data
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    // 快速生成（简化接口）
    async generate(prompt, options = {}) {
        const defaultOptions = {
            aspectRatio: '3:4',
            resolution: '2K',
            outputFormat: 'png',
            timeout: this.defaultTimeout,
            pollInterval: this.pollInterval
        };

        const finalOptions = { ...defaultOptions, ...options };

        return await this.generateImage(prompt, finalOptions);
    }
}

// 自定义错误类
class NanoBananaAPIError extends Error {
    constructor(message, statusCode = 0, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'NanoBananaAPIError';
        this.statusCode = statusCode;
        this.code = code;

        // 确保错误堆栈正确
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NanoBananaAPIError);
        }
    }
}

// 错误代码映射
const ERROR_CODES = {
    NETWORK_ERROR: '网络连接错误',
    TIMEOUT: '请求超时',
    INVALID_PROMPT: '无效的提示词',
    PROMPT_TOO_LONG: '提示词过长',
    INVALID_TASK_ID: '无效的任务ID',
    TASK_FAILED: '任务执行失败',
    PARSE_ERROR: '结果解析失败',
    INSUFFICIENT_BALANCE: '账户余额不足',
    RATE_LIMITED: '请求频率超限',
    AUTHENTICATION_FAILED: '认证失败',
    NOT_FOUND: '资源不存在',
    INTERNAL_ERROR: '服务器内部错误',
    UNKNOWN_ERROR: '未知错误'
};

// 工具函数
function getErrorMessage(code) {
    return ERROR_CODES[code] || '未知错误';
}

// 导出为全局变量（用于非模块环境）
if (typeof window !== 'undefined') {
    window.NanoBananaAPI = NanoBananaAPI;
    window.NanoBananaAPIError = NanoBananaAPIError;
    window.getErrorMessage = getErrorMessage;
}

// 如果是模块环境，也支持 ES6 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NanoBananaAPI, NanoBananaAPIError, getErrorMessage };
}