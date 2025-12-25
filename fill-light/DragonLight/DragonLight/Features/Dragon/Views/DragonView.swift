//
//  DragonView.swift
//  DragonLight
//
//  奶龙角色 - 卡通可爱版
//

import SwiftUI

struct DragonView: View {
    // MARK: - Properties

    @StateObject private var dragonState = DragonState()
    @EnvironmentObject private var lightViewModel: LightViewModel
    @EnvironmentObject private var settingsState: SettingsState

    @State private var showSettings = false
    @State private var isFirstAppear = true

    // MARK: - Body

    var body: some View {
        ZStack {
            // 发光效果
            if let glowColor = dragonState.glowColor {
                Circle()
                    .fill(glowColor.opacity(0.4))
                    .frame(width: 280, height: 280)
                    .blur(radius: 70)
            }

            // 阴影
            Ellipse()
                .fill(Color.black.opacity(0.06))
                .frame(width: 160, height: 25)
                .blur(radius: 12)
                .offset(y: 75)

            // 身体
            bodyView

            // 肚子
            bellyView

            // 脸部
            faceView

            // 手脚
            limbsView

            // 龙角
            hornsView

            // 尾巴
            tailView

            // 灯笼
            lanternView
                .offset(x: 70, y: -45)
                .zIndex(100)
        }
        .onAppear {
            if isFirstAppear {
                triggerFirstAppearanceAnimation()
                isFirstAppear = false
            }
        }
        .onChange(of: lightViewModel.selectedColor) { newColor in
            dragonState.updateGlowColor(newColor.color)
        }
    }

    // MARK: - Views

