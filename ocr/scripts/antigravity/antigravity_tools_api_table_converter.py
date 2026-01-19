#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
表格识别脚本 - 基于 Gemini 3 Flash (antigravity)
功能：上传图片 → 解析表格 → 输出 Excel
"""

import base64
import os
from datetime import datetime
from openai import OpenAI

CLIENT = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-antigravity"
)


def encode_image(image_path: str) -> str:
    """将图片编码为 base64 data URI"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"图片文件不存在: {image_path}")

    with open(image_path, "rb") as f:
        image_data = f.read()
        base64_data = base64.b64encode(image_data).decode("utf-8")

    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'}
    mime_type = mime_map.get(ext, 'image/jpeg')

    return f"data:{mime_type};base64,{base64_data}"


def process_image(image_path: str, prompt_path: str) -> bool:
    """处理图片，提取表格数据"""
    with open(prompt_path, "r", encoding="utf-8") as f:
        system_instruction = f.read()

    image_url = encode_image(image_path)

    response = CLIENT.chat.completions.create(
        model="gemini-3-flash",
        messages=[
            {"role": "system", "content": system_instruction},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请开始解析此页图片"},
                    {"type": "image_url", "image_url": {"url": image_url, "detail": "auto"}}
                ]
            }
        ],
        temperature=0.0
    )

    response_text = response.choices[0].message.content

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    output_excel = os.path.join(os.path.dirname(image_path), f"{base_name}_gemini_{timestamp}.xlsx")
    raw_output = os.path.join(os.path.dirname(image_path), f"{base_name}_raw_{timestamp}.md")

    with open(raw_output, 'w', encoding='utf-8') as f:
        f.write(response_text)

    return save_markdown_to_excel(response_text, output_excel)


def save_markdown_to_excel(md_text: str, output_excel_path: str) -> bool:
    """将 Markdown 表格转换为 Excel"""
    import re
    import io
    import pandas as pd

    try:
        if not md_text or not md_text.strip():
            print("⚠️  Markdown 内容为空")
            return False

        lines = [l.strip() for l in md_text.split('\n') if '|' in l]

        separator_pattern = re.compile(r'^[\s\-\|]+$')
        lines = [l for l in lines if not separator_pattern.match(l)]

        if not lines:
            print("⚠️  未找到有效的表格行")
            return False

        final_lines = []
        for l in lines:
            parts = [p.strip() for p in l.split('|')[1:-1]]
            final_lines.append('|'.join(parts))

        csv_content = '\n'.join(final_lines)
        df = pd.read_csv(io.StringIO(csv_content), sep='|', header=None, dtype=str, engine='python', on_bad_lines='skip', keep_default_na=False, na_values=[''])

        df = df.fillna('')

        df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)

        df.to_excel(output_excel_path, index=False, header=False)
        print(f"✅ Markdown 表格已保存到: {output_excel_path}")
        return True
    except Exception as e:
        print(f"❌ Markdown 转换失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python gemini_client.py <image_path> <prompt_path>")
        sys.exit(1)

    success = process_image(sys.argv[1], sys.argv[2])
    if success:
        print("🎉 处理完成！")
    else:
        sys.exit(1)
