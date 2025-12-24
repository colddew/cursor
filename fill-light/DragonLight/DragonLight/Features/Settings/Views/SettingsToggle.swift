//
//  SettingsToggle.swift
//  DragonLight
//
//  设置开关组件
//

import SwiftUI

struct SettingsToggle: View {
    // MARK: - Properties

    let title: String
    let isOn: Bool
    let action: () -> Void

    // MARK: - Body

    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(AppDesign.Typography.body)
                    .foregroundColor(AppDesign.Colors.text)

                Spacer()

                // 自定义开关
                toggleSwitch
            }
            .padding(.horizontal, AppDesign.Spacing.md.rawValue)
            .padding(.vertical, AppDesign.Spacing.md.rawValue)
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Subviews

    private var toggleSwitch: some View {
        HStack(spacing: 4) {
            // 背景轨道
            RoundedRectangle(cornerRadius: 12)
                .fill(isOn ? AppDesign.Colors.primary : Color.gray.opacity(0.3))
                .frame(width: 44, height: 26)
                .overlay(
                    // 滑块
                    Circle()
                        .fill(Color.white)
                        .frame(width: 22, height: 22)
                        .offset(x: isOn ? 9 : -9)
                        .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                )
        }
        .animation(.spring(response: 0.2), value: isOn)
    }
}

// MARK: - Preview

struct SettingsToggle_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            SettingsToggle(
                title: "音量键可以拍照",
                isOn: true
            ) {}

            SettingsToggle(
                title: "触觉反馈",
                isOn: false
            ) {}
        }
        .padding()
        .background(Color.white)
    }
}
