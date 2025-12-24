//
//  CaptureButton.swift
//  DragonLight
//
//  拍照按钮组件
//

import SwiftUI

struct CaptureButton: View {
    // MARK: - Properties

    @EnvironmentObject private var viewModel: CameraViewModel
    let onTap: () -> Void

    @State private var isPressed = false

    // MARK: - Body

    var body: some View {
        Button(action: {
            onTap()
            triggerTapAnimation()
        }) {
            ZStack {
                // 外圈
                Circle()
                    .stroke(Color.white, lineWidth: 4)
                    .frame(width: 80, height: 80)

                // 内圈
                Circle()
                    .fill(viewModel.isProcessingPhoto ? Color.gray : Color.white)
                    .frame(width: isPressed ? 58 : 64, height: isPressed ? 58 : 64)
            }
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(!viewModel.canTakePhoto)
        .opacity(viewModel.canTakePhoto ? 1.0 : 0.6)
    }

    // MARK: - Private Methods

    private func triggerTapAnimation() {
        withAnimation(.spring(response: 0.15)) {
            isPressed = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.spring(response: 0.15)) {
                isPressed = false
            }
        }
    }
}

// MARK: - Preview

struct CaptureButton_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.black
            CaptureButton {
                print("拍照")
            }
        }
    }
}
