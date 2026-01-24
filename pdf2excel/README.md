# AI Studio PaddleOCR-VL 使用指南

## 📁 项目结构

```
pdf2excel/
├── scripts/            # 处理脚本 (按省份逻辑划分：anhui, zhejiang)
├── docs/               # 全量文档 (01-12, 涵盖技术选型及实测结果)
├── data/               # 待处理图片 (按省份子目录存放)
├── output/             # 识别结果 (自动化分类输出)
├── .env                # 凭证配置 (不可提交)
└── README.md           # 本说明文件
```

---

## 🚀 快速开始

### 1. 配置 API 凭证

复制模板文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的凭证：
```bash
AISTUDIO_API_URL=https://你的地址.aistudio-app.com/layout-parsing
AISTUDIO_TOKEN=你的访问令牌
```

**获取凭证**：
- 访问：https://aistudio.baidu.com/paddleocr/task
- 在"API调用示例"中复制 API_URL 和 TOKEN

### 2. 安装依赖

```bash
./venv/bin/pip install python-dotenv beautifulsoup4
```

### 3. 运行识别

```bash
./venv/bin/python scripts/aistudio_paddleocr_vl.py data/zhejiang.png
```

---

## 📋 支持的文件类型

- **PDF**: `.pdf`
- **图片**: `.jpg`, `.jpeg`, `.png`, `.bmp`

---

## 📁 输出文件

输出目录：`output/`
- `文件名_时间戳.md` - Markdown 格式文本
- `文件名_时间戳.xlsx` - Excel 表格（带边框）

---

## 🔒 安全说明

- ✅ `.env` 文件已加入 `.gitignore`，不会提交到 Git
- ✅ 你的 API 凭证安全存储在本地
- ✅ `.env.example` 是模板，可以安全提交

---

## 📚 参考文档

- **API 文档**: `docs/paddleocr_vl_api.md`
- **脚本说明**: `scripts/README.md`
- **性能测试**: `docs/07_性能测试报告.md` - 三次测试对比、大批量预估
- **项目总结**: `docs/06_项目总结.md` - 包含 Excel 优化说明
- **AI Studio 官网**: https://aistudio.baidu.com/paddleocr

---

## 📊 性能参考

**基于实测数据**（并发5，请求间隔500ms）：

| 页数   | 预估时间   |
| ------ | ---------- |
| 100页  | 约 15分钟  |
| 500页  | 约 1.3小时 |
| 1000页 | 约 2.5小时 |

**浙江381页 + 安徽581页 = 962页**: 约 **2.6小时**

详细测试数据和配置建议见 [性能测试报告](docs/07_性能测试报告.md)。
