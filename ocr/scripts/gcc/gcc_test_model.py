#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GCC Gemini API 模型连通性测试

# 模型测试结果 (2026-01-19)
# ✅ 已确认可用:
#    - gemini-3-flash-preview (推荐使用)
"""

import os
from dotenv import load_dotenv
load_dotenv()

import requests
import json

api_key = os.getenv("GEMINI_API_KEY")
proxy_url = os.getenv("HTTPS_PROXY") or os.getenv("https_proxy") or os.getenv("HTTP_PROXY") or os.getenv("http_proxy")

if not api_key:
    print("❌ 请设置 GEMINI_API_KEY 环境变量")
    exit(1)

PROXY = {"http": proxy_url, "https": proxy_url} if proxy_url else None


def test_model(model_name, prompt):
    """测试指定模型"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    response = requests.post(url, json=data, headers={"Content-Type": "application/json"}, proxies=PROXY)

    if response.status_code == 200:
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        print(f"✅ {model_name}")
        print(f"   响应: {text}")
    else:
        print(f"❌ {model_name}: {response.status_code}")
        print(f"   {response.text[:200]}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("用法:")
        print("  python gcc_test_model.py <model_name> <prompt>")
        print()
        print("示例:")
        print("  python gcc_test_model.py gemini-3-pro-preview '请用一句话介绍你自己'")
        print("  python gcc_test_model.py gemini-3-flash-preview '请用一句话介绍你自己'")
        exit(1)

    model = sys.argv[1]
    prompt = sys.argv[2]

    print(f"🔍 测试 {model}...")
    test_model(model, prompt)
