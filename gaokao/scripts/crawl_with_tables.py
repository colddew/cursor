#!/usr/bin/env python3
"""
爬取带表格格式的招生章程（HTML嵌入方式）
复用 test_tables_html.py 的测试通过逻辑
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright
import random

INPUT_FILE = "tables/有表格的学校清单.json"
OUTPUT_DIR = "tables"


async def check_and_crawl_table(page, school_name, url, wait_time=2.0):
    """检查并爬取表格格式的招生章程（HTML嵌入方式）

    兼容多种页面结构：
    - 纯表格
    - 文字 + 表格
    - 文字 + 表格 + 文字
    - 文字 + 表格 + 文字 + 表格 + 文字（多次混合）
    """
    try:
        await page.goto(url, timeout=60000, wait_until='networkidle')
        await asyncio.sleep(wait_time)

        # 用JavaScript提取并清理内容（复用test_tables_html.py的清理逻辑）
        result = await page.evaluate("""
            () => {
                // 获取整个body的innerHTML
                let bodyHTML = document.body.innerHTML;

                // 查找开始标记
                let startMarker = '已经由上级主管部门审核通过';
                let startIdx = bodyHTML.indexOf(startMarker);

                if (startIdx < 0) {
                    return { hasTable: false, error: '未找到开始标记' };
                }

                // 从开始标记位置开始查找结束标记
                let endMarker = '学籍查询';
                let endIdx = bodyHTML.indexOf(endMarker, startIdx);

                if (endIdx < 0) {
                    return { hasTable: false, error: '未找到结束标记' };
                }

                // 从开始标记之后开始提取（跳过"已经由上级主管部门审核通过"）
                let afterStart = startIdx + startMarker.length;
                let contentHTML = bodyHTML.substring(afterStart, endIdx);

                // 创建临时容器处理HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentHTML;

                // 移除footer、script、style、svg等不需要的元素
                const unwanted = tempDiv.querySelectorAll('script, style, link, meta, .footer-wrapper, .footer-nav, svg');
                unwanted.forEach(el => el.remove());

                // 检查表格并清理
                const tables = tempDiv.querySelectorAll('table');
                let tableCount = 0;

                tables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    if (rows.length > 2) {
                        tableCount++;
                        // 清理表格
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
                                    let tagName = node.tagName.toLowerCase();
                                    let text = node.textContent.trim();

                                    if (!text) return;

                                    htmlContent += text;

                                    // 检查是否需要换行
                                    let nextNode = childNodes[idx + 1];
                                    if (nextNode) {
                                        if (tagName === 'p' || tagName === 'div' || tagName === 'br') {
                                            htmlContent += '<br>';
                                        } else if (tagName === 'li' || tagName === 'tr') {
                                            htmlContent += '<br>';
                                        }
                                    }
                                }
                            });

                            cell.innerHTML = '';
                            cell.innerHTML = htmlContent.trim();

                            // 移除所有属性
                            while (cell.attributes.length > 0) {
                                cell.removeAttribute(cell.attributes[0].name);
                            }

                            // 只添加回colspan和rowspan
                            if (colspan) cell.setAttribute('colspan', colspan);
                            if (rowspan) cell.setAttribute('rowspan', rowspan);
                        });

                        // 替换原表格
                        table.replaceWith(clonedTable);
                    } else {
                        // 移除小表格
                        table.remove();
                    }
                });

                // 处理非表格内容：提取纯文本
                function extractText(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        let text = node.textContent.trim();
                        return text ? text + '\\n\\n' : '';
                    }

                    if (node.nodeType !== Node.ELEMENT_NODE) return '';

                    let tagName = node.tagName.toLowerCase();

                    // 跳过已处理的表格和非内容标签
                    if (tagName === 'table' || tagName === 'script' || tagName === 'style' ||
                        tagName === 'svg' || tagName === 'link' || tagName === 'meta') {
                        return '';
                    }

                    // 检查是否包含表格
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

                    // 不包含表格的元素，提取文本
                    let text = node.textContent.trim();
                    return text ? text + '\\n\\n' : '';
                }

                // 构建最终内容
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

        # 保存到tables文件夹（直接保存HTML片段）
        Path(OUTPUT_DIR).mkdir(exist_ok=True)
        filepath = Path(OUTPUT_DIR) / school_name
        with open(f"{filepath}.md", 'w', encoding='utf-8') as f:
            f.write(content)

        return {
            'success': True,
            'has_table': True,
            'table_count': result['tableCount'],
            'content_length': result['contentLength']
        }

    except Exception as e:
        return {'success': False, 'has_table': False, 'error': str(e)[:100]}


async def crawl_table_format_schools(test_mode=True, test_count=20):
    """爬取有表格的学校

    Args:
        test_mode: 测试模式，只爬取前N所
        test_count: 测试模式下爬取的学校数量
    """

    # 读取清单
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        schools = json.load(f)

    if test_mode:
        schools = schools[:test_count]

    print("=" * 60)
    if test_mode:
        print(f"【测试模式】爬取前 {len(schools)} 所学校的表格格式招生章程")
    else:
        print(f"爬取 {len(schools)} 所学校的表格格式招生章程")
    print("=" * 60)

    Path(OUTPUT_DIR).mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled']
        )

        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='zh-CN',
            timezone_id='Asia/Shanghai',
        )

        page = await context.new_page()

        completed = 0
        failed = 0
        log_entries = []

        for idx, school in enumerate(schools, 1):
            school_name = school['学校名称']
            url = school['详情页链接']

            print(f"[{idx}/{len(schools)}] {school_name}", flush=True)

            # 第一页等待2秒，后续0.5秒（优化速度）
            wait_time = 2.0 if idx == 1 else 0.5
            result = await check_and_crawl_table(page, school_name, url, wait_time)

            if result['success'] and result['has_table']:
                print(f"  ✓ 成功 ({result['content_length']}字符, {result['table_count']}个表格)")
                completed += 1
                log_entries.append(f"[{idx}/{len(schools)}] {school_name} - 成功 ({result['content_length']}字符, {result['table_count']}个表格)")
            elif result['success'] and not result['has_table']:
                print(f"  ✗ 未检测到表格")
                failed += 1
                log_entries.append(f"[{idx}/{len(schools)}] {school_name} - 未检测到表格")
            else:
                print(f"  ✗ {result.get('error', '未知错误')}")
                failed += 1
                log_entries.append(f"[{idx}/{len(schools)}] {school_name} - 失败: {result.get('error', '未知错误')}")

            # 延迟
            if idx < len(schools):
                await asyncio.sleep(random.uniform(0.3, 0.5))

        await browser.close()

    # 保存日志
    with open(f"{OUTPUT_DIR}/crawl.log", 'w', encoding='utf-8') as f:
        f.write('\n'.join(log_entries))

    print("\n" + "=" * 60)
    print("爬取完成！")
    print(f"  成功: {completed}")
    print(f"  失败: {failed}")
    print(f"  成功率: {completed / (completed + failed) * 100:.1f}%")
    print("=" * 60)


if __name__ == "__main__":
    # 全量爬取所有学校
    asyncio.run(crawl_table_format_schools(test_mode=False))
