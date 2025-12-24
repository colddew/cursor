//
//  DragonView.swift
//  DragonLight
//
//  奶龙角色容器视图
//

import SwiftUI

struct DragonView: View {
    // MARK: - Properties

    @StateObject private var dragonState = DragonState()
    @EnvironmentObject private var lightViewModel: LightViewModel

    @State private var showSettings = false
    @State private var isFirstAppear = true

    // MARK: - Body

    var body: some View {
        ZStack {
            // 奶龙主体
            dragonBody
                .offset(y: dragonState.isJumping ? -30 : 0)

            // 灯笼
            lanternView
                .offset(x: 80, y: -20)
                .zIndex(1)

            // 发光效果
            if let glowColor = dragonState.glowColor {
                glowEffect(color: glowColor)
            }
        }
        .onAppear {
            // 首次出现时触发灯笼闪烁
            if isFirstAppear {
                triggerFirstAppearanceAnimation()
                isFirstAppear = false
            }
        }
        .onChange(of: lightViewModel.selectedColor) { newColor in
            dragonState.updateGlowColor(newColor.color)
        }
    }

    // MARK: - Subviews

    private var dragonBody: some View {
        ZStack {
            // 身体
            RoundedRectangle(cornerRadius: 60)
                .fill(AppDesign.Colors.dragonBody)
                .frame(width: 180, height: 160)
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)

            // 脸部
            dragonFace

            // 龙角
            dragonHorns
        }
        .scaleEffect(dragonState.isThumbsUp ? 1.1 : 1.0)
        .onTapGesture {
            dragonState.triggerTap()
            if SettingsService.shared.hapticFeedback {
                HapticService.shared.lightImpact()
            }
        }
    }

    private var dragonFace: some View {
        VStack(spacing: 20) {
            // 眼睛
            HStack(spacing: 40) {
                dragonEye
                dragonEye
            }

            // 腮红
            HStack(spacing: 60) {
                Circle()
                    .fill(AppDesign.Colors.dragonBlush.opacity(0.6))
                    .frame(width: 30, height: 20)

                Circle()
                    .fill(AppDesign.Colors.dragonBlush.opacity(0.6))
                    .frame(width: 30, height: 20)
            }

            // 嘴巴
            smile
        }
    }

    private var dragonEye: some View {
        ZStack {
            // 眼白
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white)
                .frame(width: 35, height: dragonState.isBlinking ? 4 : 40)

            if !dragonState.isBlinking {
                // 眼珠
                Circle()
                    .fill(AppDesign.Colors.dragonEye)
                    .frame(width: 22, height: 22)

                // 高光
                Circle()
                    .fill(Color.white)
                    .frame(width: 8, height: 8)
                    .offset(x: 5, y: -5)
            }
        }
        .animation(.linear(duration: 0.1), value: dragonState.isBlinking)
    }

    private var dragonHorns: some View {
        HStack(spacing: 100) {
            // 左角
            horn
                .rotationEffect(.degrees(-20))
                .offset(x: -20, y: -70)

            // 右角
            horn
                .rotationEffect(.degrees(20))
                .offset(x: 20, y: -70)
        }
    }

    private var horn: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(AppDesign.Colors.gold)
            .frame(width: 20, height: 40)
            .rotationEffect(.degrees(-15))
    }

    private var smile: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(AppDesign.Colors.dragonBlush.opacity(0.8))
            .frame(width: 40, height: 20)
            .offset(y: dragonState.isThumbsUp ? 10 : 0)
    }

    private var lanternView: some View {
        LanternView(showSettings: $showSettings)
            .environmentObject(dragonState)
    }

    private func glowEffect(color: Color) -> some View {
        Circle()
            .fill(color.opacity(dragonState.glowIntensity))
            .frame(width: 300, height: 300)
            .blur(radius: 60)
            .allowsHitTesting(false)
    }

    // MARK: - Methods

    private func triggerFirstAppearanceAnimation() {
        // 首次出现时灯笼闪烁3次
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            NotificationCenter.default.post(name: .lanternFirstAppear, object: nil)
        }
    }

    /// 触发拍照完成动画
    func triggerCaptureAnimation() {
        dragonState.triggerCapture()
    }
}

// MARK: - Preview

struct DragonView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            AppDesign.Colors.background
            DragonView()
                .environmentObject(LightViewModel())
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let lanternFirstAppear = Notification.Name("lanternFirstAppear")
    static let showSettings = Notification.Name("showSettings")
}
