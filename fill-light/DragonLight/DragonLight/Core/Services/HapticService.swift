//
//  HapticService.swift
//  DragonLight
//
//  触觉反馈服务
//

import UIKit
import CoreHaptics

/// 触觉反馈服务（单例）
class HapticService {
    // MARK: - Singleton

    static let shared = HapticService()

    private init() {
        setupHaptics()
    }

    // MARK: - Properties

    private var impactLight: UIImpactFeedbackGenerator?
    private var impactMedium: UIImpactFeedbackGenerator?
    private var impactHeavy: UIImpactFeedbackGenerator?
    private var notification: UINotificationFeedbackGenerator?
    private var selection: UISelectionFeedbackGenerator?

    private var hapticEngine: CHHapticEngine?

    // MARK: - Setup

    private func setupHaptics() {
        // 预加载 Impact Feedback
        impactLight = UIImpactFeedbackGenerator(style: .light)
        impactMedium = UIImpactFeedbackGenerator(style: .medium)
        impactHeavy = UIImpactFeedbackGenerator(style: .heavy)

        // 预加载 Notification Feedback
        notification = UINotificationFeedbackGenerator()

        // 预加载 Selection Feedback
        selection = UISelectionFeedbackGenerator()

        // 准备触觉引擎
        impactLight?.prepare()
        impactMedium?.prepare()
        impactHeavy?.prepare()
        notification?.prepare()
        selection?.prepare()

        // 尝试创建 Core Haptics 引擎（iOS 13+）
        if #available(iOS 13.0, *) {
            do {
                hapticEngine = try CHHapticEngine()
                try hapticEngine?.start()
            } catch {
                print("Core Haptics 不可用: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Impact Feedback

    /// 轻触反馈
    func lightImpact() {
        impactLight?.impactOccurred()
    }

    /// 中等反馈
    func mediumImpact() {
        impactMedium?.impactOccurred()
    }

    /// 重反馈
    func heavyImpact() {
        impactHeavy?.impactOccurred()
    }

    // MARK: - Notification Feedback

    /// 成功反馈
    func success() {
        notification?.notificationOccurred(.success)
    }

    /// 警告反馈
    func warning() {
        notification?.notificationOccurred(.warning)
    }

    /// 错误反馈
    func error() {
        notification?.notificationOccurred(.error)
    }

    // MARK: - Selection Feedback

    /// 选择变化反馈
    func selectionChanged() {
        selection?.selectionChanged()
    }
}
