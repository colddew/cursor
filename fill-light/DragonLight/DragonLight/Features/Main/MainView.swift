//
//  MainView.swift
//  DragonLight
//
//  主界面视图
//

import SwiftUI
import Combine

struct MainView: View {
    // MARK: - Properties

    @EnvironmentObject private var lightViewModel: LightViewModel
    @EnvironmentObject private var cameraViewModel: CameraViewModel
    @EnvironmentObject private var settingsViewModel: SettingsViewModel
    @StateObject private var settingsState = SettingsState.shared

    @State private var showFlash = false
    @State private var showControls = true

    // MARK: - Body

    var body: some View {
        ZStack {
            // 背景颜色（补光效果）
            backgroundView

            // 主内容
            mainContent
                .environmentObject(settingsState)

            // 拍照闪光效果
            if showFlash {
                flashView
            }

            // 设置菜单
            if settingsState.isSettingsMenuVisible {
                settingsMenuOverlay
            }
        }
        .onAppear {
            cameraViewModel.startSession()
        }
        .onDisappear {
            cameraViewModel.stopSession()
        }
        .onChange(of: showFlash) { _ in
            if showFlash {
                hideFlashAfterDelay()
            }
        }
    }

    // MARK: - Subviews

    private var backgroundView: some View {
        lightViewModel.screenFillColor
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.3), value: lightViewModel.selectedColor)
    }

    private var mainContent: some View {
        VStack(spacing: 0) {
            // 顶部区域 - 印章
            topBar

            // 中间区域 - 奶龙
            dragonSection

            // 控制区域
            controlsSection
        }
        .ignoresSafeArea(.keyboard)
    }

    private var topBar: some View {
        HStack {
            Spacer()

            SealView()
                .padding(.trailing, AppDesign.Spacing.md.rawValue)
                .padding(.top, 8)
        }
    }

    private var dragonSection: some View {
        ZStack {
            // 奶龙
            DragonView()
        }
        .frame(height: 240)
        .padding(.bottom, 12)
    }

    private var controlsSection: some View {
        VStack(spacing: 0) {
            if showControls {
                VStack(spacing: 4) {
                    // 亮度滑块
                    BrightnessSlider()

                    // 对比度滑块
                    ContrastSlider()

                    // 颜色选择器
                    LightColorPicker()

                    // 拍照按钮区域
                    cameraControls

                    // 隐藏/显示按钮
                    toggleControlsButton
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 8)
            } else {
                // 收起时只显示按钮
                toggleControlsButton
                    .padding(.top, 6)
                    .padding(.bottom, 6)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showControls)
    }

    private var toggleControlsButton: some View {
        Button(action: {
            withAnimation(.easeInOut(duration: 0.3)) {
                showControls.toggle()
            }
            if SettingsService.shared.hapticFeedback {
                HapticService.shared.lightImpact()
            }
        }) {
            HStack(spacing: 8) {
                Image(systemName: showControls ? "chevron.up" : "chevron.down")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(AppDesign.Colors.text.opacity(0.6))

                Text(showControls ? "收起" : "展开")
                    .font(AppDesign.Typography.caption)
                    .foregroundColor(AppDesign.Colors.text.opacity(0.6))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(Color.white.opacity(0.9))
                    .shadow(color: Color.black.opacity(0.08), radius: 6, x: 0, y: 3)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .contentShape(Capsule())
        .zIndex(100)
        .simultaneousGesture(
            DragGesture()
                .onEnded { value in
                    if value.translation.height < -30 {
                        // 向上滑动 - 展开
                        if !showControls {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                showControls = true
                            }
                            if SettingsService.shared.hapticFeedback {
                                HapticService.shared.lightImpact()
                            }
                        }
                    } else if value.translation.height > 30 {
                        // 向下滑动 - 收起
                        if showControls {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                showControls = false
                            }
                            if SettingsService.shared.hapticFeedback {
                                HapticService.shared.lightImpact()
                            }
                        }
                    }
                }
        )
    }

    private var cameraControls: some View {
        VStack(spacing: 6) {
            // 拍照按钮
            CaptureButton {
                takePhoto()
            }

            // 相机切换按钮
            CameraSwitchButton()
        }
    }

    private var flashView: some View {
        Color.white
            .ignoresSafeArea()
            .opacity(showFlash ? 1 : 0)
    }

    private var settingsMenuOverlay: some View {
        ZStack {
            if settingsState.isSettingsMenuVisible {
                SettingsMenu()
                    .environmentObject(settingsViewModel)
            }
        }
    }

    // MARK: - Methods

    private func takePhoto() {
        guard cameraViewModel.canTakePhoto else { return }

        // 显示闪光效果
        withAnimation(.linear(duration: 0.1)) {
            showFlash = true
        }

        // 拍照
        cameraViewModel.takePhoto()

        // 触发奶龙比赞动画
        // TODO: 通过通知或状态传递给 DragonView
    }

    private func hideFlashAfterDelay() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.linear(duration: 0.1)) {
                showFlash = false
            }
        }
    }
}

// MARK: - Preview

struct MainView_Previews: PreviewProvider {
    static var previews: some View {
        MainView()
            .environmentObject(LightViewModel())
            .environmentObject(CameraViewModel())
            .environmentObject(SettingsViewModel())
            .previewDisplayName("奶龙补光灯")
    }
}
