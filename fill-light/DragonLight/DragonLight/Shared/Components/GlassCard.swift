//
//  GlassCard.swift
//  DragonLight
//
//  毛玻璃卡片组件
//

import SwiftUI

struct GlassCard<Content: View>: View {
    // MARK: - Properties

    let content: Content

    // MARK: - Initialization

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    // MARK: - Body

    var body: some View {
        ZStack {
            // 背景模糊效果
            Rectangle()
                .fill(Color.white.opacity(0.8))
                .background(
                    // 模糊效果
                    Rectangle()
                        .fill(Material.ultraThinMaterial)
                        .blur(radius: 20)
                )

            // 内容
            content
        }
        .cornerRadius(AppDesign.CornerRadius.lg.rawValue)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
    }
}

// MARK: - Preview

struct GlassCard_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            AppDesign.Colors.background

            GlassCard {
                VStack(spacing: 12) {
                    Text("毛玻璃卡片")
                        .font(AppDesign.Typography.headline)

                    Text("这是一个半透明的毛玻璃效果卡片")
                        .font(AppDesign.Typography.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
            }
            .frame(width: 200, height: 100)
        }
    }
}
