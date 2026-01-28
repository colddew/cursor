"""
import sys
sys.dont_write_bytecode = True
"""
PDF 转图片工具
使用 PyMuPDF 进行高质量转换
"""

import sys
import time
from pathlib import Path
import fitz  # PyMuPDF

def pdf_to_images(pdf_path, output_dir=None, dpi=300):
    """
    将 PDF 转换为图片
    
    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录（默认为项目根目录的 output/pdf_images）
        dpi: 分辨率（默认300）
    """
    pdf_path = Path(pdf_path)
    
    # 如果没有指定输出目录，使用 PDF 文件所在的同级目录的同名文件夹
    if output_dir is None:
        output_dir = pdf_path.parent / pdf_path.stem
    else:
        output_dir = Path(output_dir)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📄 PDF 转图片")
    print(f"=" * 60)
    print(f"输入文件: {pdf_path.name}")
    print(f"输出目录: {output_dir}")
    print(f"分辨率: {dpi} DPI")
    
    total_start = time.time()
    
    # 打开 PDF
    print(f"\n📖 打开 PDF...", end='', flush=True)
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    print(f" 完成")
    print(f"   总页数: {page_count}")
    
    # 转换每一页
    print(f"\n🖼️  转换图片:")
    images = []
    
    for page_num in range(page_count):
        page_start = time.time()
        
        page = doc[page_num]
        
        # 设置缩放比例（DPI）
        zoom = dpi / 72  # 72 是 PDF 的默认 DPI
        mat = fitz.Matrix(zoom, zoom)
        
        # 渲染为图片
        pix = page.get_pixmap(matrix=mat)
        
        # 保存图片
        image_path = output_dir / f"page_{page_num + 1:03d}.png"
        pix.save(str(image_path))
        
        page_time = time.time() - page_start
        file_size = image_path.stat().st_size / 1024  # KB
        
        print(f"   ✓ 第 {page_num + 1}/{page_count} 页: {page_time:.2f}秒, {file_size:.1f}KB")
        
        images.append(image_path)
    
    doc.close()
    
    total_time = time.time() - total_start
    avg_time = total_time / page_count
    
    print(f"\n🎉 完成！")
    print(f"⏱️  总耗时: {total_time:.2f}秒")
    print(f"📊 平均每页: {avg_time:.2f}秒")
    print(f"📁 输出目录: {output_dir.absolute()}")
    print(f"🖼️  生成图片: {len(images)} 张")
    
    return images

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python pdf_to_images.py <PDF文件>")
        print("\n示例:")
        print("  python pdf_to_images.py data/zhejiang.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(f"❌ 文件不存在: {pdf_path}")
        sys.exit(1)
    
    try:
        images = pdf_to_images(pdf_path)
        print(f"\n✅ 处理完成！")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
