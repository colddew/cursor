//
//  PhotoService.swift
//  DragonLight
//
//  照片处理服务
//

import UIKit
import Photos

/// 照片处理服务（单例）
class PhotoService {
    // MARK: - Singleton

    static let shared = PhotoService()

    private init() {}

    // MARK: - Properties

    private var saveCompletion: ((Result<Bool, Error>) -> Void)?

    // MARK: - Public Methods

    /// 保存图片到相册
    func saveImage(_ image: UIImage, completion: @escaping (Result<Bool, Error>) -> Void) {
        saveCompletion = completion

        // 检查权限
        PHPhotoLibrary.requestAuthorization { status in
            switch status {
            case .authorized, .limited:
                self.performSave(image)
            case .denied, .restricted:
                DispatchQueue.main.async {
                    completion(.failure(PhotoError.accessDenied))
                }
            case .notDetermined:
                DispatchQueue.main.async {
                    completion(.failure(PhotoError.accessNotDetermined))
                }
            @unknown default:
                DispatchQueue.main.async {
                    completion(.failure(PhotoError.unknownError))
                }
            }
        }
    }

    // MARK: - Private Methods

    private func performSave(_ image: UIImage) {
        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.creationRequestForAsset(from: image)
        }) { [weak self] success, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.saveCompletion?(.failure(error))
                } else {
                    self?.saveCompletion?(.success(success))
                }
                self?.saveCompletion = nil
            }
        }
    }
}

// MARK: - PhotoError

enum PhotoError: LocalizedError {
    case accessDenied
    case accessNotDetermined
    case unknownError

    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "相册访问被拒绝，请在设置中开启权限"
        case .accessNotDetermined:
            return "相册访问权限未确定"
        case .unknownError:
            return "保存照片时发生未知错误"
        }
    }
}
