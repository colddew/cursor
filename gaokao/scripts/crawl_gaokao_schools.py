#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阳光高考网招生章程数据爬虫
使用Playwright MCP模拟人类操作，爬取所有学校信息
优化版：延迟1-2秒，直接提取img src
"""

import re
import pandas as pd
import time
import random


def extract_schools_with_js():
    """
    使用JavaScript从当前页面提取学校信息
    返回学校列表
    """
    js_code = """
async (page) => {
  const schoolCards = await page.evaluate(() => {
    const cards = [];
    const enrollmentLinks = document.querySelectorAll('a[href*="/zsgs/zhangcheng/listZszc--"]');

    enrollmentLinks.forEach((enrollmentLink) => {
      let card = enrollmentLink.closest('div');
      while (card && !card.querySelector('a[href*="/sch/schoolInfo--"]')) {
        card = card.parentElement;
      }
      if (!card) return;

      const school = {
        name: '',
        province: '',
        city: '',
        department: '',
        level: '',
        features: '',
        logoUrl: '',
        enrollmentUrl: enrollmentLink.href,
        detailUrl: ''
      };

      // 提取学校名称和详情页URL
      const nameLink = card.querySelector('a[href*="/sch/schoolInfo--"]');
      if (nameLink) {
        school.name = nameLink.textContent.trim();
        school.detailUrl = nameLink.href;
      }

      // 提取校徽 - 直接从img标签获取src属性
      const logoImg = card.querySelector('img');
      if (logoImg && logoImg.src) {
        school.logoUrl = logoImg.src;
      }

      const allLinks = Array.from(card.querySelectorAll('a'));
      let locationLink = allLinks.find(link => {
        const text = link.textContent;
        return text.includes('主管部门：') || text.includes('主管部门:');
      });

      if (locationLink) {
        // 第一遍：找省份（第一个非空文本节点）
        const childNodes = Array.from(locationLink.childNodes);
        for (const child of childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            if (text && text !== '|' && text !== '｜' && !school.province) {
              school.province = text;
              break;
            }
          }
        }

        // 第二遍：找主管部门（"主管部门："标记后的文本节点）
        let foundMarker = false;
        for (const child of childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const text = child.textContent.trim();
            if (text === '主管部门：' || text === '主管部门:') {
              foundMarker = true;
            }
          } else if (child.nodeType === Node.TEXT_NODE && foundMarker) {
            const text = child.textContent.trim();
            if (text) {
              school.department = text;
              break;
            }
          }
        }

        // 直辖市：城市=省份
        if (['北京', '天津', '上海', '重庆'].includes(school.province)) {
          school.city = school.province;
        }
      }

      // 提取办学层次和院校特性
      let levelLink = allLinks.find(link => {
        const text = link.textContent.trim();
        return text.includes('本科') || text.includes('高职');
      });

      if (levelLink) {
        const levelText = levelLink.textContent.trim();
        if (levelText.includes('本科')) {
          school.level = '本科';
        } else if (levelText.includes('高职(专科)')) {
          school.level = '高职(专科)';
        }

        // 提取院校特性
        if (levelText.includes('|') || levelText.includes('｜')) {
          const parts = levelText.split(/\\||\\｜/);
          if (parts.length > 1) {
            const featureText = parts[1].trim();
            const features = [];

            if (featureText.includes('双一流')) features.push('"双一流"建设高校');
            if (featureText.includes('民办高校')) features.push('民办高校');
            if (featureText.includes('独立学院')) features.push('独立学院');
            if (featureText.includes('中外合作办学')) features.push('中外合作办学');
            if (featureText.includes('内地与港澳台地区合作办学')) features.push('内地与港澳台地区合作办学');

            school.features = features.join(' | ');
          }
        }
      }

      if (school.name) {
        cards.push(school);
      }
    });

    return cards;
  });

  return {
    success: true,
    count: schoolCards.length,
    schools: schoolCards
  };
}
"""

    # 通过Playwright MCP执行JavaScript提取
    # 注意：这里需要调用browser_run_code，实际实现需要MCP工具支持
    return js_code


def parse_single_school(block):
    """解析单个学校卡片的文本块"""
    school = {
        'name': '',
        'province': '',
        'city': '',
        'department': '',
        'level': '',
        'features': '',
        'logo_url': '',
        'enrollment_url': '',
        'detail_url': ''
    }

    # 提取学校名称 - 格式：link "天津理工大学" [ref=e116]
    name_match = re.search(r'link\s+"([^"]+)"\s*\[ref=e\d+\]\s*\[cursor=pointer\]:\s*\n\s*-?\s*/url:\s*/sch/schoolInfo--', block)
    if name_match:
        school['name'] = name_match.group(1)

    # 提取校徽图片URL - 格式：img [ref=e113]
    logo_match = re.search(r'img\s*\[ref=e\d+\](?:\s*\n\s*-?\s*)?((?!.*text:))', block)
    # 更简单的方式：查找img后的schoolInfo链接之前的URL
    logo_match = re.search(r'link\s*\[ref=e\d+\]\s*\[cursor=pointer\]:\s*\n\s*-?\s*/url:\s*(\S+)(?=\s*\n\s*-\s*img)', block)
    if not logo_match:
        # 查找img标签后的url
        logo_match = re.search(r'-\s*img\s*\[ref=e\d+\](?:\s*\n|\s*$)', block)

    # 提取详情页URL
    detail_match = re.search(r'/url:\s*([/\w\-\.]+schoolInfo--[^\s"\']+)', block)
    if detail_match:
        url = detail_match.group(1)
        if not url.startswith('http'):
            url = f"https://gaokao.chsi.com.cn{url}"
        school['detail_url'] = url

    # 提取省份 - 格式：text: 天津
    province_match = re.search(r'link\s+"[^\"]*?\|\s*主管部门：[^\"]*"\s*\[ref=e\d+\].*?\n\s*-\s*generic\s*\[ref=e\d+\]:\s*[^\w\*]*\n\s*-\s*text:\s*([\u4e00-\u9fa5]+)', block)
    if province_match:
        school['province'] = province_match.group(1)
        # 处理直辖市
        if school['province'] in ['北京', '天津', '上海', '重庆']:
            school['city'] = school['province']

    # 提取主管部门 - 格式：text: 主管部门： \n text: 天津市教育委员会
    dept_match = re.search(r'generic\s*\[ref=e\d+\]:\s*主管部门：\s*\n\s*-\s*text:\s*([^\n]+)', block)
    if dept_match:
        school['department'] = dept_match.group(1).strip()

    # 提取办学层次 - 本科或高职(专科)
    if re.search(r'text:\s*"本科"', block):
        school['level'] = '本科'
    elif re.search(r'text:\s*"高职\(专科\)"', block):
        school['level'] = '高职(专科)'

    # 提取院校特性
    features = []
    if '双一流' in block and '建设高校' in block:
        features.append('"双一流"建设高校')
    if '民办高校' in block:
        features.append('民办高校')
    if '独立学院' in block:
        features.append('独立学院')
    if '中外合作办学' in block:
        features.append('中外合作办学')
    if '内地与港澳台地区合作办学' in block:
        features.append('内地与港澳台地区合作办学')
    school['features'] = ' | '.join(features)

    # 提取招生章程链接
    enrollment_match = re.search(r'/url:\s*([/\w\-\.]+listZszc--[^\s"\']+)', block)
    if enrollment_match:
        url = enrollment_match.group(1)
        if not url.startswith('http'):
            url = f"https://gaokao.chsi.com.cn{url}"
        school['enrollment_url'] = url

    return school


def get_total_pages(snapshot_text):
    """从分页组件获取总页数"""
    # 查找最后一个页码
    page_match = re.search(r'listitem\s+"(\d+)"\s*\[ref=e\d+\]\s*\[cursor=pointer\]\s*\n\s*-?\s*listitem\s+"下一页"', snapshot_text)
    if page_match:
        return int(page_match.group(1))

    # 备选方案：查找最大的页码数字
    page_numbers = re.findall(r'listitem\s+"(\d+)"\s*\[ref=e\d+\]', snapshot_text)
    if page_numbers:
        return max(map(int, page_numbers))

    return None


def save_to_excel(schools, filename='招生章程.xlsx'):
    """保存学校数据到Excel文件"""
    df = pd.DataFrame(schools)

    # 调整列顺序
    columns_order = ['学校名称', '省份', '城市', '主管部门', '办学层次', '院校特性', '校徽', '招生章程链接', '学校详情页链接']

    # 重命名列
    df.rename(columns={
        'name': '学校名称',
        'province': '省份',
        'city': '城市',
        'department': '主管部门',
        'level': '办学层次',
        'features': '院校特性',
        'logo_url': '校徽',
        'enrollment_url': '招生章程链接',
        'detail_url': '学校详情页链接'
    }, inplace=True)

    # 确保所有列都存在
    for col in columns_order:
        if col not in df.columns:
            df[col] = ''

    # 只保存存在的列
    df = df[[col for col in columns_order if col in df.columns]]

    # 保存到Excel
    df.to_excel(filename, index=False, engine='openpyxl')
    print(f"✅ 已保存 {len(schools)} 所学校到 {filename}")

    return df


def get_extraction_js():
    """
    获取用于数据提取的JavaScript代码（改进版）

    改进点：
    1. 改进LogoUrl提取：检查img.src和data-src属性
    2. 移除可能导致学校丢失的过滤条件
    3. 增加错误处理，确保所有学校都被提取

    返回:
        str: JavaScript代码字符串，用于通过Playwright MCP执行
    """
    return """
