# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**奶龙补光灯 (DragonLight)** - An iOS fill light app featuring a Chinese dragon mascot.

- **Language**: Swift 5.7+
- **UI Framework**: SwiftUI 4.0 + UIKit hybrid
- **Minimum iOS**: 16.0
- **Maximum iOS**: 17.x
- **Architecture**: MVVM + Service pattern

## Build Commands

### Building the Project

```bash
# Open in Xcode
open DragonLight/DragonLight.xcodeproj

# Or build from command line
xcodebuild -project DragonLight/DragonLight.xcodeproj -scheme DragonLight -configuration Debug build
```

### Running Tests

```bash
# Run unit tests
xcodebuild test -project DragonLight/DragonLight.xcodeproj -scheme DragonLight -destination 'platform=iOS Simulator,name=iPhone 14'

# Run UI tests
xcodebuild test -project DragonLight/DragonLight.xcodeproj -scheme DragonLight -testPlan DragonLightUITests
```

## Code Architecture

### MVVM + Service Pattern

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ SwiftUI │  │ SwiftUI │  │ SwiftUI │  │ UIKit │ │
│  │  Views  │  │Components│  │ Animations│ │Views │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    ViewModel Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Light      │  │   Camera     │  │   Settings   │ │
│  │  ViewModel   │  │  ViewModel   │  │  ViewModel   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                      Service Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Settings    │  │   Haptics    │  │   Camera     │ │
│  │  Service     │  │   Service    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Design System | `Core/Design/` | Central design tokens (colors, fonts, spacing) |
| Models | `Core/Models/` | Data structures (LightColor, DragonState, Settings) |
| ViewModels | `Core/ViewModels/` & `Features/*/ViewModels/` | Business logic layer |
| Services | `Core/Services/` | Singleton services (Settings, Haptics, Camera) |
| Light | `Features/Light/` | Fill light controls (picker, slider) |
| Camera | `Features/Camera/` | Camera functionality |
| Dragon | `Features/Dragon/` | Dragon character and animations |
| Settings | `Features/Settings/` | Settings menu and preferences |

### Design System (`AppDesign`)

All design tokens are accessed via `AppDesign` namespace:

```swift
// Colors
AppDesign.Colors.rouge        // 胭脂 #FFE4E4
AppDesign.Colors.藤黄           // 藤黄 #FFF4D6
AppDesign.Colors.primary       // 朱砂红 #FF4C00

// Typography
AppDesign.Typography.largeTitle
AppDesign.Typography.body
AppDesign.Typography.seal       // 楷体

// Spacing
AppDesign.Spacing.md.rawValue   // 16pt

// Animation
AppDesign.AnimationCurve.spring
AppDesign.AnimationCurve.easeOut
```

### 8 Chinese Traditional Colors

| Name | Hex | Temperature | Usage |
|------|-----|-------------|-------|
| 胭脂 | #FFE4E4 | Warm | Portrait, warm tone |
| 藤黄 | #FFF4D6 | Warm | Cozy atmosphere |
| 杏子 | #FFEBD9 | Warm | Natural daily use |
| 月白 | #F0F6F8 | Neutral | Cool style |
| 天青 | #D4E8E8 | Neutral | Minimalist |
| 竹青 | #C8DEC8 | Cold | Fresh style |
| 黛蓝 | #D0D8E8 | Cold | Artistic cool |
| 靛青 | #C8D8EC | Cold | Vintage retro |

## Development Notes

### iOS 16 Compatibility

This project targets iOS 16.0 minimum:
- Use `NavigationView` instead of `NavigationStack`
- Use `@ObservableObject` instead of `@Observable` macro
- Use `@Published` for reactive properties

### Camera Service

The camera uses AVFoundation on a dedicated serial queue:
```swift
private let sessionQueue = DispatchQueue(label: "com.dragonlight.camera.session")
```

Always perform camera operations on this queue to avoid blocking the main thread.

### Settings Persistence

Settings are stored in `UserDefaults` via `SettingsService`:
```swift
SettingsService.shared.selectedColorIndex = 0
SettingsService.shared.brightness = 0.75
```

### Haptic Feedback

Use `HapticService.shared` for consistent haptic feedback:
```swift
HapticService.shared.lightImpact()    // Light tap
HapticService.shared.mediumImpact()  // Success feedback
HapticService.shared.success()       // Success notification
HapticService.shared.error()         // Error notification
```

### Animation Timing

Standard animation durations:
- Blink: 200ms
- Jump: 300ms spring
- Thumbs-up: 400ms
- Color transition: 300ms ease-in-out
- Menu: 300ms spring
- Lantern shake: 2s loop (±3°)

## Common Tasks

### Adding a New Color

1. Add to `LightColor.allColors` in `Core/Models/LightColor.swift`
2. No UI changes needed - the grid updates automatically

### Adding a New Setting

1. Add property to `Settings` model
2. Add key to `SettingsService.Keys`
3. Add getter/setter to `SettingsService`
4. Add toggle to `SettingsMenu`

### Customizing Dragon Animation

Edit `DragonState.swift`:
- `triggerTap()` - Tap interaction
- `triggerCapture()` - Photo capture
- `updateGlowColor()` - Color glow effect

## File Structure Reference

```
DragonLight/
├── DragonLightApp.swift          # App entry point
├── Core/
│   ├── Design/                   # Design system
│   │   ├── AppDesign.swift       # Central design namespace
│   │   ├── Colors.swift
│   │   ├── Fonts.swift
│   │   ├── Spacing.swift
│   │   └── Animations.swift
│   ├── Models/
│   │   ├── LightColor.swift      # 8 traditional colors
│   │   ├── DragonState.swift     # Animation states
│   │   ├── Settings.swift        # User preferences
│   │   └── CameraState.swift     # Camera status
│   ├── ViewModels/
│   │   └── LightViewModel.swift  # Fill light logic
│   └── Services/
│       ├── SettingsService.swift # UserDefaults wrapper
│       ├── HapticService.swift   # Touch feedback
│       ├── CameraService.swift   # AVFoundation camera
│       └── PhotoService.swift    # Photo saving
├── Features/
│   ├── Light/
│   │   ├── Views/
│   │   │   ├── LightColorPicker.swift
│   │   │   └── BrightnessSlider.swift
│   │   └── Components/
│   │       └── ColorGridCell.swift
│   ├── Camera/
│   │   └── ViewModels/
│   │       └── CameraViewModel.swift
│   ├── Dragon/
│   │   └── Views/
│   │       ├── DragonView.swift
│   │       └── SealView.swift
│   ├── Settings/
│   │   ├── Views/
│   │   │   ├── SettingsMenu.swift
│   │   │   └── SettingsToggle.swift
│   │   └── ViewModels/
│   │       └── SettingsViewModel.swift
│   └── Main/
│       └── MainView.swift        # Main screen
├── Shared/
│   ├── Components/
│   └── Extensions/
│       ├── Color+Hex.swift
│       └── NotificationCenter+Name.swift
└── Resources/
    ├── Assets.xcassets/          # Images, colors
    └── Fonts/                    # Custom fonts
```

## Git Commit Convention

Follow this format:
```
feat: 添加灯笼摇晃动画
fix: 修复相机切换崩溃问题
perf: 优化奶龙视图渲染性能
test: 添加LightViewModel单元测试
docs: 更新架构文档
```
