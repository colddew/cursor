#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import pandas as pd
from pathlib import Path

def extract_company_name(filename):
    """
    从文件名中提取公司名称
    文件名格式：[公司名称]-分析报告.md
    """
    if filename == '需求挖掘大师提示词.md':
        return None
    # 移除文件后缀
    name_without_ext = filename.replace('.md', '')
    # 分割获取公司名称
    parts = name_without_ext.split('-分析报告')
    return parts[0] if parts else None

def extract_customer_link(file_content):
    """
    从文件内容中提取客户链接
    客户链接通常在文件第一行，格式：报告源地址：https://www.feishu.cn/customers/[company-id]
    """
    lines = file_content.split('\n')
    for line in lines:
        if line.startswith('报告源地址：'):
            # 提取URL部分
            url = line.replace('报告源地址：', '').strip()
            return url
    return None

def remove_source_address(content):
    """
    移除内容中的第一行报告源地址信息
    """
    lines = content.split('\n')
    # 如果第一行是报告源地址，则移除
    if lines and lines[0].startswith('报告源地址：'):
        # 移除第一行
        content_without_source = '\n'.join(lines[1:])
        return content_without_source.strip()
    return content

def process_markdown_files(report_folder='.', output_file='飞书客户分析报告汇总.xlsx'):
    """
    处理report文件夹下的所有markdown文件，生成Excel汇总表
    """
    # 存储数据的列表
    data = []

    # 获取所有.md文件
    md_files = list(Path(report_folder).glob('*.md'))

    # 排除需求挖掘大师提示词.md
    md_files = [f for f in md_files if f.name != '需求挖掘大师提示词.md']

    print(f"找到 {len(md_files)} 个分析报告文件")

    for file_path in md_files:
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 提取公司名称
            company_name = extract_company_name(file_path.name)

            if company_name:
                # 提取客户链接
                customer_link = extract_customer_link(content)

                # 移除报告源地址行
                content_without_source = remove_source_address(content)

                # 添加到数据列表
                data.append({
                    '公司名称': company_name,
                    '分析报告': content_without_source,
                    '客户链接': customer_link
                })

                print(f"已处理: {company_name}")

        except Exception as e:
            print(f"处理文件 {file_path.name} 时出错: {e}")

    # 创建DataFrame
    df = pd.DataFrame(data)

    # 保存到Excel
    with pd.ExcelWriter(output_file, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='客户分析报告汇总', index=False)

        # 获取工作簿和工作表对象
        workbook = writer.book
        worksheet = writer.sheets['客户分析报告汇总']

        # 设置列宽
        worksheet.set_column('A:A', 30)  # 公司名称
        worksheet.set_column('B:B', 100)  # 分析报告
        worksheet.set_column('C:C', 50)  # 客户链接

        # 设置格式
        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'top',
            'fg_color': '#D7E4BC',
            'border': 1
        })

        # 设置表头格式
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)

    print(f"\nExcel文件已生成: {output_file}")
    print(f"共处理 {len(data)} 家公司的分析报告")

    return df

if __name__ == "__main__":
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # report文件夹在子目录中
    report_folder = os.path.join(script_dir, 'report')
    output_file = os.path.join(script_dir, '飞书客户分析报告汇总.xlsx')

    # 生成Excel文件
    df = process_markdown_files(
        report_folder=report_folder,
        output_file=output_file
    )

    # 显示前5行数据预览
    print("\n数据预览（前5行）:")
    print(df[['公司名称', '客户链接']].head())