#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片编辑脚本 - 基于 Gemini 3 Pro Image
功能：上传本地图片 + 修改提示词 → 生成新图片

使用方式：
    python3 antigravity_tools_gemini3pro_image_edit.py --image <图片路径> --prompt <修改提示词>
    
示例：
    python3 antigravity_tools_gemini3pro_image_edit.py --image test_images/anhui_sample.jpg --prompt "把背景改成蓝色"
"""

import base64
import os
import argparse
from datetime import datetime
from openai import OpenAI

# Antigravity 客户端配置
CLIENT = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-antigravity"
)


def get_image_mime_type(image_path: str) -> str:
    """
    检测图片的 MIME 类型
    """
    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.ico': 'image/x-icon',
    }
    return mime_map.get(ext, 'image/jpeg')


def encode_image(image_path: str) -> str:
    """
    将本地图片编码为 base64 data URI
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"图片文件不存在: {image_path}")
    
    with open(image_path, "rb") as f:
        image_data = f.read()
        base64_data = base64.b64encode(image_data).decode("utf-8")
    
    mime_type = get_image_mime_type(image_path)
    return f"data:{mime_type};base64,{base64_data}"


def edit_image(
    image_path: str,
    prompt: str,
    output_dir: str = None,
    model: str = "gemini-3-pro-image",
    aspect_ratio: str = "1:1",
    resolution: str = "1K"
) -> str:
    """
    编辑图片
    """
    if output_dir is None:
        output_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "output"
        )
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"📁 读取图片: {image_path}")
    image_url = encode_image(image_path)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = os.path.splitext(image_path)[1] or ".jpg"
    filename = f"edited_image_{timestamp}{ext}"
    output_path = os.path.join(output_dir, filename)
    
    print(f"🎨 正在编辑图片...")
    print(f"   提示词: {prompt}")
    print(f"   宽高比: {aspect_ratio}")
    print(f"   分辨率: {resolution}")
    
    # 使用 OpenAI 格式的消息
    response = CLIENT.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"请根据以下要求修改这张图片：{prompt}"},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }
        ],
        extra_body={
            "aspect_ratio": aspect_ratio,
            "resolution": resolution
        }
    )
    
    image_bytes = None
    
    if hasattr(response, 'choices') and response.choices:
        content = response.choices[0].message.content
        if content and "data:image" in content:
            header, b64 = content.split(",", 1)
            image_bytes = base64.b64decode(b64)
    
    if not image_bytes:
        raise ValueError("无法获取图片数据")
    
    with open(output_path, "wb") as f:
        f.write(image_bytes)
    
    file_size = len(image_bytes) / 1024
    print(f"\n✅ 图片已保存: {output_path}")
    print(f"   文件大小: {file_size:.1f} KB")
    
    return output_path


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="图片编辑脚本 - 基于 Gemini 3 Pro Image",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python3 antigravity_tools_gemini3pro_image_edit.py --image photo.png --prompt "把背景改成蓝色"
        """
    )
    
    parser.add_argument("--image", "-i", required=True, help="本地图片路径")
    parser.add_argument("--prompt", "-p", required=True, help="修改提示词")
    parser.add_argument("--output", "-o", default=None, help="输出目录")
    parser.add_argument("--model", "-m", default="gemini-3-pro-image", help="模型")
    parser.add_argument("--aspect-ratio", default="1:1", choices=["1:1", "16:9", "9:16", "4:3", "3:2"], help="宽高比")
    parser.add_argument("--resolution", "-r", default="1K", choices=["1K", "2K", "4K"], help="分辨率")
    
    args = parser.parse_args()
    
    try:
        output_path = edit_image(
            image_path=args.image,
            prompt=args.prompt,
            output_dir=args.output,
            model=args.model,
            aspect_ratio=args.aspect_ratio,
            resolution=args.resolution
        )
        print(f"\n📂 输出目录: {os.path.dirname(output_path)}")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
