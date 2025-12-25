//
//  BrightnessSlider.swift
//  DragonLight
//
//  亮度滑块组件
//

import SwiftUI

struct BrightnessSlider: View {
    // MARK: - Properties

    @EnvironmentObject private var viewModel: LightViewModel

    @State private var isDragging = false
    @State private var dragOffset: CGFloat = 0

    // MARK: - Body

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            // 标题和数值
            HStack {
                Text("亮度")
                    .font(AppDesign.Typography.headline)
                    .foregroundColor(AppDesign.Colors.text)

                Spacer()

                Text("\(Int(viewModel.brightness * 100))%")
                    .font(AppDesign.Typography.mono)
                    .foregroundColor(AppDesign.Colors.text)
            }

            // 滑块
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // 轨道背景
                    RoundedRectangle(cornerRadius: AppDesign.CornerRadius.sm.rawValue)
                        .fill(Color.black.opacity(0.1))
                        .frame(height: 8)

                    // 进度条
                    RoundedRectangle(cornerRadius: AppDesign.CornerRadius.sm.rawValue)
                        .fill(AppDesign.Colors.primary)
                        .frame(width: max(0, geometry.size.width * viewModel.brightness), height: 8)

                    // 滑块按钮
                    Circle()
                        .fill(Color.white)
                        .frame(width: isDragging ? 28 : 24, height: isDragging ? 28 : 24)
                        .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
                        .offset(x: max(0, geometry.size.width * viewModel.brightness) - (isDragging ? 14 : 12))
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    isDragging = true
                                    let newBrightness = min(1, max(0, value.location.x / geometry.size.width))
                                    viewModel.setBrightness(newBrightness)
                                }
                                .onEnded { _ in
                                    withAnimation(.spring(response: 0.2)) {
                                        isDragging = false
                                    }
                                }
                        )
                }
            }
            .frame(height: 40)
        }
    }
}

// MARK: - Preview

struct BrightnessSlider_Previews: PreviewProvider {
    static var previews: some View {
        BrightnessSlider()
            .environmentObject(LightViewModel())
            .background(AppDesign.Colors.background)
    }
}
