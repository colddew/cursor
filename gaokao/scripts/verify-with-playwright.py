#!/usr/bin/env python3
"""
验证数据准确性 - 本地Playwright方案
- 20条一批，每批完成后保存副本
- 第一条等待2秒防错
- 支持断点续传
"""

import pandas as pd
import asyncio
import time
import json
import os
from datetime import datetime
from playwright.async_api import async_playwright

# ==================== 配置 ====================
EXCEL_FILE = '招生章程.xlsx'
COPY_FILE = '招生章程_验证副本.xlsx'
BATCH_SIZE = 20  # 每批20条
PROGRESS_FILE = 'verification_progress.json'

# ==================== 工具函数 ====================

def create_copy():
    """创建副本Excel并添加列"""
    if os.path.exists(COPY_FILE):
        print(f"✅ 副本已存在: {COPY_FILE}")
        return True

    df = pd.read_excel(EXCEL_FILE)

    # 添加两列
    df['验证状态'] = ''
    df['新招生章程详情页链接'] = ''

    df.to_excel(COPY_FILE, index=False, engine='openpyxl')
    print(f"✅ 创建副本: {COPY_FILE}")
    print(f"   添加列: 验证状态、新招生章程详情页链接")
    return True

def load_progress():
    """加载进度"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {
        'start_time': None,
        'last_update': None,
        'verified_count': 0,
        'total_count': 0,
        'current_batch': 0
    }

def save_progress(progress):
    """保存进度"""
    progress['last_update'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def get_schools_to_verify():
    """获取需要验证的学校"""
    df = pd.read_excel(EXCEL_FILE)

    schools = []
    for idx, row in df.iterrows():
        enrollment_link = row.get('招生章程链接')
        detail_link = row.get('招生章程详情页链接')

        # 只验证有数据的，排除已标记无效、多链接、空值的
        if pd.notna(enrollment_link) and str(enrollment_link).startswith('https'):
            if pd.notna(detail_link) and str(detail_link).startswith('0-'):
                continue
            if pd.notna(detail_link) and str(detail_link).count('https://') >= 2:
                continue
            if pd.isna(detail_link) or str(detail_link).strip() == '':
                continue

            schools.append({
                'index': int(idx),
                'name': row.get('学校名称'),
                'enrollment_link': enrollment_link,
                'existing_data': str(detail_link)
            })

    return schools

async def verify_and_update_batch(schools, batch_num, total_batches):
    """验证一批学校并更新副本"""

    print(f"\n批次 {batch_num}/{total_batches} ({len(schools)}条)")
    print("-" * 50)

    results = []
    start_time = time.time()

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

        for i, school in enumerate(schools):
            print(f"  [{i+1}/{len(schools)}] {school['name']}", flush=True)

            # 第一条等待2秒，后续等待0.5秒
            wait_time = 2.0 if batch_num == 1 and i == 0 else 0.5

            try:
                await page.goto(school['enrollment_link'], timeout=30000, wait_until='domcontentloaded')
                await asyncio.sleep(wait_time)

                detail_links = await page.query_selector_all('a[href*="/zsgs/zhangcheng/listVerifedZszc--"]')

                if detail_links:
                    link_text = await detail_links[0].inner_text()
                    link_href = await detail_links[0].get_attribute('href')

                    if link_href and not link_href.startswith('http'):
                        link_href = 'https://gaokao.chsi.com.cn' + link_href

                    new_formatted = f"{link_text.strip()},{link_href}"
                    existing = school['existing_data']

                    if new_formatted == existing:
                        print(f"    ✅", flush=True)
                        result = {'index': school['index'], 'status': '', 'new_data': ''}
                    else:
                        print(f"    ❌ 不一致", flush=True)
                        result = {'index': school['index'], 'status': '❌不一致', 'new_data': new_formatted}
                else:
                    print(f"    ⚠️  未找到详情页", flush=True)
                    result = {'index': school['index'], 'status': '⚠️未找到详情页', 'new_data': ''}

            except Exception as e:
                print(f"    ❌ 错误: {str(e)[:40]}", flush=True)
                result = {'index': school['index'], 'status': f'⚠️错误:{str(e)[:30]}', 'new_data': ''}

            results.append(result)

            # 延迟
            if i < len(schools) - 1:
                await asyncio.sleep(0.3)

        await browser.close()

    elapsed = time.time() - start_time
    print(f"\n批次耗时: {elapsed:.1f}秒")

    # 暂停1-2秒
    print("保存副本中...")
    await asyncio.sleep(1.5)

    # 更新副本
    df = pd.read_excel(COPY_FILE)
    for r in results:
        df.at[r['index'], '验证状态'] = r['status']
        df.at[r['index'], '新招生章程详情页链接'] = r['new_data']

    df.to_excel(COPY_FILE, index=False, engine='openpyxl')
    print(f"✅ 副本已更新: {COPY_FILE}")

    return results

async def main():
    """主流程"""
    print("=" * 60)
    print("数据准确性验证 - 本地Playwright")
    print("=" * 60)

    # 1. 创建副本
    print("\n步骤1: 创建副本")
    create_copy()

    # 2. 加载进度
    print("\n步骤2: 加载进度")
    progress = load_progress()
    if progress['verified_count'] > 0:
        print(f"  已验证: {progress['verified_count']} 条")
        print(f"  上次批次: {progress['current_batch']}")

    # 3. 获取待验证学校
    print("\n步骤3: 获取待验证学校")
    all_schools = get_schools_to_verify()
    print(f"  总计: {len(all_schools)} 条")

    if progress['total_count'] == 0:
        progress['total_count'] = len(all_schools)

    if len(all_schools) == 0:
        print("  没有需要验证的数据")
        return

    # 4. 分批验证
    print(f"\n步骤4: 开始验证（每批{BATCH_SIZE}条）")
    print("=" * 60)

    if progress['start_time'] is None:
        progress['start_time'] = datetime.now().isoformat()
        save_progress(progress)

    total_batches = (len(all_schools) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_idx in range(progress['current_batch'], total_batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(all_schools))
        batch_schools = all_schools[start_idx:end_idx]

        # 验证并更新
        results = await verify_and_update_batch(batch_schools, batch_idx + 1, total_batches)

        # 更新进度
        progress['verified_count'] += len(batch_schools)
        progress['current_batch'] = batch_idx + 1
        save_progress(progress)

        # 统计
        issues = len([r for r in results if r['status']])
        print(f"本批问题: {issues}/{len(results)}")

        # 总进度
        percentage = progress['verified_count'] / len(all_schools) * 100
        print(f"总进度: {progress['verified_count']}/{len(all_schools)} ({percentage:.1f}%)")
        print(f"✅ 进度已保存，可随时中断\n")

    # 5. 完成
    print("=" * 60)
    print("验证完成！")
    print("=" * 60)
    print(f"\n副本文件: {COPY_FILE}")
    print(f"筛选'验证状态'列即可查看问题数据")

if __name__ == '__main__':
    asyncio.run(main())
