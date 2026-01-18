#!/bin/bash

# ============================================
# Python 3.12 安装与配置脚本
# 使用国内镜像加速
# ============================================

PROJECT_DIR="/Users/colddew/Downloads/cursor/ocr"

echo "🚀 开始配置 Python 3.12..."

# 配置 pip 镜像（清华源）
export PIP_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple"
export PIP_TRUSTED_HOST="pypi.tuna.tsinghua.edu.cn"

# 1. 检查 Python 3.12 是否已安装
echo "📦 检查 Python 3.12..."
if ! brew list python@3.12 &>/dev/null; then
    echo "📥 安装 Python 3.12..."
    brew install python@3.12
else
    echo "✅ Python 3.12 已安装"
fi

# 2. 添加到 PATH
echo "⚙️ 配置环境变量..."
PYTHON312_PATH="/usr/local/opt/python@3.12/bin"

if ! grep -q "python@3.12" ~/.zshrc; then
    echo "export PATH=\"$PYTHON312_PATH:\$PATH\"" >> ~/.zshrc
    echo "✅ 已添加到 ~/.zshrc"
else
    echo "⚠️  已存在 python@3.12 PATH 配置"
fi

# 3. 直接使用全路径配置虚拟环境
echo "📁 创建 Python 3.12 虚拟环境..."
cd "$PROJECT_DIR"

# 如果已存在 venv，先删除
if [ -d "venv" ]; then
    echo "⚠️  发现已有 venv 目录"
    echo "请手动删除后重新运行: sudo rm -rf venv"
    echo ""
    echo "========================================"
    echo "✅ 配置完成（请手动删除 venv 并重建）"
    echo "========================================"
    exit 0
fi

# 使用 Python 3.12 的完整路径创建 venv
"$PYTHON312_PATH/python3" -m venv venv

# 4. 安装依赖
echo "📦 安装 Python 依赖 (使用清华镜像)..."
source venv/bin/activate
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/

echo ""
echo "========================================"
echo "✅ 安装完成！"
echo "========================================"
echo ""
echo "📝 常用命令："
echo "   激活环境: source venv/bin/activate"
echo "   安装依赖: pip install xxx -i https://pypi.tuna.tsinghua.edu.cn/simple/"
echo "   退出环境: deactivate"
echo ""
