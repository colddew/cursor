# 需要安装: pip install openai
import base64
import os
from datetime import datetime
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-antigravity"
)

response = client.chat.completions.create(
    model="gemini-3-pro-image",
    extra_body={"size": "1024x1024"},
    messages=[{
        "role": "user",
        "content": "中国传统新年的习俗相关内容，画出一幅中小学生水彩的手抄报风格的小报，可爱的适合小红书（这几个文字不用出现）"
    }]
)

# 解析响应中的 base64 图像数据
content = response.choices[0].message.content

# 提取 base64 数据
if "data:image" in content:
    # 格式: data:image/jpeg;base64,xxxxxxxx
    header, base64_data = content.split(",", 1)
    mime_type = header.split(";")[0].replace("data:", "")
    ext = mime_type.split("/")[-1]
    
    # 保存到脚本同目录下的 output 文件夹
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(output_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    # 使用时间戳命名，防止覆盖
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(output_dir, f"generated_image_{timestamp}.{ext}")
    
    # 解码并保存
    image_data = base64.b64decode(base64_data)
    with open(filename, "wb") as f:
        f.write(image_data)
    
    print(f"✅ 图像已保存到: {filename}")
else:
    print("响应内容:")
    print(content)
