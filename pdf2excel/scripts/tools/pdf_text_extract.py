#!/usr/bin/env python3
import sys; sys.dont_write_bytecode = True"""
PDF 文本提取器 - 保留布局结构
适用于有文本但无表格结构的 PDF
"""

import fitz  # PyMuPDF
import pandas as pd
from pathlib import Path
import sys

def extract_text_with_layout():
    """提取文本并保留布局"""
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "zhejiang.pdf"
    
    # 统一输出到项目根目录的 output
    project_root = Path(__file__).parent.parent
    output_dir = project_root / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if len(sys.argv) > 2:
        output_path = Path(sys.argv[2])
    else:
        output_path = output_dir / Path(pdf_path).with_suffix('.xlsx').name
    
    print(f"\n🚀 PDF 文本提取器（保留布局）")
    print(f"=" * 60)
    print(f"📄 输入: {pdf_path}")
    print(f"📊 输出: {output_path}")
    
    doc = fitz.open(pdf_path)
    print(f"\n📖 总页数: {len(doc)}")
    
    all_data = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        print(f"\n📄 处理页面 {page_num + 1}/{len(doc)}...")
        
        # 获取文本块（包含位置信息）
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            if block["type"] == 0:  # 文本块
                for line in block.get("lines", []):
                    line_text = ""
                    x0 = line["bbox"][0]
                    y0 = line["bbox"][1]
                    
                    for span in line.get("spans", []):
                        line_text += span["text"]
                    
                    if line_text.strip():
                        all_data.append({
                            '页码': page_num + 1,
                            'X坐标': round(x0, 1),
                            'Y坐标': round(y0, 1),
                            '内容': line_text.strip()
                        })
        
        print(f"   ✓ 提取了 {len([d for d in all_data if d['页码'] == page_num + 1])} 行文本")
    
    doc.close()
    
    print(f"\n✅ 共提取 {len(all_data)} 行文本")
    
    # 保存到 Excel
    if all_data:
        df = pd.DataFrame(all_data)
        
        # 按页码和Y坐标排序
        df = df.sort_values(['页码', 'Y坐标', 'X坐标'])
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # 完整数据（带坐标）
            df.to_excel(writer, sheet_name='完整数据', index=False)
            
            # 纯文本（按页分组）
            for page_num in df['页码'].unique():
                page_df = df[df['页码'] == page_num]['内容']
                page_df.to_excel(writer, sheet_name=f'第{page_num}页', index=False, header=False)
            
            # 合并所有文本
            all_text_df = df['内容']
            all_text_df.to_excel(writer, sheet_name='全部文本', index=False, header=False)
        
        print(f"\n🎉 成功！文件: {output_path.absolute()}")
        print(f"📊 包含 {len(df['页码'].unique()) + 2} 个工作表")
        print(f"\n💡 提示:")
        print(f"   - '完整数据' 工作表包含坐标信息")
        print(f"   - 各页工作表包含纯文本内容")
        print(f"   - '全部文本' 工作表包含所有页面的文本")
    else:
        print("\n⚠️  未提取到任何文本")

if __name__ == "__main__":
    extract_text_with_layout()
