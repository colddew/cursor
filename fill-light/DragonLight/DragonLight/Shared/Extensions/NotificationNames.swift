//
//  NotificationNames.swift
//  DragonLight
//
//  统一的通知名称定义和状态管理
//

import Foundation
import SwiftUI

// MARK: - SettingsState

/// 设置菜单状态管理器（单例）
class SettingsState: ObservableObject {
    static let shared = SettingsState()

    @Published var isSettingsMenuVisible: Bool = false

    private init() {}
}

// MARK: - Notification Names

extension Notification.Name {
    /// 显示设置菜单
    static let showSettings = Notification.Name("showSettings")

    /// 隐藏设置菜单
    static let hideSettings = Notification.Name("hideSettings")

    /// 灯笼首次出现动画
    static let lanternFirstAppear = Notification.Name("lanternFirstAppear")

    /// 拍照完成
    static let photoCaptured = Notification.Name("photoCaptured")
}
