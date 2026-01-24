# Scripts 目录说明

## 🎯 当前使用的脚本

### aistudio_paddleocr_vl.py ⭐ **主要使用**
**功能**：使用 AI Studio PaddleOCR-VL 进行单页 OCR 识别
**用法**：
```bash
../venv/bin/python aistudio_paddleocr_vl.py <图片或PDF>
```
**输出**：Markdown + Excel（带边框）
**配置**：需要配置 `.env` 文件

---

## 📚 其他 OCR 脚本（备选方案）

### vision_ocr.py
**功能**：使用 Apple Vision Framework（本地OCR）
**优点**：完全免费，速度快（2-3秒）
**缺点**：表格结构丢失
**适用**：纯文字提取

### baidu_ocr.py
**功能**：百度通用 OCR API
**适用**：文字识别，不适合表格

### baidu_table_ocr.py
**功能**：百度表格识别 API（旧版）
**状态**：已被 PaddleOCR-VL 替代

### baidu_doc_analysis.py
**功能**：百度文档解析（旧版）
**状态**：已被 PaddleOCR-VL 替代

### baidu_table_v2.py
**功能**：百度表格识别 V2
**状态**：已被 PaddleOCR-VL 替代

---

## 🧪 测试和分析脚本

### analyze_pdf.py
**功能**：分析 PDF 结构（文本/图片/表格）
**用法**：
```bash
../venv/bin/python analyze_pdf.py <PDF文件>
```

### pdf_text_extract.py
**功能**：提取 PDF 文本（保留坐标）
**适用**：文本型 PDF

---

## 🗑️ 废弃/历史版本脚本（早期技术方案探索）

以下脚本是项目早期尝试不同 PDF 处理路线时保留的，目前主要作为技术参考，不再作为主力工具。

### pdf_to_excel_fast.py
- **原理**：直接从 PDF 提取文本对象（Text Object）。
- **特点**：速度极快，完全不经过 OCR。
- **局限**：仅适用于“原生”生成的 PDF（文字可选中），对扫描件或表格图片无效。

### pdf_to_excel_ocr.py
- **原理**：本地截图 + 本地 OCR 模型。
- **特点**：完全本地运行，不依赖外部 API。
- **局限**：识别精度和表格还原效果远不如在线 API（如 PaddleOCR-VL）。

### pdf_to_excel_advanced.py
- **原理**：混合方案（文本提取 + 启发式布局分析）。
- **特点**：尝试通过算法自动还原复杂的表格边框和多栏布局。
- **局限**：逻辑复杂，且对非标准格式的兼容性较弱。

### pdf_to_excel.py
- **原理**：最基础的 PDF 文本流还原。
- **状态**：该方案的早期雏形。

---

## 🚀 核心工具集（2026-01-22 更新）

### 1. **pdf_to_images.py** ⭐
**功能**：高质量 PDF 转图片
**用法**：`python scripts/pdf_to_images.py <PDF文件>`
**输出**：在 PDF 同级目录创建同名文件夹，存放 page_001.png 等图片。

### 2. **aistudio_paddleocr_vl.py** ⭐
**功能**：高精度识别单张图片中的表格
**输出**：Markdown + Excel（带合并单元格和自适应列宽）。

### 3. **process_images_parallel.py** ⭐
**功能**：批量并行 OCR 处理（带断点续传）
**用法**：`python scripts/process_images_parallel.py data/zhejiang`
**输出**：自动映射到 `output/zhejiang/` 目录。

### 4. **md_to_excel.py**
**功能**：将 OCR 生成的 Markdown 独立转换为 Excel（用于二次处理或修复）。
**用法**：`python scripts/md_to_excel.py <MD文件>`

---

## 🧪 辅助工具

- **analyze_pdf.py**: 用于判断 PDF 是“文字型”还是“扫描图片型”。
- **vision_ocr.py**: 本地 Apple Vision 识别，仅用于快速提取文字，无表格结构。

---

**最佳流程建议**：
`PDF 文件` -> `pdf_to_images.py` -> `process_images_parallel.py` -> `结果核对`
