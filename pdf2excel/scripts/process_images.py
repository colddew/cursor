#!/usr/bin/env python3
"""
批量顺序处理图片 OCR
支持省份策略选择、断点续传和失败重试
主要用于测试单文件处理时间或稳定调试
"""

import os
import sys
# 禁用生成 __pycache__
sys.dont_write_bytecode = True
import time
import argparse
from pathlib import Path
from datetime import datetime
import subprocess
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def process_single_image(image_path, script_path, output_dir=None, province='zhejiang'):
    """处理单个图片"""
    start_time = time.time()
    try:
        cmd = [sys.executable, str(script_path), str(image_path)]
        if output_dir:
            cmd.extend(['--output-dir', str(output_dir)])
        if province:
             cmd.extend(['--province', str(province)])
            
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        elapsed = time.time() - start_time
        
        return {
            'file': image_path.name,
            'status': 'success' if result.returncode == 0 else 'failed',
            'time': elapsed,
            'stdout': result.stdout,
            'stderr': result.stderr if result.returncode != 0 else None
        }
    except subprocess.TimeoutExpired:
        return {
            'file': image_path.name,
            'status': 'timeout',
            'time': time.time() - start_time
        }
    except Exception as e:
        return {
            'file': image_path.name,
            'status': 'error',
            'time': time.time() - start_time,
            'error': str(e)
        }

def filter_images(images, output_dir, skip_existing, retry_failed, failed_list_path):
    """根据条件过滤待处理的图片"""
    if retry_failed:
        if not failed_list_path.exists():
            print("⚠️ 未找到失败文件列表，将处理所有文件")
            return images
            
        with open(failed_list_path, 'r', encoding='utf-8') as f:
            failed_files = set(line.strip() for line in f if line.strip())
            
        if not failed_files:
            print("⚠️ 失败文件列表为空")
            return []
            
        filtered = [img for img in images if img.name in failed_files]
        print(f"🔄 仅重试 {len(filtered)} 个失败文件")
        return filtered
        
    if skip_existing:
        filtered = []
        for img in images:
            base_name = img.stem
            # 检查是否有以 base_name 开头的文件
            has_output = any(output_dir.glob(f"{base_name}_*.xlsx"))
            if not has_output:
                filtered.append(img)
        
        skipped = len(images) - len(filtered)
        if skipped > 0:
            print(f"⏭️  已跳过 {skipped} 个已存在结果的文件")
        return filtered
        
    return images

