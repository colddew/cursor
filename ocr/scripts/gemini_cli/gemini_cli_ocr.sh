#!/usr/bin/env bash
# GCC Gemini CLI - 图片转 Excel

IMAGE="/Users/colddew/Downloads/cursor/ocr/test_images/anhui_sample.jpg"
PROMPT="/Users/colddew/Downloads/cursor/ocr/prompt/visual_prompt.txt"
OUTPUT="anhui_result.xlsx"

echo "🚀 执行 Gemini CLI 图片转 Excel..."
echo "   图片: $IMAGE"
echo "   提示词: $PROMPT"
echo "   输出: $OUTPUT"

gemini -p "参考 @$PROMPT 的规则，分析图片 @$IMAGE 中的招生计划数据，输出为 Markdown 表格，然后生成 $OUTPUT 文件" --yolo
