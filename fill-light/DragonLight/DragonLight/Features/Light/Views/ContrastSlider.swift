//
//  ContrastSlider.swift
//  DragonLight
//
//  对比度滑块组件
//

import SwiftUI

struct ContrastSlider: View {
    // MARK: - Properties

    @EnvironmentObject private var viewModel: LightViewModel

    @State private var isDragging = false
    @State private var dragOffset: CGFloat = 0

    // MARK: - Body

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            // 标题和数值
            HStack {
                Text("对比度")
                    .font(AppDesign.Typography.headline)
                    .foregroundColor(AppDesign.Colors.text)

                Spacer()

                Text("\(Int(viewModel.contrast * 100))%")
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

                    // 进度条 - 从中心开始计算
                    HStack(spacing: 0) {
                        // 左侧（低于1.0的部分）
                        if viewModel.contrast < 1.0 {
                            RoundedRectangle(cornerRadius: AppDesign.CornerRadius.sm.rawValue)
                                .fill(AppDesign.Colors.primary.opacity(0.6))
                                .frame(width: geometry.size.width * (1.0 - viewModel.contrast) / 2, height: 8)
                        }
                        // 中间点
                        RoundedRectangle(cornerRadius: AppDesign.CornerRadius.sm.rawValue)
                            .fill(AppDesign.Colors.primary)
                            .frame(width: 2, height: 8)
                        // 右侧（高于1.0的部分）
                        if viewModel.contrast > 1.0 {
                            RoundedRectangle(cornerRadius: AppDesign.CornerRadius.sm.rawValue)
                                .fill(AppDesign.Colors.primary)
                                .frame(width: geometry.size.width * (viewModel.contrast - 1.0) / 2, height: 8)
                        }
                    }
                    .frame(width: geometry.size.width, alignment: .center)

                    // 滑块按钮
                    Circle()
                        .fill(Color.white)
                        .frame(width: isDragging ? 28 : 24, height: isDragging ? 28 : 24)
                        .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
                        .offset(x: sliderOffset(for: geometry.size.width))
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    isDragging = true
                                    let newValue = min(1, max(0, (value.location.x / geometry.size.width)))
                                    let newContrast = newValue * 1.0 + 0.5
                                    viewModel.setContrast(newContrast)
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

    // MARK: - Helper Methods

    private func sliderOffset(for width: CGFloat) -> CGFloat {
        // 将 0.5-1.5 的范围映射到 0-width
        let normalizedValue = (viewModel.contrast - 0.5) / 1.0
        return max(0, width * normalizedValue) - (isDragging ? 14 : 12)
    }
}

// MARK: - Preview

struct ContrastSlider_Previews: PreviewProvider {
    static var previews: some View {
        ContrastSlider()
            .environmentObject(LightViewModel())
            .background(AppDesign.Colors.background)
            .previewDisplayName("对比度滑块")
    }
}
