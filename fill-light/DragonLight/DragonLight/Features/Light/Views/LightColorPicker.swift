//
//  LightColorPicker.swift
//  DragonLight
//
//  补光颜色选择器 - 8种国潮色盘网格
//

import SwiftUI

struct LightColorPicker: View {
    // MARK: - Properties

    @EnvironmentObject private var viewModel: LightViewModel

    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    // MARK: - Body

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            // 标题
            Text("补光色")
                .font(AppDesign.Typography.headline)
                .foregroundColor(AppDesign.Colors.text)

            // 颜色网格
            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(viewModel.allColors) { color in
                    ColorGridCell(
                        color: color,
                        isSelected: viewModel.selectedColor.id == color.id
                    ) {
                        viewModel.selectColor(color)
                    }
                }
            }
        }
        .padding(.horizontal, 12)
    }
}

// MARK: - Preview

struct LightColorPicker_Previews: PreviewProvider {
    static var previews: some View {
        LightColorPicker()
            .environmentObject(LightViewModel())
            .background(AppDesign.Colors.background)
    }
}
