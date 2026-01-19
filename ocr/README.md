# OCR 图片表格识别项目

将招生计划书图片识别并转换为 Excel 表格。

## 项目结构

```
ocr/
├── README.md                      # 本文档
├── requirements.txt               # Python 依赖
├── python3.12_setup.sh            # Python 3.12 环境配置脚本
├── venv_guide.md                  # 虚拟环境指南
├── scripts/
│   ├── antigravity/               # Antigravity 本地代理方式
│   │   ├── antigravity_tools_api_table_converter.py  # 表格识别主脚本
│   │   ├── antigravity_tools_gemini3flsh.py
│   │   ├── antigravity_tools_gemini3pro_high.py
│   │   ├── antigravity_tools_gemini3pro_image.py
│   │   ├── antigravity_tools_gemini3pro_image_composite.py
│   │   ├── antigravity_tools_gemini3pro_image_edit.py
│   │   └── antigravity_tools_gemini3pro_low.py
│   ├── gemini_cli/                # Gemini CLI 方式
│   │   ├── gemini_cli_ocr.sh      # 一键处理脚本
│   │   └── md_to_excel.py         # Markdown 转 Excel
│   ├── gcc/                       # Google Cloud Console API 方式
│   │   ├── gcc_gemini_test.py     # Hello World 测试
│   │   ├── gcc_list_models.py     # 列出可用模型
│   │   └── gcc_test_model.py      # 单独测试指定模型
│   └── ai_stuidio/                # Google AI Studio API 方式（已弃用）
│       ├── api_table_converter.py
│       ├── check_enum.py
│       └── list_models.py
├── prompt/                        # 提示词文件
│   ├── visual_prompt.md           # 详细规则型提示词
│   ├── simple_prompt.md           # 简洁规则型提示词（推荐）
│   └── complex_prompt.md          # JSON 输出型提示词（不适用）
├── test_images/                   # 测试图片
│   ├── anhui_sample.jpg           # 安徽招生计划（3列）
│   └── zhejiang_sample.png        # 浙江招生计划（5列）
└── .env                           # 环境变量配置
```

## 调用方式对比

| 方式                 | 配置                       | 模型                   | 耗时   | 列数 | 稳定性   | 推荐度 |
| -------------------- | -------------------------- | ---------------------- | ------ | ---- | -------- | ------ |
| **Antigravity**      | `http://127.0.0.1:8045/v1` | gemini-3-flash         | ~2分   | 3列  | ✅ 稳定   | ⭐⭐⭐    |
| **Gemini CLI**       | 登录凭证 + 代理            | gemini-3-flash-preview | ~2-3分 | 3列  | ⚠️ 不稳定 | ⭐⭐     |
| **GCC API (REST)**   | `GEMINI_API_KEY` + 代理    | gemini-3-flash-preview | ~2分   | 6列  | ❌ 不稳定 | ⭐      |
| **Google AI Studio** | `GOOGLE_API_KEY`           | gemini-3-flash         | -      | -    | ❌ 429    | ❌      |

### 1. Antigravity（推荐）

**配置：** 运行 antigravity 本地代理服务

**使用：**
```bash
cd /tmp
python3 scripts/antigravity/antigravity_tools_api_table_converter.py \
    test_images/anhui_sample.jpg \
    prompt/simple_prompt.md
```

**优点：** 稳定、快速、无需代理
**缺点：** 需要运行本地代理服务

### 2. Gemini CLI

**配置：** 需设置代理（国内网络）
```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
```

**使用：**
```bash
bash scripts/gemini_cli/gemini_cli_ocr.sh anhui_sample.jpg simple_prompt.md
```

**优点：** 使用 Google 账号配额，额度大
**缺点：** 有时超时/不稳定

### 3. GCC API（需代理）

**配置：** `.env` 中设置 `GEMINI_API_KEY` 和代理

**使用：**
```bash
export https_proxy=http://127.0.0.1:7897
python3 scripts/gcc/gcc_test_model.py gemini-3-flash-preview "你的问题"
```

**缺点：** 列数不稳定，有时 6 列而非 3 列；需要绑定信用卡才能获得更高配额

### 4. Google AI Studio API（已弃用）

**缺点：** 免费额度仅 20 次/天，易超限

## 提示词对比

| 提示词              | 行数 | 特点      | 列数 | 状态     |
| ------------------- | ---- | --------- | ---- | -------- |
| `simple_prompt.md`  | 17   | 简洁规则  | 4列  | ✅ 推荐   |
| `visual_prompt.md`  | 24   | 详细规则  | 3列  | ⚠️ 不稳定 |
| `complex_prompt.md` | 104  | JSON 输出 | -    | ❌ 不适用 |

### simple_prompt.md（推荐）

```markdown
列拆分规则：
- 有边框按边框拆分
- 无边框看垂直空白间隔
- 括号内容保持完整
```

### visual_prompt.md

- 规则更详细
- 但有时过度拆分（7列）
- 不稳定

### complex_prompt.md

- 输出 JSON 格式
- 不适用于 Markdown 转 Excel 流程

## 测试结果

### 安徽图片（3列结构）

| 方式                        | 列数 | 数据完整性 |
| --------------------------- | ---- | ---------- |
| Antigravity + visual_prompt | 3列  | ✅ 完整     |
| Gemini CLI + visual_prompt  | 3列  | ✅ 完整     |

### 浙江图片（5列结构）

| 方式                        | 列数 | 数据完整性 |
| --------------------------- | ---- | ---------- |
| Antigravity + visual_prompt | 5列  | ✅ 完整     |

## 环境配置

`.env` 文件：
```bash
# Antigravity（本地代理）
# 无需配置，运行代理服务即可

# GCC API
GEMINI_API_KEY=your-api-key
https_proxy=http://127.0.0.1:7897
http_proxy=http://127.0.0.1:7897
```

## 注意事项

1. **国内网络** - Gemini CLI 和 GCC API 需配置代理
2. **Antigravity 代理** - 需保持本地服务运行（端口 8045）
3. **列数问题** - GCC API 有时返回不稳定列数
4. **额度限制** - Google AI Studio API 免费额度有限
