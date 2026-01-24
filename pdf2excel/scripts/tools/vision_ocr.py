#!/usr/bin/env python3
"""
Apple Vision Framework OCR 提取器
适用于 macOS 10.15+ (包括 Intel Mac)
无需安装依赖，使用系统内置 OCR
"""

import sys
import os
from pathlib import Path

def check_macos_version():
    """检查 macOS 版本"""
    import platform
    version = platform.mac_ver()[0]
    major, minor = map(int, version.split('.')[:2])
    
    if major < 10 or (major == 10 and minor < 15):
        print(f"❌ 需要 macOS 10.15 或更高版本（当前: {version}）")
        return False
    
    print(f"✓ macOS {version}")
    return True

def extract_with_vision():
    """使用 Apple Vision Framework 提取"""
    try:
        # 导入必要的 Apple 框架
        from Foundation import NSURL, NSData
        from Quartz import CIImage
        import Vision
        import pandas as pd
        import time
        
    except ImportError:
        print("❌ 无法导入 Apple Vision 框架")
        print("   请安装: pip install pyobjc-framework-Vision pyobjc-framework-Quartz")
        sys.exit(1)
    
    # 获取输入文件
    if len(sys.argv) < 2:
        print("用法: python vision_ocr.py <PDF或图片文件>")
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    
    # 统一输出到项目根目录的 output
    project_root = Path(__file__).parent.parent
    output_dir = project_root / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if len(sys.argv) > 2:
        output_path = Path(sys.argv[2])
    else:
        output_path = output_dir / input_path.with_suffix('.xlsx').name
    
    if not input_path.exists():
        print(f"❌ 文件不存在: {input_path}")
        sys.exit(1)
    
    print(f"\n🚀 Apple Vision OCR 提取器")
    print(f"=" * 60)
    print(f"📄 输入: {input_path.name}")
    print(f"📊 输出: {output_path}")
    
    total_start = time.time()
    
    # 处理 PDF 或图片
    if input_path.suffix.lower() == '.pdf':
        images = convert_pdf_to_images(input_path)
    else:
        images = [str(input_path)]
    
    print(f"\n📖 总页数/图片数: {len(images)}")
    
    all_data = []
    
    for idx, img_path in enumerate(images, 1):
        page_start = time.time()
        print(f"\n📄 处理第 {idx}/{len(images)} 页...")
        
        # 加载图片
        url = NSURL.fileURLWithPath_(str(img_path))
        image_data = NSData.dataWithContentsOfURL_(url)
        ci_image = CIImage.imageWithData_(image_data)
        
        if not ci_image:
            print(f"   ⚠️  无法加载图片")
            continue
        
        print(f"   🔍 OCR 识别中...", end='', flush=True)
        
        # 创建文本识别请求
        request = Vision.VNRecognizeTextRequest.alloc().init()
        request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
        request.setRecognitionLanguages_(["zh-Hans", "en-US"])  # 中文和英文
        request.setUsesLanguageCorrection_(True)
        
        # 执行识别
        handler = Vision.VNImageRequestHandler.alloc().initWithCIImage_options_(ci_image, None)
        success = handler.performRequests_error_([request], None)
        
        ocr_time = time.time() - page_start
        
        if success:
            results = request.results()
            text_count = 0
            
            for observation in results:
                text = observation.topCandidates_(1)[0].string()
                confidence = observation.confidence()
                
                # 获取边界框
                bbox = observation.boundingBox()
                # Vision 坐标系：左下角为 (0,0)，需要转换
                x = bbox.origin.x
                y = 1.0 - bbox.origin.y - bbox.size.height  # 转换为左上角
                
                if confidence > 0.5 and text.strip():
                    all_data.append({
                        '页码': idx,
                        'X坐标': round(x * 1000, 1),  # 归一化坐标转为像素近似
                        'Y坐标': round(y * 1000, 1),
                        '内容': text.strip(),
                        '置信度': round(confidence, 2)
                    })
                    text_count += 1
            
            print(f" 完成（{ocr_time:.1f}秒）")
            print(f"   ✓ 识别到 {text_count} 个文本块")
        else:
            print(f" 失败")
            print(f"   ⚠️  识别失败")
    
    # 清理临时文件
    if input_path.suffix.lower() == '.pdf':
        cleanup_temp_images(images)
    
    total_time = time.time() - total_start
    
    print(f"\n✅ 共识别 {len(all_data)} 个文本块")
    print(f"⏱️  总耗时: {total_time:.1f}秒")
    
    # 保存到 Excel
    if all_data:
        import pandas as pd
        df = pd.DataFrame(all_data)
        df = df.sort_values(['页码', 'Y坐标', 'X坐标'])
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # 完整数据
            df.to_excel(writer, sheet_name='OCR完整数据', index=False)
            
            # 按页面分组并重组行
            for page_num in df['页码'].unique():
                page_df = df[df['页码'] == page_num].copy()
                page_df['行号'] = (page_df['Y坐标'] // 20).astype(int)
                
                rows = []
                for row_num in sorted(page_df['行号'].unique()):
                    row_data = page_df[page_df['行号'] == row_num].sort_values('X坐标')
                    row_text = ' '.join(row_data['内容'].tolist())
                    rows.append({'内容': row_text})
                
                if rows:
                    row_df = pd.DataFrame(rows)
                    row_df.to_excel(writer, sheet_name=f'第{page_num}页', index=False)
            
            # 纯文本
            text_df = df.groupby('页码').apply(
                lambda x: '\n'.join(x.sort_values(['Y坐标', 'X坐标'])['内容'].tolist())
            ).reset_index()
            text_df.columns = ['页码', '文本内容']
            text_df.to_excel(writer, sheet_name='纯文本', index=False)
        
        print(f"\n🎉 成功！文件: {output_path.absolute()}")
        print(f"📊 包含 {len(df['页码'].unique()) + 2} 个工作表")
        print(f"⚡ 平均速度: {total_time / len(images):.1f}秒/页")
    else:
        print("\n⚠️  未识别到任何文本")

def convert_pdf_to_images(pdf_path):
    """将 PDF 转换为图片"""
    import fitz
    import tempfile
    
    doc = fitz.open(pdf_path)
    temp_dir = tempfile.mkdtemp(prefix='vision_ocr_')
    images = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # 使用 2 倍分辨率
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        
        img_path = os.path.join(temp_dir, f'page_{page_num + 1}.png')
        pix.save(img_path)
        images.append(img_path)
    
    doc.close()
    return images

def cleanup_temp_images(images):
    """清理临时图片"""
    import shutil
    if images and os.path.exists(images[0]):
        temp_dir = os.path.dirname(images[0])
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    if not check_macos_version():
        sys.exit(1)
    
    try:
        extract_with_vision()
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
