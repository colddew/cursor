// 提示词生成器
class PromptGenerator {
    constructor() {
        // 加载提示词模板
        this.template = this.loadTemplate();
        this.defaultTitles = this.getDefaultTitles();
    }

    // 加载提示词模板
    loadTemplate() {
        return `Generate a vibrant English learning poster for teenagers titled "{{title}}", vertical A4 layout, educational newspaper style, suitable for 10-16 year olds learning English through pictures.

# I. Title Section (Top)

**Large centered title**: "{{title}}"
* **Style**: Educational newspaper / English learning poster
* **Text requirements**: Large, bold, cartoon handwritten font, colorful gradient outlines (using rainbow colors: red, orange, yellow, green, blue, purple)
* **Decorations**: Add {{theme}}-related colorful sticker-style decorations around the title, bright and eye-catching

# II. Main Scene (Center)

The center features a **cartoon illustration of a "{{theme}}" scene**:
* **Overall atmosphere**: Bright, warm, positive, engaging
* **Composition**: Clear object boundaries for easy text association, not overcrowded

**Scene zones and core content**:
1. **Core Zone A (Main activities)**: Show key {{theme}} activities
2. **Core Zone B (Tools & items)**: Display related equipment and objects
3. **Core Zone C (Environment)**: Show environmental features (walls, signs, etc.)

**Main character**:
* **Character**: 1 cute cartoon character (profession/identity matching {{theme}})
* **Action**: Naturally interacting with the scene

# III. Required Objects & Vocabulary List

**Must clearly draw the following objects and leave space for labels**:

**1. Core characters & facilities**:
{{coreObjects}}

**2. Common items/tools**:
{{commonItems}}

**3. Environment & decorations**:
{{environmentItems}}

# IV. Labeling Rules

For each object above, attach educational labels with:
* **Format**: Three-line style (Line 1: English word, Line 2: Chinese characters, Line 3: phonetic symbols)
* **Style**: Colorful sticker style, each label with different vibrant background colors (pink, light blue, light green, yellow, orange), dark text for high contrast
* **Typography**: Fun, playful fonts suitable for children, rounded letters
* **Layout**: Labels positioned near corresponding objects without obscuring the main illustration

# V. Art Style Parameters
* **Style**: Children's picture book + educational poster
* **Color palette**: High saturation, bright, warm tones with rainbow accents (High Saturation, Warm Tone)
* **Text treatment**: All text elements should be colorful with gradient effects, shadows, or outlines to make them pop
* **Quality**: 8k resolution, high detail, vector illustration style, clean lines, professional printing quality`;
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
            return 'None';
        }

        // 限制数量并随机打乱
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, maxCount);

        return selected.map(word => {
            // 确保音标格式正确 - 确保两侧都有斜线
            let phonetic = word.phonetic || '';
            if (!phonetic.startsWith('/')) {
                phonetic = `/${phonetic}`;
            }
            if (!phonetic.endsWith('/')) {
                phonetic = `${phonetic}/`;
            }
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