    // 身体 - 圆润饱满
    private var bodyView: some View {
        ZStack {
            // 主体 - 圆形
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color(hex: "FFFAF0"),
                            AppDesign.Colors.dragonBody,
                            Color(hex: "FFE8D0")
                        ],
                        center: UnitPoint(x: 0.3, y: 0.3),
                        startRadius: 20,
                        endRadius: 80
                    )
                )
                .frame(width: 160, height: 160)
                .shadow(color: Color.black.opacity(0.08), radius: 15, x: 0, y: 8)

            // 高光
            Circle()
                .fill(Color.white.opacity(0.6))
                .frame(width: 60, height: 60)
                .offset(x: -35, y: -35)
                .blur(radius: 20)
        }
        .scaleEffect(dragonState.isThumbsUp ? 1.05 : 1.0)
        .offset(y: dragonState.isJumping ? -30 : 0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: dragonState.isThumbsUp)
        .animation(.spring(response: 0.4), value: dragonState.isJumping)
    }

    // 肚子 - 心形
    private var bellyView: some View {
        VStack {
            Spacer().frame(height: 70)

            // 心形肚子
            Image(systemName: "heart.fill")
                .font(.system(size: 50))
                .foregroundColor(Color(hex: "FFFAEB").opacity(0.6))
                .offset(y: 10)
        }
        .offset(y: dragonState.isJumping ? -30 : 0)
    }

    // 脸部
    private var faceView: some View {
        VStack(spacing: 6) {
            Spacer().frame(height: 30)

            // 眼睛
            HStack(spacing: 45) {
                eyeView
                eyeView
            }

            // 腮红
            HStack(spacing: 70) {
                Ellipse()
                    .fill(AppDesign.Colors.dragonBlush.opacity(0.35))
                    .frame(width: 30, height: 22)
                Ellipse()
                    .fill(AppDesign.Colors.dragonBlush.opacity(0.35))
                    .frame(width: 30, height: 22)
            }

            // 鼻子和嘴巴
            noseAndMouthView
        }
        .offset(y: dragonState.isJumping ? -30 : 0)
    }

    // 眼睛 - 超大卡通眼
    private var eyeView: some View {
        ZStack {
            // 眼白 - 大大的圆形
            Circle()
                .fill(Color.white)
                .frame(width: 42, height: dragonState.isBlinking ? 4 : 46)
                .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)

            if !dragonState.isBlinking {
                // 眼珠 - 大大的深色圆
                Circle()
                    .fill(AppDesign.Colors.dragonEye)
                    .frame(width: 26, height: 26)
                    .offset(x: 2, y: 2)

                // 主高光
                Circle()
                    .fill(Color.white)
                    .frame(width: 12, height: 12)
                    .offset(x: 6, y: -6)

                // 副高光
                Circle()
                    .fill(Color.white.opacity(0.7))
                    .frame(width: 6, height: 6)
                    .offset(x: -5, y: 5)
            }
        }
        .animation(.easeOut(duration: 0.05), value: dragonState.isBlinking)
    }

    // 鼻子和嘴巴
    private var noseAndMouthView: some View {
        VStack(spacing: 4) {
            // 鼻子 - 小小的
            HStack(spacing: 10) {
                Circle()
                    .fill(AppDesign.Colors.dragonBlush.opacity(0.5))
                    .frame(width: 9, height: 9)
                Circle()
                    .fill(AppDesign.Colors.dragonBlush.opacity(0.5))
                    .frame(width: 9, height: 9)
            }

            // 嘴巴 - 微笑
            Ellipse()
                .fill(AppDesign.Colors.dragonBlush.opacity(0.3))
                .frame(width: 28, height: 14)
                .offset(y: dragonState.isThumbsUp ? 4 : 0)
        }
    }

    // 手脚 - 小短手小短脚
    private var limbsView: some View {
        ZStack {
            // 左手 - 小圆手
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "FFF9E7"), AppDesign.Colors.dragonBody],
                        center: UnitPoint(x: 0.3, y: 0.3),
                        startRadius: 5,
                        endRadius: 15
                    )
                )
                .frame(width: 28, height: 32)
                .shadow(color: Color.black.opacity(0.06), radius: 4, x: 0, y: 2)
                .offset(x: -70, y: 15)
                .rotationEffect(.degrees(-25))

            // 右手 - 提灯笼
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "FFFAF0"), AppDesign.Colors.dragonBody],
                        center: UnitPoint(x: 0.3, y: 0.3),
                        startRadius: 5,
                        endRadius: 15
                    )
                )
                .frame(width: 30, height: 34)
                .shadow(color: Color.black.opacity(0.08), radius: 5, x: 1, y: 2)
                .offset(x: 70, y: 5)
                .rotationEffect(.degrees(20))

            // 左脚 - 小圆脚
            Ellipse()
                .fill(AppDesign.Colors.dragonBody)
                .frame(width: 35, height: 25)
                .shadow(color: Color.black.opacity(0.06), radius: 4, x: 0, y: 2)
                .offset(x: -35, y: 75)

            // 右脚 - 小圆脚
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "FFF9E7"), AppDesign.Colors.dragonBody],
                        center: UnitPoint(x: 0.4, y: 0.2),
                        startRadius: 5,
                        endRadius: 15
                    )
                )
                .frame(width: 35, height: 25)
                .shadow(color: Color.black.opacity(0.06), radius: 4, x: 0, y: 2)
                .offset(x: 35, y: 75)
        }
        .offset(y: dragonState.isJumping ? -30 : 0)
    }

    // 龙角 - 可爱的小角
    private var hornsView: some View {
        HStack(spacing: 95) {
            cuteHorn.rotationEffect(.degrees(-20)).offset(x: -20, y: -95)
            cuteHorn.rotationEffect(.degrees(20)).offset(x: 20, y: -95)
        }
        .offset(y: dragonState.isJumping ? -30 : 0)
    }

    private var cuteHorn: some View {
        ZStack {
            // 小角 - 更圆润
            Ellipse()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "FFE066"), AppDesign.Colors.gold],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: 16, height: 30)

            // 高光
            Ellipse()
                .fill(Color.white.opacity(0.6))
                .frame(width: 6, height: 15)
                .offset(y: -5)
        }
        .shadow(color: Color.black.opacity(0.08), radius: 3, x: 0, y: 1)
    }

    // 尾巴 - 小小的圆尾巴
    private var tailView: some View {
        ZStack {
            Circle()
                .fill(AppDesign.Colors.dragonBody)
                .frame(width: 35, height: 35)
                .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 1)
                .offset(x: -75, y: 60)

            // 尾巴尖端高光
            Circle()
                .fill(Color.white.opacity(0.4))
                .frame(width: 15, height: 15)
                .offset(x: -80, y: 55)
        }
    }

    private var lanternView: some View {
        LanternView(showSettings: $showSettings)
            .environmentObject(dragonState)
            .environmentObject(settingsState)
    }

    // MARK: - Methods

    private func triggerFirstAppearanceAnimation() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            NotificationCenter.default.post(name: .lanternFirstAppear, object: nil)
        }
    }

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
