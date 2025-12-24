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

    /// 所有可用的颜色
    let allColors: [LightColor]

    // MARK: - Properties

    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    init() {
        self.allColors = LightColor.allColors
        self.selectedColor = LightColor.allColors.first ?? LightColor.allColors[0]
        self.brightness = AppSettings.default.brightness

        // 监听设置服务的变化
        SettingsService.shared.$selectedColorIndex
            .map { LightColor.color(withId: $0) ?? LightColor.allColors[0] }
            .assign(to: &$selectedColor)

        SettingsService.shared.$brightness
            .assign(to: &$brightness)
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
        selectedColor.color.opacity(brightness)
    }

    // MARK: - Persistence

    /// 加载保存的设置
    func loadSavedSettings() {
        let savedIndex = SettingsService.shared.selectedColorIndex
        if let savedColor = LightColor.color(withId: savedIndex) {
            selectedColor = savedColor
        }
        brightness = SettingsService.shared.brightness
    }
}
