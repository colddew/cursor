# 项目文档索引

本目录包含项目开发过程中的所有重要文档。

---

## 📋 技术文档

### [01_技术选型分析.md](./01_技术选型分析.md)
**内容**：
- Mac 平台 OCR 方案对比
- Apple Vision Framework vs Tesseract vs PaddleOCR
- 在线 API vs 本地处理
- 性能和准确率分析

**结论**：选择 AI Studio PaddleOCR-VL

---

### [02_实现计划.md](./02_实现计划.md)
**内容**：
- 批量处理工具设计
- PDF 预处理方案
- 并发 OCR 处理
- Excel 合并策略

**状态**：部分实现（单页处理已完成）

---

### [03_AI_Studio模型对比.md](./03_AI_Studio模型对比.md)
**内容**：
- PaddleOCR-VL vs PP-OCRv5 vs PP-StructureV3
- 三个模型的功能差异
- 适用场景分析

**推荐**：PaddleOCR-VL（表格识别最强）

---

### [04_百度服务对比.md](./04_百度服务对比.md)
**内容**：
- 百度智能云 vs AI Studio
- 免费额度说明（200页一次性）
- 价格对比
- 服务稳定性分析

---

### [05_使用指南.md](./05_使用指南.md)
**内容**：
- Vision OCR 使用方法
- 百度 OCR API 使用方法
- 百度表格识别使用方法
- 性能对比和推荐

**状态**：已被新的 README 替代，保留作为历史参考

---

### [06_项目总结.md](./06_项目总结.md)
**内容**：
- 测试图片分析（浙江招生大本）
- 已实现的方案总结
- Vision OCR vs 百度 API 对比
- 关键结论和最佳实践

**价值**：记录了早期测试和决策过程

---

## 🔧 API 文档

### [paddleocr_vl_api.md](./paddleocr_vl_api.md)
**内容**：
- PaddleOCR-VL 完整 API 文档
- 请求参数说明
- 响应格式
- Python 调用示例
- 性能指标

---

## 📝 使用说明

查看项目根目录的 [README.md](../README.md) 了解快速开始指南。

查看 [scripts/README.md](../scripts/README.md) 了解各个脚本的用途。

---

## 🗂️ 文档更新记录

- 2026-01-21：整理所有历史文档到 docs 目录
- 2026-01-21：添加 PaddleOCR-VL API 文档
- 2026-01-21：创建文档索引