def batch_process_sequential(image_dir, output_dir=None, script_path=None, skip_existing=False, retry_failed=False, province='zhejiang'):
    """批量顺序处理图片"""
    image_dir = Path(image_dir)
    
    # 默认根据省份自动选择脚本路径
    if not script_path:
        current_script_dir = Path(__file__).parent
        if province == 'anhui':
            script_path = current_script_dir / "anhui" / "process_anhui.py"
        else:
            script_path = current_script_dir / "zhejiang" / "process_zhejiang.py"
    else:
        script_path = Path(script_path)
        
    if not script_path.exists():
        print(f"❌ 错误: 找不到处理脚本 {script_path}")
        sys.exit(1)
    
    # 确定输出目录 (与 parallel 逻辑保持一致)
    if not output_dir:
        try:
            abs_image_dir = image_dir.absolute()
            project_root = Path(os.getcwd())
            abs_data_root = (project_root / "data").absolute()
            
            try:
                is_in_data = abs_image_dir.is_relative_to(abs_data_root)
            except AttributeError:
                try:
                    abs_image_dir.relative_to(abs_data_root)
                    is_in_data = True
                except ValueError:
                    is_in_data = False
            
            if is_in_data:
                rel_path = abs_image_dir.relative_to(abs_data_root)
                output_dir = project_root / "output" / rel_path
            else:
                output_dir = project_root / "output"
        except Exception:
            output_dir = Path(os.getcwd()) / "output"
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 查找所有图片
    images = sorted(image_dir.glob("page_*.png"))
    
    if not images:
        print(f"❌ 在 {image_dir} 中未找到 page_*.png 文件")
        return
    
    # 失败文件列表路径
    failed_list_path = output_dir / 'failed_files.txt'
    
    # 过滤待处理文件
    images = filter_images(images, output_dir, skip_existing, retry_failed, failed_list_path)
    
    if not images:
        print("✅ 没有需要处理的文件")
        return
    
    print(f"\n{'='*70}")
    print(f"📊 批量顺序处理 (用于测试时间/稳定调试)")
    print(f"{'='*70}")
    print(f"📁 输入目录: {image_dir}")
    print(f"📂 输出目录: {output_dir}")
    print(f"🌍 解析策略: {province}")
    print(f"📄 待处理数: {len(images)}")
    print(f"🕐 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")
    
    total_start = time.time()
    results = []
    failed_files = set()
    
    # 读取旧的失败列表
    if failed_list_path.exists():
        with open(failed_list_path, 'r', encoding='utf-8') as f:
            failed_files = set(line.strip() for line in f if line.strip())
    
    # 顺序处理每个图片
    for idx, image_path in enumerate(images, 1):
        print(f"[{idx}/{len(images)}] 处理: {image_path.name}")
        
        result = process_single_image(image_path, script_path, output_dir, province)
        results.append(result)
        
        status_icon = "✅" if result['status'] == 'success' else "❌"
        print(f"   └─ {status_icon} {result['status']} - 耗时: {result['time']:.1f}秒")
        
        if result['status'] != 'success':
            print(f"      错误提示: {result.get('stderr') or result.get('error') or '未知错误'}")
            failed_files.add(image_path.name)
        else:
            if image_path.name in failed_files:
                failed_files.remove(image_path.name)
        
        # 保存中间状态（每处理一个文件就更新一下失败列表，防止中途断电）
        if failed_files:
            with open(failed_list_path, 'w', encoding='utf-8') as f:
                for fname in sorted(failed_files):
                    f.write(f"{fname}\n")
        elif failed_list_path.exists():
            failed_list_path.unlink()
    
    total_elapsed = time.time() - total_start
    
    # 统计信息计算
    success_count = sum(1 for r in results if r['status'] == 'success')
    failed_count = len(results) - success_count
    
    print(f"\n{'='*70}")
    print(f"📊 处理完成统计")
    print(f"{'='*70}")
    print(f"✅ 成功: {success_count}/{len(results)}")
    print(f"❌ 失败: {failed_count}/{len(results)}")
    print(f"⏱️  总耗时: {total_elapsed:.1f}秒 ({total_elapsed/60:.1f}分钟)")
    
    if success_count > 0:
        success_times = [r['time'] for r in results if r['status'] == 'success']
        avg_time = sum(success_times) / len(success_times)
        min_time = min(success_times)
        max_time = max(success_times)
        
        print(f"\n📈 时间统计（成功的文件）:")
        print(f"   平均耗时: {avg_time:.1f}秒/页")
        print(f"   最快: {min_time:.1f}秒")
        print(f"   最慢: {max_time:.1f}秒")
        
        # 预估大批量处理时间
        print(f"\n🔮 大批量处理预估（顺序执行）:")
        for page_count in [100, 500, 1000]:
            est_sec = avg_time * page_count
            print(f"   {page_count:4d} 页: 约 {est_sec/3600:.1f} 小时")
    
    print(f"\n{'='*70}")
    print(f"🕐 结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="批量顺序处理图片 OCR")
    parser.add_argument("image_dir", help="包含 page_*.png 图片的目录")
    parser.add_argument("--script", help="OCR 脚本路径 (可选)", default=None)
    parser.add_argument("--output-dir", help="指定输出目录 (可选)", default=None)
    parser.add_argument("--skip-existing", action="store_true", help="跳过已存在输出结果的文件")
    parser.add_argument("--retry-failed", action="store_true", help="仅重试 failed_files.txt 中的文件")
    parser.add_argument("--province", help="省份策略代码 (zhejiang/anhui)", default="zhejiang")
    
    args = parser.parse_args()
    
    batch_process_sequential(
        args.image_dir,
        args.output_dir,
        args.script,
        args.skip_existing,
        args.retry_failed,
        args.province
    )
