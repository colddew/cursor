# 青少年英语小报生成器

一个基于 Web 的青少年英语学习小报生成系统，通过 AI 技术生成包含中英文对照的英语学习小报。

## 功能特性

### 🎯 核心功能
- **主题选择**: 提供多个生活化主题（日常生活、购物、学校、娱乐、健康、旅行）
- **智能词汇**: 每个主题预置 15-20 个相关词汇，包含中英文和音标
- **AI 生成**: 集成 Nano Banana Pro API 生成高质量图片
- **自定义编辑**: 支持选择词汇、自定义标题
- **作品管理**: 自动保存生成历史，支持查看和下载

### 🎨 设计特点
- **卡通风格**: 面向 10-16 岁青少年的友好界面
- **响应式设计**: 支持手机、平板、桌面等各种设备
- **流畅动画**: 丰富的交互动画和过渡效果
- **直观操作**: 简单三步完成小报生成

### 🔧 技术实现
- **纯前端**: HTML5 + CSS3 + JavaScript ES6+
- **状态管理**: 自定义 Store 模式
- **模块化设计**: 组件化开发，易于维护
- **本地存储**: 使用 localStorage 保存用户设置和作品

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发环境运行
```bash
npm run dev
```
- Vite 启动开发服务器（默认 http://localhost:5173）
- 支持热模块替换（HMR）
- 基于原生 ES modules 的快速启动

### 3. 构建生产版本
```bash
npm run build
```
- Vite 执行生产构建
- 使用 Rollup 进行代码打包优化
- 构建文件输出到 `dist` 目录
- 自动进行代码压缩和资源优化

### 4. 预览生产版本
```bash
npm run preview
```
- Vite 启动预览服务器，模拟生产环境
- 用于本地验证构建结果

## API 配置

在使用前，需要配置 Nano Banana Pro API 密钥：

1. 访问 [API Key Management Page](https://kie.ai/api-key) 获取 API 密钥
2. 在应用中点击"设置"按钮
3. 输入您的 API 密钥
4. 保存设置

## 使用说明

### 操作流程
1. **选择主题**: 从六个主题中选择一个感兴趣的主题
2. **配置内容**:
   - 可选择自定义标题（留空使用默认标题）
   - 选择要包含的词汇（最多 20 个）
   - 设置图片参数（比例、分辨率）
3. **生成小报**: 点击"生成小报"按钮，等待 AI 创作
4. **保存下载**: 生成完成后可保存到作品库或直接下载

### 主题说明
- **日常生活**: 家庭、社区生活场景
- **购物**: 超市、市场等购物场景
- **学校**: 教室、图书馆、操场等学校场景
- **娱乐**: 游戏厅、电影院等娱乐场景
- **健康**: 医院、健身房、健康饮食场景
- **旅行**: 机场、酒店、景点等旅行场景

## 项目结构

```
children-bulletin/
├── index.html                    # 主页面
├── styles/                       # 样式文件
│   ├── main.css                  # 主样式
│   └── components.css           # 组件样式
├── js/                          # JavaScript 文件
│   ├── modern-main.js           # 应用主入口（整合版）
│   ├── store.js                 # 状态管理（备用）
│   ├── components/              # 组件
│   │   ├── theme-selector.js    # 主题选择组件
│   │   └── vocabulary-editor.js # 词汇编辑组件
│   ├── api.js                   # API 集成（备用）
│   ├── prompt-generator.js      # 提示词生成器（备用）
├── themes.json                  # 主题数据配置
├── titles.json                  # 标题模板配置
├── vite.config.js              # Vite 配置
└── package.json                 # 项目配置
```

## 技术架构

### 整体架构设计

本系统采用**单页应用（SPA）架构**，基于原生 ES6+ JavaScript 实现，具有以下特点：

- **无框架依赖**: 纯原生 JavaScript 实现，无第三方框架依赖
- **模块化设计**: 使用 ES6 模块化，代码结构清晰
- **组件化思想**: 功能模块独立，易于维护和扩展
- **响应式架构**: 支持多种设备尺寸的自适应布局

### 核心技术栈

#### 前端技术
- **HTML5**: 语义化标签，支持现代 Web 特性
- **CSS3**:
  - Flexbox/Grid 布局
  - CSS 变量（自定义属性）
  - 动画和过渡效果
  - 响应式媒体查询
- **JavaScript ES6+**:
  - Class 类语法
  - 模块化（import/export）
  - Async/Await 异步处理
  - Fetch API 网络请求
  - LocalStorage 本地存储

#### 构建工具
- **Vite**: 现代化前端构建工具
  - 快速的开发服务器
  - 热模块替换（HMR）
  - 生产环境优化打包

### 架构分层

#### 1. 数据层（Data Layer）
```javascript
// themes.json - 主题和词汇数据
{
  "themes": [
    {
      "id": "unique-id",
      "name": "主题名称",
      "icon": "🏠",
      "scenes": [
        {
          "id": "scene-id",
          "name": "场景名称",
          "vocabulary": [
            {
              "english": "word",
              "chinese": "中文",
              "phonetic": "/音标/",
              "category": "character|object|environment|action"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 2. 状态管理层（State Management）
```javascript
// AppState 类 - 集中式状态管理
class AppState {
  constructor() {
    this.state = {
      currentSection: 'welcome',
      currentTheme: null,
      currentScene: null,
      selectedVocabulary: [],
      apiKey: '',
      // ...其他状态
    };
    this.listeners = []; // 观察者模式
  }

  setState(updates) {
    // 状态更新和通知
  }

  subscribe(listener) {
    // 订阅状态变化
  }
}
```

#### 3. 业务逻辑层（Business Logic）
```javascript
// API 服务层
class NanoBananaAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.kie.ai/api/v1';
  }

  async createTask(prompt, options) {
    // 创建生成任务
  }

  async getTaskStatus(taskId) {
    // 获取任务状态
  }

  async generate(prompt, options) {
    // 完整的生成流程
  }
}

