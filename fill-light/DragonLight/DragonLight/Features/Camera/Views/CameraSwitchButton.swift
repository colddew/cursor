//
//  CameraSwitchButton.swift
//  DragonLight
//
//  相机切换按钮组件
//

import SwiftUI

struct CameraSwitchButton: View {
    // MARK: - Properties

    @EnvironmentObject private var viewModel: CameraViewModel

    @State private var isRotating = false

    // MARK: - Body

    var body: some View {
        Button(action: {
            viewModel.switchCamera()
            triggerRotationAnimation()
        }) {
            HStack(spacing: AppDesign.Spacing.sm.rawValue) {
                Image(systemName: "camera.rotate")
                    .font(.system(size: 16))
                    .rotationEffect(.degrees(isRotating ? 180 : 0))

                Text("前后摄像头切换")
                    .font(AppDesign.Typography.caption)
            }
            .foregroundColor(.white)
            .padding(.horizontal, AppDesign.Spacing.md.rawValue)
            .padding(.vertical, AppDesign.Spacing.sm.rawValue)
            .background(Color.black.opacity(0.6))
            .cornerRadius(AppDesign.CornerRadius.md.rawValue)
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Private Methods

    private func triggerRotationAnimation() {
        withAnimation(.easeInOut(duration: 0.3)) {
            isRotating.toggle()
        }
    }
}

// MARK: - Preview

struct CameraSwitchButton_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.gray
            CameraSwitchButton()
        }
    }
}
