#!/usr/bin/env python3
import sys; sys.dont_write_bytecode = True"""
Markdown 转 Excel 工具
"""
import sys
from pathlib import Path
from aistudio_paddleocr_vl import markdown_to_excel

def convert_md_to_excel(md_path):
    md_path = Path(md_path)
    if not md_path.exists():
        print(f"❌ 找不到文件: {md_path}")
        return

    # 读取 Markdown 内容
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    # 指定输出 Excel 路径
    output_path = md_path.with_suffix('.xlsx')
    
    print(f"📄 正在转换: {md_path.name}")
    if markdown_to_excel(md_text, output_path):
        print(f"✅ 转换完成: {output_path.absolute()}")
    else:
        print("❌ 转换失败：未找到有效表格")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python md_to_excel.py <markdown_file>")
    else:
        convert_md_to_excel(sys.argv[1])
