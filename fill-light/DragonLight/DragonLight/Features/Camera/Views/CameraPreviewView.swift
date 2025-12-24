//
//  CameraPreviewView.swift
//  DragonLight
//
//  相机预览视图 - UIViewRepresentable 包装 AVCaptureVideoPreviewLayer
//

import SwiftUI
import AVFoundation

struct CameraPreviewView: UIViewRepresentable {
    // MARK: - Properties

    @EnvironmentObject private var viewModel: CameraViewModel

    // MARK: - UIViewRepresentable

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = UIColor.black

        let previewLayer = viewModel.getPreviewLayer()
        previewLayer.frame = view.bounds
        view.layer.addSublayer(previewLayer)

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if let previewLayer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
            previewLayer.frame = uiView.bounds
        }
    }
}

// MARK: - Preview

struct CameraPreviewView_Previews: PreviewProvider {
    static var previews: some View {
        CameraPreviewView()
            .environmentObject(CameraViewModel())
            .frame(height: 400)
    }
}
