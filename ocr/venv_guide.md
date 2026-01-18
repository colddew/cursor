# Python venv 虚拟环境使用指南

## 什么是 venv？

venv 是 Python 3.3+ 自带的虚拟环境工具，用于隔离项目依赖，避免不同项目之间的包版本冲突

## 常用命令

### 创建虚拟环境
```bash
python3 -m venv venv
```
会在当前目录创建 `venv` 文件夹

### 激活虚拟环境
```bash
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 退出虚拟环境
```bash
deactivate
```

### 安装依赖
```bash
pip install -r requirements.txt
```

### 查看已安装的包
```bash
pip list
```

### 导出当前环境依赖
```bash
pip freeze > requirements.txt
```

## 在本项目中的使用

```bash
# 1. 进入项目目录
cd /Users/colddew/Downloads/cursor/ocr

# 2. 创建虚拟环境
python3 -m venv venv

# 3. 激活环境
source venv/bin/activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 运行脚本
python3 scripts/xxx.py

# 6. 退出环境
deactivate
```

## 如何判断是否进入venv环境
- 查看命令行提示符是否有 (venv) 前缀
- 运行 which python 或 which python3 检查路径是否指向 venv 目录
- 运行 python -c "import sys; print(sys.prefix)" 检查 sys.prefix 是否指向 venv 目录
- 运行 pip --version 检查 pip 路径

## 注意事项

- `venv` 文件夹不需要提交到 git（已列入 .gitignore）
- 每次新开终端都需要重新 `source venv/bin/activate`
- 如果删除 venv 文件夹，重新运行上述命令即可重建