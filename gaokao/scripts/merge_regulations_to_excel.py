#!/usr/bin/env python3
"""
将MD文件中的招生章程内容合并到Excel

功能：
1. 读取 achievement/招生章程.xlsx
2. 从 tables/ 和 details/ 读取MD文件内容
3. 新增"招生章程内容"和"招生章程是否含表格"两列
4. 保存到 achievement/招生章程（详情）.xlsx
"""

import pandas as pd
import json
from pathlib import Path

# 读取800所表格学校清单
print("读取表格学校清单...")
with open('tables/有表格的学校清单.json', 'r', encoding='utf-8') as f:
    table_schools = json.load(f)
table_school_names = set(s['学校名称'] for s in table_schools)
print(f"  表格学校: {len(table_school_names)}所")

# 读取源Excel
print("\n读取源Excel...")
df = pd.read_excel('achievement/招生章程.xlsx')
print(f"  总学校数: {len(df)}所")

# 新增列
df['招生章程内容'] = ''
df['招生章程是否含表格'] = ''

# 遍历每所学校
print("\n开始合并MD文件内容...")
success_count = 0
not_found_count = 0

for idx, row in df.iterrows():
    school_name = row['学校名称']

    # 优先从 tables/ 读取
    if school_name in table_school_names:
        md_file = Path(f'tables/{school_name}.md')
        df.at[idx, '招生章程是否含表格'] = '是'
    else:
        md_file = Path(f'details/{school_name}.md')
        df.at[idx, '招生章程是否含表格'] = '否'

    # 读取MD文件内容
    if md_file.exists():
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        df.at[idx, '招生章程内容'] = content
        success_count += 1
        if success_count % 500 == 0:
            print(f"  进度: {success_count}/{len(df)}")
    else:
        not_found_count += 1

# 保存到新文件
print(f"\n保存到新文件...")
output_file = 'achievement/招生章程（详情）.xlsx'
df.to_excel(output_file, index=False, engine='openpyxl')

# 统计结果
print(f"\n" + "=" * 50)
print(f"合并完成！")
print(f"  成功合并: {success_count}所")
print(f"  文件不存在: {not_found_count}所")
print(f"  含表格: {len(df[df['招生章程是否含表格'] == '是'])}所")
print(f"  不含表格: {len(df[df['招生章程是否含表格'] == '否'])}所")
print(f"  输出文件: {output_file}")
print(f"=" * 50)
