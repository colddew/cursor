//
//  SettingsViewModel.swift
//  DragonLight
//
//  设置模块 ViewModel
//

import SwiftUI
import Combine

/// 设置 ViewModel
class SettingsViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var selectedColorIndex: Int
    @Published var brightness: Double
    @Published var volumeKeyShutter: Bool
    @Published var saveOriginal: Bool
    @Published var gestureBrightness: Bool
    @Published var hapticFeedback: Bool

    // MARK: - Properties

    private let settingsService = SettingsService.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    init() {
        // 从设置服务加载初始值
        self.selectedColorIndex = settingsService.selectedColorIndex
        self.brightness = settingsService.brightness
        self.volumeKeyShutter = settingsService.volumeKeyShutter
        self.saveOriginal = settingsService.saveOriginal
        self.gestureBrightness = settingsService.gestureBrightness
        self.hapticFeedback = settingsService.hapticFeedback

        // 绑定设置服务的变化
        bindToSettingsService()
    }

    // MARK: - Binding

    private func bindToSettingsService() {
        settingsService.$selectedColorIndex
            .assign(to: &$selectedColorIndex)

        settingsService.$brightness
            .assign(to: &$brightness)

        settingsService.$volumeKeyShutter
            .assign(to: &$volumeKeyShutter)

        settingsService.$saveOriginal
            .assign(to: &$saveOriginal)

        settingsService.$gestureBrightness
            .assign(to: &$gestureBrightness)

        settingsService.$hapticFeedback
            .assign(to: &$hapticFeedback)
    }

    // MARK: - Public Methods

    /// 加载设置
    func loadSettings() {
        // 设置会自动从 SettingsService 加载
    }

    /// 切换音量键拍照
    func toggleVolumeKeyShutter() {
        settingsService.volumeKeyShutter.toggle()
        triggerFeedback()
    }

    /// 切换保存原图
    func toggleSaveOriginal() {
        settingsService.saveOriginal.toggle()
        triggerFeedback()
    }

    /// 切换手势调亮度
    func toggleGestureBrightness() {
        settingsService.gestureBrightness.toggle()
        triggerFeedback()
    }

    /// 切换触觉反馈
    func toggleHapticFeedback() {
        settingsService.hapticFeedback.toggle()
        triggerFeedback()
    }

    /// 重置所有设置
    func resetAllSettings() {
        settingsService.resetAll()
        triggerFeedback()
    }

    // MARK: - Private Methods

    private func triggerFeedback() {
        if settingsService.hapticFeedback {
            HapticService.shared.selectionChanged()
        }
    }

    // MARK: - Computed Properties

    /// 获取当前设置模型
    var currentSettings: AppSettings {
        return AppSettings(
            selectedColorIndex: selectedColorIndex,
            brightness: brightness,
            volumeKeyShutter: volumeKeyShutter,
            saveOriginal: saveOriginal,
            gestureBrightness: gestureBrightness,
            hapticFeedback: hapticFeedback
        )
    }

    /// 获取当前颜色
    var currentColor: LightColor {
        LightColor.color(withId: selectedColorIndex) ?? LightColor.allColors[0]
    }
}
