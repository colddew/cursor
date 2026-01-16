#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计Excel文件和MD文件中符号的全半角使用习惯
"""

import pandas as pd
from collections import defaultdict
from pathlib import Path


def count_symbols(text):
    """统计文本中的符号使用情况"""
    if not text or not isinstance(text, str):
        return defaultdict(int)

    symbols = {
        # 全角符号
        '（': '全角左括号',
        '）': '全角右括号',
        '，': '全角逗号',
        '。': '全角句号',
        '、': '顿号',
        '：': '全角冒号',
        '；': '全角分号',
        '"': '全角左双引号',
        '"': '全角右双引号',
 ''': '全角左单引号',
 ''': '全角右单引号',
        '《': '全角左书名号',
        '》': '全角右书名号',
        '【': '全角左方括号',
        '】': '全角右方括号',
        '！': '全角感叹号',
        '？': '全角问号',

        # 半角符号
        '(': '半角左括号',
        ')': '半角右括号',
        ',': '半角逗号',
        '.': '半角句号',
        ':': '半角冒号',
        ';': '半角分号',
        '"': '半角双引号',
        "'": '半角单引号',
        '<': '半角小于号',
        '>': '半角大于号',
        '[': '半角左方括号',
        ']': '半角右方括号',
        '!': '半角感叹号',
        '?': '半角问号',
    }

    counts = defaultdict(int)

    for char, name in symbols.items():
        count = text.count(char)
        if count > 0:
            counts[name] += count

    return dict(counts)


def analyze_excel_file(file_path, file_name, exclude_columns=None):
    """分析Excel文件"""
    print(f"\n{'='*60}")
    print(f"文件：{file_name}")
    print(f"{'='*60}\n")

    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"读取文件失败：{e}")
        return None

    print(f"总行数：{len(df)}")
    print(f"总列数：{len(df.columns)}")
    print(f"列名：{', '.join(df.columns.tolist())}\n")

    # 排除某些列
    if exclude_columns:
        for col in exclude_columns:
            if col in df.columns:
                df = df.drop(columns=[col])

    # 统计所有符号
    total_counts = defaultdict(int)
    column_counts = {}

    for col in df.columns:
        col_counts = defaultdict(int)
        for value in df[col]:
            counts = count_symbols(value)
            for symbol, count in counts.items():
                col_counts[symbol] += count
                total_counts[symbol] += count

        if col_counts:
            column_counts[col] = dict(col_counts)

    return dict(total_counts), column_counts


def analyze_details_folder(folder_path, file_name):
    """分析details文件夹中的MD文件"""
    print(f"\n{'='*60}")
    print(f"文件夹：{file_name}")
    print(f"{'='*60}\n")

    folder = Path(folder_path)
    md_files = list(folder.glob('*.md'))

    if not md_files:
        print("未找到MD文件")
        return None, None

    print(f"文件数量：{len(md_files)}")
    print(f"路径：{folder_path}\n")

    total_counts = defaultdict(int)
    file_counts = {}

    for md_file in md_files:
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            counts = count_symbols(content)

            for symbol, count in counts.items():
                total_counts[symbol] += count

            if counts:
                file_counts[md_file.name] = dict(counts)

        except Exception as e:
            print(f"读取文件失败 {md_file.name}: {e}")

    return dict(total_counts), file_counts


def print_summary(total_counts, title="总体统计"):
    """打印统计汇总"""
    print(f"\n{title}:")
    print("-" * 60)

    # 按符号类别分组统计
    symbol_groups = {
        '括号类': ['全角左括号', '全角右括号', '半角左括号', '半角右括号',
                   '全角左方括号', '全角右方括号', '半角左方括号', '半角右方括号'],
        '标点类': ['全角逗号', '半角逗号', '全角句号', '半角句号',
                   '顿号', '全角冒号', '半角冒号', '全角分号', '半角分号',
                   '全角感叹号', '半角感叹号', '全角问号', '半角问号'],
        '引号类': ['全角左双引号', '全角右双引号', '全角左单引号', '全角右单引号',
                   '半角双引号', '半角单引号'],
        '书名号类': ['全角左书名号', '全角右书名号', '半角小于号', '半角大于号'],
    }

    for group_name, symbols in symbol_groups.items():
        group_found = False
        for symbol in symbols:
            if total_counts.get(symbol, 0) > 0:
                group_found = True
                break

        if group_found:
            print(f"\n【{group_name}】")
            for symbol in symbols:
                count = total_counts.get(symbol, 0)
                if count > 0:
                    print(f"  {symbol:12s}: {count:,} 次")


def print_ratios(total_counts):
    """计算并打印全半角比例"""
    print(f"\n\n全半角使用比例：")
    print("-" * 60)

    ratios = {
        '括号': {
            '全角': total_counts.get('全角左括号', 0) + total_counts.get('全角右括号', 0),
            '半角': total_counts.get('半角左括号', 0) + total_counts.get('半角右括号', 0)
        },
        '逗号': {
            '全角': total_counts.get('全角逗号', 0),
            '半角': total_counts.get('半角逗号', 0)
        },
        '冒号': {
            '全角': total_counts.get('全角冒号', 0),
            '半角': total_counts.get('半角冒号', 0)
        },
        '句号': {
            '全角': total_counts.get('全角句号', 0),
            '半角': total_counts.get('半角句号', 0)
        },
        '顿号': {
            '全角': total_counts.get('顿号', 0),
            '半角': 0  # 顿号没有半角
        },
    }

    for symbol_name, counts in ratios.items():
        full = counts['全角']
        half = counts['半角']
        total = full + half

        if total > 0:
            full_percent = (full / total) * 100
            half_percent = (half / total) * 100
            print(f"\n{symbol_name}：")
            print(f"  全角：{full:,} 次 ({full_percent:.1f}%)")
            if half > 0:
                print(f"  半角：{half:,} 次 ({half_percent:.1f}%)")
            else:
                print(f"  半角：0 次 (0.0%)")


def main():
    results = {}

    # 1. 分析教育部名单文件
    print("\n" + "="*80)
    print("第一部分：2025年全国普通高等学校名单（教育部）")
    print("="*80)

    total_counts_1, _ = analyze_excel_file(
        'achievement/2025全国普通高等学校名单.xlsx',
        '2025年全国普通高等学校名单（教育部）'
    )

    if total_counts_1:
        print_summary(total_counts_1)
        print_ratios(total_counts_1)
        results['教育部名单'] = total_counts_1

    # 2. 分析招生章程基本信息
    print("\n\n" + "="*80)
    print("第二部分：招生章程.xlsx（阳光高考网院校基本信息）")
    print("="*80)

    total_counts_2, _ = analyze_excel_file(
        'achievement/招生章程.xlsx',
        '招生章程.xlsx（阳光高考网院校基本信息）'
    )

    if total_counts_2:
        print_summary(total_counts_2)
        print_ratios(total_counts_2)
        results['招生章程基本信息'] = total_counts_2

    # 3. 分析招生章程内容（details/文件夹）
    print("\n\n" + "="*80)
    print("第三部分：details/（招生章程内容全量数据）")
    print("="*80)

    total_counts_3, file_counts_3 = analyze_details_folder(
        'details/',
        'details/（招生章程内容）'
    )

    if total_counts_3:
        print_summary(total_counts_3)
        print_ratios(total_counts_3)
        results['招生章程内容'] = total_counts_3

    # 打印三方对比总结
    print("\n\n" + "="*80)
    print("三方对比总结")
    print("="*80)

    comparison_symbols = [
        ('全角左括号', '全角右括号', '括号'),
        ('半角左括号', '半角右括号', '括号'),
        ('全角逗号', None, '逗号'),
        ('半角逗号', None, '逗号'),
        ('全角句号', None, '句号'),
        ('半角句号', None, '句号'),
        ('全角冒号', None, '冒号'),
        ('半角冒号', None, '冒号'),
        ('顿号', None, '顿号'),
    ]

    print("\n符号使用对比（单位：次）：\n")
    print(f"{'符号':<12} {'教育部名单':<15} {'招生章程信息':<15} {'招生章程内容':<15}")
    print("-" * 60)

    for sym1, sym2, name in comparison_symbols:
        count1 = results.get('教育部名单', {}).get(sym1, 0)
        if sym2:
            count1 += results.get('教育部名单', {}).get(sym2, 0)

        count2 = results.get('招生章程基本信息', {}).get(sym1, 0)
        if sym2:
            count2 += results.get('招生章程基本信息', {}).get(sym2, 0)

        count3 = results.get('招生章程内容', {}).get(sym1, 0)
        if sym2:
            count3 += results.get('招生章程内容', {}).get(sym2, 0)

        if count1 + count2 + count3 > 0:
            label = sym1 if not sym2 else f"{name}（全角）" if '全角' in sym1 else f"{name}（半角）"
            print(f"{label:<12} {count1:<15,} {count2:<15,} {count3:<15,}")

    print("\n\n分析完成！\n")


if __name__ == '__main__':
    main()
