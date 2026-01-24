# AI Studio PaddleOCR-VL API 文档

## 📋 基本信息

**服务名称**：PaddleOCR-VL（文档解析）
**官方文档**：https://ai.baidu.com/ai-doc/AISTUDIO/2mh4okm66
**API 类型**：同步接口
**返回格式**：JSON

---

## 🔗 接口地址

**获取方式**：访问 https://aistudio.baidu.com/paddleocr/task

每个用户的 API URL 是唯一的，格式类似：
```
https://xxxxx.aistudio-app.com/layout-parsing
```

---

## 🔑 认证方式

**Header**：
```json
{
    "Authorization": "token YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
}
```

---

## 📤 请求参数

### 必需参数

| 参数       | 类型    | 说明                    | 示例 |
| ---------- | ------- | ----------------------- | ---- |
| `file`     | string  | Base64 编码的文件数据   | -    |
| `fileType` | integer | 文件类型：0=PDF, 1=图片 | `1`  |

### 可选参数

| 参数                        | 类型    | 默认值 | 说明                     |
| --------------------------- | ------- | ------ | ------------------------ |
| `useDocOrientationClassify` | boolean | false  | 图片方向矫正（旋转）     |
| `useDocUnwarping`           | boolean | false  | 图片扭曲矫正（透视变形） |
| `useChartRecognition`       | boolean | false  | 图表识别                 |
| `useLayoutDetection`        | boolean | null   | 版面分析                 |

---

## 📥 响应格式

### 成功响应

```json
{
    "errorCode": 0,
    "errorMsg": "Success",
    "result": {
        "layoutParsingResults": [
            {
                "markdown": {
                    "text": "识别出的 Markdown 文本",
                    "images": {}
                }
            }
        ]
    }
}
```

---

##  Python 调用示例

```python
import base64
import requests

# 读取文件
with open("image.png", "rb") as f:
    file_data = base64.b64encode(f.read()).decode("ascii")

# 请求头
headers = {
    "Authorization": f"token {YOUR_TOKEN}",
    "Content-Type": "application/json"
}

# 请求体
payload = {
    "file": file_data,
    "fileType": 1,  # 图片
    "useDocOrientationClassify": False,
    "useDocUnwarping": False,
}

# 发送请求
response = requests.post(API_URL, json=payload, headers=headers)
result = response.json()

if result["errorCode"] == 0:
    print(result["result"]["layoutParsingResults"][0]["markdown"]["text"])
```

---

##  相关资源
- [官方文档 (PaddleOCR-VL)](https://ai.baidu.com/ai-doc/AISTUDIO/2mh4okm66)
- [PaddleOCR 官网](https://aistudio.baidu.com/paddleocr)
