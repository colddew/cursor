#!/usr/bin/env python3
"""
阳光高考网招生章程详情页增量爬取脚本

⚠️ 重要说明：
本脚本为设计参考文档，记录了增量爬取的核心逻辑和参数配置。
实际爬取是通过 Claude Code + Playwright MCP 工具手动完成的。

实际使用方式：
1. 在 Claude Code 对话中手动调用 mcp__playwright__* 系列工具
2. 每批次（15-20所）完成后，生成更新脚本同步 Excel/CSV/JSON
3. 参考本文档的延迟策略和验证逻辑

批次大小：15-20条/批次
延迟策略：
  - 翻页后: 2.5-4秒（随机）
  - 学校之间: 3-5.5秒（随机）
  - 批次之间: 5-10秒（随机）
  - 出错重试: 10-20秒（随机）
"""

import pandas as pd
import json
import os
import random
import time
from datetime import datetime

# ==================== 配置参数 ====================
BATCH_SIZE = 15-20  # 每批15-20条（根据实际情况调整）
EXCEL_PATH = '招生章程.xlsx'
PROGRESS_PATH = 'crawl_progress.json'
ERROR_LOG_PATH = 'crawl_errors.log'

# 延迟设置（秒）- 根据反爬虫策略优化
DELAY_AFTER_PAGE_LOAD = (2.5, 4.0)  # 翻页后2.5-4秒（随机）
DELAY_BETWEEN_SCHOOLS = (3.0, 5.5)  # 学校之间3-5.5秒（随机）
DELAY_BETWEEN_BATCHES = (5.0, 10.0)  # 批次之间5-10秒（随机）
DELAY_ON_ERROR = (10.0, 20.0)  # 出错后10-20秒（随机）


# ==================== 工具函数 ====================

