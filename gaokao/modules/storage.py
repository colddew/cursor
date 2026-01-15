"""
存储模块
负责将提取的内容保存为MD文件
"""

import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class RegulationStorage:
    """招生章程存储管理器"""

    def __init__(self, output_dir: str = "details"):
        """
        初始化存储管理器

        Args:
            output_dir: MD文件保存目录
        """
        self.output_dir = Path(output_dir)
        self._ensure_output_dir()

    def _ensure_output_dir(self):
        """确保输出目录存在"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"MD文件保存目录: {self.output_dir.absolute()}")

    def save(self, school_name: str, content: str) -> bool:
        """
        保存学校招生章程内容为MD文件

        Args:
            school_name: 学校名称（作为文件名）
            content: 章程内容

        Returns:
            保存成功返回True，失败返回False
        """
        # 清理文件名（移除不允许的字符）
        safe_name = self._sanitize_filename(school_name)
        filepath = self.output_dir / f"{safe_name}.md"

        # 如果文件已存在，先删除
        if filepath.exists():
            logger.info(f"文件已存在，将覆盖: {filepath.name}")
            filepath.unlink()

        try:
            # 写入内容
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            logger.info(f"已保存: {filepath.name} ({len(content)} 字符)")
            return True

        except Exception as e:
            logger.error(f"保存失败 {school_name}: {e}")
            return False

    def exists(self, school_name: str) -> bool:
        """
        检查学校MD文件是否已存在

        Args:
            school_name: 学校名称

        Returns:
            存在返回True，否则返回False
        """
        safe_name = self._sanitize_filename(school_name)
        filepath = self.output_dir / f"{safe_name}.md"
        return filepath.exists()

    def get_filepath(self, school_name: str) -> Path:
        """获取学校MD文件的完整路径"""
        safe_name = self._sanitize_filename(school_name)
        return self.output_dir / f"{safe_name}.md"

    def _sanitize_filename(self, name: str) -> str:
        """
        清理文件名，移除不允许的字符

        Args:
            name: 原始名称

        Returns:
            安全的文件名
        """
        # 移除或替换不允许的字符
        # Windows不允许: < > : " / \ | ? *
        # 保留中文和常见符号
        invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']

        safe_name = name
        for char in invalid_chars:
            safe_name = safe_name.replace(char, '_')

        # 移除首尾空格和点
        safe_name = safe_name.strip('. ')

        return safe_name

    def get_saved_count(self) -> int:
        """获取已保存的MD文件数量"""
        return len(list(self.output_dir.glob("*.md")))

    def get_all_saved_files(self) -> list:
        """获取所有已保存的文件名列表"""
        return [f.stem for f in self.output_dir.glob("*.md")]


def save_empty_file(school_name: str, reason: str = "无法获取内容", output_dir: str = "details"):
    """
    保存空内容文件（用于记录失败的情况）

    Args:
        school_name: 学校名称
        reason: 失败原因
        output_dir: 输出目录
    """
    storage = RegulationStorage(output_dir)
    content = f"# {school_name}\n\n**状态**: {reason}\n"
    storage.save(school_name, content)
