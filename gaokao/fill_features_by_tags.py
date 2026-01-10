#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
院校特性补全脚本 - 基于阳光高考网筛选标签
通过筛选URL爬取学校名称，补充院校特性信息
"""

import pandas as pd
import json

# 学校名称到特性的映射
FEATURE_MAPPING = {
    2: "民办高校",
    3: "独立学院",
    4: "中外合作办学",
    5: "内地与港澳台地区合作办学"
}

def load_existing_schools():
    """读取招生章程.xlsx"""
    df = pd.read_excel("招生章程.xlsx")
    print(f"✅ 读取招生章程.xlsx: {len(df)} 所学校")
    return df

def save_feature_mapping(schools_dict, output_path="/tmp/school_features.json"):
    """保存学校特性映射到JSON文件"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(schools_dict, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存学校特性映射到 {output_path}")

def load_feature_mapping(input_path="/tmp/school_features.json"):
    """从JSON文件加载学校特性映射"""
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            schools_dict = json.load(f)
        print(f"✅ 已从 {input_path} 加载 {len(schools_dict)} 所学校")
        return schools_dict
    except FileNotFoundError:
        print(f"⚠️  文件 {input_path} 不存在，返回空字典")
        return {}

def update_excel_with_features(df, schools_dict):
    """更新Excel中的院校特性列"""
    # 只更新空值
    mask = (df['院校特性'].isna()) | (df['院校特性'] == '')
    updated_count = 0

    for idx, row in df[mask].iterrows():
        school_name = row['学校名称']
        if school_name in schools_dict:
            df.at[idx, '院校特性'] = schools_dict[school_name]
            updated_count += 1

    print(f"✅ 更新了 {updated_count} 所学校的院校特性")
    return df, updated_count

def save_updated_excel(df, output_path="招生章程.xlsx"):
    """保存更新后的Excel"""
    df.to_excel(output_path, index=False, engine='openpyxl')
    print(f"✅ 已保存更新后的Excel到 {output_path}")

def print_statistics(df):
    """打印统计信息"""
    print("\n" + "="*60)
    print("📊 院校特性统计")
    print("="*60)

    # 各种特性的学校数量
    feature_counts = df['院校特性'].value_counts(dropna=False)
    for feature, count in feature_counts.items():
        if pd.isna(feature):
            print(f"  空: {count} 所")
        else:
            print(f"  {feature}: {count} 所")

    print(f"\n  总计: {len(df)} 所")
    print(f"  非空: {df['院校特性'].notna().sum()} 所 ({df['院校特性'].notna().sum()/len(df)*100:.1f}%)")
    print("="*60 + "\n")

def main():
    print("="*60)
    print("院校特性补全脚本")
    print("="*60)
    print()

    # 1. 读取现有Excel
    df = load_existing_schools()

    # 2. 加载已爬取的学校特性映射（如果有）
    schools_dict = load_feature_mapping()

    if not schools_dict:
        print("⚠️  还没有爬取任何学校数据")
        print("📝 请使用Playwright MCP工具爬取以下筛选URL：")
        for yxjbz, feature_name in FEATURE_MAPPING.items():
            url = f"https://gaokao.chsi.com.cn/sch/search.do?searchType=1&yxjbz={yxjbz}"
            print(f"   - {feature_name}: {url}")
        print()
        print("📝 爬取完成后，将学校名称按以下JSON格式保存到 /tmp/school_features.json：")
        print('{')
        print('  "学校名称": "院校特性",')
        print('  ...')
        print('}')
        return

    # 3. 更新Excel
    df, updated_count = update_excel_with_features(df, schools_dict)

    # 4. 保存更新后的Excel
    save_updated_excel(df, "招生章程.xlsx")

    # 5. 打印统计信息
    print_statistics(df)

if __name__ == '__main__':
    main()
