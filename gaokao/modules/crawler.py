"""
浏览器爬虫模块
负责页面加载和浏览器管理
"""

import asyncio
import random
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class RegulationCrawler:
    """招生章程详情页爬虫"""

    # 反爬虫配置（来自PRD验证成功的配置）
    ANTI_BOT_CONFIG = {
        "headless": False,  # 有头模式更难被检测
        "args": [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--disable-extensions",
            "--no-first-run",
            "--disable-blink-features=AutomationControlled"
        ],
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "locale": "zh-CN",
        "timezone_id": "Asia/Shanghai",
        "viewport": {"width": 1920, "height": 1080},
    }

    def __init__(self, page_load_delay: float = 4.0):
        """
        初始化爬虫

        Args:
            page_load_delay: 页面加载等待时间（秒）
        """
        self.page_load_delay = page_load_delay
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

    async def start(self):
        """启动浏览器"""
        self.playwright = await async_playwright().start()

        self.browser = await self.playwright.chromium.launch(
            headless=self.ANTI_BOT_CONFIG["headless"],
            args=self.ANTI_BOT_CONFIG["args"]
        )

        self.context = await self.browser.new_context(
            user_agent=self.ANTI_BOT_CONFIG["user_agent"],
            viewport=self.ANTI_BOT_CONFIG["viewport"],
            locale=self.ANTI_BOT_CONFIG["locale"],
            timezone_id=self.ANTI_BOT_CONFIG["timezone_id"],
        )

        self.page = await self.context.new_page()
        logger.info("浏览器启动成功")

    async def close(self):
        """关闭浏览器"""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("浏览器已关闭")

    async def fetch_page(self, url: str) -> Optional[str]:
        """
        获取页面内容

        Args:
            url: 目标URL

        Returns:
            页面HTML内容，失败返回None
        """
        if not self.page:
            raise RuntimeError("浏览器未启动，请先调用 start() 方法")

        try:
            logger.info(f"正在访问: {url}")
            await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # 等待页面加载完成
            await asyncio.sleep(self.page_load_delay)

            # 检查是否被重定向到错误页面
            current_url = self.page.url
            if "error" in current_url.lower():
                logger.warning(f"页面访问可能失败: {current_url}")
                return None

            return await self.page.content()

        except Exception as e:
            logger.error(f"访问页面失败 {url}: {e}")
            return None

    async def execute_js(self, js_code: str) -> Any:
        """
        执行JavaScript代码

        Args:
            js_code: JavaScript代码

        Returns:
            执行结果
        """
        if not self.page:
            raise RuntimeError("浏览器未启动")

        return await self.page.evaluate(js_code)

    async def take_screenshot(self, filepath: str):
        """截图保存"""
        if not self.page:
            raise RuntimeError("浏览器未启动")
        await self.page.screenshot(path=filepath)
        logger.info(f"截图已保存: {filepath}")


async def random_delay(min_seconds: float, max_seconds: float):
    """随机延迟"""
    delay = random.uniform(min_seconds, max_seconds)
    logger.debug(f"延迟 {delay:.2f} 秒")
    await asyncio.sleep(delay)
