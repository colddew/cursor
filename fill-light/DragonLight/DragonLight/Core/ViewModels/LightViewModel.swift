//
//  LightViewModel.swift
//  DragonLight
//
//  补光模块 ViewModel
//

import SwiftUI
import Combine

/// 补光 ViewModel
class LightViewModel: ObservableObject {
    // MARK: - Published Properties

    /// 当前选中的颜色
    @Published var selectedColor: LightColor

    /// 当前亮度
    @Published var brightness: Double

    /// 当前对比度
    @Published var contrast: Double

    /// 所有可用的颜色
    let allColors: [LightColor]

    // MARK: - Properties

    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    init() {
        self.allColors = LightColor.allColors
        self.selectedColor = LightColor.allColors.first ?? LightColor.allColors[0]
        self.brightness = AppSettings.default.brightness
        self.contrast = AppSettings.default.contrast

        // 监听设置服务的变化
        SettingsService.shared.$selectedColorIndex
            .map { LightColor.color(withId: $0) ?? LightColor.allColors[0] }
            .assign(to: &$selectedColor)

        SettingsService.shared.$brightness
            .assign(to: &$brightness)

        SettingsService.shared.$contrast
            .assign(to: &$contrast)
    }

    // MARK: - Public Methods

    /// 选择颜色
    func selectColor(_ color: LightColor) {
        withAnimation(.easeInOut(duration: 0.3)) {
            selectedColor = color
            SettingsService.shared.selectedColorIndex = color.id

            // 触觉反馈
            if SettingsService.shared.hapticFeedback {
                HapticService.shared.lightImpact()
            }
        }
    }

    /// 设置亮度
    func setBrightness(_ value: Double) {
        brightness = max(0.0, min(1.0, value))
        SettingsService.shared.brightness = brightness
    }

    /// 设置对比度
    func setContrast(_ value: Double) {
        contrast = max(0.5, min(1.5, value))
        SettingsService.shared.contrast = contrast
    }

    /// 增加亮度
    func increaseBrightness(by amount: Double = 0.1) {
        setBrightness(brightness + amount)
    }

    /// 减少亮度
    func decreaseBrightness(by amount: Double = 0.1) {
        setBrightness(brightness - amount)
    }

    /// 获取当前屏幕补光颜色（带亮度）
    var screenFillColor: Color {
        let baseColor = selectedColor.color.opacity(brightness)

        // 应用对比度调整
        if contrast != 1.0 {
            // 通过 UIColor 调整对比度
            let uiColor = UIColor(baseColor)
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            uiColor.getRed(&r, green: &g, blue: &b, alpha: &a)

            // 对比度调整: 将颜色值从 0.5 向外或向内推
            let factor = contrast
            r = max(0, min(1, (r - 0.5) * factor + 0.5))
            g = max(0, min(1, (g - 0.5) * factor + 0.5))
            b = max(0, min(1, (b - 0.5) * factor + 0.5))

            return Color(red: r, green: g, blue: b, opacity: a)
        }

        return baseColor
    }

    // MARK: - Persistence

    /// 加载保存的设置
    func loadSavedSettings() {
        let savedIndex = SettingsService.shared.selectedColorIndex
        if let savedColor = LightColor.color(withId: savedIndex) {
            selectedColor = savedColor
        }
        brightness = SettingsService.shared.brightness
        contrast = SettingsService.shared.contrast
    }
}
