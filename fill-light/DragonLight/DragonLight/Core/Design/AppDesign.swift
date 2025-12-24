//
//  AppDesign.swift
//  DragonLight
//
//  设计系统命名空间 - 统一管理所有设计规范
//

import SwiftUI

/// 设计系统命名空间
enum AppDesign {
    /// 颜色规范
    enum Colors {
        // MARK: - 国潮色盘 - 8种传统色

        /// 胭脂 #FFE4E4 - 妆容之美，温柔腮红
        static let rouge = Color(hex: "FFE4E4")

        /// 藤黄 #FFF4D6 - 国画颜料，传统正色
        static let 藤黄 = Color(hex: "FFF4D6")

        /// 杏子 #FFEBD9 - 春日杏花，柔美淡雅
        static let apricot = Color(hex: "FFEBD9")

        /// 月白 #F0F6F8 - 月光如水，纯净洁白
        static let 月白 = Color(hex: "F0F6F8")

        /// 天青 #D4E8E8 - 汝窑天青，雨过云破
        static let 天青 = Color(hex: "D4E8E8")

        /// 竹青 #C8DEC8 - 翠竹成林，清幽雅致
        static let 竹青 = Color(hex: "C8DEC8")

        /// 黛蓝 #D0D8E8 - 远山如黛，水墨丹青
        static let 黛蓝 = Color(hex: "D0D8E8")

        /// 靛青 #C8D8EC - 靛蓝染布，蓝印花布
        static let 靛青 = Color(hex: "C8D8EC")

        // MARK: - 界面主色

        /// 背景色 - 松烟色（浅色模式）
        static let background = Color(hex: "F5F5F5")

        /// 背景色 - 深色模式
        static let backgroundDark = Color(hex: "1A1A1A")

        /// 强调色 - 朱砂红 #FF4C00
        static let primary = Color(hex: "FF4C00")

        /// 次要色 - 天青色 #7CC2C3
        static let secondary = Color(hex: "7CC2C3")

        /// 文字 - 墨色（浅色模式）
        static let text = Color(hex: "3E3E3E")

        /// 文字 - 浅色（深色模式）
        static let textLight = Color(hex: "F0F0F0")

        // MARK: - 语义化颜色

        /// 灯笼红
        static let lanternRed = Color(hex: "FFB6C1")

        /// 印章红
        static let sealRed = Color(hex: "FF4C00")

        /// 金色
        static let gold = Color(hex: "F4C430")

        /// 奶龙主体 - 奶白
        static let dragonBody = Color(hex: "FFF8E7")

        /// 奶龙腮红
        static let dragonBlush = Color(hex: "FFB6C1")

        /// 奶龙眼睛
        static let dragonEye = Color(hex: "1A1A1A")
    }

    /// 字体规范
    enum Typography {
        /// 大标题 28pt Medium
        static let largeTitle = Font.system(size: 28, weight: .medium)

        /// 小标题 17pt Regular
        static let title = Font.system(size: 17, weight: .regular)

        /// 标题 15pt Regular
        static let headline = Font.system(size: 15, weight: .regular)

        /// 正文 15pt Regular
        static let body = Font.system(size: 15, weight: .regular)

        /// 辅助文字 13pt Light
        static let caption = Font.system(size: 13, weight: .light)

        /// 印章字体 - 楷体
        static let seal = Font.custom("STKaiti", size: 24)

        /// 等宽字体（数值显示）
        static let mono = Font.system(size: 15, design: .monospaced)
    }

    /// 间距规范
    enum Spacing: CGFloat {
        case xs = 4
        case sm = 8
        case md = 16
        case lg = 24
        case xl = 32
        case xxl = 48
    }

    /// 圆角规范
    enum CornerRadius: CGFloat {
        case sm = 8
        case md = 12
        case lg = 16
        case xl = 24
        case circle = 999
    }

    /// 动画时长
    enum AnimationDuration: Double {
        case fast = 0.15
        case normal = 0.3
        case slow = 0.5
    }

    /// 动画曲线
    enum AnimationCurve {
        /// 缓出
        static let easeOut = SwiftUI.Animation.easeOut(duration: AnimationDuration.normal.rawValue)

        /// 缓入缓出
        static let easeInOut = SwiftUI.Animation.easeInOut(duration: AnimationDuration.normal.rawValue)

        /// 弹性
        static let spring = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.7)

        /// 柔和弹性
        static let softSpring = SwiftUI.Animation.spring(response: 0.4, dampingFraction: 0.6)

        /// 快速弹性
        static let bouncySpring = SwiftUI.Animation.spring(response: 0.2, dampingFraction: 0.5)
    }

    /// 阴影规范
    enum Shadow {
        /// 轻微阴影
        static let light = SwiftUI.Shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)

        /// 中等阴影
        static let medium = SwiftUI.Shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)

        /// 深度阴影
        static let deep = SwiftUI.Shadow(color: Color.black.opacity(0.2), radius: 16, x: 0, y: 8)
    }
}

// MARK: - Color Extension

extension Color {
    /// 从十六进制字符串创建颜色
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
