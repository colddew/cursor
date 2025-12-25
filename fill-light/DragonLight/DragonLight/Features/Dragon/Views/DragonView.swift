//
//  DragonView.swift
//  DragonLight
//
//  奶龙角色 - 使用 GIF 动画
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
                .frame(width: 200, height: 30)
                .blur(radius: 12)
                .offset(y: 60)

            // 奶龙 GIF 动画 - 放大显示
            GIFPlayerView(gifName: "dragon")
                .frame(width: 260, height: 260)
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
