//
//  SettingsMenu.swift
//  DragonLight
//
//  设置菜单 - 下拉菜单
//

import SwiftUI

struct SettingsMenu: View {
    // MARK: - Properties

    @EnvironmentObject private var settingsViewModel: SettingsViewModel

    @State private var opacity: Double = 0
    @State private var scale: CGFloat = 0.8

    // MARK: - Body

    var body: some View {
        ZStack {
            // 背景遮罩
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture {
                    dismissMenu()
                }
                .opacity(opacity)

            // 菜单内容
            VStack {
                Spacer()

                menuContent
                    .scaleEffect(scale)
                    .opacity(opacity)

                Spacer()
                    .frame(height: 200)
            }
            .ignoresSafeArea()
        }
        .onAppear {
            presentMenu()
        }
    }

    // MARK: - Subviews

    private var menuContent: some View {
        VStack(spacing: 0) {
            // 设置选项
            VStack(spacing: 0) {
                SettingsToggle(
                    title: "音量键可以拍照",
                    isOn: settingsViewModel.volumeKeyShutter
                ) {
                    settingsViewModel.toggleVolumeKeyShutter()
                }

                Divider()
                    .padding(.leading, AppDesign.Spacing.lg.rawValue)

                SettingsToggle(
                    title: "保存无补光原片",
                    isOn: settingsViewModel.saveOriginal
                ) {
                    settingsViewModel.toggleSaveOriginal()
                }

                Divider()
                    .padding(.leading, AppDesign.Spacing.lg.rawValue)

                SettingsToggle(
                    title: "手势调节亮度",
                    isOn: settingsViewModel.gestureBrightness
                ) {
                    settingsViewModel.toggleGestureBrightness()
                }

                Divider()
                    .padding(.leading, AppDesign.Spacing.lg.rawValue)

                SettingsToggle(
                    title: "触觉反馈",
                    isOn: settingsViewModel.hapticFeedback
                ) {
                    settingsViewModel.toggleHapticFeedback()
                }

                Divider()
                    .padding(.leading, AppDesign.Spacing.lg.rawValue)

                // 关于我们和评分反馈
                ForEach(0..<2) { index in
                    if index == 0 {
                        Button(action: { }) {
                            HStack {
                                Text("关于我们")
                                    .font(AppDesign.Typography.body)
                                    .foregroundColor(AppDesign.Colors.text)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14))
                                    .foregroundColor(AppDesign.Colors.text.opacity(0.5))
                            }
                            .padding(.horizontal, AppDesign.Spacing.md.rawValue)
                            .padding(.vertical, AppDesign.Spacing.md.rawValue)
                        }
                        .buttonStyle(PlainButtonStyle())
                    } else {
                        Button(action: { }) {
                            HStack {
                                Text("评分反馈")
                                    .font(AppDesign.Typography.body)
                                    .foregroundColor(AppDesign.Colors.text)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14))
                                    .foregroundColor(AppDesign.Colors.text.opacity(0.5))
                            }
                            .padding(.horizontal, AppDesign.Spacing.md.rawValue)
                            .padding(.vertical, AppDesign.Spacing.md.rawValue)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    if index < 1 {
                        Divider()
                            .padding(.leading, AppDesign.Spacing.lg.rawValue)
                    }
                }
            }
            .background(
                RoundedRectangle(cornerRadius: AppDesign.CornerRadius.lg.rawValue)
                    .fill(Color.white)
                    .shadow(color: Color.black.opacity(0.15), radius: 20, x: 0, y: 5)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppDesign.CornerRadius.lg.rawValue)
                    .stroke(Color.white, lineWidth: 1)
            )
            .padding(.horizontal, AppDesign.Spacing.lg.rawValue)
        }
    }

    // MARK: - Animation Methods

    private func presentMenu() {
        withAnimation(AppDesign.AnimationCurve.spring) {
            opacity = 1
            scale = 1
        }
    }

    private func dismissMenu() {
        withAnimation(AppDesign.AnimationCurve.easeOut) {
            opacity = 0
            scale = 0.8
        }

        // 直接设置状态隐藏设置菜单
        SettingsState.shared.isSettingsMenuVisible = false

        // 延迟后让 MainView 移除这个视图
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            // 这里什么都不做，MainView 会根据 settingsState.isSettingsMenuVisible 自动移除视图
        }
    }
}

// MARK: - MenuRow

struct MenuRow: View {
    let title: String
    private let action: () -> Void
    let showArrow: Bool

    init(showArrow: Bool = false, title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
        self.showArrow = showArrow
    }

    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(AppDesign.Typography.body)
                    .foregroundColor(AppDesign.Colors.text)

                Spacer()

                if showArrow {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                        .foregroundColor(AppDesign.Colors.text.opacity(0.5))
                }
            }
            .padding(.horizontal, AppDesign.Spacing.md.rawValue)
            .padding(.vertical, AppDesign.Spacing.md.rawValue)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Preview

struct SettingsMenu_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            AppDesign.Colors.background

            SettingsMenu()
                .environmentObject(SettingsViewModel())
        }
        .onAppear {
            SettingsState.shared.isSettingsMenuVisible = true
        }
    }
}
