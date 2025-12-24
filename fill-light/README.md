# 奶龙补光灯 - 快速开始指南

## 项目说明

这是一个完整的 iOS 补光灯应用，采用 MVVM + Service 架构，使用 SwiftUI 4.0 开发。

- **最低支持**: iOS 16.0
- **开发工具**: Xcode 14.2+
- **语言**: Swift 5.7+

## 快速开始

### 方法 1: 使用 Xcode 创建项目（推荐）

1. **打开 Xcode**
   - 选择 `File > New > Project`

2. **选择项目模板**
   - 选择 `iOS > App`
   - 点击 `Next`

3. **填写项目信息**
   - **Product Name**: `DragonLight`
   - **Team**: 选择你的开发团队
   - **Organization Identifier**: `com.dragonlight`
   - **Interface**: `SwiftUI`
   - **Language**: `Swift`
   - 取消勾选 `Use Core Data`
   - 取消勾选 `Include Tests`
   - 点击 `Next`

4. **选择保存位置**
   - 选择 `/Users/colddew/Downloads/cursor/fill-light/DragonLight` 目录
   - 点击 `Create`

5. **替换文件**
   - 删除 Xcode 自动创建的以下文件：
     - `DragonLightApp.swift`
     - `ContentView.swift`
     - `Assets.xcassets`
     - `Preview Content`

   - 将 `DragonLight/` 目录下已有的所有文件拖入 Xcode 项目中

6. **配置项目**
   - 选择项目文件
   - 在 `Target > DragonLight > Info` 中确认以下权限已添加：
     ```
     Privacy - Camera Usage Description: "需要访问相机来拍摄照片"
     Privacy - Photo Library Usage Description: "需要访问相册来保存照片"
     Privacy - Photo Library Add Usage Description: "需要访问相册来保存拍摄的照片"
     ```

7. **运行项目**
   - 选择模拟器或真机
   - 点击 `Run` (⌘+R)

### 方法 2: 直接打开项目

如果项目文件已创建：
```bash
cd /Users/colddew/Downloads/cursor/fill-light/DragonLight
open DragonLight.xcodeproj
```

## 项目结构

```
DragonLight/
├── DragonLightApp.swift          # App 入口
├── Info.plist                     # 配置文件
│
├── Core/                          # 核心层
│   ├── Design/                    # 设计系统
│   │   └── AppDesign.swift
│   ├── Models/                    # 数据模型
│   │   ├── LightColor.swift
│   │   ├── DragonState.swift
│   │   ├── Settings.swift
│   │   └── CameraState.swift
│   ├── ViewModels/                # 视图模型
│   │   └── LightViewModel.swift
│   └── Services/                  # 服务层
│       ├── CameraService.swift
│       ├── HapticService.swift
│       ├── PhotoService.swift
│       └── SettingsService.swift
│
├── Features/                      # 功能模块
│   ├── Camera/                    # 相机模块
│   ├── Light/                     # 补光模块
│   ├── Dragon/                    # 奶龙模块
│   └── Settings/                  # 设置模块
│
└── Shared/                        # 共享组件
    ├── Components/
    └── Extensions/
```

## 主要功能

1. **补光系统**
   - 8种国潮色盘（胭脂、藤黄、杏子、月白、天青、竹青、黛蓝、靛青）
   - 亮度调节（0-100%）
   - 实时屏幕补光

2. **相机功能**
   - 前置/后置摄像头切换
   - 拍照保存到相册
   - 闪光灯效果

3. **奶龙主题**
   - 可爱的中国龙角色
   - 提灯笼动画
   - 点击互动（眨眼、跳跃）
   - 比赞动画（拍照完成）

4. **双重设置入口**
   - 右上角"龍"字印章
   - 奶龙手中的红灯笼
   - 毛玻璃设置菜单

## 依赖项

项目使用系统框架，无需额外依赖：
- SwiftUI
- Combine
- AVFoundation
- Core Haptics
- UIKit

## 权限说明

需要在 Info.plist 中添加以下权限：
- `NSCameraUsageDescription`: 相机访问
- `NSPhotoLibraryUsageDescription`: 相册访问
- `NSPhotoLibraryAddUsageDescription`: 保存照片

## 注意事项

1. **触觉反馈**：仅在真机上有效
2. **相机功能**：需要真机或相册权限的模拟器
3. **iOS 版本**：最低 iOS 16.0

## 故障排除

### 问题：编译错误
- 确认 Xcode 版本 >= 14.2
- 确认 iOS 部署目标 >= 16.0

### 问题：相机无法运行
- 检查相机权限配置
- 使用真机测试

### 问题：自定义字体不显示
- 确认楷体已添加到项目中
- 检查 Info.plist 中的字体配置

## 技术支持

如有问题，请参考以下文档：
- [PRD.md](../prd.md) - 产品需求文档
- [tech.md](../tech.md) - 技术方案文档
- [CLAUDE.md](../CLAUDE.md) - 项目开发指南
