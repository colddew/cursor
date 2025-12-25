//
//  Settings.swift
//  DragonLight
//
//  应用设置数据模型
//

import Foundation

/// 应用设置模型
struct AppSettings: Codable {
    // MARK: - Properties

    /// 选中的颜色索引
    var selectedColorIndex: Int

    /// 亮度值 (0.0 - 1.0)
    var brightness: Double

    /// 对比度值 (0.5 - 1.5)
    var contrast: Double

    /// 音量键拍照
    var volumeKeyShutter: Bool

    /// 保存无补光原片
    var saveOriginal: Bool

    /// 手势调节亮度
    var gestureBrightness: Bool

    /// 触觉反馈
    var hapticFeedback: Bool

    // MARK: - Default Values

    static let `default` = AppSettings(
        selectedColorIndex: 0,
        brightness: 0.75,
        contrast: 1.0,
        volumeKeyShutter: true,
        saveOriginal: false,
        gestureBrightness: false,
        hapticFeedback: true
    )
}
