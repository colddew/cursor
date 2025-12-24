#!/bin/bash

# 奶龙补光灯 - Xcode 项目设置脚本

set -e

PROJECT_DIR="/Users/colddew/Downloads/cursor/fill-light/DragonLight"
PROJECT_NAME="DragonLight"
BUNDLE_ID="com.dragonlight.DragonLight"

echo "🚀 开始设置奶龙补光灯项目..."

# 检查 Xcode 是否安装
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ 错误: 未找到 Xcode，请先安装 Xcode"
    exit 1
fi

echo "✅ Xcode 已安装"

# 创建项目目录结构
echo "📁 创建项目目录结构..."
mkdir -p "$PROJECT_DIR"

# 使用 xcodegen 创建项目（如果可用）
if command -v xcodegen &> /dev/null; then
    echo "📦 使用 xcodegen 创建项目..."

    cat > "$PROJECT_DIR/project.yml" << 'EOF'
name: DragonLight
options:
  bundleIdPrefix: com.dragonlight
  deploymentTarget:
    iOS: "16.0"
  developmentLanguage: zh-Hans

targets:
  DragonLight:
    type: application
    platform: iOS
    deploymentTarget: "16.0"
    sources:
      - DragonLight
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.dragonlight.DragonLight
        INFOPLIST_FILE: DragonLight/Info.plist
        TARGETED_DEVICE_FAMILY: 1,2
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: AccentColor
        SWIFT_VERSION: "5.7"
        IPHONEOS_DEPLOYMENT_TARGET: "16.0"

schemes:
  DragonLight:
    build:
      targets:
        DragonLight: all
    run:
      config: Debug
    archive:
      config: Release
EOF

    cd "$PROJECT_DIR"
    xcodegen generate
    echo "✅ 项目已创建"
else
    echo "⚠️  xcodegen 未安装，创建基础项目文件..."

    # 创建基础项目
    cd "$PROJECT_DIR"

    # 创建 project.pbxproj（简化版）
    mkdir -p "$PROJECT_NAME.xcodeproj"

    echo "⚠️  请在 Xcode 中手动创建项目："
    echo "   1. 打开 Xcode"
    echo "   2. File > New > Project > iOS App"
    echo "   3. 项目名: DragonLight"
    echo "   4. 保存到: $PROJECT_DIR"
    echo "   5. 将现有文件拖入项目"
fi

echo ""
echo "✨ 项目设置完成！"
echo ""
echo "下一步："
echo "   1. 打开 Xcode: open $PROJECT_DIR/$PROJECT_NAME.xcodeproj"
echo "   2. 选择目标设备"
echo "   3. 点击 Run (⌘+R)"
echo ""
