//
//  SettingsService.swift
//  DragonLight
//
//  设置服务 - UserDefaults 管理
//

import Foundation
import Combine

/// 设置服务（单例）
class SettingsService: ObservableObject {
    // MARK: - Singleton

    static let shared = SettingsService()

    // MARK: - Keys

    enum Keys: String, CaseIterable {
        case selectedColorIndex = "dragonlight.selectedColorIndex"
        case brightness = "dragonlight.brightness"
        case volumeKeyShutter = "dragonlight.volumeKeyShutter"
        case saveOriginal = "dragonlight.saveOriginal"
        case gestureBrightness = "dragonlight.gestureBrightness"
        case hapticFeedback = "dragonlight.hapticFeedback"
    }

    // MARK: - Published Properties

    @Published var selectedColorIndex: Int {
        didSet {
            set(key: .selectedColorIndex, value: selectedColorIndex)
        }
    }

    @Published var brightness: Double {
        didSet {
            set(key: .brightness, value: brightness)
        }
    }

    @Published var volumeKeyShutter: Bool {
        didSet {
            set(key: .volumeKeyShutter, value: volumeKeyShutter)
        }
    }

    @Published var saveOriginal: Bool {
        didSet {
            set(key: .saveOriginal, value: saveOriginal)
        }
    }

    @Published var gestureBrightness: Bool {
        didSet {
            set(key: .gestureBrightness, value: gestureBrightness)
        }
    }

    @Published var hapticFeedback: Bool {
        didSet {
            set(key: .hapticFeedback, value: hapticFeedback)
        }
    }

    // MARK: - Initialization

    private init() {
        // 从 UserDefaults 加载值
        self.selectedColorIndex = get(key: .selectedColorIndex) ?? AppSettings.default.selectedColorIndex
        self.brightness = get(key: .brightness) ?? AppSettings.default.brightness
        self.volumeKeyShutter = get(key: .volumeKeyShutter) ?? AppSettings.default.volumeKeyShutter
        self.saveOriginal = get(key: .saveOriginal) ?? AppSettings.default.saveOriginal
        self.gestureBrightness = get(key: .gestureBrightness) ?? AppSettings.default.gestureBrightness
        self.hapticFeedback = get(key: .hapticFeedback) ?? AppSettings.default.hapticFeedback
    }

    // MARK: - Public Methods

    /// 通用设置方法
    func set<T: Codable>(key: Keys, value: T?) {
        let encoder = JSONEncoder()
        if let value = value {
            if let encoded = try? encoder.encode(value) {
                UserDefaults.standard.set(encoded, forKey: key.rawValue)
            }
        } else {
            UserDefaults.standard.removeObject(forKey: key.rawValue)
        }
    }

    /// 通用获取方法
    func get<T: Codable>(key: Keys) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key.rawValue) else {
            return nil
        }
        let decoder = JSONDecoder()
        return try? decoder.decode(T.self, from: data)
    }

    /// 重置所有设置
    func resetAll() {
        Keys.allCases.forEach { key in
            UserDefaults.standard.removeObject(forKey: key.rawValue)
        }

        selectedColorIndex = AppSettings.default.selectedColorIndex
        brightness = AppSettings.default.brightness
        volumeKeyShutter = AppSettings.default.volumeKeyShutter
        saveOriginal = AppSettings.default.saveOriginal
        gestureBrightness = AppSettings.default.gestureBrightness
        hapticFeedback = AppSettings.default.hapticFeedback
    }

    /// 获取完整的 AppSettings 对象
    func getAppSettings() -> AppSettings {
        return AppSettings(
            selectedColorIndex: selectedColorIndex,
            brightness: brightness,
            volumeKeyShutter: volumeKeyShutter,
            saveOriginal: saveOriginal,
            gestureBrightness: gestureBrightness,
            hapticFeedback: hapticFeedback
        )
    }
}
