"""
数据清洗模块
负责后续的数据清洗和结构化处理
"""

import re
import logging
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class RegulationCleaner:
    """招生章程数据清洗器"""

    # 需要移除的无关内容模式
    USELESS_PATTERNS = [
        r'分享到.*',
        r'责任编辑.*',
        r'点击次数.*',
        r'发布时间.*',
        r'来源：.*',
        r'【.*】.*',
        r'上一篇|下一篇',
        r'相关阅读.*',
        r'热点推荐.*',
        r'版权所有.*',
        r'技术支持.*',
    ]

    # 章程章节模式
    CHAPTER_PATTERNS = [
        r'第[一二三四五六七八九十百]+章',
        r'第[0-9]+章',
        r'第[一二三四五六七八九十百]+条',
        r'第[0-9]+条',
        r'^[一二三四五六七八九十百]+[、\.]',
        r'^[0-9]+[、\.]',
    ]

    def __init__(self):
        """初始化清洗器"""
        self.compiled_patterns = [re.compile(p, re.MULTILINE) for p in self.USELESS_PATTERNS]
        self.chapter_patterns = [re.compile(p) for p in self.CHAPTER_PATTERNS]

    def clean_text(self, text: str) -> str:
        """
        清理文本内容

        Args:
            text: 原始文本

        Returns:
            清理后的文本
        """
        if not text:
            return ""

        # 移除无关内容
        for pattern in self.compiled_patterns:
            text = pattern.sub('', text)

        # 清理多余空白
        text = re.sub(r'[ \t]+', ' ', text)  # 空格和tab
        text = re.sub(r'\n\s*\n', '\n\n', text)  # 多余空行
        text = re.sub(r'\r\n', '\n', text)  # 统一换行符

        # 移除行首行尾空白
        lines = [line.strip() for line in text.split('\n')]
        text = '\n'.join(lines)

        # 移除过短的行（可能是噪音）
        # lines = [line for line in text.split('\n') if len(line) >= 3]
        # text = '\n'.join(lines)

        return text.strip()

    def extract_chapters(self, text: str) -> List[Dict]:
        """
        提取章节结构

        Args:
            text: 章程文本

        Returns:
            章节列表，每个章节包含标题和内容
        """
        chapters = []
        lines = text.split('\n')

        current_chapter = None
        current_content = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # 检查是否是章节标题
            is_chapter = False
            for pattern in self.chapter_patterns:
                if pattern.match(line):
                    is_chapter = True
                    break

            if is_chapter:
                # 保存上一章
                if current_chapter:
                    chapters.append({
                        "title": current_chapter,
                        "content": '\n'.join(current_content).strip()
                    })

                current_chapter = line
                current_content = []
            else:
                if current_chapter:
                    current_content.append(line)
                else:
                    # 第一章之前的内容
                    current_content.append(line)

        # 保存最后一章
        if current_chapter:
            chapters.append({
                "title": current_chapter,
                "content": '\n'.join(current_content).strip()
            })

        return chapters

    def extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        """
        提取联系信息

        Args:
            text: 章程文本

        Returns:
            联系信息字典
        """
        contact_info = {
            "phone": None,
            "email": None,
            "website": None,
            "address": None
        }

        # 提取电话
        phone_patterns = [
            r'电话[：:]\s*([0-9\-—()()]{7,20})',
            r'联系电话[：:]\s*([0-9\-—()()]{7,20})',
            r'招生电话[：:]\s*([0-9\-—()()]{7,20})',
        ]
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                contact_info["phone"] = match.group(1).strip()
                break

        # 提取邮箱
        email_patterns = [
            r'邮箱[：:]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
            r'E-mail[：:]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
            r'Email[：:]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
        ]
        for pattern in email_patterns:
            match = re.search(pattern, text)
            if match:
                contact_info["email"] = match.group(1).strip()
                break

        # 提取网址
        website_patterns = [
            r'网址[：:]\s*(https?://[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?(?:/[^\s]*)?)',
            r'网站[：:]\s*(https?://[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?(?:/[^\s]*)?)',
            r'官网[：:]\s*(https?://[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?(?:/[^\s]*)?)',
        ]
        for pattern in website_patterns:
            match = re.search(pattern, text)
            if match:
                contact_info["website"] = match.group(1).strip()
                break

        # 提取地址
        address_patterns = [
            r'地址[：:]\s*([^。\n]{10,100})',
            r'学校地址[：:]\s*([^。\n]{10,100})',
            r'通讯地址[：:]\s*([^。\n]{10,100})',
        ]
        for pattern in address_patterns:
            match = re.search(pattern, text)
            if match:
                contact_info["address"] = match.group(1).strip()
                break

        return contact_info

    def clean_md_file(self, filepath: Path) -> bool:
        """
        清洗单个MD文件

        Args:
            filepath: MD文件路径

        Returns:
            清洗成功返回True
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # 清洗内容
            cleaned = self.clean_text(content)

            # 写回文件
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(cleaned)

            logger.debug(f"已清洗: {filepath.name}")
            return True

        except Exception as e:
            logger.error(f"清洗失败 {filepath}: {e}")
            return False

    def batch_clean(self, directory: str = "details") -> Dict:
        """
        批量清洗MD文件

        Args:
            directory: MD文件目录

        Returns:
            统计信息
        """
        dir_path = Path(directory)
        md_files = list(dir_path.glob("*.md"))

        logger.info(f"开始批量清洗: 共 {len(md_files)} 个文件")

        success_count = 0
        fail_count = 0

        for md_file in md_files:
            if self.clean_md_file(md_file):
                success_count += 1
            else:
                fail_count += 1

        result = {
            "total": len(md_files),
            "success": success_count,
            "failed": fail_count
        }

        logger.info(f"批量清洗完成: {result}")
        return result

    def validate_content(self, text: str, min_length: int = 100) -> Dict:
        """
        验证内容质量

        Args:
            text: 文本内容
            min_length: 最小长度要求

        Returns:
            验证结果
        """
        issues = []

        # 检查长度
        if len(text) < min_length:
            issues.append(f"内容过短: {len(text)} 字符")

        # 检查是否包含章节
        has_chapters = any(p.search(text) for p in self.chapter_patterns)
        if not has_chapters:
            issues.append("未检测到章节结构")

        # 检查是否包含关键信息
        keywords = ["招生", "章程", "录取", "报考"]
        missing_keywords = [kw for kw in keywords if kw not in text]
        if missing_keywords:
            issues.append(f"缺少关键词: {', '.join(missing_keywords)}")

        return {
            "valid": len(issues) == 0,
            "issues": issues
        }
