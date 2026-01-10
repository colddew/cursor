#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
城市数据填充脚本
从教育部官方名单中提取城市信息，补充到阳光高考网数据中
"""

import re
import pandas as pd
from datetime import datetime


def normalize_school_name(name):
    """标准化学校名称，解决全半角括号等问题"""
    if not isinstance(name, str):
        return name

    # 1. 全角括号转半角
    name = name.replace('（', '(').replace('）', ')')

    # 2. 去除首尾空格
    name = name.strip()

    # 3. 统一空格（多个空格转单个）
    name = re.sub(r'\s+', ' ', name)

    return name


def fill_city_data():
    """填充城市数据"""

    print("=" * 60)
    print("城市数据填充脚本")
    print("=" * 60)
    print()

    # 1. 读取数据
    print("📂 正在读取数据文件...")
    df_gaokao = pd.read_excel('招生章程.xlsx')
    df_moe = pd.read_excel('2025全国普通高等学校名单.xlsx')
    print(f"   ✅ 招生章程.xlsx: {len(df_gaokao)} 所学校")
    print(f"   ✅ 2025全国普通高等学校名单.xlsx: {len(df_moe)} 所学校")
    print()

    # 2. 标准化学校名称
    print("🔧 正在标准化学校名称...")
    df_moe['标准名称'] = df_moe['学校名称'].apply(normalize_school_name)
    df_gaokao['标准名称'] = df_gaokao['学校名称'].apply(normalize_school_name)
    print("   ✅ 标准化完成（全半角括号转换、空格处理）")
    print()

    # 3. 创建城市映射字典
    print("📋 正在创建城市映射字典...")
    city_map = dict(zip(df_moe['标准名称'], df_moe['所在地']))
    print(f"   ✅ 创建映射字典：{len(city_map)} 条")
    print()

    # 4. 匹配并填充（只填充空值）
    print("🔄 正在匹配并填充城市数据...")
    matched = []
    failed = []

    for idx, row in df_gaokao.iterrows():
        # 跳过已有城市的
        if pd.notna(row['城市']) and row['城市'] != '':
            continue

        standard_name = row['标准名称']

        if standard_name in city_map:
            df_gaokao.at[idx, '城市'] = city_map[standard_name]
            matched.append(row['学校名称'])
        else:
            failed.append({
                '学校名称': row['学校名称'],
                '省份': row['省份']
            })

    print(f"   ✅ 成功匹配：{len(matched)} 所")
    print(f"   ❌ 匹配失败：{len(failed)} 所")
    print()

    # 5. 保存结果
    print("💾 正在保存结果...")
    df_gaokao.to_excel('招生章程.xlsx', index=False, engine='openpyxl')
    print("   ✅ 已保存到 招生章程.xlsx")
    print()

    # 6. 生成详细报告
    print("=" * 60)
    print("📊 匹配结果统计")
    print("=" * 60)
    print(f"总学校数：{len(df_gaokao)} 所")
    print(f"成功匹配：{len(matched)} 所 ({len(matched)/len(df_gaokao)*100:.1f}%)")
    print(f"匹配失败：{len(failed)} 所 ({len(failed)/len(df_gaokao)*100:.1f}%)")
    print()

    # 统计城市字段填充率
    city_filled = df_gaokao['城市'].notna() & (df_gaokao['城市'] != '')
    print(f"城市字段填充率：{city_filled.sum()}/{len(df_gaokao)} ({city_filled.sum()/len(df_gaokao)*100:.1f}%)")
    print()

    if failed:
        print("匹配失败学校列表：")
        for school in failed[:20]:  # 只显示前20个
            print(f"  - {school['学校名称']} ({school['省份']})")
        if len(failed) > 20:
            print(f"  ... 还有 {len(failed)-20} 所")
        print()

    # 7. 保存报告到文件
    report_content = []
    report_content.append("=" * 60)
    report_content.append("城市数据匹配报告")
    report_content.append("=" * 60)
    report_content.append(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_content.append("")
    report_content.append("## 统计摘要")
    report_content.append(f"总学校数：{len(df_gaokao)} 所")
    report_content.append(f"成功匹配：{len(matched)} 所 ({len(matched)/len(df_gaokao)*100:.1f}%)")
    report_content.append(f"匹配失败：{len(failed)} 所 ({len(failed)/len(df_gaokao)*100:.1f}%)")
    report_content.append(f"城市字段填充率：{city_filled.sum()}/{len(df_gaokao)} ({city_filled.sum()/len(df_gaokao)*100:.1f}%)")
    report_content.append("")

    if failed:
        report_content.append("## 匹配失败学校列表")
        for school in failed:
            report_content.append(f"- {school['学校名称']} ({school['省份']})")
        report_content.append("")

    report_content.append("=" * 60)

    with open('城市匹配报告.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_content))

    print(f"📄 详细报告已保存到：城市匹配报告.txt")
    print()
    print("=" * 60)
    print("✅ 任务完成！")
    print("=" * 60)

    return len(matched), failed


if __name__ == '__main__':
    fill_city_data()
