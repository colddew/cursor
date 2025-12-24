//
//  CameraViewModel.swift
//  DragonLight
//
//  相机模块 ViewModel
//

import SwiftUI
import Combine
import AVFoundation

/// 相机 ViewModel
class CameraViewModel: ObservableObject {
    // MARK: - Published Properties

    /// 会话是否正在运行
    @Published var isSessionRunning: Bool = false

    /// 当前相机位置
    @Published var cameraPosition: AVCaptureDevice.Position = .back

    /// 是否正在处理照片
    @Published var isProcessingPhoto: Bool = false

    /// 最后拍摄的照片
    @Published var lastCapturedPhoto: UIImage?

    /// 相机权限状态
    @Published var cameraPermissionStatus: AVAuthorizationStatus = .notDetermined

    // MARK: - Properties

    private let cameraService = CameraService.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    init() {
        // 绑定相机服务状态
        cameraService.$isSessionRunning
            .assign(to: &$isSessionRunning)

        cameraService.$cameraPosition
            .assign(to: &$cameraPosition)

        cameraService.$isProcessingPhoto
            .assign(to: &$isProcessingPhoto)

        cameraService.$lastCapturedPhoto
            .assign(to: &$lastCapturedPhoto)

        // 检查相机权限
        checkCameraPermission()
    }

    // MARK: - Permission

    /// 检查相机权限
    func checkCameraPermission() {
        cameraPermissionStatus = AVCaptureDevice.authorizationStatus(for: .video)
    }

    /// 请求相机权限
    func requestCameraPermission() {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                self?.cameraPermissionStatus = granted ? .authorized : .denied
                if granted {
                    self?.startSession()
                }
            }
        }
    }

    // MARK: - Session Control

    /// 启动相机会话
    func startSession() {
        guard cameraPermissionStatus == .authorized else {
            requestCameraPermission()
            return
        }
        cameraService.startSession()
    }

    /// 停止相机会话
    func stopSession() {
        cameraService.stopSession()
    }

    // MARK: - Camera Switch

    /// 切换相机
    func switchCamera() {
        cameraService.switchCamera()

        // 触觉反馈
        if SettingsService.shared.hapticFeedback {
            HapticService.shared.lightImpact()
        }
    }

    // MARK: - Photo Capture

    /// 拍照
    func takePhoto() {
        guard !isProcessingPhoto else { return }

        cameraService.takePhoto { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let image):
                    self?.lastCapturedPhoto = image

                    // 保存照片
                    if SettingsService.shared.saveOriginal {
                        self?.savePhoto(image)
                    }

                    // 触觉反馈
                    if SettingsService.shared.hapticFeedback {
                        HapticService.shared.mediumImpact()
                    }

                case .failure(let error):
                    print("拍照失败: \(error.localizedDescription)")

                    // 错误反馈
                    if SettingsService.shared.hapticFeedback {
                        HapticService.shared.error()
                    }
                }
            }
        }
    }

    /// 保存照片到相册
    private func savePhoto(_ image: UIImage) {
        PhotoService.shared.saveImage(image) { result in
            switch result {
            case .success:
                print("照片保存成功")
                if SettingsService.shared.hapticFeedback {
                    HapticService.shared.success()
                }
            case .failure(let error):
                print("照片保存失败: \(error.localizedDescription)")
                if SettingsService.shared.hapticFeedback {
                    HapticService.shared.error()
                }
            }
        }
    }

    // MARK: - Preview Layer

    /// 获取预览图层
    func getPreviewLayer() -> AVCaptureVideoPreviewLayer {
        return cameraService.getPreviewLayer()
    }

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

    /// 是否可以拍照
    var canTakePhoto: Bool {
        isSessionRunning && !isProcessingPhoto
    }
}
