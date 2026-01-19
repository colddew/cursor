#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Markdown 转 Excel
用法: python md_to_excel.py <markdown文件> <输出excel文件>
"""

import os
import sys
import re
import io
import pandas as pd


def md_to_excel(md_path, excel_path):
    """Markdown 表格转 Excel"""
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    lines = [l.strip() for l in md_text.split('\n') if '|' in l]

    separator_pattern = re.compile(r'^[\s\-\|]+$')
    lines = [l for l in lines if not separator_pattern.match(l)]

    if not lines:
        print("❌ 未找到有效的表格行")
        return False

    final_lines = []
    for l in lines:
        parts = [p.strip() for p in l.split('|')[1:-1]]
        final_lines.append('|'.join(parts))

    csv_content = '\n'.join(final_lines)
    df = pd.read_csv(io.StringIO(csv_content), sep='|', header=None, dtype=str,
                     engine='python', on_bad_lines='skip', keep_default_na=False, na_values=[''])
    df = df.fillna('')
    df = df.apply(lambda x: x.str.strip() if x.dtype == 'object' else x)

    df.to_excel(excel_path, index=False, header=False)
    print(f"✅ 已保存: {excel_path}")
    return True


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法: python md_to_excel.py <markdown文件> <输出excel文件>")
        sys.exit(1)

    md_path = sys.argv[1]
    excel_path = sys.argv[2]

    if not os.path.exists(md_path):
        print(f"❌ 文件不存在: {md_path}")
        sys.exit(1)

    md_to_excel(md_path, excel_path)
