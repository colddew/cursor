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
            if SettingsService.shared.hapticFeedback {
                HapticService.shared.lightImpact()
            }
        }) {
            HStack(spacing: 8) {
                // 相机图标
                Image(systemName: "camera.rotate")
                    .font(.system(size: 15, weight: .medium))
                    .rotationEffect(.degrees(isRotating ? 180 : 0))

                // 文字
                Text("切换镜头")
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.black.opacity(0.6))
            .cornerRadius(16)
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Private Methods

    private func triggerRotationAnimation() {
        withAnimation(.easeInOut(duration: 0.4)) {
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
                .environmentObject(CameraViewModel())
        }
    }
}
