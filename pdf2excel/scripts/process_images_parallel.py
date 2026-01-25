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
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import subprocess
from dotenv import load_dotenv

# 加载配置
load_dotenv()

def setup_logging(output_dir):
    """配置日志系统：同时输出到控制台和文件"""
    log_dir = Path(output_dir) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"batch_task_{timestamp}.log"
    
    logger = logging.getLogger("BatchProcessor")
    logger.setLevel(logging.INFO)
    
    if logger.handlers:
        return logger, log_file

    # 文件 Handler - 记录详细时间戳和级别
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_fmt = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    file_handler.setFormatter(file_fmt)
    
    # 控制台 Handler - 保持简洁输出
    console_handler = logging.StreamHandler()
    console_fmt = logging.Formatter('%(message)s')
    console_handler.setFormatter(console_fmt)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger, log_file

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

def filter_images(images, output_dir, skip_existing, retry_failed, failed_list_path, logger):
    """根据条件过滤待处理的图片"""
    if retry_failed:
        if not failed_list_path.exists():
            logger.warning("⚠️ 未找到失败文件列表，将处理所有文件")
            return images
            
        with open(failed_list_path, 'r', encoding='utf-8') as f:
            failed_files = set(line.strip() for line in f if line.strip())
            
        if not failed_files:
            logger.warning("⚠️ 失败文件列表为空")
            return []
            
        filtered = [img for img in images if img.name in failed_files]
        logger.info(f"🔄 仅重试 {len(filtered)} 个失败文件")
        return filtered
        
    if skip_existing:
        filtered = []
        for img in images:
            base_name = img.stem
            has_output = any(output_dir.glob(f"{base_name}_*.xlsx"))
            if not has_output:
                filtered.append(img)
        
        skipped = len(images) - len(filtered)
        if skipped > 0:
            logger.info(f"⏭️  已跳过 {skipped} 个已存在结果的文件")
        return filtered
        
    return images

def batch_process(image_dir, output_dir=None, script_path=None, skip_existing=False, retry_failed=False, province='zhejiang', model='auto'):
    """批量处理入口"""
    if not script_path:
        if province == 'anhui':
            script_path = Path(__file__).parent / "anhui" / "process_anhui.py"
        else:
            script_path = Path(__file__).parent / "zhejiang" / "process_zhejiang.py"
        
    if not script_path.exists():
        print(f"❌ 错误: 找不到处理脚本 {script_path}")
        sys.exit(1)
        
    # 路径推导逻辑保持不变
    if not output_dir:
        project_root = Path(os.getcwd())
        abs_image_dir = Path(image_dir).absolute()
        abs_data_root = (project_root / "data").absolute()
        try:
            rel_path = abs_image_dir.relative_to(abs_data_root)
            output_dir = project_root / "output" / rel_path
        except ValueError:
            output_dir = project_root / "output"
    else:
        output_dir = Path(output_dir)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 启动日志
    logger, log_file_path = setup_logging(output_dir)
    
    start_total = time.time()
    images = sorted(image_dir.glob("page_*.png"))
    
    if not images:
        logger.error(f"❌ 在 {image_dir} 中未找到 page_*.png 文件")
        return
    
    failed_list_path = output_dir / 'failed_files.txt'
    images = filter_images(images, output_dir, skip_existing, retry_failed, failed_list_path, logger)
    
    if not images:
        logger.info("✅ 没有需要处理的文件")
        return
    
    max_workers = int(os.getenv('MAX_WORKERS', 5))
    request_delay_ms = int(os.getenv('API_REQUEST_DELAY_MS', 500))
    request_delay_sec = request_delay_ms / 1000.0
    
    logger.info("="*70)
    logger.info("📊 批量并行处理启动")
    logger.info("="*70)
    logger.info(f"📂 输入目录: {image_dir}")
    logger.info(f"📂 输出目录: {output_dir}")
    logger.info(f"📝 日志文件: {log_file_path}")
    logger.info(f"🌍 解析策略: {province} | 🚀 并发: {max_workers} | ⏱️ 延迟: {request_delay_ms}ms")
    logger.info(f"📄 待处理数: {len(images)}")
    logger.info("="*70)
    
    failed_files = set()
    if failed_list_path.exists():
        with open(failed_list_path, 'r', encoding='utf-8') as f:
            failed_files = set(line.strip() for line in f if line.strip())
    
    processed_count = 0
    success_count = 0
    failed_count = 0
    results = []
    
    import threading
    print_lock = threading.Lock()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_file = {}
        for img in images:
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
                    logger.info(f"[{processed_count}/{len(images)}] {status_icon} {res['file']} ({res['time']:.1f}s)")
                    
                    if res['status'] != 'success':
                        failed_count += 1
                        err_msg = res.get('stderr') or res.get('error') or 'Unknown error'
                        logger.error(f"   └─ 失败原因: {err_msg.strip()}")
                        failed_files.add(img.name)
                    else:
                        success_count += 1
                        if img.name in failed_files:
                            failed_files.remove(img.name)
                            
            except Exception as exc:
                with print_lock:
                    logger.error(f"❌ {img.name} 发生系统异常: {exc}")
                    failed_count += 1
                    failed_files.add(img.name)
    
    # 保存失败列表
    if failed_files:
        with open(failed_list_path, 'w', encoding='utf-8') as f:
            for fname in sorted(failed_files):
                f.write(f"{fname}\n")
    elif failed_list_path.exists():
        failed_list_path.unlink()

    # --- 详细统计计算 ---
    total_time = time.time() - start_total
    avg_time = total_time / processed_count if processed_count > 0 else 0
    
    success_times = [r['time'] for r in results if r['status'] == 'success']
    
    logger.info("\n" + "-"*70)
    logger.info(f"🎉 批量处理完成！")
    logger.info(f"统计: 总数 {processed_count} | 成功 {success_count} | 失败 {failed_count}")
    logger.info(f"耗时: {total_time:.1f}s (总平均 {avg_time:.1f}s/页)")
    
    if success_times:
        avg_success = sum(success_times) / len(success_times)
        logger.info(f"📈 时间细节（成功页）:")
        logger.info(f"   平均: {avg_success:.1f}s | 最快: {min(success_times):.1f}s | 最慢: {max(success_times):.1f}s")
        
    if failed_count > 0:
        logger.warning(f"⚠️  失败列表已保存至: {failed_list_path}")
    logger.info("="*70 + "\n")
    
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