async (page) => {
  // 等待页面完全加载，包括图片
  await page.waitForLoadState('networkidle');

  const schoolCards = await page.evaluate(() => {
    const cards = [];
    const enrollmentLinks = document.querySelectorAll('a[href*="/zsgs/zhangcheng/listZszc--"]');

    console.log(`找到 ${enrollmentLinks.length} 个招生章程链接`);

    enrollmentLinks.forEach((enrollmentLink, index) => {
      try {
        let card = enrollmentLink.closest('div');
        while (card && !card.querySelector('a[href*="/sch/schoolInfo--"]')) {
          card = card.parentElement;
        }
        if (!card) {
          console.log(`跳过第 ${index + 1} 个链接：找不到学校卡片`);
          return;
        }

        const school = {
          name: '',
          province: '',
          city: '',
          department: '',
          level: '',
          features: '',
          logoUrl: '',
          enrollmentUrl: enrollmentLink.href,
          detailUrl: ''
        };

        // 提取学校名称和详情页URL
        const nameLink = card.querySelector('a[href*="/sch/schoolInfo--"]');
        if (nameLink) {
          school.name = nameLink.textContent.trim();
          school.detailUrl = nameLink.href;
        }

        // 改进的校徽提取 - 检查多个可能的来源
        const logoImg = card.querySelector('img');
        if (logoImg) {
          // 优先检查 data-src 属性（懒加载）
          if (logoImg.dataset && logoImg.dataset.src) {
            school.logoUrl = logoImg.dataset.src;
          }
          // 检查 data-original 属性
          else if (logoImg.dataset && logoImg.dataset.original) {
            school.logoUrl = logoImg.dataset.original;
          }
          // 最后检查 src 属性
          else if (logoImg.src && logoImg.src !== '' && !logoImg.src.includes('data:')) {
            school.logoUrl = logoImg.src;
          }
        }

        const allLinks = Array.from(card.querySelectorAll('a'));
        let locationLink = allLinks.find(link => {
          const text = link.textContent;
          return text.includes('主管部门：') || text.includes('主管部门:');
        });

        if (locationLink) {
          // 第一遍：找省份（第一个非空文本节点）
          const childNodes = Array.from(locationLink.childNodes);
          for (const child of childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent.trim();
              if (text && text !== '|' && text !== '｜' && !school.province) {
                school.province = text;
                break;
              }
            }
          }

          // 第二遍：找主管部门（"主管部门："标记后的文本节点）
          let foundMarker = false;
          for (const child of childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const text = child.textContent.trim();
              if (text === '主管部门：' || text === '主管部门:') {
                foundMarker = true;
              }
            } else if (child.nodeType === Node.TEXT_NODE && foundMarker) {
              const text = child.textContent.trim();
              if (text) {
                school.department = text;
                break;
              }
            }
          }

          // 直辖市：城市=省份
          if (['北京', '天津', '上海', '重庆'].includes(school.province)) {
            school.city = school.province;
          }
        }

        // 提取办学层次和院校特性
        let levelLink = allLinks.find(link => {
          const text = link.textContent.trim();
          return text.includes('本科') || text.includes('高职');
        });

        if (levelLink) {
          const levelText = levelLink.textContent.trim();
          if (levelText.includes('本科')) {
            school.level = '本科';
          } else if (levelText.includes('高职(专科)')) {
            school.level = '高职(专科)';
          }

          // 提取院校特性
          if (levelText.includes('|') || levelText.includes('｜')) {
            const parts = levelText.split(/\\||\\｜/);
            if (parts.length > 1) {
              const featureText = parts[1].trim();
              const features = [];

              if (featureText.includes('双一流')) features.push('"双一流"建设高校');
              if (featureText.includes('民办高校')) features.push('民办高校');
              if (featureText.includes('独立学院')) features.push('独立学院');
              if (featureText.includes('中外合作办学')) features.push('中外合作办学');
              if (featureText.includes('内地与港澳台地区合作办学')) features.push('内地与港澳台地区合作办学');

              school.features = features.join(' | ');
            }
          }
        }

        // 即使某些字段为空，只要学校名称不为空就添加
        if (school.name && school.name.trim() !== '') {
          cards.push(school);
        } else {
          console.log(`跳过一个学校：名称为空`);
        }
      } catch (error) {
        console.log(`处理第 ${index + 1} 个学校时出错:`, error.message);
      }
    });

    console.log(`成功提取 ${cards.length} 所学校`);
    return cards;
  });

  return {
    success: true,
    count: schoolCards.length,
    schools: schoolCards
  };
}
"""


def crawl_schools(test_pages=3, full_crawl=False):
    """
    执行多页爬取（需要配合Playwright MCP工具使用）

    ⚠️ 重要：此脚本需要配合Playwright MCP工具使用
    使用方法：
    1. 首先使用 browser_navigate 导航到目标页面
    2. 使用 browser_run_code 执行 get_extraction_js() 返回的JavaScript代码
    3. 使用 browser_click 点击"下一页"按钮
    4. 重复步骤2-3直到所有页面爬取完成
    5. 调用 save_to_excel() 保存数据

    参数:
        test_pages: 测试爬取的页数（默认3页）
        full_crawl: 是否执行全量爬取（默认False）

    返回:
        schools: 爬取到的学校列表
    """
    print("=" * 60)
    print("阳光高考网招生章程数据爬虫")
    print("=" * 60)
    print()
    print("⚠️ 此脚本需要配合Playwright MCP工具使用")
    print()
    print("📋 使用步骤：")
    print("   1. 导航到: https://gaokao.chsi.com.cn/zsgs/zhangcheng/listVerifedZszc--method-index,lb-30.dhtml")
    print("   2. 使用 browser_run_code 执行JavaScript提取数据")
    print("   3. 使用 browser_click 点击'下一页'按钮")
    print("   4. 重复步骤2-3直到完成所有页面")
    print("   5. 调用 save_to_excel(schools) 保存数据")
    print()

    if full_crawl:
        print("🚀 模式：全量爬取（所有页面）")
    else:
        print(f"🧪 模式：测试爬取（前{test_pages}页）")
    print()

    # 返回JavaScript代码供MCP工具使用
    js_code = get_extraction_js()

    print("✅ JavaScript提取代码已准备就绪")
    print()
    print("📝 JavaScript代码（用于browser_run_code）：")
    print("-" * 60)
    print(js_code)
    print("-" * 60)
    print()

    return {'status': 'ready', 'js_code': js_code}


def main(test_mode=True, test_pages=3):
    """
    主函数

    参数:
        test_mode: 是否为测试模式（默认True）
        test_pages: 测试模式下的爬取页数（默认3页）
    """
    if test_mode:
        print("🧪 测试模式：爬取前3页数据")
        print()
        schools = crawl_schools(test_pages=test_pages, full_crawl=False)

        if schools:
            print()
            print("=" * 60)
            print("📊 测试爬取完成！")
            print(f"   - 共爬取: {len(schools)} 所学校")
            print(f"   - 数据预览:")
            for i, school in enumerate(schools[:5], 1):
                print(f"     {i}. {school.get('name', 'N/A')} - {school.get('province', 'N/A')} - {school.get('level', 'N/A')}")

            print()
            print("💾 正在生成测试Excel文件...")
            save_to_excel(schools, '招生章程_测试.xlsx')

            print()
            print("✅ 测试完成！请查看 '招生章程_测试.xlsx' 核对数据")
            print()
            print("📝 下一步：")
            print("   1. 检查测试Excel文件中的数据是否正确")
            print("   2. 确认无误后，运行 full_crawl() 执行全量爬取")
            print("   3. 全量爬取将生成 '招生章程.xlsx' 文件")
        else:
            print("❌ 未爬取到任何数据，请检查错误信息")
    else:
        print("🚀 全量爬取模式")
        print()
        confirm = input("⚠️  全量爬取将获取所有学校数据，可能需要较长时间，确认继续？(yes/no): ")

        if confirm.lower() == 'yes':
            schools = crawl_schools(full_crawl=True)

            if schools:
                save_to_excel(schools, '招生章程.xlsx')
                print()
                print("=" * 60)
                print(f"✅ 爬取完成！共获取 {len(schools)} 所学校")
                print(f"📄 数据已保存到: 招生章程.xlsx")
            else:
                print("❌ 未爬取到任何数据")
        else:
            print("❌ 用户取消操作")


if __name__ == '__main__':
    main()
