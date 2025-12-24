//
//  View+Extensions.swift
//  DragonLight
//
//  View 扩展 - 通用修饰符
//

import SwiftUI

extension View {
    /// 隐藏键盘
    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    /// 条件性应用修饰符
    @ViewBuilder
    func `if`<Transform: View>(
        _ condition: Bool,
        transform: (Self) -> Transform
    ) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }

    /// 条件性应用修饰符（带 else）
    @ViewBuilder
    func `if`<TrueContent: View, FalseContent: View>(
        _ condition: Bool,
        if ifTransform: (Self) -> TrueContent,
        else elseTransform: (Self) -> FalseContent
    ) -> some View {
        if condition {
            ifTransform(self)
        } else {
            elseTransform(self)
        }
    }

    /// 添加角标
    func badge(_ text: String) -> some View {
        self.overlay(
            Text(text)
                .font(AppDesign.Typography.caption)
                .foregroundColor(.white)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(AppDesign.Colors.primary)
                .cornerRadius(10)
                .offset(x: 10, y: -10),
            alignment: .topTrailing
        )
    }

    /// 添加卡片阴影
    func cardShadow() -> some View {
        self.shadow(
            color: Color.black.opacity(0.1),
            radius: 10,
            x: 0,
            y: 4
        )
    }

    /// 添加按下效果
    func pressEffect(onPress: @escaping () -> Void = {}) -> some View {
        self.buttonStyle(PressButtonStyle(onPress: onPress))
    }
}

// MARK: - PressButtonStyle

struct PressButtonStyle: ButtonStyle {
    let onPress: () -> Void

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.15), value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { isPressed in
                if !isPressed {
                    onPress()
                }
            }
    }
}

// MARK: - View Preview

extension View {
    /// iOS 预览封装
    func previewAsDevice() -> some View {
        self.previewDevice(PreviewDevice(rawValue: "iPhone 14 Pro"))
    }
}
