#!/usr/bin/env python3
"""
爬取3所特殊招生章程（密云分校、人民武装学院、艺术体育类）

复用 crawl_with_tables.py 的成功代码
"""

import asyncio
import sys
import pandas as pd
from pathlib import Path
from playwright.async_api import async_playwright
import random

# 输出目录
OUTPUT_DIR = "special"

# 爬取参数（复用成功配置）
DELAY_FIRST_PAGE = 2.0
DELAY_BETWEEN_SCHOOLS = 1.0


async def check_and_crawl_table(page, school_name, url, wait_time=2.0):
    """检查并爬取表格格式的招生章程（复用crawl_with_tables.py的代码）"""
    try:
        await page.goto(url, timeout=60000, wait_until='networkidle')
        await asyncio.sleep(wait_time)

        result = await page.evaluate("""
            () => {
                let bodyHTML = document.body.innerHTML;
                let startMarker = '已经由上级主管部门审核通过';
                let startIdx = bodyHTML.indexOf(startMarker);

                if (startIdx < 0) {
                    return { hasTable: false, error: '未找到开始标记' };
                }

                let endMarker = '学籍查询';
                let endIdx = bodyHTML.indexOf(endMarker, startIdx);

                if (endIdx < 0) {
                    return { hasTable: false, error: '未找到结束标记' };
                }

                let afterStart = startIdx + startMarker.length;
                let contentHTML = bodyHTML.substring(afterStart, endIdx);

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentHTML;

                // 移除不需要的元素
                const unwanted = tempDiv.querySelectorAll('script, style, link, meta, .footer-wrapper, .footer-nav, svg');
                unwanted.forEach(el => el.remove());

                // 检查表格并清理
                const tables = tempDiv.querySelectorAll('table');
                let tableCount = 0;

                tables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    if (rows.length > 2) {
                        tableCount++;
                        let clonedTable = table.cloneNode(true);

                        // 移除table的所有属性
                        while (clonedTable.attributes.length > 0) {
                            clonedTable.removeAttribute(clonedTable.attributes[0].name);
                        }

                        // 移除所有tr的属性
                        const trs = clonedTable.querySelectorAll('tr');
                        trs.forEach(tr => {
                            while (tr.attributes.length > 0) {
                                tr.removeAttribute(tr.attributes[0].name);
                            }
                        });

                        // 清理td/th单元格
                        const cells = clonedTable.querySelectorAll('td, th');
                        cells.forEach(cell => {
                            const colspan = cell.getAttribute('colspan');
                            const rowspan = cell.getAttribute('rowspan');

                            // 提取单元格内容
                            let htmlContent = '';
                            let childNodes = Array.from(cell.childNodes);

                            childNodes.forEach((node, idx) => {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    let text = node.textContent.trim();
                                    if (text) htmlContent += text;
                                } else if (node.nodeType === Node.ELEMENT_NODE) {
                                    let text = node.textContent.trim();
                                    if (!text) return;
                                    htmlContent += text;

                                    let nextNode = childNodes[idx + 1];
                                    if (nextNode) {
                                        let tagName = node.tagName.toLowerCase();
                                        if (tagName === 'p' || tagName === 'div' || tagName === 'br' || tagName === 'li' || tagName === 'tr') {
                                            htmlContent += '<br>';
                                        }
                                    }
                                }
                            });

                            cell.innerHTML = htmlContent.trim();

                            // 移除所有属性
                            while (cell.attributes.length > 0) {
                                cell.removeAttribute(cell.attributes[0].name);
                            }

                            if (colspan) cell.setAttribute('colspan', colspan);
                            if (rowspan) cell.setAttribute('rowspan', rowspan);
                        });

                        table.replaceWith(clonedTable);
                    } else {
                        table.remove();
                    }
                });

                // 处理非表格内容
                function extractText(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        let text = node.textContent.trim();
                        return text ? text + '\\n\\n' : '';
                    }

                    if (node.nodeType !== Node.ELEMENT_NODE) return '';

                    let tagName = node.tagName.toLowerCase();

                    if (tagName === 'table' || tagName === 'script' || tagName === 'style' ||
                        tagName === 'svg' || tagName === 'link' || tagName === 'meta') {
                        return '';
                    }

                    if (node.querySelectorAll('table').length > 0) {
                        let result = '';
                        for (let child of node.childNodes) {
                            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'table') {
                                result += child.outerHTML + '\\n\\n';
                            } else {
                                result += extractText(child);
                            }
                        }
                        return result;
                    }

                    let text = node.textContent.trim();
                    return text ? text + '\\n\\n' : '';
                }

                let finalContent = '';
                for (let child of tempDiv.childNodes) {
                    if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'table') {
                        finalContent += child.outerHTML + '\\n\\n';
                    } else {
                        finalContent += extractText(child);
                    }
                }

                return {
                    hasTable: true,
                    content: finalContent,
                    tableCount: tableCount,
                    contentLength: finalContent.length
                };
            }
        """)

        if not result['hasTable']:
            error = result.get('error', '未检测到表格')
            return {'success': True, 'has_table': False, 'error': error}

        content = result['content']

        if not content or not content.strip():
            return {'success': False, 'has_table': True, 'error': '内容提取失败'}

        return {
            'success': True,
            'has_table': True,
            'content': content,
            'table_count': result['tableCount'],
            'content_length': result['contentLength']
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


async def main():
    """主程序"""

    print("=" * 60)
    print("特殊招生章程爬虫启动")
    print("=" * 60)

    # 读取源Excel，获取3所特殊链接学校
    df = pd.read_excel('achievement/招生章程.xlsx')
    special_schools = ['首都经济贸易大学', '浙江工商大学', '西南林业大学']
    special_data = df[df['学校名称'].isin(special_schools)][['学校名称', '招生章程详情页链接（特殊）', '招生章程详情页链接名称（特殊）']]

    print(f"待爬取: {len(special_data)}所")

    # 创建输出目录
    Path(OUTPUT_DIR).mkdir(exist_ok=True)

    # 启动浏览器（headless=False 便于调试）
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,  # 开窗便于调试
            args=['--disable-blink-features=AutomationControlled']
        )

        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='zh-CN',
            timezone_id='Asia/Shanghai',
        )

        page = await context.new_page()
        print("浏览器启动成功")

        completed_count = 0
        failed_count = 0

        for idx, row in special_data.iterrows():
            school_name = row['学校名称']
            link_name = row['招生章程详情页链接名称（特殊）']
            url = row['招生章程详情页链接（特殊）']

            print(f"")
            print(f"[{idx+1}/{len(special_data)}] {school_name}")
            print(f"  链接名称: {link_name}")
            print(f"  URL: {url}")

            try:
                # 第一条2秒，后续1秒
                wait_time = DELAY_FIRST_PAGE if completed_count == 0 else 1.0

                # 爬取
                result = await check_and_crawl_table(page, school_name, url, wait_time)

                if result['success']:
                    if result.get('has_table'):
                        content = result['content']

                        # 保存文件
                        filename = f"{school_name}-{link_name}.md"
                        filepath = Path(OUTPUT_DIR) / filename

                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)

                        print(f"  ✓ 成功 ({result['content_length']}字符, {result['table_count']}个表格)")
                        print(f"  → {filepath}")
                        completed_count += 1
                    else:
                        error = result.get('error', '未知错误')
                        print(f"  ✗ 无表格: {error}")
                        failed_count += 1
                else:
                    error = result.get('error', '未知错误')
                    print(f"  ✗ 失败: {error}")
                    failed_count += 1

            except Exception as e:
                print(f"  ✗ 异常: {e}")
                failed_count += 1

            # 学校之间延迟
            if idx < len(special_data) - 1:
                delay = random.uniform(0.5, 1.0)
                await asyncio.sleep(delay)

        await browser.close()

    # 最终统计
    print(f"")
    print(f"=" * 60)
    print(f"爬取完成！")
    print(f"  成功: {completed_count}")
    print(f"  失败: {failed_count}")
    print(f"=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("")
        print("用户中断")
