//
//  MainView.swift
//  DragonLight
//
//  主界面视图
//

import SwiftUI

struct MainView: View {
    // MARK: - Properties

    @EnvironmentObject private var lightViewModel: LightViewModel
    @EnvironmentObject private var cameraViewModel: CameraViewModel
    @EnvironmentObject private var settingsViewModel: SettingsViewModel

    @State private var showSettingsMenu = false
    @State private var showFlash = false

    // MARK: - Body

    var body: some View {
        ZStack {
            // 背景颜色（补光效果）
            backgroundView

            // 主内容
            mainContent

            // 拍照闪光效果
            if showFlash {
                flashView
            }

            // 设置菜单
            settingsMenuOverlay
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

            Spacer()

            // 中间区域 - 奶龙
            dragonSection

            Spacer()

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
                .padding(.top, AppDesign.Spacing.md.rawValue)
        }
    }

    private var dragonSection: some View {
        ZStack {
            // 相机预览（背景）
            CameraPreviewView()
                .frame(height: 300)
                .cornerRadius(AppDesign.CornerRadius.lg.rawValue)
                .padding(.horizontal, AppDesign.Spacing.lg.rawValue)
                .opacity(0.3)

            // 奶龙
            DragonView()
                .frame(height: 300)
        }
    }

    private var controlsSection: some View {
        VStack(spacing: AppDesign.Spacing.lg.rawValue) {
            // 亮度滑块
            BrightnessSlider()

            // 颜色选择器
            LightColorPicker()

            // 拍照按钮区域
            cameraControls

            // 底部间距
            Spacer()
                .frame(height: AppDesign.Spacing.xl.rawValue)
        }
        .padding(.bottom, AppDesign.Spacing.lg.rawValue)
    }

    private var cameraControls: some View {
        VStack(spacing: AppDesign.Spacing.md.rawValue) {
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
        SettingsMenu(isPresented: $showSettingsMenu)
            .environmentObject(settingsViewModel)
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