// 提示词生成器
class PromptGenerator {
  async generatePrompt(options) {
    // 根据用户选择生成 AI 提示词
  }
}
```

#### 4. 组件层（Component Layer）
```javascript
// 主题选择组件
class ThemeSelector {
  constructor(container, store, themes) {
    // 初始化
  }

  render() {
    // 渲染主题列表
  }

  bindEvents() {
    // 绑定事件处理
  }
}

// 词汇编辑组件
class VocabularyEditor {
  // 词汇选择和编辑功能
}
```

#### 5. 控制层（Controller Layer）
```javascript
// UI 控制器 - 协调各个组件
class UIController {
  constructor(store) {
    this.store = store;
    this.vocabularyEditor = null;
  }

  async handleGeneration() {
    // 处理生成流程
    const api = new NanoBananaAPI(this.store.state.apiKey);
    const promptGenerator = new PromptGenerator();
    // ...生成逻辑
  }

  showSection(sectionName) {
    // 页面切换控制
  }
}
```

#### 6. 应用入口层（Application Layer）
```javascript
// 应用主类
class App {
  constructor() {
    this.store = new AppState();
    this.uiController = null;
  }

  async init() {
    // 初始化应用
    await this.loadThemes();
    this.uiController = new UIController(this.store);
    this.setupEventListeners();
  }
}
```

### 关键设计模式

1. **观察者模式（Observer Pattern）**
   - 状态管理中的订阅/通知机制
   - 组件间解耦通信

2. **模块模式（Module Pattern）**
   - ES6 模块化
   - 功能封装和隔离

3. **单例模式（Singleton Pattern）**
   - 全局状态管理实例
   - API 客户端实例

4. **策略模式（Strategy Pattern）**
   - 不同主题的提示词生成策略
   - 可扩展的生成参数配置

### 数据流架构

```
用户操作 → UI Controller → State Management → API Service → AI Generation
                ↓                       ↓
            Component Update ← Local Storage ← Result Processing
```

1. **用户交互流程**
   - 用户操作触发事件
   - UI Controller 处理事件
   - 更新应用状态
   - 状态变化触发 UI 更新

2. **AI 生成流程**
   - 收集用户选择的数据
   - 生成 AI 提示词
   - 调用外部 API
   - 处理返回结果
   - 更新 UI 显示

### 安全性考虑

1. **API 密钥安全**
   - 仅保存在 LocalStorage
   - 不暴露在前端代码中
   - 支持 用户输入配置

2. **数据验证**
   - 输入参数校验
   - API 响应处理
   - 错误边界处理

3. **网络安全**
   - HTTPS 通信
   - CORS 跨域处理
   - 请求超时控制

### 性能优化

1. **资源加载**
   - 懒加载主题数据
   - 图片预加载
   - 缓存机制

2. **渲染优化**
   - 事件委托
   - 防抖/节流
   - 虚拟滚动（如需要）

3. **构建优化**
   - Vite 快速构建
   - 代码压缩
   - 资源优化

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. **API 密钥安全**: API 密钥仅保存在本地，不会上传到服务器
2. **网络要求**: 需要稳定的网络连接来调用 AI API
3. **生成时间**: 图片生成需要 30 秒到 2 分钟不等，请耐心等待
4. **使用限制**: API 调用可能有限制，请合理使用

## 开发指南

### 添加新主题
1. 编辑 `themes.json` 文件
2. 在 `themes` 数组中添加新主题对象
3. 确保 vocabulary 格式正确

### 自定义样式
- 修改 `styles/main.css` 中的 CSS 变量
- 组件样式在 `styles/components.css` 中定义

### 扩展功能
- 新增组件请在 `js/components/` 目录下创建
- 使用 ES6 模块化开发
- 遵循现有的代码风格

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！