// 提示词生成器
class PromptGenerator {
    constructor() {
        // 加载提示词模板
        this.template = this.loadTemplate();
        this.defaultTitles = this.getDefaultTitles();
    }

    // 加载提示词模板
    loadTemplate() {
        return `请生成一张青少年学英语小报《{{title}}》，竖版 A4，学习小报版式，适合 10-16 岁青少年 看图学英语

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{title}}》
* **风格**：学习小报 / 英语学习报
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{theme}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{theme}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{theme}} 的核心活动
2.  **核心区域 B（配套设施）**：展示相关的工具或物品
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{theme}} 匹配）
* **动作**：正在进行与场景相关的自然互动

# 三、必画物体与单词清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{coreObjects}}

**2. 常见物品/工具：**
{{commonItems}}

**3. 环境与装饰：**
{{environmentItems}}

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：三行制（第一行英文，第二行简体汉字，第三行英语音标）
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读
* **排版**：标签靠近对应的物体，不遮挡主体

# 五、画风参数
* **风格**：青少年绘本 + 英语小报
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines`;
    }

    // 获取默认标题
    getDefaultTitles() {
        return {
            'daily-life': {
                home: '温馨家庭',
                neighborhood: '快乐社区'
            },
            'shopping': {
                supermarket: '超市购物',
                market: '市场淘宝'
            },
            'school': {
                classroom: '智慧课堂',
                library: '书香图书馆',
                playground: '活力操场'
            },
            'entertainment': {
                'game-center': '游戏天堂',
                cinema: '电影院奇遇'
            },
            'health': {
                hospital: '健康守护',
                gym: '健身时光',
                'healthy-food': '营养美食'
            },
            'travel': {
                airport: '机场旅程',
                hotel: '温馨酒店',
                attraction: '景点探秘'
            }
        };
    }

    // 生成完整提示词
    generatePrompt(options = {}) {
        // 验证必需参数
        if (!options.theme || !options.theme.name) {
            throw new Error('主题信息不能为空');
        }

        if (!options.vocabulary || !Array.isArray(options.vocabulary)) {
            throw new Error('词汇列表不能为空');
        }

        // 获取标题
        const title = this.getTitle(options);

        // 按类别分组词汇
        const categorizedVocabulary = this.categorizeVocabulary(options.vocabulary);

        // 生成词汇列表
        const coreObjects = this.generateVocabularyList(categorizedVocabulary.character, 5);
        const commonItems = this.generateVocabularyList(categorizedVocabulary.object, 8);
        const environmentItems = this.generateVocabularyList(categorizedVocabulary.environment, 5);

        // 替换模板变量
        let prompt = this.template
            .replace(/{{title}}/g, title)
            .replace(/{{theme}}/g, options.theme.name)
            .replace('{{coreObjects}}', coreObjects)
            .replace('{{commonItems}}', commonItems)
            .replace('{{environmentItems}}', environmentItems);

        // 添加场景信息
        if (options.scene && options.scene.name) {
            prompt = prompt.replace(/{{theme}}/g, `${options.theme.name} - ${options.scene.name}`);
        }

        // 添加可选的额外描述
        if (options.description) {
            prompt += `\n\n# 额外说明\n${options.description}`;
        }

        return prompt;
    }

    // 获取标题
    getTitle(options) {
        // 如果用户提供了自定义标题，优先使用
        if (options.customTitle && options.customTitle.trim()) {
            return options.customTitle.trim();
        }

        // 获取场景特定标题
        if (options.theme && options.scene && this.defaultTitles[options.theme.id]) {
            const sceneTitles = this.defaultTitles[options.theme.id];
            if (sceneTitles[options.scene.id]) {
                return sceneTitles[options.scene.id];
            }
        }

        // 使用默认标题格式
        return `走进${options.theme.name}`;
    }

    // 按类别分组词汇
    categorizeVocabulary(vocabulary) {
        const categories = {
            character: [],    // 角色
            object: [],       // 物品
            environment: [],  // 环境
            action: []        // 动作
        };

        vocabulary.forEach(word => {
            if (categories.hasOwnProperty(word.category)) {
                categories[word.category].push(word);
            } else {
                // 如果类别不存在，默认归为物品
                categories.object.push(word);
            }
        });

        return categories;
    }

    // 生成词汇列表字符串
    generateVocabularyList(words, maxCount) {
        if (!words || words.length === 0) {
            return '无';
        }

        // 限制数量并随机打乱
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, maxCount);

