#!/usr/bin/env python3
"""
招生章程详情页爬虫主程序
爬取阳光高考网所有学校的招生章程完整内容
"""

import asyncio
import sys
import logging
from pathlib import Path
from datetime import datetime
import random
from playwright.async_api import async_playwright
import pandas as pd

# ==================== 配置参数 ====================

EXCEL_PATH = "achievement/招生章程.xlsx"
OUTPUT_DIR = "details"
PROGRESS_FILE = "爬取进度.xlsx"

# 爬取参数
BATCH_SIZE = 15  # 每批处理学校数量
DELAY_FIRST_PAGE = 2.0  # 第一条等待时间
DELAY_BETWEEN_SCHOOLS = (0.3, 0.5)  # 学校之间延迟

# 日志配置
LOG_FILE = f"logs/crawl_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

# ==================== 日志设置 ====================

Path("logs").mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def extract_content(text: str) -> str:
    """
    精确提取招生章程内容
    从"已经由上级主管部门审核通过"到"学籍查询"之前
    """
    lines = text.split('\n')

    # 找到开始和结束位置
    start_idx = -1
    end_idx = len(lines)

    for i, line in enumerate(lines):
        if '已经由上级主管部门审核通过' in line:
            start_idx = i + 1  # 从下一行开始
        if '学籍查询' in line:
            end_idx = i
            break

    # 提取中间内容
    if start_idx >= 0:
        content_lines = []
        for line in lines[start_idx:end_idx]:
            trimmed = line.strip()
            if trimmed:
                content_lines.append(trimmed)
        return '\n\n'.join(content_lines)
    else:
        # 如果没找到标记，返回空
        return ""


async def main():
    """主程序入口"""

    logger.info("=" * 60)
    logger.info("招生章程详情页爬虫启动")
    logger.info("=" * 60)

    # 读取任务
    df = pd.read_excel(EXCEL_PATH)
    df = df[df['招生章程详情页链接（本部）'].notna()]

    # 只获取本部链接有数据的学校
    tasks = df[['学校名称', '招生章程详情页链接（本部）']].to_dict('records')

    logger.info(f"总任务数: {len(tasks)}")

    # 获取剩余任务（排除已完成的）
    remaining_tasks = []
    for task in tasks:
        school_name = task['学校名称']
        md_file = Path(OUTPUT_DIR) / f"{school_name}.md"
        if not md_file.exists():
            remaining_tasks.append(task)

    logger.info(f"剩余任务数: {len(remaining_tasks)}")

    if not remaining_tasks:
        logger.info("所有任务已完成！")
        return

    # 启动浏览器（只启动一次）
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
        logger.info("浏览器启动成功")

        # 分批处理
        total_batches = (len(remaining_tasks) + BATCH_SIZE - 1) // BATCH_SIZE
        logger.info(f"开始分批爬取: 共 {total_batches} 批，预计 {total_batches * 15 / 60:.1f} 小时")

        completed_count = 0
        failed_count = 0

        for batch_idx, batch_start in enumerate(range(0, len(remaining_tasks), BATCH_SIZE), 1):
            batch_tasks = remaining_tasks[batch_start:batch_start + BATCH_SIZE]

            logger.info(f"")
            logger.info(f"=" * 60)
            logger.info(f"批次 [{batch_idx}/{total_batches}]: {len(batch_tasks)} 所学校")
            logger.info(f"=" * 60)

            for idx, task in enumerate(batch_tasks, 1):
                school_name = task['学校名称']
                url = task['招生章程详情页链接（本部）']

                logger.info(f"[{completed_count + failed_count + 1}/{len(remaining_tasks)}] {school_name}")

                try:
                    # 访问页面
                    await page.goto(url, timeout=30000, wait_until='domcontentloaded')

                    # 第一条等待2秒，后续0.5秒
                    wait_time = DELAY_FIRST_PAGE if completed_count == 0 and failed_count == 0 else 0.5
                    await asyncio.sleep(wait_time)

                    # 获取文本
                    text = await page.evaluate("() => document.body.innerText || ''")

                    if text and len(text) > 100:
                        # 提取内容
                        content = extract_content(text)

                        if content:
                            # 保存MD文件
                            filepath = Path(OUTPUT_DIR) / school_name
                            with open(f"{filepath}.md", 'w', encoding='utf-8') as f:
                                f.write(content)

                            logger.info(f"  ✓ 成功 ({len(content)}字符)")
                            completed_count += 1
                        else:
                            logger.warning(f"  ✗ 内容提取失败")
                            failed_count += 1
                    else:
                        logger.warning(f"  ✗ 页面内容为空")
                        failed_count += 1

                except Exception as e:
                    logger.error(f"  ✗ {e}")
                    failed_count += 1

                # 学校之间延迟
                if idx < len(batch_tasks):
                    delay = random.uniform(*DELAY_BETWEEN_SCHOOLS)
                    await asyncio.sleep(delay)

            # 批次完成，显示进度
            progress_pct = (completed_count + failed_count) / len(remaining_tasks) * 100
            logger.info(f"")
            logger.info(f"批次完成！总进度: {completed_count + failed_count}/{len(remaining_tasks)} ({progress_pct:.1f}%)")
            logger.info(f"  成功: {completed_count}, 失败: {failed_count}")

            # 批次之间稍作停顿
            if batch_idx < total_batches:
                await asyncio.sleep(2.0)

        await browser.close()

    # 最终统计
    logger.info(f"")
    logger.info(f"=" * 60)
    logger.info(f"爬取完成！")
    logger.info(f"  成功: {completed_count}")
    logger.info(f"  失败: {failed_count}")
    logger.info(f"  成功率: {completed_count / (completed_count + failed_count) * 100:.1f}%")
    logger.info(f"=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("")
        logger.info("用户中断，进度已保存（已完成的MD文件）")
