import os
import requests
import base64

def call_paddleocr_vl(file_path, api_url, token):
    """
    调用 AI Studio PaddleOCR-VL API (Restored from Backup)
    用于处理正式表格 (Page 01)
    """
    with open(file_path, "rb") as file:
        file_bytes = file.read()
    file_data = base64.b64encode(file_bytes).decode("ascii")
    
    headers = {
        "Authorization": f"token {token}",
        "Content-Type": "application/json"
    }
    
    file_ext = os.path.splitext(file_path)[1].lower()
    file_type = 0 if file_ext == '.pdf' else 1
    
    # 从环境变量读取矫正配置，保持与备份代码一致的逻辑
    use_orientation = os.getenv('USE_DOC_ORIENTATION', 'false').lower() == 'true'
    use_unwarping = os.getenv('USE_DOC_UNWARPING', 'false').lower() == 'true'
    
    payload = {
        "file": file_data,
        "fileType": file_type,
        "useDocOrientationClassify": use_orientation,
        "useDocUnwarping": use_unwarping,
        "useChartRecognition": False,
    }
    
    response = requests.post(api_url, json=payload, headers=headers)
    return response
