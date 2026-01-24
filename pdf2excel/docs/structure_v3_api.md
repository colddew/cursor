# AI Studio PP-StructureV3 API 文档

## 📋 概览

**PP-StructureV3** 是一款专注于文档版面分析与结构化提取的增强型 OCR 模型。相比通用的 PaddleOCR-VL，它在处理复杂布局、多栏文档、表格识别以及公式提取方面具有显著优势。

- **官方文档 (中)**：[访问地址](https://ai.baidu.com/ai-doc/AISTUDIO/Fmfz6oh2e)
- **官方文档 (英)**：[访问地址](https://ai.baidu.com/ai-doc/AISTUDIO/Bmfz6me8d)
- **核心能力**：高精度版面分析、阅读顺序还原、分栏识别、SOTA 级表格识别。

---

## 🔗 接口地址与认证

### 接口 URL
访问 [AI Studio 控制台](https://aistudio.baidu.com/paddleocr/task) 获取您个人的 API URL。格式通常为：
`https://[id].aistudio-app.com/layout-parsing`

### 身份认证
请求头必须包含 `Authorization` 字段。
- **推荐格式**：`Authorization: Bearer YOUR_TOKEN`
- **传统格式**：`Authorization: token YOUR_TOKEN`

> [!NOTE]
> 在本项目中建议使用 `Bearer` 认证，已验证在 StructureV3 部署中表现稳定。

---

## 📤 请求参数 (JSON Payload)

### 必需参数
| 参数       | 类型    | 说明                                              | 示例 |
| ---------- | ------- | ------------------------------------------------- | ---- |
| `file`     | string  | Base64 编码的文件数据（不带 data:image/... 前缀） | -    |
| `fileType` | integer | 0=PDF, 1=图片                                     | `1`  |

### 版面分析参数 (核心)
| 参数                    | 类型    | 默认值  | 详细说明                                                                                |
| ----------------------- | ------- | ------- | --------------------------------------------------------------------------------------- |
| `useRegionDetection`    | boolean | true    | **复杂版面处理**。开启后可识别分栏、图片、表格等区域。                                  |
| `layoutThreshold`       | float   | 0.5     | **过滤强度 (0-1)**。控制区域检测的敏感度。调低（如 0.3）可找回漏识别的内容。            |
| `layoutMergeBboxesMode` | string  | "large" | **重叠过滤方式**。`large`: 只保留外层大框；`small`: 只保留内层小框；`union`: 保留所有。 |
| `prettifyMarkdown`      | boolean | false   | 是否尽量生成美化布局后的 Markdown。                                                     |

### 功能开关参数
| 参数                        | 类型    | 默认值 | 说明                                      |
| --------------------------- | ------- | ------ | ----------------------------------------- |
| `useTableRecognition`       | boolean | true   | 开启表格识别（转换为 HTML/Markdown 表格） |
| `useFormulaRecognition`     | boolean | true   | 开启数学公式识别                          |
| `useSealRecognition`        | boolean | false  | 开启印章识别                              |
| `useDocOrientationClassify` | boolean | false  | 自动判断并旋转图片方向                    |
| `useDocUnwarping`           | boolean | false  | 解决纸张卷曲、透视变形等问题              |

---

## 📥 响应格式

接口返回标准的 JSON 对象：
```json
{
    "errorCode": 0,
    "errorMsg": "Success",
    "result": {
        "layoutParsingResults": [
            {
                "markdown": {
                    "text": "# 识别结果标题\n这是一段正文...",
                    "images": { "image_0.png": "http://..." }
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

def call_structure_v3(file_path, api_url, token):
    with open(file_path, "rb") as f:
        file_data = base64.b64encode(f.read()).decode("ascii")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "file": file_data,
        "fileType": 1,  # 图片
        "useRegionDetection": True,
        "layoutThreshold": 0.3,
        "layoutMergeBboxesMode": "union",
        "prettifyMarkdown": True
    }
    
    response = requests.post(api_url, json=payload, headers=headers)
    return response.json()
```

---

## 💡 技术调优与最佳实践

1. **分栏表格乱序**：由于旧版 OCR 是按物理行扫描，遇到分栏会导致左右文字穿插。StructureV3 会先识别分栏区域再按区域提取，彻底解决此问题。
2. **内容“丢失”排查**：如果发现某些关键行因为背景干扰被误判为非文字区域，请将 `layoutThreshold` 调低至 `0.2` 或更小。
3. **表格重叠问题**：若模型误将一个大表拆分成多个小表框，尝试将 `layoutMergeBboxesMode` 设为 `union` 或 `large`。
4. **Markdown 匹配**：V3 生成的非美化版 Markdown 结构非常客观，建议在正则表达式中使用 `\s*`（匹配零个或多个空格）来兼容紧凑的输出。