        return selected.map(word => {
            // 确保音标格式正确
            const phonetic = word.phonetic.startsWith('/') ? word.phonetic : `/${word.phonetic}/`;
            return `${word.english} ${phonetic} ${word.chinese}`;
        }).join(', ');
    }

    // 生成简化提示词（用于快速预览）
    generateSimplePrompt(theme, vocabulary, customTitle = '') {
        const title = customTitle || `走进${theme}`;
        const words = vocabulary.slice(0, 10).map(v => `${v.english}/${v.chinese}`).join(', ');

        return `Generate a colorful English learning poster for teenagers titled "${title}".
Include vocabulary: ${words}.
Style: cartoon illustration, bright colors, clean layout, 8K quality, suitable for 10-16 year old students.`;
    }

    // 从现有提示词提取信息
    extractInfoFromPrompt(prompt) {
        const info = {
            title: '',
            theme: '',
            vocabulary: []
        };

        // 提取标题
        const titleMatch = prompt.match(/《([^》]+)》/);
        if (titleMatch) {
            info.title = titleMatch[1];
        }

        // 提取主题
        const themeMatch = prompt.match(/「([^」]+)」/);
        if (themeMatch) {
            info.theme = themeMatch[1];
        }

        // 提取词汇列表
        const vocabularyMatches = prompt.match(/([a-zA-Z]+) \/([^\/]+)\/ ([\u4e00-\u9fa5]+)/g);
        if (vocabularyMatches) {
            info.vocabulary = vocabularyMatches.map(match => {
                const parts = match.match(/([a-zA-Z]+) \/([^\/]+)\/ ([\u4e00-\u9fa5]+)/);
                if (parts) {
                    return {
                        english: parts[1],
                        phonetic: parts[2],
                        chinese: parts[3],
                        category: 'object' // 默认类别
                    };
                }
                return null;
            }).filter(v => v !== null);
        }

        return info;
    }

    // 验证提示词
    validatePrompt(prompt) {
        const errors = [];

        // 检查长度
        if (prompt.length > 10000) {
            errors.push('提示词长度不能超过10000字符');
        }

        // 检查必需的部分
        const requiredSections = ['小报标题区', '小报主体', '必画物体与单词清单'];
        requiredSections.forEach(section => {
            if (!prompt.includes(section)) {
                errors.push(`缺少必需部分：${section}`);
            }
        });

        // 检查词汇数量
        const vocabularyCount = (prompt.match(/[a-zA-Z]+ \/[^\/]+\/ [\u4e00-\u9fa5]+/g) || []).length;
        if (vocabularyCount < 5) {
            errors.push('词汇数量过少，建议至少包含5个词汇');
        }

        return {
            isValid: errors.length === 0,
            errors,
            vocabularyCount
        };
    }

    // 优化提示词
    optimizePrompt(prompt) {
        let optimized = prompt;

        // 确保格式正确
        optimized = optimized.replace(/^[ \t]+/gm, ''); // 移除行首空格
        optimized = optimized.replace(/\n{3,}/g, '\n\n'); // 减少多余空行

        // 确保词汇格式统一
        optimized = optimized.replace(/([a-zA-Z]+)\s+\/([^\/]+)\/\s*([\u4e00-\u9fa5]+)/g, '$1 /$2/ $3');

        // 添加质量关键词（如果不存在）
        if (!optimized.includes('8k') && !optimized.includes('high quality')) {
            optimized = optimized.replace(
                /质量.*$/,
                '质量：8k resolution, high detail, vector illustration style, clean lines'
            );
        }

        return optimized;
    }

    // 获取提示词统计信息
    getPromptStats(prompt) {
        const stats = {
            length: prompt.length,
            wordCount: prompt.split(/\s+/).length,
            vocabularyCount: 0,
            sections: []
        };

        // 统计词汇
        stats.vocabularyCount = (prompt.match(/[a-zA-Z]+ \/[^\/]+\/ [\u4e00-\u9fa5]+/g) || []).length;

        // 统计章节
        const sectionMatches = prompt.match(/^# ([^\n]+)/gm);
        if (sectionMatches) {
            stats.sections = sectionMatches.map(match => match.replace(/^# /, ''));
        }

        return stats;
    }
}

// 导出
export default PromptGenerator;

// 工具函数
export function createPromptGenerator() {
    return new PromptGenerator();
}