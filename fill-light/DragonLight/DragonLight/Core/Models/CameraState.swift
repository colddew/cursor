//
//  CameraState.swift
//  DragonLight
//
//  相机状态模型
//

import Foundation
import AVFoundation

/// 相机状态模型
struct CameraState {
    // MARK: - Properties

    /// 相机是否正在运行
    var isSessionRunning: Bool = false

    /// 当前相机位置
    var cameraPosition: AVCaptureDevice.Position = .back

    /// 是否正在处理照片
    var isProcessingPhoto: Bool = false

    /// 闪光灯状态
    var flashMode: AVCaptureDevice.FlashMode = .off

    // MARK: - Computed Properties

    /// 相机位置描述
    var positionDescription: String {
        switch cameraPosition {
        case .front:
            return "前置"
        case .back:
            return "后置"
        case .unspecified:
            return "未知"
        @unknown default:
            return "未知"
        }
    }

    // MARK: - Methods

    /// 切换相机位置
    mutating func togglePosition() {
        cameraPosition = cameraPosition == .back ? .front : .back
    }

    /// 更新会话状态
    mutating func updateSessionRunning(_ isRunning: Bool) {
        isSessionRunning = isRunning
    }

    /// 更新照片处理状态
    mutating func updateProcessingPhoto(_ isProcessing: Bool) {
        isProcessingPhoto = isProcessing
    }
}
