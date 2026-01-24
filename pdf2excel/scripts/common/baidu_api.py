import os
import sys
# 禁用生成 __pycache__
sys.dont_write_bytecode = True
from requests import Response # or just import requests
import requests
import base64

def call_structure_v3(image_path, api_url, token):
    """
    调用百度 AI Studio StructureV3 接口进行版面解析
    """
    with open(image_path, "rb") as f:
        image_data = f.read()
    
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    payload = {
        "file": base64_image,
        "fileType": 1,
        "useLayoutDetection": True,
        "layoutThreshold": 0.3,
        "layoutMergeBboxesMode": "union",
        "prettifyMarkdown": True
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"token {token}"
    }
    
    response = requests.post(api_url, json=payload, headers=headers)
    return response
