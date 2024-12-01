# Todo List 应用

一个简单但功能完整的待办事项应用，采用前后端分离架构，展示了基本的 CRUD 操作和前后端交互。

## 功能特点

- ✨ 苹果风格的现代化界面
- ✅ 添加新的待办事项
- 🔄 标记待办事项为已完成/未完成
- 🗑️ 删除待办事项（带确认对话框）
- 💾 数据持久化存储
- 📱 响应式设计，支持移动设备

## 目录结构

todo_project/
├── backend/
│ ├── main.py # FastAPI 应用主程序
│ ├── database.py # 数据库配置
│ └── models.py # 数据模型定义
│
├── frontend/
│ ├── index.html # 页面结构
│ ├── styles.css # 样式定义
│ └── script.js # 前端逻辑
│
└── requirements.txt # Python 依赖

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript (原生)
- 苹果设计风格 (SF Pro Display 字体)

### 后端
- Python 3.9+
- FastAPI (Web 框架)
- SQLModel (ORM)
- PyMySQL (数据库驱动)
- MySQL 5.7+ (数据库)

## 项目启动

### 1. 数据库配置
```sql
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE todo_db;
```

### 2. 安装依赖
pip install -r requirements.txt

### 3. 启动后端
cd database
uvicorn backend.main:app --reload

### 4. 启动前端
cd frontend
python -m http.server 8080

### 5. 访问应用
- 前端页面：`http://localhost:8080`
- API 文档（Swagger UI）：`http://127.0.0.1:8000/docs`
- API 文档（ReDoc）：`http://127.0.0.1:8000/docs`
- API 接口：`http://127.0.0.1:8000/todos`

## 注意事项

1. 确保 MySQL 服务已启动
2. 检查数据库连接信息是否正确
3. 前后端需要分别启动
4. 需要支持 JavaScript 的现代浏览器