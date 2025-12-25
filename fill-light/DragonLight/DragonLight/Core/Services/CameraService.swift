//
//  CameraService.swift
//  DragonLight
//
//  相机服务 - AVFoundation 封装
//

import AVFoundation
import UIKit
import Combine

/// 相机服务（单例）
class CameraService: NSObject, ObservableObject {
    // MARK: - Singleton

    static let shared = CameraService()

    private override init() {
        super.init()
        setupCamera()
    }

    // MARK: - Published Properties

    @Published var isSessionRunning: Bool = false
    @Published var cameraPosition: AVCaptureDevice.Position = .back
    @Published var isProcessingPhoto: Bool = false
    @Published var lastCapturedPhoto: UIImage?

    // MARK: - Properties

    private let captureSession = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "com.dragonlight.camera.session")
    private var videoDeviceInput: AVCaptureDeviceInput?
    private let photoOutput = AVCapturePhotoOutput()
    private var videoDeviceOutput: AVCaptureVideoDataOutput?

    private var photoCaptureCompletion: ((Result<UIImage, Error>) -> Void)?

    // MARK: - Setup

    private func setupCamera() {
        sessionQueue.async { [weak self] in
            self?.configureSession()
        }
    }

    private func configureSession() {
        captureSession.beginConfiguration()

        // 设置会话预设
        captureSession.sessionPreset = .photo

        // 添加视频输入
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let videoDeviceInput = try? AVCaptureDeviceInput(device: videoDevice) else {
            captureSession.commitConfiguration()
            return
        }

        if captureSession.canAddInput(videoDeviceInput) {
            captureSession.addInput(videoDeviceInput)
            self.videoDeviceInput = videoDeviceInput
            self.cameraPosition = .back
        }

        // 添加照片输出
        if captureSession.canAddOutput(photoOutput) {
            captureSession.addOutput(photoOutput)
            // iOS 16+ 移除弃用的 API，默认使用最大分辨率
            if #available(iOS 16.0, *) {
                // maxPhotoQualityPrioritization 在 iOS 16+ 中默认为 balanced
                photoOutput.maxPhotoQualityPrioritization = .quality
            } else {
                photoOutput.isHighResolutionCaptureEnabled = true
            }
        }

        captureSession.commitConfiguration()
    }

    // MARK: - Session Control

    /// 启动会话
    func startSession() {
        sessionQueue.async { [weak self] in
            if !(self?.captureSession.isRunning ?? false) {
                self?.captureSession.startRunning()
                DispatchQueue.main.async {
                    self?.isSessionRunning = true
                }
            }
        }
    }

    /// 停止会话
    func stopSession() {
        sessionQueue.async { [weak self] in
            if self?.captureSession.isRunning ?? false {
                self?.captureSession.stopRunning()
                DispatchQueue.main.async {
                    self?.isSessionRunning = false
                }
            }
        }
    }

    // MARK: - Camera Switch

    /// 切换相机
    func switchCamera() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            // 检查会话是否正在运行
            guard self.captureSession.isRunning else {
                print("相机会话未运行，无法切换")
                return
            }

            self.captureSession.beginConfiguration()

            // 移除当前输入
            if let currentInput = self.videoDeviceInput {
                self.captureSession.removeInput(currentInput)
            }

            // 切换位置
            let newPosition: AVCaptureDevice.Position = self.cameraPosition == .back ? .front : .back

            // 获取新设备
            guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: newPosition),
                  let videoDeviceInput = try? AVCaptureDeviceInput(device: videoDevice) else {
                self.captureSession.commitConfiguration()
                print("无法获取相机设备: \(newPosition)")
                return
            }

            // 添加新输入
            if self.captureSession.canAddInput(videoDeviceInput) {
                self.captureSession.addInput(videoDeviceInput)
                self.videoDeviceInput = videoDeviceInput

                DispatchQueue.main.async {
                    self.cameraPosition = newPosition
                }
            }

            self.captureSession.commitConfiguration()
        }
    }

    // MARK: - Photo Capture

    /// 拍照
    func takePhoto(completion: @escaping (Result<UIImage, Error>) -> Void) {
        photoCaptureCompletion = completion

        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            // 检查会话是否正在运行
            guard self.captureSession.isRunning else {
                DispatchQueue.main.async {
                    completion(.failure(CameraError.deviceNotAvailable))
                }
                return
            }

            // 检查是否有视频输入
            guard self.videoDeviceInput != nil else {
                DispatchQueue.main.async {
                    completion(.failure(CameraError.deviceNotAvailable))
                }
                return
            }

            let settings = AVCapturePhotoSettings()

            if self.videoDeviceInput?.device.isFlashAvailable == true {
                settings.flashMode = .off
            }

            // iOS 16+ 已弃用 isHighResolutionPhotoEnabled，使用 maxPhotoDimensions
            if #available(iOS 16.0, *) {
                // maxPhotoDimensions 已在 configureSession 中设置
            } else {
                settings.isHighResolutionPhotoEnabled = true
            }

            self.photoOutput.capturePhoto(with: settings, delegate: self)

            DispatchQueue.main.async {
                self.isProcessingPhoto = true
            }
        }
    }

    // MARK: - Preview Layer

    /// 获取预览图层
    func getPreviewLayer() -> AVCaptureVideoPreviewLayer {
        let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.videoGravity = .resizeAspectFill
        return previewLayer
    }
}

// MARK: - AVCapturePhotoCaptureDelegate

extension CameraService: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error = error {
            DispatchQueue.main.async { [weak self] in
                self?.isProcessingPhoto = false
                self?.photoCaptureCompletion?(.failure(error))
            }
            return
        }

        guard let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            DispatchQueue.main.async { [weak self] in
                self?.isProcessingPhoto = false
                self?.photoCaptureCompletion?(.failure(CameraError.photoProcessingFailed))
            }
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.isProcessingPhoto = false
            self?.lastCapturedPhoto = image
            self?.photoCaptureCompletion?(.success(image))
        }
    }
}

// MARK: - CameraError

enum CameraError: LocalizedError {
    case deviceNotAvailable
    case photoProcessingFailed
    case permissionDenied

    var errorDescription: String? {
        switch self {
        case .deviceNotAvailable:
            return "相机设备不可用"
        case .photoProcessingFailed:
            return "照片处理失败"
        case .permissionDenied:
            return "相机权限被拒绝"
        }
    }
}
