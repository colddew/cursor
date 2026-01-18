#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模特换装组合脚本 - 基于 Gemini 3 Pro Image
功能：上传1张模特照片 + 多张服装照片 → 生成模特同时穿上所有服装的组合图

使用方式：
    python3 antigravity_tools_gemini3pro_image_composite.py --model <模特图> --clothes <服装图1> <服装图2> ... --prompt <提示词>

示例：
    # 基本用法
    python3 antigravity_tools_gemini3pro_image_composite.py \
        --model model.png \
        --clothes dress.png shirt.png pants.png \
        --prompt "让模特同时穿上这三件服装，保持模特的面部特征和姿势"

    # 指定输出目录
    python3 antigravity_tools_gemini3pro_image_composite.py \
        --model model.png \
        --clothes dress.png \
        --prompt "给模特穿上这条裙子" \
        --output ./output

    # 多服装组合
    python3 antigravity_tools_gemini3pro_image_composite.py \
        --model photo.jpg \
        --clothes top.jpg bottom.jpg shoes.jpg accessory.jpg \
        --prompt "让模特同时穿上这四件服装，保持整体协调和模特姿势"

注意事项：
    - 最多支持 14 张参考图片（1 张模特图 + 13 张服装图）
    - 支持的图片格式：JPG, PNG, GIF, WebP
    - 生成的图片会保存在 output 目录，文件名带时间戳不会覆盖
"""

import base64
import os
import argparse
from datetime import datetime
from typing import List
from openai import OpenAI

# Antigravity 客户端配置
CLIENT = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-antigravity"
)


def get_image_mime_type(image_path: str) -> str:
    """
    检测图片的 MIME 类型
    
    Args:
        image_path: 图片路径
        
    Returns:
        MIME 类型字符串，如 'image/jpeg', 'image/png' 等
    """
    # 根据扩展名判断
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
    
    Args:
        image_path: 本地图片路径
        
    Returns:
        完整的 data URI 字符串，格式: data:image/xxx;base64,xxxxx
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"图片文件不存在: {image_path}")
    
    with open(image_path, "rb") as f:
        image_data = f.read()
        base64_data = base64.b64encode(image_data).decode("utf-8")
    
    mime_type = get_image_mime_type(image_path)
    return f"data:{mime_type};base64,{base64_data}"


def composite_image(
    model_path: str,
    clothes_paths: List[str],
    prompt: str,
    output_dir: str = None,
    model: str = "gemini-3-pro-image",
    aspect_ratio: str = "1:1",
    resolution: str = "1K"
) -> str:
    """
    模特换装组合：将模特图和所有服装图组合，生成模特同时穿上所有服装的图片
    
    Args:
        model_path: 模特照片路径
        clothes_paths: 服装照片路径列表
        prompt: 融合提示词，描述想要的换装效果
        output_dir: 输出目录 (默认: scripts/antigravity/output)
        model: 使用的模型 (默认: gemini-3-pro-image)
        aspect_ratio: 宽高比 (默认: 1:1)
        resolution: 分辨率 (默认: 1K)
        
    Returns:
        保存的图片文件路径
    """
    # 验证图片数量
    total_images = 1 + len(clothes_paths)  # 1张模特图 + N张服装图
    if total_images > 14:
        raise ValueError(f"图片数量超过限制！最多支持 14 张图片（1 张模特图 + 13 张服装图），当前输入 {total_images} 张")
    
    # 设置输出目录
    if output_dir is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.join(script_dir, "output")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # 编码所有图片
    print(f"📁 读取模特图片: {model_path}")
    model_image_url = encode_image(model_path)
    
    clothes_image_urls = []
    for i, clothes_path in enumerate(clothes_paths, 1):
        print(f"📁 读取服装图片 {i}/{len(clothes_paths)}: {clothes_path}")
        clothes_image_urls.append(encode_image(clothes_path))
    
    # 生成时间戳文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = os.path.splitext(model_path)[1] or ".jpg"
    filename = f"model_composite_{timestamp}{ext}"
    output_path = os.path.join(output_dir, filename)
    
    # 构建图片描述列表
    clothes_descriptions = []
    for i, path in enumerate(clothes_paths, 1):
        filename = os.path.basename(path)
        clothes_descriptions.append(f"[服装{i}: {filename}]")
    
    clothes_list_str = ", ".join(clothes_descriptions)
    
    # 增强提示词
    enhanced_prompt = f"""{prompt}

参考图片：
- 模特图片: {os.path.basename(model_path)}
- 服装图片: {clothes_list_str}

