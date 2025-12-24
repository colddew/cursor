//
//  SealView.swift
//  DragonLight
//
//  印章视图 - 繁体"龍"字印章
//

import SwiftUI

struct SealView: View {
    // MARK: - Properties

    @State private var isPressed = false

    // MARK: - Body

    var body: some View {
        Button(action: {
            tapSeal()
        }) {
            ZStack {
                // 圆形背景
                Circle()
                    .fill(AppDesign.Colors.sealRed.opacity(0.8))

                // 金色边框
                Circle()
                    .stroke(AppDesign.Colors.gold, lineWidth: 2)

                // 繁体"龍"字
                Text("龍")
                    .font(AppDesign.Typography.seal)
                    .foregroundColor(.white)
            }
            .frame(width: 44, height: 44)
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Methods

    private func tapSeal() {
        // 缩放动画
        withAnimation(.spring(response: 0.15)) {
            isPressed = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.spring(response: 0.15)) {
                isPressed = false
            }
        }

        // 触觉反馈
        if SettingsService.shared.hapticFeedback {
            HapticService.shared.lightImpact()
        }

        // 显示设置菜单
        NotificationCenter.default.post(name: .showSettings, object: nil)
    }
}

// MARK: - Preview

struct SealView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            AppDesign.Colors.background
            SealView()
        }
        .padding()
    }
}
