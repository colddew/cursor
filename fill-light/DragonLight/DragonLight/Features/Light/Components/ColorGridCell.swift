//
//  ColorGridCell.swift
//  DragonLight
//
//  颜色格子组件
//

import SwiftUI

struct ColorGridCell: View {
    // MARK: - Properties

    let color: LightColor
    let isSelected: Bool
    let onTap: () -> Void

    @State private var isPressed = false

    // MARK: - Body

    var body: some View {
        Button(action: {
            onTap()
        }) {
            VStack(spacing: AppDesign.Spacing.xs.rawValue) {
                // 颜色圆圈
                ZStack {
                    Circle()
                        .fill(color.color)
                        .frame(width: 60, height: 60)

                    // 选中状态的高亮边框
                    if isSelected {
                        Circle()
                            .stroke(AppDesign.Colors.primary, lineWidth: 3)
                            .frame(width: 68, height: 68)
                    }

                    // 按下效果
                    if isPressed {
                        Circle()
                            .fill(Color.black.opacity(0.1))
                            .frame(width: 60, height: 60)
                    }
                }

                // 颜色名称
                Text(color.name)
                    .font(AppDesign.Typography.caption)
                    .foregroundColor(AppDesign.Colors.text)
            }
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
            withAnimation(.spring(response: 0.15)) {
                isPressed = pressing
            }
        }, perform: {})
    }
}

// MARK: - Preview

struct ColorGridCell_Previews: PreviewProvider {
    static var previews: some View {
        HStack(spacing: 20) {
            ColorGridCell(
                color: LightColor.allColors[0],
                isSelected: true,
                onTap: {}
            )

            ColorGridCell(
                color: LightColor.allColors[1],
                isSelected: false,
                onTap: {}
            )
        }
        .padding()
        .background(AppDesign.Colors.background)
    }
}
