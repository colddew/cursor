#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析具体字段的符号使用习惯
"""

import pandas as pd
from collections import defaultdict


def analyze_field_symbols(file_path, file_name, fields_to_analyze):
    """分析特定字段的符号使用"""
    print(f"\n{'='*80}")
    print(f"文件：{file_name}")
    print(f"{'='*80}\n")

    df = pd.read_excel(file_path)
    print(f"总行数：{len(df)}\n")

    results = {}

    for field in fields_to_analyze:
        if field not in df.columns:
            print(f"⚠️  字段【{field}】不存在")
            continue

        print(f"\n{'─'*60}")
        print(f"字段：{field}")
        print(f"{'─'*60}")

        # 统计该字段的所有符号使用
        full_parentheses = 0  # 全角括号
        half_parentheses = 0  # 半角括号
        full_comma = 0  # 全角逗号
        half_comma = 0  # 半角逗号
        full_period = 0  # 全角句号
        half_period = 0  # 半角句号
        dunhao = 0  # 顿号

        # 收集示例（前10个）
        full_paren_examples = []
        half_paren_examples = []
        dunhao_examples = []

        for value in df[field]:
            if pd.isna(value):
                continue

            value_str = str(value)

            # 统计括号
            full_left = value_str.count('（')
            full_right = value_str.count('）')
            half_left = value_str.count('(')
            half_right = value_str.count(')')

            full_parentheses += (full_left + full_right)
            half_parentheses += (half_left + half_right)

            # 统计逗号
            full_comma += value_str.count('，')
            half_comma += value_str.count(',')

            # 统计句号
            full_period += value_str.count('。')
            half_period += value_str.count('.')

            # 统计顿号
            dunhao_count = value_str.count('、')
            dunhao += dunhao_count

            # 收集示例
            if full_left > 0 or full_right > 0:
                if len(full_paren_examples) < 10:
                    full_paren_examples.append(value_str)
            if half_left > 0 or half_right > 0:
                if len(half_paren_examples) < 10:
                    half_paren_examples.append(value_str)
            if dunhao_count > 0:
                if len(dunhao_examples) < 10:
                    dunhao_examples.append(value_str)

        # 计算总数
        total_parens = full_parentheses + half_parentheses
        total_commas = full_comma + half_comma
        total_periods = full_period + half_period

        # 打印统计结果
        print(f"\n【括号使用】")
        if total_parens > 0:
            full_pct = (full_parentheses / total_parens) * 100
            half_pct = (half_parentheses / total_parens) * 100
            print(f"  全角括号：（{full_parentheses:,}次）({full_pct:.1f}%)")
            print(f"  半角括号：({half_parentheses:,}次)({half_pct:.1f}%)")
        else:
            print(f"  无括号使用")

        print(f"\n【逗号使用】")
        if total_commas > 0:
            full_pct = (full_comma / total_commas) * 100
            half_pct = (half_comma / total_commas) * 100
            print(f"  全角逗号：，{full_comma:,}次 ({full_pct:.1f}%)")
            print(f"  半角逗号：,{half_comma:,}次 ({half_pct:.1f}%)")
        else:
            print(f"  无逗号使用")

        print(f"\n【句号使用】")
        if total_periods > 0:
            full_pct = (full_period / total_periods) * 100
            half_pct = (half_period / total_periods) * 100
            print(f"  全角句号：。{full_period:,}次 ({full_pct:.1f}%)")
            print(f"  半角句号：.{half_period:,}次 ({half_pct:.1f}%)")
        else:
            print(f"  无句号使用")

        print(f"\n【顿号使用】")
        if dunhao > 0:
            print(f"  顿号：、{dunhao:,}次")
        else:
            print(f"  无顿号使用")

        # 显示示例
        if full_paren_examples:
            print(f"\n  全角括号示例（前{len(full_paren_examples)}个）：")
            for ex in full_paren_examples[:5]:
                print(f"    • {ex}")

        if half_paren_examples:
            print(f"\n  半角括号示例（前{len(half_paren_examples)}个）：")
            for ex in half_paren_examples[:5]:
                print(f"    • {ex}")

        if dunhao_examples:
            print(f"\n  顿号示例（前{len(dunhao_examples)}个）：")
            for ex in dunhao_examples[:5]:
                print(f"    • {ex}")

        # 保存结果
        results[field] = {
            '全角括号': full_parentheses,
            '半角括号': half_parentheses,
            '全角逗号': full_comma,
            '半角逗号': half_comma,
            '全角句号': full_period,
            '半角句号': half_period,
            '顿号': dunhao,
        }

    return results


def main():
    # 要分析的字段
    fields = ['学校名称', '省份', '城市', '主管部门', '办学层次', '院校特性']

    # 1. 分析教育部名单
    print("\n" + "="*80)
    print("第一部分：教育部名单文件分析")
    print("="*80)

    results_1 = analyze_field_symbols(
        'achievement/2025全国普通高等学校名单.xlsx',
        '2025全国普通高等学校名单.xlsx（教育部）',
        fields
    )

    # 2. 分析招生章程文件
    print("\n\n" + "="*80)
    print("第二部分：招生章程文件分析")
    print("="*80)

    results_2 = analyze_field_symbols(
        'achievement/招生章程.xlsx',
        '招生章程.xlsx（阳光高考网）',
        fields
    )

    # 打印对比总结
    print("\n\n" + "="*80)
    print("字段对比总结")
    print("="*80)

    print(f"\n括号使用对比（单位：次）：\n")
    print(f"{'字段':<12} {'教育部名单':<20} {'招生章程':<20} {'差异'}")
    print("-" * 60)

    for field in fields:
        if field in results_1 and field in results_2:
            r1 = results_1[field]
            r2 = results_2[field]

            full1 = r1['全角括号']
            half1 = r1['半角括号']
            full2 = r2['全角括号']
            half2 = r2['半角括号']

            total1 = full1 + half1
            total2 = full2 + half2

            if total1 > 0 or total2 > 0:
                edu_str = f"全{full1} 半{half1}" if total1 > 0 else "无"
                gk_str = f"全{full2} 半{half2}" if total2 > 0 else "无"

                diff = ""
                if total1 > 0 and total2 > 0:
                    if (full1 == total1 and half2 > 0) or (half2 == total2 and full1 > 0):
                        diff = "→ 规律不同"
                    elif full1 > 0 and full2 > 0:
                        diff = "✓ 一致"
                    elif half1 > 0 and half2 > 0:
                        diff = "✓ 一致"

                print(f"{field:<12} {edu_str:<20} {gk_str:<20} {diff}")

    print("\n\n分析完成！\n")


if __name__ == '__main__':
    main()