def log_error(message):
    """记录错误到日志"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(ERROR_LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {message}\n")
    print(f"❌ {message}")


def load_progress():
    """加载进度文件"""
    if os.path.exists(PROGRESS_PATH):
        with open(PROGRESS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return {
            'metadata': {
                'start_time': None,
                'last_update': None,
                'total_to_crawl': 0,
                'completed_count': 0,
                'current_batch': 0,
                'total_batches': 0
            },
            'completed_schools': [],
            'current_batch_schools': [],
            'failed_schools': []
        }


def save_progress(progress):
    """保存进度文件"""
    progress['metadata']['last_update'] = datetime.now().isoformat()
    with open(PROGRESS_PATH, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def get_remaining_schools():
    """获取待爬取学校列表"""
    df = pd.read_excel(EXCEL_PATH)
    progress = load_progress()

    completed = set(progress['completed_schools'])
    current_batch = progress.get('current_batch_schools', [])

    # 链接为空的学校
    needs_crawl = df[df['招生章程详情页链接'].isna()]

    # 排除已完成的和当前批次已爬取的
    remaining = needs_crawl[~needs_crawl['学校名称'].isin(completed)]
    if current_batch:
        remaining = remaining[~remaining['学校名称'].isin(current_batch)]

    # 更新总数
    progress['metadata']['total_to_crawl'] = len(needs_crawl)
    save_progress(progress)

    return remaining[['学校名称', '招生章程链接']].to_dict('records')


# ==================== Excel 更新逻辑 ====================

def update_excel_batch(batch_results):
    """
    根据学校名称精确匹配更新Excel

    参数:
        batch_results: {
            '学校名称': {
                'status': 'success' | 'unavailable' | 'not_open' | ...
                'title': '...' (如果有)
                'url': '...' (如果有)
                'message': '...'
            }
        }
    """
    df = pd.read_excel(EXCEL_PATH)

    for school_name, result in batch_results.items():
        # 精确匹配学校名称
        mask = df['学校名称'] == school_name

        if mask.sum() == 1:
            idx = df[mask].index[0]

            # 根据状态更新
            if result['status'] == 'success':
                df.at[idx, '招生章程详情页链接'] = f"{result['title']},{result['url']}"
            else:
                # 记录状态消息
                df.at[idx, '招生章程详情页链接'] = result['message']
        else:
            log_error(f"无法匹配学校: {school_name}")

    # 保存Excel
    df.to_excel(EXCEL_PATH, index=False, engine='openpyxl')
    return len(batch_results)


def verify_batch_update(batch_results):
    """验证批次更新是否成功"""
    df = pd.read_excel(EXCEL_PATH)

    for school_name, result in batch_results.items():
        mask = df['学校名称'] == school_name

        if mask.sum() == 1:
            idx = mask[mask].index[0]
            detail_link = df.at[idx, '招生章程详情页链接']

            # 验证非空
            if pd.isna(detail_link) or detail_link == '':
                return False, f"{school_name}: 链接为空"

            # 验证格式
            if result['status'] == 'success':
                if ',' not in str(detail_link):
                    return False, f"{school_name}: 格式错误（缺少逗号）"
            else:
                if str(detail_link) != result['message']:
                    return False, f"{school_name}: 消息不匹配"
        else:
            return False, f"{school_name}: 找不到匹配行"

    return True, "验证通过"


# ==================== 核心爬取逻辑 ====================

def crawl_school(school_name, enrollment_link):
    """
    爬取单个学校的招生章程详情页

    返回:
        {
            'status': 'success' | 'unavailable' | 'not_open' | 'not_exist' | 'empty_page' | 'unknown',
            'title': '...' (如果有),
            'url': '...' (如果有),
            'message': '...'
        }
    """
    from mcp__playwright import browser_navigate, browser_run_code

    try:
        # 1. 导航到招生章程链接
        result = browser_navigate(url=enrollment_link, timeout=10000)
        if not result.get('success'):
            return {
                'status': 'unknown',
                'message': '导航失败'
            }

        # 2. 等待页面加载
        time.sleep(DELAY_AFTER_PAGE_LOAD)

        # 3. 执行JavaScript提取
        js_code = """
        async (page) => {
          await page.waitForLoadState('networkidle');

          const result = await page.evaluate(() => {
            const mainContent = document.querySelector('.main-content, .content, .main') || document.body;
            const pageText = mainContent.innerText.toLowerCase();

            // 有详情页链接
            const detailLinks = document.querySelectorAll('a[href*="/zsgs/zhangcheng/listVerifedZszc--"]');
            if (detailLinks.length > 0) {
              const firstLink = detailLinks[0];
              return {
                status: 'success',
                title: firstLink.textContent.trim(),
                url: firstLink.href,
                message: `找到${detailLinks.length}条详情页链接`
              };
            }

            // 暂无招生章程
            if (pageText.includes('暂无招生章程') || pageText.includes('暂无章程')) {
              return { status: 'unavailable', message: '暂无招生章程' };
            }

            // 暂未开放
            if (pageText.includes('暂未开放') || pageText.includes('尚未开放')) {
              return { status: 'not_open', message: '暂未开放院校相关信息' };
            }

            // 不存在
            if (pageText.includes('不存在') || pageText.includes('无相关')) {
              return { status: 'not_exist', message: '招生章程不存在' };
            }

            // 空白页（异常）
            if (pageText.trim().length < 50) {
              return { status: 'empty_page', message: '页面加载失败' };
            }

            // 未知情况
            return {
              status: 'unknown',
              message: '需人工审核: ' + pageText.substring(0, 200)
            };
          });

          return result;
        }
        """

        extraction_result = browser_run_code(code=js_code)

        if extraction_result.get('success'):
            data = extraction_result.get('result', {})
            return {
                'status': data.get('status', 'unknown'),
                'title': data.get('title', ''),
                'url': data.get('url', ''),
                'message': data.get('message', '提取失败')
            }
        else:
            return {
                'status': 'unknown',
                'message': f'JavaScript执行失败: {extraction_result.get("error", "未知错误")}'
            }

    except Exception as e:
        log_error(f"爬取 {school_name} 异常: {str(e)}")
        return {
            'status': 'unknown',
            'message': f'爬取异常: {str(e)}'
        }


def crawl_batch(schools):
    """
    爬取一个批次（20所学校）

    参数:
        schools: [
            {'学校名称': '...', '招生章程链接': '...'},
            ...
        ]

    返回:
        {
            '学校名称': {结果},
            ...
        }
    """
    batch_results = {}

    for i, school in enumerate(schools):
        school_name = school['学校名称']
        enrollment_link = school['招生章程链接']

        print(f"  [{i+1}/{len(schools)}] {school_name}")

        # 爬取
        result = crawl_school(school_name, enrollment_link)
        batch_results[school_name] = result

        # 显示结果
        status_icon = {
            'success': '✅',
            'unavailable': '⚠️',
            'not_open': '⚠️',
            'not_exist': '⚠️',
            'empty_page': '❌',
            'unknown': '❓'
        }.get(result['status'], '❌')
        print(f"    {status_icon} {result['message']}")

        # 学校之间延迟
        if i < len(schools) - 1:
            delay = random.uniform(DELAY_BETWEEN_SCHOOLS_MIN, DELAY_BETWEEN_SCHOOLS_MAX)
            time.sleep(delay)

    return batch_results


# ==================== 主流程 ====================

def main():
    """主流程"""
    print("=" * 60)
    print("阳光高考网招生章程详情页增量爬取")
    print("=" * 60)

    # 1. 加载进度
    progress = load_progress()

    if progress['metadata']['start_time']:
        print(f"\n📅 开始时间: {progress['metadata']['start_time']}")
        print(f"✅ 已完成: {progress['metadata']['completed_count']} 所")
        print(f"📍 当前进度: {progress['metadata']['current_batch']}/{progress['metadata']['total_batches']} 批次")

    # 2. 获取待爬取学校
    remaining_schools = get_remaining_schools()

    if len(remaining_schools) == 0:
        print("\n✅ 所有学校已爬取完成！")
        return

    total_to_crawl = progress['metadata']['total_to_crawl']
    print(f"\n📊 待爬取: {len(remaining_schools)} 所 (总共需爬取: {total_to_crawl} 所)")

    # 3. 分批处理
    total_batches = (len(remaining_schools) + BATCH_SIZE - 1) // BATCH_SIZE
    progress['metadata']['total_batches'] = total_batches
    save_progress(progress)

    # 4. 爬取循环
    for batch_idx in range(progress['metadata']['current_batch'], total_batches):
        # 获取当前批次
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(remaining_schools))
        batch_schools = remaining_schools[start_idx:end_idx]

        print(f"\n{'=' * 60}")
        print(f"批次 {batch_idx + 1}/{total_batches} ({len(batch_schools)}所学校)")
        print(f"{'=' * 60}")

        # 爬取
        batch_results = crawl_batch(batch_schools)

        # 验证
        success_count = len([r for r in batch_results.values() if r['status'] == 'success'])
        success_rate = success_count / len(batch_results) * 100

        print(f"\n批次统计:")
        print(f"  成功: {success_count}/{len(batch_results)} ({success_rate:.1f}%)")

        # 更新Excel
        print(f"\n更新Excel...")
        update_count = update_excel_batch(batch_results)
        print(f"  ✓ 已更新 {update_count} 条")

        # 验证更新
        print(f"验证更新...")
        verified, msg = verify_batch_update(batch_results)
        if verified:
            print(f"  ✓ {msg}")
        else:
            print(f"  ✗ {msg}")
            log_error(f"批次 {batch_idx + 1} 验证失败: {msg}")

        # 更新进度
        for school_name, result in batch_results.items():
            if result['status'] == 'success':
                progress['completed_schools'].append(school_name)
            else:
                progress['failed_schools'].append({
                    'name': school_name,
                    'status': result['status'],
                    'message': result['message']
                })

        progress['metadata']['completed_count'] = len(progress['completed_schools'])
        progress['metadata']['current_batch'] = batch_idx + 1
        progress['current_batch_schools'] = []
        save_progress(progress)

        # 显示总体进度
        percentage = progress['metadata']['completed_count'] / total_to_crawl * 100
        print(f"\n📊 总进度: {progress['metadata']['completed_count']}/{total_to_crawl} ({percentage:.1f}%)")

        # 批次间延迟
        if batch_idx < total_batches - 1:
            delay = random.uniform(DELAY_BETWEEN_BATCHES_MIN, DELAY_BETWEEN_BATCHES_MAX)
            print(f"⏱️  等待 {delay:.1f} 秒后继续...")
            time.sleep(delay)

    # 5. 完成
    print(f"\n{'=' * 60}")
    print("✅ 爬取完成！")
    print(f"{'=' * 60}")
    print(f"\n最终统计:")
    print(f"  总计爬取: {progress['metadata']['completed_count']} 所")
    print(f"  失败: {len(progress['failed_schools'])} 所")
    print(f"\n详细结果请查看: {EXCEL_PATH}")
    print(f"错误日志请查看: {ERROR_LOG_PATH}")


if __name__ == '__main__':
    main()
