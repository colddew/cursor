#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
查看 Google Cloud Console Gemini API 可用模型列表
"""

import os
import sys
import requests

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ 请设置 GEMINI_API_KEY 环境变量")
    print("   export GEMINI_API_KEY=your-api-key")
    sys.exit(1)

print("🚀 获取可用模型列表...")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print("✅ 可用模型:")
    for model in data.get("models", []):
        print(f"  - {model['name']}")
else:
    print(f"❌ 请求失败: {response.status_code}")
    print(response.text)
