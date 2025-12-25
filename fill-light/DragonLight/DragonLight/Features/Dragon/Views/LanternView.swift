//
//  LanternView.swift
//  DragonLight
//
//  灯笼视图 - 奶龙提着的红灯笼
//

import SwiftUI
import Combine

struct LanternView: View {
    // MARK: - Properties

    @Binding var showSettings: Bool
    @EnvironmentObject var dragonState: DragonState
    @EnvironmentObject private var settingsState: SettingsState

    @State private var isGlowing = false
    @State private var shakeAngle: Double = 0
    @State private var shouldAnimate = false

    // MARK: - Body

    var body: some View {
        ZStack {
            // 发光光晕
            if isGlowing {
                glowHalo
            }

            // 灯笼主体
            lanternBody
                .rotationEffect(.degrees(shakeAngle))
                .onAppear {
                    startShakeAnimation()
                    setupFirstAppearAnimation()
                }

            // 红绳
            rope
        }
        .contentShape(Rectangle())
        .onTapGesture {
            tapLantern()
        }
    }

    // MARK: - Subviews

    private var lanternBody: some View {
        VStack(spacing: 4) {
            // 灯笼上盖
            Rectangle()
                .fill(AppDesign.Colors.gold)
                .frame(width: 44, height: 8)

            // 灯笼主体
            RoundedRectangle(cornerRadius: 20)
                .fill(AppDesign.Colors.lanternRed)
                .frame(width: 50, height: 50)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(AppDesign.Colors.gold, lineWidth: 2)
                )

            // 灯笼下底
            Rectangle()
                .fill(AppDesign.Colors.gold)
                .frame(width: 44, height: 8)

            // 流苏
            tassel
        }
    }

    private var tassel: some View {
        VStack(spacing: 2) {
            ForEach(0..<5) { _ in
                Rectangle()
                    .fill(AppDesign.Colors.gold)
                    .frame(width: 4, height: 12)
            }
        }
    }

    private var rope: some View {
        Rectangle()
            .fill(AppDesign.Colors.primary)
            .frame(width: 3, height: 30)
            .offset(y: -50)
    }

    private var glowHalo: some View {
        Circle()
            .fill(AppDesign.Colors.lanternRed.opacity(0.4))
            .frame(width: 80, height: 80)
            .blur(radius: 20)
    }

    // MARK: - Animation Methods

    private func startShakeAnimation() {
        withAnimation(
            Animation.easeInOut(duration: 2)
                .repeatForever(autoreverses: true)
        ) {
            shakeAngle = 3
        }
    }

    private func setupFirstAppearAnimation() {
        // 监听首次出现通知
        NotificationCenter.default.publisher(for: .lanternFirstAppear)
            .sink { _ in
                triggerBlinkAnimation()
            }
            .store(in: &cancellables)
    }

    private func triggerBlinkAnimation() {
        // 闪烁3次
        for i in 0..<3 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.5) {
                withAnimation(.easeOut(duration: 0.2)) {
                    isGlowing = true
                }

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                    withAnimation(.easeOut(duration: 0.2)) {
                        isGlowing = false
                    }
                }
            }
        }
    }

    private func tapLantern() {
        print("LanternView: 点击灯笼")

        // 发光动画
        withAnimation(.easeOut(duration: 0.2)) {
            isGlowing = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.easeOut(duration: 0.2)) {
                isGlowing = false
            }
        }

        // 奶龙眨眼
        dragonState.triggerTap()

        // 触觉反馈
        if SettingsService.shared.hapticFeedback {
            HapticService.shared.lightImpact()
        }

        // 直接设置状态显示设置菜单
        print("LanternView: 显示设置菜单")
        settingsState.isSettingsMenuVisible = true
    }

    // MARK: - Properties

    @State private var cancellables = Set<AnyCancellable>()
}

// MARK: - Preview

struct LanternView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.gray
            LanternView(showSettings: .constant(false))
                .environmentObject(DragonState())
        }
    }
}
