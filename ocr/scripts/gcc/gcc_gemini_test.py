#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Cloud Console Gemini API 连通性测试
需要设置代理: export https_proxy=http://127.0.0.1:7897
"""

import os
import sys

from dotenv import load_dotenv
load_dotenv()

try:
    import requests
except ImportError:
    print("❌ 未安装 requests: pip install requests")
    sys.exit(1)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ 请设置 GEMINI_API_KEY 环境变量")
    sys.exit(1)

print("🚀 测试 GCC Gemini API 连通性...")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

data = {
    "contents": [{"parts": [{"text": "Hello!"}]}]
}

response = requests.post(url, json=data, headers={"Content-Type": "application/json"})

if response.status_code == 200:
    text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    print(f"✅ 成功: {text}")
else:
    print(f"❌ 失败 ({response.status_code}): {response.text[:200]}")
    sys.exit(1)
