//
//  DragonLightApp.swift
//  DragonLight
//
//  奶龙补光灯 - 国潮风补光灯应用
//

import SwiftUI

@main
struct DragonLightApp: App {
    // MARK: - Properties

    @StateObject private var lightViewModel = LightViewModel()
    @StateObject private var cameraViewModel = CameraViewModel()
    @StateObject private var settingsViewModel = SettingsViewModel()

    // MARK: - Body

    var body: some Scene {
        WindowGroup {
            MainView()
                .environmentObject(lightViewModel)
                .environmentObject(cameraViewModel)
                .environmentObject(settingsViewModel)
                .onAppear {
                    // 初始化设置
                    setupApp()
                }
        }
    }

    // MARK: - Private Methods

    private func setupApp() {
        // 加载保存的设置
        settingsViewModel.loadSettings()
        lightViewModel.loadSavedSettings()
    }
}