请将所有服装合理地组合在模特身上，保持模特的面部特征、肤色和整体姿势自然协调。"""
    
    # 调用 API
    print(f"\n🎨 正在生成换装组合图...")
    print(f"   模特图片: 1 张")
    print(f"   服装图片: {len(clothes_paths)} 张")
    print(f"   宽高比: {aspect_ratio}")
    print(f"   分辨率: {resolution}")
    
    # 构建消息内容：文本 + 所有图片
    message_content = [
        {"type": "text", "text": enhanced_prompt},
        {"type": "image_url", "image_url": {"url": model_image_url, "detail": "auto"}},
    ]
    
    # 添加所有服装图片
    for clothes_url in clothes_image_urls:
        message_content.append(
            {"type": "image_url", "image_url": {"url": clothes_url, "detail": "auto"}}
        )
    
    # 调用 API
    response = CLIENT.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": message_content}
        ],
        extra_body={
            "aspect_ratio": aspect_ratio,
            "resolution": resolution
        }
    )
    
    # 解析响应
    image_bytes = None
    
    if hasattr(response, 'choices') and response.choices:
        content = response.choices[0].message.content
        if content and "data:image" in content:
            header, b64 = content.split(",", 1)
            image_bytes = base64.b64decode(b64)
    
    if not image_bytes:
        raise ValueError("无法获取图片数据，请检查 API 连接或参数")
    
    # 保存图片
    with open(output_path, "wb") as f:
        f.write(image_bytes)
    
    file_size = len(image_bytes) / 1024
    print(f"\n✅ 组合图已保存: {output_path}")
    print(f"   文件大小: {file_size:.1f} KB")
    print(f"   模特: {os.path.basename(model_path)}")
    print(f"   服装: {[os.path.basename(p) for p in clothes_paths]}")
    
    return output_path


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="模特换装组合脚本 - 基于 Gemini 3 Pro Image",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    # 基本用法 - 模特试穿多套服装
    python3 antigravity_tools_gemini3pro_image_composite.py \\
        --model model.png \\
        --clothes dress.png shirt.png pants.png \\
        --prompt "让模特同时穿上这三件服装，保持模特的面部特征和姿势"
    
    # 指定输出目录
    python3 antigravity_tools_gemini3pro_image_composite.py \\
        --model photo.jpg \\
        --clothes dress.png \\
        --prompt "给模特穿上这条漂亮的裙子" \\
        --output ./output
    
    # 完整搭配（上衣+裤子+鞋子+配饰）
    python3 antigravity_tools_gemini3pro_image_composite.py \\
        --model model.jpg \\
        --clothes top.jpg bottom.jpg shoes.jpg bag.jpg \\
        --prompt "给模特搭配一套完整的服装，保持整体协调"

限制:
    - 最多支持 14 张参考图片（1 张模特图 + 13 张服装图）
    - 支持的图片格式: JPG, PNG, GIF, WebP
        """
    )
    
    parser.add_argument(
        "--model", "-m",
        required=True,
        help="模特照片路径（必填）"
    )
    parser.add_argument(
        "--clothes", "-c",
        required=True,
        nargs="+",
        help="服装照片路径列表（至少1张，可多张，用空格分隔）"
    )
    parser.add_argument(
        "--prompt", "-p",
        required=True,
        help="换装提示词，描述想要的换装效果"
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="输出目录 (默认: scripts/antigravity/output)"
    )
    parser.add_argument(
        "--model-name", "-M",
        default="gemini-3-pro-image",
        help="使用的模型 (默认: gemini-3-pro-image)"
    )
    parser.add_argument(
        "--aspect-ratio",
        default="1:1",
        choices=["1:1", "16:9", "9:16", "4:3", "3:2", "3:4", "5:3", "5:4"],
        help="宽高比 (默认: 1:1)"
    )
    parser.add_argument(
        "--resolution", "-r",
        default="1K",
        choices=["1K", "2K", "4K"],
        help="分辨率 (默认: 1K)"
    )
    
    args = parser.parse_args()
    
    try:
        output_path = composite_image(
            model_path=args.model,
            clothes_paths=args.clothes,
            prompt=args.prompt,
            output_dir=args.output,
            model=args.model_name,
            aspect_ratio=args.aspect_ratio,
            resolution=args.resolution
        )
        print(f"\n📂 输出目录: {os.path.dirname(output_path)}")
        print(f"\n💡 提示: 生成的图片文件名带有时间戳，不会覆盖之前的图片")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
