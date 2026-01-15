"""
内容提取模块
负责从页面中提取招生章程纯文本内容
"""

import logging
import re
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class RegulationExtractor:
    """招生章程内容提取器"""

    # 可能的内容容器选择器
    CONTENT_SELECTORS = [
        ".main-content",
        ".content",
        ".main",
        ".article-content",
        ".detail-content",
        ".text-content",
        "#content",
        "#main",
    ]

    # 需要过滤的无关内容关键词
    FILTER_KEYWORDS = [
        "分享到",
        "责任编辑",
        "点击次数",
        "发布时间",
        "来源：",
        "【收藏】",
        "【打印】",
        "【关闭】",
        "上一篇",
        "下一篇",
        "相关阅读",
        "热点推荐",
    ]

    def __init__(self):
        """初始化提取器"""
        self.js_extraction_code = self._build_extraction_js()

    def _build_extraction_js(self) -> str:
        """
        构建JavaScript提取代码
        返回纯文本内容和表格数据
        """
        return """
        () => {
            // 直接从body提取文本，简单有效
            const bodyText = document.body.innerText || '';

            // 清理文本：移除导航、页脚等无关内容
            const lines = bodyText.split('\\n');
            const filteredLines = [];
            let inContent = false;

            for (const line of lines) {
                const trimmed = line.trim();

                // 跳过空行
                if (!trimmed) continue;

                // 跳过导航菜单
                if (['首页', '高考资讯', '阳光志愿', '高招咨询', '招生动态',
                     '试题评析', '院校库', '专业库', '院校满意度', '专业满意度',
                     '学籍查询', '学历查询', '学位查询', '在线验证',
                     '登录', '注册', '更多', '主办单位：', 'Copyright',
                     '客服热线：', '客服邮箱：', '官方微信', '官方微博'].includes(trimmed)) {
                    continue;
                }

                // 跳过页脚链接
                if (trimmed.includes('京ICP备') || trimmed.includes('京公网安备')) {
                    continue;
                }

                // 检测正文开始（包含"招生章程"或学校相关关键词）
                if (!inContent) {
                    if (trimmed.includes('招生章程') || trimmed.includes('第一章') ||
                        trimmed.includes('第一条') || trimmed.includes('总则')) {
                        inContent = true;
                    } else {
                        continue;
                    }
                }

                // 到达页脚时停止
                if (trimmed.includes('附：') || trimmed.includes('学校地址：')) {
                    filteredLines.push(trimmed);
                    // 继续添加联系信息
                } else if (trimmed.startsWith('http') || trimmed.includes('点击次数')) {
                    // 跳过链接和统计
                    continue;
                } else {
                    filteredLines.push(trimmed);
                }
            }

            const fullText = filteredLines.join('\\n\\n');

            // 提取表格（如果有）
            const tables = [];
            const tableElements = document.querySelectorAll('table');

            tableElements.forEach((table, index) => {
                const headers = Array.from(table.querySelectorAll('th, tr:first-child td'))
                    .map(th => th.textContent?.trim() || '')
                    .filter(h => h);

                const rows = [];
                const rowElements = table.querySelectorAll('tr');

                Array.from(rowElements).slice(1).forEach(tr => {
                    const cells = Array.from(tr.querySelectorAll('td'))
                        .map(td => td.textContent?.trim() || '')
                        .filter(c => c);

                    if (cells.length > 0) {
                        rows.push(cells);
                    }
                });

                if (headers.length > 0 || rows.length > 0) {
                    tables.push({
                        index: index,
                        headers: headers,
                        rows: rows
                    });
                }
            });

            return {
                text: fullText,
                tables: tables,
                textLength: fullText.length,
                tableCount: tables.length
            };
        }
        """

    async def extract(self, page, url: str) -> Optional[Dict[str, Any]]:
        """
        从页面提取内容

        Args:
            page: Playwright Page对象
            url: 当前页面URL（用于日志）

        Returns:
            提取结果字典，包含text和tables字段
        """
        try:
            logger.info(f"正在提取内容: {url}")

            # 直接获取body文本，简单有效
            body_text = await page.evaluate("() => document.body.innerText || ''")

            if not body_text or len(body_text) < 100:
                logger.warning(f"提取内容过少: {url} (长度: {len(body_text) if body_text else 0})")
                return None

            # 用Python处理文本，更可控
            lines = body_text.split('\n')
            filtered_lines = []
            in_content = False

            for line in lines:
                trimmed = line.strip()

                if not trimmed:
                    continue

                # 跳过导航菜单
                skip_keywords = [
                    '首页', '高考资讯', '阳光志愿', '高招咨询', '招生动态',
                    '试题评析', '院校库', '专业库', '院校满意度', '专业满意度',
                    '学籍查询', '学历查询', '学位查询', '在线验证',
                    '登录', '注册', '更多', '主办单位：', 'Copyright',
                    '客服热线：', '客服邮箱：', '官方微信', '官方微博',
                    '学信网', '中心简介', '联系我们', '版权声明', '帮助中心', '网站地图',
                    '京ICP备', '京公网安备', '教育部学生服务与素质发展中心'
                ]

                if any(kw in trimmed for kw in skip_keywords):
                    continue

                # 检测正文开始
                if not in_content:
                    if any(kw in trimmed for kw in ['招生章程', '第一章', '第一条', '总则']):
                        in_content = True
                    else:
                        continue

                filtered_lines.append(trimmed)

            full_text = '\n\n'.join(filtered_lines)

            logger.info(f"提取成功: {url} (文本: {len(full_text)}字符)")

            return {
                "text": full_text,
                "tables": [],
                "url": url,
                "text_length": len(full_text),
                "table_count": 0
            }

        except Exception as e:
            logger.error(f"提取内容失败 {url}: {e}")
            return None

    def format_tables_as_markdown(self, tables: list) -> str:
        """
        将表格转换为Markdown格式

        Args:
            tables: 表格数据列表

        Returns:
            Markdown格式的表格字符串
        """
        if not tables:
            return ""

        md_parts = []
        for table in tables:
            headers = table.get("headers", [])
            rows = table.get("rows", [])

            if not headers and not rows:
                continue

            # 构建Markdown表格
            if headers:
                md_parts.append("| " + " | ".join(headers) + " |")
                md_parts.append("| " + " | ".join(["---"] * len(headers)) + " |")

            for row in rows:
                # 确保行长度与表头一致
                while len(row) < len(headers):
                    row.append("")
                md_parts.append("| " + " | ".join(row[:len(headers)]) + " |")

            md_parts.append("")  # 表格后空行

        return "\n".join(md_parts)

    def combine_content(self, extraction_result: Dict[str, Any]) -> str:
        """
        组合文本和表格为完整内容

        Args:
            extraction_result: 提取结果字典

        Returns:
            完整的Markdown格式内容
        """
        text = extraction_result.get("text", "")
        tables = extraction_result.get("tables", [])

        # 转换表格为Markdown
        tables_md = self.format_tables_as_markdown(tables)

        # 组合内容
        if tables_md:
            return f"{text}\n\n{tables_md}"
        else:
            return text


def clean_text(text: str) -> str:
    """
    清理文本内容

    Args:
        text: 原始文本

    Returns:
        清理后的文本
    """
    if not text:
        return ""

    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)

    # 移除特定无用内容
    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # 跳过过滤内容
        is_filtered = any(kw in line for kw in RegulationExtractor.FILTER_KEYWORDS)
        if is_filtered:
            continue

        cleaned_lines.append(line)

    return '\n'.join(cleaned_lines)
