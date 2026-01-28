#!/usr/bin/env python3
import sys; sys.dont_write_bytecode = True"""
PDF 分析工具 - 检查 PDF 内容类型
"""

import fitz  # PyMuPDF

pdf_path = "zhejiang.pdf"
doc = fitz.open(pdf_path)

print(f"\n📄 PDF 分析: {pdf_path}")
print(f"=" * 60)
print(f"总页数: {len(doc)}")
print(f"加密: {'是' if doc.is_encrypted else '否'}")
print(f"元数据: {doc.metadata}")

for page_num in range(min(2, len(doc))):  # 只检查前2页
    page = doc[page_num]
    print(f"\n📖 页面 {page_num + 1}:")
    print(f"  尺寸: {page.rect.width} x {page.rect.height}")
    
    # 检查文本
    text = page.get_text()
    print(f"  文本字符数: {len(text)}")
    if text.strip():
        print(f"  文本预览: {text[:200]}...")
    
    # 检查图片
    images = page.get_images()
    print(f"  图片数量: {len(images)}")
    
    # 检查绘图对象
    drawings = page.get_drawings()
    print(f"  绘图对象: {len(drawings)}")
    
    # 检查表格
    tables = page.find_tables()
    table_list = tables.tables if hasattr(tables, 'tables') else []
    print(f"  表格数量: {len(table_list)}")
    if table_list:
        for i, table in enumerate(table_list):
            print(f"    表格 {i+1}: {table.row_count} 行 × {table.col_count} 列")

doc.close()
