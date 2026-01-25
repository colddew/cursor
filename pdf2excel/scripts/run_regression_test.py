#!/usr/bin/env python3
"""
自动回归测试脚本 (Regression Test Suite)
对比当前代码生成的 Excel 与 test/regression/cases 下的 Truth Excel 是否一致
"""

import sys
# 禁用生成 __pycache__
sys.dont_write_bytecode = True
import os
import shutil
import argparse
import pandas as pd
from pathlib import Path
import subprocess
import re

# 尝试导入 colorama
try:
    from colorama import init, Fore, Style
    init()
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False

def print_log(msg, level="INFO"):
    if not HAS_COLOR:
        print(f"[{level}] {msg}")
        return
    if level == "INFO":
        print(f"{Fore.CYAN}[INFO]{Style.RESET_ALL} {msg}")
    elif level == "PASS":
        print(f"{Fore.GREEN}[PASS]{Style.RESET_ALL} {msg}")
    elif level == "FAIL":
        print(f"{Fore.RED}[FAIL]{Style.RESET_ALL} {msg}")
    elif level == "WARN":
        print(f"{Fore.YELLOW}[WARN]{Style.RESET_ALL} {msg}")

def normalize_text(text):
    """标准化文本以忽略视觉噪音"""
    if not isinstance(text, str):
        return text
    # 1. 全半角转换
    repls = {'（': '(', '）': ')', '；': ';', '：': ':', '，': ',', '。': '.'}
    for old, new in repls.items():
        text = text.replace(old, new)
    # 2. 移除标点周围空格
    text = re.sub(r'\s*([();:,])\s*', r'\1', text)
    # 3. 移除中文字符与汉字/数字/标点间的空格
    text = re.sub(r'([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])', r'\1\2', text)
    text = re.sub(r'(\d)\s+([\u4e00-\u9fa5])', r'\1\2', text)
    text = re.sub(r'([\u4e00-\u9fa5])\s+(\d)', r'\1\2', text)
    # 4. 合并连续空格
    return re.sub(r'\s+', ' ', text).strip()

def run_ocr(image_path, output_dir, province, model='ocr'):
    """执行 OCR 任务"""
    script_exec = Path(f"scripts/{'zhejiang/process_zhejiang.py' if province == 'zhejiang' else 'anhui/process_anhui.py'}")
    cmd = [sys.executable, str(script_exec), str(image_path), "--output-dir", str(output_dir), "--model", model]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0: return None, result.stderr
        generated = list(output_dir.glob(f"{image_path.stem}_*.xlsx"))
        return (sorted(generated)[-1], None) if generated else (None, "No output file")
    except Exception as e: return None, str(e)

def compare_excel(truth_file, new_file):
    """Pandas 对比逻辑"""
    try:
        t_sheets = pd.read_excel(truth_file, sheet_name=None, dtype=str)
        n_sheets = pd.read_excel(new_file, sheet_name=None, dtype=str)
        if set(t_sheets.keys()) != set(n_sheets.keys()):
            return False, "Sheets mismatch"
        for name, df_t in t_sheets.items():
            df_n = n_sheets[name]
            # 注意：此处必须使用 map 而非已过时的 applymap
            df_t = df_t.fillna("").map(normalize_text)
            df_n = df_n.fillna("").map(normalize_text)
            if not df_t.equals(df_n):
                if len(df_t) != len(df_n): return False, f"Row count mismatch: T={len(df_t)}, N={len(df_n)}"
                return False, f"Content/Order mismatch in '{name}'"
        return True, "Success"
    except Exception as e: return False, f"Error: {e}"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--province", choices=['zhejiang', 'anhui_physics', 'anhui_history', 'all'], default='all')
    parser.add_argument("--model", choices=['auto', 'ocr', 'v3'], default='ocr')
    parser.add_argument("--case", help="模糊匹配文件名", default=None)
    parser.add_argument("--compare-only", action="store_true")
    args = parser.parse_args()

    cases_root = Path("test/regression/cases")
    temp_output = Path("test/regression/output")
    temp_output.mkdir(parents=True, exist_ok=True)
    
    provinces = [args.province] if args.province != 'all' else ['zhejiang', 'anhui_physics', 'anhui_history']
    results = []

    print_log(f"开始回归测试 | {'仅对比' if args.compare_only else '全量'} | 模型: {args.model}")
    print("="*60)

    for prov in provinces:
        case_dir = cases_root / prov
        if not case_dir.exists(): continue
        images = sorted(case_dir.glob("*.png"))
        if args.case: images = [img for img in images if args.case in img.name]
        if not images: continue

        print_log(f"测试模块: {prov} ({len(images)}个用例)")
        for img in images:
            # 兼容性寻找基准文件
            truth_xlsx = case_dir / f"{img.stem}.xlsx"
            if not truth_xlsx.exists():
                truth_xlsx = case_dir / f"{img.stem}_truth.xlsx"
            
            if not truth_xlsx.exists():
                print_log(f"  跳过 {img.name}: 缺失基准", "WARN")
                continue

            print_log(f"  处理: {img.name}...", "INFO")
            case_out_dir = temp_output / prov / img.stem
            
            if args.compare_only:
                new_xlsx = sorted(case_out_dir.glob(f"{img.stem}_*.xlsx"))[-1] if case_out_dir.exists() and list(case_out_dir.glob(f"{img.stem}_*.xlsx")) else None
                if not new_xlsx: continue
            else:
                if case_out_dir.exists(): shutil.rmtree(case_out_dir)
                case_out_dir.mkdir(parents=True)
                new_xlsx, err = run_ocr(img, case_out_dir, prov.split('_')[0], args.model)
                if not new_xlsx:
                    print_log(f"    OCR失败: {err}", "FAIL")
                    results.append((prov, img.name, "OCR_ERROR", err)); continue

            match, msg = compare_excel(truth_xlsx, new_xlsx)
            if match:
                print_log(f"    PASS", "PASS")
                results.append((prov, img.name, "PASS", ""))
            else:
                print_log(f"    FAIL: {msg}", "FAIL")
                results.append((prov, img.name, "FAIL", msg))

    print("\n汇总报告")
    for res in results: print(f"{res[0]:<15} | {res[1]:<12} | {res[2]:<10} {res[3]}")

if __name__ == "__main__":
    main()