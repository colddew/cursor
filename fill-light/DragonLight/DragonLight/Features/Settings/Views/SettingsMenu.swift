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
    @Binding var isPresented: Bool

    @State private var opacity: Double = 0
    @State private var scale: CGFloat = 0.8

    // MARK: - Body

    var body: some View {
        ZStack {
            // 背景遮罩
            if isPresented {
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .onTapGesture {
                        dismissMenu()
                    }
                    .opacity(opacity)
            }

            // 菜单内容
            VStack {
                Spacer()

                if isPresented {
                    menuContent
                        .scaleEffect(scale)
                        .opacity(opacity)
                }

                Spacer()
                    .frame(height: 200)
            }
            .ignoresSafeArea()
        }
        .onChange(of: isPresented) { newValue in
            if newValue {
                presentMenu()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .showSettings)) { _ in
            isPresented = true
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

                // 关于我们
                MenuRow(title: "关于我们", showArrow: true) {
                    // TODO: 导航到关于页面
                }

                Divider()
                    .padding(.leading, AppDesign.Spacing.lg.rawValue)

                // 评分反馈
                MenuRow(title: "评分反馈", showArrow: true) {
                    // TODO: 打开 App Store 评分
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

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            isPresented = false
            // 重置动画状态
            opacity = 0
            scale = 0.8
        }
    }
}

// MARK: - MenuRow

struct MenuRow: View {
    let title: String
    let showArrow: Bool
    let action: () -> Void

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

            SettingsMenu(isPresented: .constant(true))
                .environmentObject(SettingsViewModel())
        }
    }
}
