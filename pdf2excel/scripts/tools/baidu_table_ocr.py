#!/usr/bin/env python3
import sys; sys.dont_write_bytecode = True"""
百度表格识别 API - 专门针对表格优化
比通用 OCR 更适合处理表格内容
"""

import sys
import base64
import requests
from pathlib import Path
import time
import json
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def get_baidu_token(api_key, secret_key):
    """获取百度 access_token"""
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": secret_key
    }
    
    response = requests.post(url, params=params)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        raise Exception(f"获取 token 失败: {response.text}")

def table_recognize_baidu(image_path, access_token):
    """使用百度表格识别 API"""
    # 使用表格识别专用接口
    url = f"https://aip.baidubce.com/rest/2.0/solution/v1/form_ocr/request?access_token={access_token}"
    
    # 读取图片并 base64 编码
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {'image': image_data}
    
    response = requests.post(url, headers=headers, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('result'):
            # 返回 request_id 用于获取结果
            return result['result'][0]['request_id']
        else:
            raise Exception(f"表格识别失败: {result}")
    else:
        raise Exception(f"API 调用失败: {response.text}")

def get_table_result(request_id, access_token, max_retries=10):
    """获取表格识别结果（异步）"""
    url = f"https://aip.baidubce.com/rest/2.0/solution/v1/form_ocr/get_request_result?access_token={access_token}"
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'request_id': request_id,
        'result_type': 'excel'  # 返回 Excel 格式
    }
    
    for i in range(max_retries):
        response = requests.post(url, headers=headers, data=data)
        
        if response.status_code == 200:
            result = response.json()
            
            # 检查处理状态
            if result.get('result', {}).get('ret_code') == 3:
                # 处理完成
                return result
            elif result.get('result', {}).get('ret_code') == 2:
                # 处理中，等待
                print(f"      处理中...（{i+1}/{max_retries}）", end='\r')
                time.sleep(2)
            else:
                raise Exception(f"识别失败: {result}")
        else:
            raise Exception(f"获取结果失败: {response.text}")
    
    raise Exception("处理超时")

def extract_with_baidu_table():
    """使用百度表格识别 API"""
    import os
    
    api_key = os.getenv('BAIDU_OCR_API_KEY')
    secret_key = os.getenv('BAIDU_OCR_SECRET_KEY')
    
    if not api_key or not secret_key:
        print("\n❌ 请设置百度 OCR API Key:")
        print("   export BAIDU_OCR_API_KEY='your_api_key'")
        print("   export BAIDU_OCR_SECRET_KEY='your_secret_key'")
        print("\n💡 获取方式:")
        print("   1. 访问 https://ai.baidu.com/")
        print("   2. 登录并创建应用")
        print("   3. 在【文字识别】-【表格文字识别】中获取 API Key")
        sys.exit(1)
    
    if len(sys.argv) < 2:
        print("用法: python baidu_table_ocr.py <图片文件>")
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    
    # 统一输出到项目根目录的 output
    project_root = Path(__file__).parent.parent
    output_dir = project_root / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if len(sys.argv) > 2:
        output_path = Path(sys.argv[2])
    else:
        output_path = output_dir / input_path.with_suffix('.xlsx').name
    
    if not input_path.exists():
        print(f"❌ 文件不存在: {input_path}")
        sys.exit(1)
    
    # 只支持单张图片
    if input_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.bmp']:
        print(f"❌ 仅支持图片格式（JPG/PNG/BMP）")
        print(f"   PDF 请使用: ./run_ocr.sh baidu {input_path}")
        sys.exit(1)
    
    print(f"\n🚀 百度表格识别 API")
    print(f"=" * 60)
    print(f"📄 输入: {input_path.name}")
    print(f"📊 输出: {output_path}")
    
    total_start = time.time()
    
    # 获取 access_token
    print("\n🔑 获取访问令牌...")
    try:
        access_token = get_baidu_token(api_key, secret_key)
        print("   ✓ 令牌获取成功")
    except Exception as e:
        print(f"   ❌ 令牌获取失败: {e}")
        sys.exit(1)
    
    # 提交识别请求
    print(f"\n📄 提交表格识别请求...")
    try:
        request_id = table_recognize_baidu(str(input_path), access_token)
        print(f"   ✓ 请求已提交 (ID: {request_id})")
    except Exception as e:
        print(f"   ❌ 请求失败: {e}")
        sys.exit(1)
    
    # 获取结果
    print(f"\n⏳ 等待处理结果...")
    try:
        result = get_table_result(request_id, access_token)
        print(f"\n   ✓ 识别完成")
    except Exception as e:
        print(f"\n   ❌ 获取结果失败: {e}")
        sys.exit(1)
    
    total_time = time.time() - total_start
    
    # 保存 Excel
    if result.get('result', {}).get('result_data'):
        excel_data = result['result']['result_data']
        
        # Excel 数据是 base64 编码的
        excel_bytes = base64.b64decode(excel_data)
        
        with open(output_path, 'wb') as f:
            f.write(excel_bytes)
        
        print(f"\n🎉 成功！文件: {output_path.absolute()}")
        print(f"⏱️  总耗时: {total_time:.1f}秒")
        print(f"\n💡 提示: 百度表格识别会自动保留表格结构")
    else:
        print("\n⚠️  未识别到表格内容")

if __name__ == "__main__":
    try:
        extract_with_baidu_table()
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
