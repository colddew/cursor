import time
import os
import sys
import json
import base64
import typing
import pandas as pd
from google import genai
from google.genai import types
from PIL import Image
from dotenv import load_dotenv

# 加载 .env 文件 (如果存在)
load_dotenv()

def encode_image(image_path):
    """读取图片文件并返回字节"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    with open(image_path, "rb") as f:
        return f.read()

def get_api_key():
    """获取 API Key，优先从环境变量读取"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("\n⚠️  未检测到 GOOGLE_API_KEY 环境变量。")
        api_key = input("请输入您的 Google AI Studio API Key: ").strip()
        if not api_key:
            print("❌ API Key 不能为空")
            sys.exit(1)
    return api_key

def load_system_prompt(prompt_path):
    """读取提示词文件"""
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ 提示词文件未找到: {prompt_path}")
        sys.exit(1)

def json_to_excel(json_data, output_path):
    """将 Gemini 返回的 JSON 数据转换为 Excel (V2 布局增强版)"""
    try:
        if isinstance(json_data, str):
            data = json.loads(json_data)
        else:
            data = json_data
            
        all_rows = []
        
        # 1. 提取所有原始行
        if "pages" in data:
            for page in data.get("pages", []):
                for item in page.get("content", []):
                    if item.get("type") == "table" and "table_data" in item:
                        all_rows.extend(item["table_data"])
                    elif item.get("type") == "text":
                        text = item.get("text_content", "")
                        if text:
                            all_rows.append([text])

        if not all_rows:
            print("⚠️  未提取到任何有效数据。")
            return False

        # 2. 动态对齐逻辑 (V2)
        # 找出整页最大的列数
        max_cols = 0
        for row in all_rows:
            max_cols = max(max_cols, len(row))
        
        # 为了给右侧页码留出空间，如果最大列数太小（比如只有1-2列），强制设定一个最小宽度
        max_cols = max(max_cols, 5) 

        aligned_rows = []
        for row in all_rows:
            # V3.1: 尊重模型返回的数组结构。
            # 如果模型遵循 Flex-Grid 规则返回了 ["", "", "页码"]，len(row) 会接近 max_cols。
            # 我们只需要在右侧补齐到 max_cols，以保证 DataFrame 的对齐。
            aligned_rows.append(row + [""] * (max_cols - len(row)))

        # 3. 转换为 DataFrame 并导出
        df = pd.DataFrame(aligned_rows)
        # 移除了 writer = pd.ExcelWriter(...) 的繁琐写法，直接用 to_excel
        df.to_excel(output_path, index=False, header=False)
        print(f"✅ Excel 文件已生成: {output_path}")
        return True
    except Exception as e:
        print(f"❌ 转换失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def process_image(image_path, prompt_path):
    """主处理流程 (使用新版 google-genai SDK + 高分辨率配置)"""
    api_key = get_api_key()
    client = genai.Client(api_key=api_key)

    # 模型版本
    model_name = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    print(f"🚀 正在初始化模型: {model_name}...")
    
    image_bytes = encode_image(image_path)
    system_instruction = load_system_prompt(prompt_path)
    
    # 定义 JSON Schema (保持不变)
    response_schema = {
        "type": "object",
        "properties": {
            "pages": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "page_number": {"type": "integer"},
                        "content": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string", "enum": ["text", "table"]},
                                    "text_content": {"type": "string"},
                                    "table_data": {
                                        "type": "array",
                                        "items": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "required": ["pages"]
    }

    print("✨ 正在发送请求给 Gemini (开启高分辨率扫描)...")
    try:
        # 构造多模态内容
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            system_instruction
        ]
        
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.0,  # 降到 0，让它变死板，死板才准
        top_p=0.95,
        max_output_tokens=8192, # 给够空间，防止表格写一半断了
                media_resolution=types.MediaResolution.MEDIA_RESOLUTION_HIGH # 强制高倍率扫描边缘细节
            )
        )
        
        output_excel = os.path.splitext(image_path)[0] + "_gemini.xlsx"
        success = json_to_excel(response.text, output_excel)
        
        if success:
            print("\n🎉 处理完成！")
            
    except Exception as e:
        print(f"\n❌ API 请求失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python api_table_converter.py <image_path_or_dir> <prompt_path>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    pmt_path = sys.argv[2]
    
    if os.path.isdir(input_path):
        # 批量处理目录
        supported_exts = {'.png', '.jpg', '.jpeg', '.bmp'}
        files = [f for f in os.listdir(input_path) if os.path.splitext(f)[1].lower() in supported_exts]
        
        print(f"📂 发现 {len(files)} 个图片文件，准备批量处理...")
        
        for i, filename in enumerate(files):
            file_path = os.path.join(input_path, filename)
            print(f"\n[{i+1}/{len(files)}] 处理: {filename}")
            
            process_image(file_path, pmt_path)
            
            if i < len(files) - 1:
                print("⏳ 触发 Rate Limiting: 休眠 4 秒...")
                time.sleep(4)
    else:
        # 单文件处理
        process_image(input_path, pmt_path)