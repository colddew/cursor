# 需要安装: pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-antigravity"
)

response = client.chat.completions.create(
    model="gemini-3-pro-high",
    messages=[{"role": "user", "content": "介绍你的模型和版本"}]
)

print(response.choices[0].message.content)
