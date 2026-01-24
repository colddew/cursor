# PDF2Excel 项目总览

## 🎯 项目目标

将各省份招生大本（500页+）的 PDF/图片转换为高质量的结构化 Excel 表格数据，重点解决跨页合并、噪音过滤及复杂备注解析问题。

---

## 📁 完整项目结构

```
pdf2excel/
├── scripts/                # 核心处理脚本集
│   ├── anhui/              # 安徽省专用解析逻辑 (v3 增强版)
│   ├── zhejiang/           # 浙江省专用解析逻辑
│   ├── common/             # 共享工具类 (API调用、Excel导出、表格检测)
│   ├── tools/              # 辅助工具 (PDF转图片、Vision OCR 备选等)
│   ├── archive/            # 历史版本备份
│   ├── process_images.py   # 单线程批量处理
│   └── process_images_parallel.py  # ⭐ 并行全量生产工具 (推荐)
├── docs/                   # 数字化资产与全体系文档
│   ├── 01_技术选型分析.md
│   ├── 02_实现计划.md
│   ├── 03_AI_Studio模型对比.md
│   ├── 04_百度服务对比.md
│   ├── 05_使用指南.md
│   ├── 06_项目总结.md
│   ├── 07_性能测试报告.md    # ⭐ 包含 2026-01-24 全线大考数据
│   ├── 08_批量处理指南.md
│   ├── 09_全链路测试指南.md
│   ├── 10_安徽招生数据处理经验总结.md
│   ├── 11_环境配置和操作指南.md
│   └── 12_关键词过滤风险评估.md
├── data/                   # 原始数据存储 (PDF 及 page_*.png)
├── output/                 # 自动化输出目录 (按省份子目录分类)
│   ├── anhui_history/
│   ├── anhui_physics/
│   └── zhejiang/
├── venv/                   # Python 虚拟环境
├── .env                    # 私密 API 凭证管理 (不提交)
├── .gitignore
├── requirements.txt
└── README.md               # 快速指引手册
```

---

## 🚀 核心生产链路

1.  **环境配置**：`source venv/bin/activate`。
2.  **全量生产**：使用 `process_images_parallel.py` 指向 `data/xxx` 目录，引擎会自动按省份策略执行 OCR 并导出 Excel。
3.  **结果审计**：生成的 `.xlsx` 文件会自动落位在 `output/` 对应子目录中。

---

## 📊 技术选型与成熟度

- **主力引擎**：AI Studio PaddleOCR-VL (SOTA 表格识别)
- **增强引擎**：StructureV3 (针对安徽大本复杂布局)
- **当前状态**：✅ **浙江/安徽 100% 全量通过**

---

**版本**: v2.1 (2026-01-24)  
**维护**: 目录结构已于本日 07:58 完成全量实测对齐。
