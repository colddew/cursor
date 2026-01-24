#!/usr/bin/env python3
"""
批量并行处理图片 OCR
支持断点续传和失败重试
"""

import os
import sys
# 禁用生成 __pycache__
sys.dont_write_bytecode = True
import time
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import subprocess
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def process_single_image(image_path, script_path, output_dir=None, province='zhejiang', model='auto'):
    """处理单个图片"""
    start_time = time.time()
    try:
        cmd = [sys.executable, str(script_path), str(image_path)]
        if output_dir:
            cmd.extend(['--output-dir', str(output_dir)])
        if province:
            cmd.extend(['--province', str(province)])
        if model:
            cmd.extend(['--model', str(model)])
            
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
            # 检查同名 output 目录下是否存在对应的 md 或 xlsx
            base_name = img.stem
            # 这里简单检查是否有以 base_name 开头的文件
            # 更严谨的检查需要正则匹配 timestamp
            has_output = any(output_dir.glob(f"{base_name}_*.xlsx"))
            if not has_output:
                filtered.append(img)
        
        skipped = len(images) - len(filtered)
        if skipped > 0:
            print(f"⏭️  已跳过 {skipped} 个已存在结果的文件")
        return filtered
        
    return images

def batch_process(image_dir, output_dir=None, script_path=None, skip_existing=False, retry_failed=False, province='zhejiang', model='auto'):
    """批量处理入口"""
    # 默认根据省份自动选择脚本路径
    if not script_path:
        if province == 'anhui':
            script_path = Path(__file__).parent / "anhui" / "process_anhui.py"
        else:
            # 默认为浙江
            script_path = Path(__file__).parent / "zhejiang" / "process_zhejiang.py"
        
    if not script_path.exists():
        print(f"❌ 错误: 找不到处理脚本 {script_path}")
        sys.exit(1)
        
    start_total = time.time()
    
    # 确定输出目录
    if not output_dir:
        try:
            # 尝试推导 output 目录结构
            abs_image_dir = Path(image_dir).absolute()
            # 假设项目根目录是当前工作目录
            project_root = Path(os.getcwd())
            abs_data_root = (project_root / "data").absolute()
            
            # 判断 image_dir 是否在 data 目录下
            try:
                # relative_to 如果不在路径下会抛出 ValueError
                is_in_data = abs_image_dir.is_relative_to(abs_data_root)
            except AttributeError:
                # Python < 3.9 兼容
                try:
                    abs_image_dir.relative_to(abs_data_root)
                    is_in_data = True
                except ValueError:
                    is_in_data = False
            
            if is_in_data:
                # 计算相对路径: data/zhejiang -> zhejiang
                rel_path = abs_image_dir.relative_to(abs_data_root)
                output_dir = project_root / "output" / rel_path
            else:
                # 不在 data 目录下，默认输出到 output 根目录
                output_dir = project_root / "output"
        except Exception as e:
            # 路径解析异常，回退到默认
            print(f"⚠️ 路径推导警告: {e}，使用默认输出目录")
            project_root = Path(os.getcwd())
            output_dir = project_root / "output"
    else:
        # 如果用户指定了输出目录，确保转换为 Path 对象
        output_dir = Path(output_dir)
    
    # 确保输出目录存在
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
    
    # 获取并发数配置和请求延迟配置
    max_workers = int(os.getenv('MAX_WORKERS', 5))
    request_delay_ms = int(os.getenv('API_REQUEST_DELAY_MS', 500))
    request_delay_sec = request_delay_ms / 1000.0
    
    print(f"{'='*70}")
    print(f"📊 批量并行处理")
    print(f"{'='*70}")
    print(f"📂 输入目录: {image_dir}")
    print(f"📂 输出目录: {output_dir}")
    print(f"🌍 解析策略: {province}")
    print(f"🚀 并发线程: {max_workers}")
    print(f"⏱️  请求间隔: {request_delay_ms} ms")
    print(f"📄 待处理数: {len(images)}")
    print(f"{'='*70}")
    
    # 读取失败列表以备更新
    failed_files = set()
    if failed_list_path.exists():
        with open(failed_list_path, 'r', encoding='utf-8') as f:
            failed_files = set(line.strip() for line in f if line.strip())
    
    processed_count = 0
    success_count = 0
    failed_count = 0
    
    import threading
    print_lock = threading.Lock()
    
    results = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # submit 任务
        future_to_file = {}
        for img in images:
            # 简单的限流
            time.sleep(request_delay_sec / max_workers) 
            
            future = executor.submit(process_single_image, img, script_path, output_dir, province, model)
            future_to_file[future] = img
            
        for future in as_completed(future_to_file):
            img = future_to_file[future]
            try:
                res = future.result()
                results.append(res)
                processed_count += 1
                
                with print_lock:
                    status_icon = "✅" if res['status'] == 'success' else "❌"
                    # 简化输出
                    print(f"[{processed_count}/{len(images)}] {status_icon} {res['file']} ({res['time']:.1f}s)")
                    
                    if res['status'] != 'success':
                        failed_count += 1
                        print(f"   └─ 错误: {res.get('stderr') or 'Unknown error'}")
                        failed_files.add(img.name)
                    else:
                        success_count += 1
                        if img.name in failed_files:
                            failed_files.remove(img.name)
                            
            except Exception as exc:
                with print_lock:
                    print(f"❌ {img.name} 发生异常: {exc}")
                    failed_count += 1
                    failed_files.add(img.name)
    
    # 更新失败文件列表
    if failed_files:
        with open(failed_list_path, 'w', encoding='utf-8') as f:
            for fname in sorted(failed_files):
                f.write(f"{fname}\n")
    elif failed_list_path.exists():
        failed_list_path.unlink()

    total_time = time.time() - start_total
    avg_time = total_time / processed_count if processed_count > 0 else 0
    
    # 统计信息计算
    if success_count > 0:
        success_times = [r['time'] for r in results if r['status'] == 'success']
        if success_times:
            avg_success = sum(success_times) / len(success_times)
            min_time = min(success_times)
            max_time = max(success_times)
        else:
            avg_success = 0
            min_time = 0
            max_time = 0
    else:
        avg_success = 0
        min_time = 0
        max_time = 0

    print(f"\n{'-'*70}")
    print(f"🎉 批量处理完成！")
    print(f"Total: {processed_count} | Success: {success_count} | Failed: {failed_count}")
    print(f"Time: {total_time:.1f}s (Avg: {avg_time:.1f}s/file)")
    
    if success_count > 0:
        print(f"\n📈 时间统计（成功）:")
        print(f"   平均: {avg_success:.1f}s | 最快: {min_time:.1f}s | 最慢: {max_time:.1f}s")
        
    if failed_count > 0:
        print(f"⚠️  失败列表已保存至: {failed_list_path}")
    print(f"{'='*70}\n")
    
    return {
        'total': processed_count,
        'success': success_count,
        'failed': failed_count,
        'time': total_time
    }

def main():
    parser = argparse.ArgumentParser(description="批量并行处理图片 OCR")
    parser.add_argument("image_dir", help="包含 page_*.png 图片的目录")
    parser.add_argument("--script", help="OCR 脚本路径 (可选)", default=None)
    parser.add_argument("--output-dir", help="指定输出目录 (可选)", default=None)
    parser.add_argument("--skip-existing", action="store_true", help="跳过已存在输出结果的文件")
    parser.add_argument("--retry-failed", action="store_true", help="仅重试 verify_failed_files.txt 中的文件")
    parser.add_argument("--province", help="省份策略代码 (默认: zhejiang)", default="zhejiang")
    parser.add_argument("--model", choices=['auto', 'ocr', 'v3'], default='auto',
                        help="OCR 模型选择: auto=自动检测, ocr=强制PaddleOCR, v3=强制StructureV3")
    
    args = parser.parse_args()
    
    image_dir = Path(args.image_dir)
    if not image_dir.exists():
        print(f"Error: Directory not found {image_dir}")
        sys.exit(1)
        
    batch_process(
        image_dir, 
        args.output_dir, 
        args.script, 
        args.skip_existing,
        args.retry_failed, 
        args.province,
        args.model
    )

if __name__ == "__main__":
    main()
