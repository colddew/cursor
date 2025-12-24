//
//  LightColor.swift
//  DragonLight
//
//  补光颜色模型 - 8种中国传统色
//

import SwiftUI

/// 色温类型
enum ColorTemperature: String, CaseIterable {
    case warm = "暖色"
    case neutral = "中性"
    case cold = "冷色"

    var icon: String {
        switch self {
        case .warm: return "🌸"
        case .neutral: return "🌤"
        case .cold: return "❄️"
        }
    }
}

/// 补光颜色模型
struct LightColor: Identifiable, Equatable {
    // MARK: - Properties

    let id: Int
    let name: String
    let hexValue: String
    let temperature: ColorTemperature
    let description: String

    // MARK: - Computed Properties

    /// SwiftUI 颜色
    var color: Color {
        Color(hex: hexValue)
    }

    // MARK: - Static Data

    /// 所有可用的国潮色盘
    static let allColors: [LightColor] = [
        LightColor(
            id: 0,
            name: "胭脂",
            hexValue: "FFE4E4",
            temperature: .warm,
            description: "妆容之美，温柔腮红"
        ),
        LightColor(
            id: 1,
            name: "藤黄",
            hexValue: "FFF4D6",
            temperature: .warm,
            description: "国画颜料，传统正色"
        ),
        LightColor(
            id: 2,
            name: "杏子",
            hexValue: "FFEBD9",
            temperature: .warm,
            description: "春日杏花，柔美淡雅"
        ),
        LightColor(
            id: 3,
            name: "月白",
            hexValue: "F0F6F8",
            temperature: .neutral,
            description: "月光如水，纯净洁白"
        ),
        LightColor(
            id: 4,
            name: "天青",
            hexValue: "D4E8E8",
            temperature: .neutral,
            description: "汝窑天青，雨过云破"
        ),
        LightColor(
            id: 5,
            name: "竹青",
            hexValue: "C8DEC8",
            temperature: .cold,
            description: "翠竹成林，清幽雅致"
        ),
        LightColor(
            id: 6,
            name: "黛蓝",
            hexValue: "D0D8E8",
            temperature: .cold,
            description: "远山如黛，水墨丹青"
        ),
        LightColor(
            id: 7,
            name: "靛青",
            hexValue: "C8D8EC",
            temperature: .cold,
            description: "靛蓝染布，蓝印花布"
        ),
    ]

    // MARK: - Convenience Methods

    /// 根据 ID 获取颜色
    static func color(withId id: Int) -> LightColor? {
        allColors.first { $0.id == id }
    }

    /// 根据色温筛选颜色
    static func colors(withTemperature temperature: ColorTemperature) -> [LightColor] {
        allColors.filter { $0.temperature == temperature }
    }

    // MARK: - Equatable

    static func == (lhs: LightColor, rhs: LightColor) -> Bool {
        lhs.id == rhs.id
    }
}
