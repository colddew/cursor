//
//  DragonState.swift
//  DragonLight
//
//  奶龙角色状态模型
//

import SwiftUI
import Combine

/// 奶龙动画状态
enum DragonAnimationState {
    case idle
    case blinking
    case jumping
    case thumbsUp
    case glowing
}

/// 奶龙状态管理
class DragonState: ObservableObject {
    // MARK: - Published Properties

    /// 当前动画状态
    @Published var animationState: DragonAnimationState = .idle

    /// 是否正在眨眼
    @Published var isBlinking: Bool = false

    /// 是否正在跳跃
    @Published var isJumping: Bool = false

    /// 是否正在比赞
    @Published var isThumbsUp: Bool = false

    /// 当前发光颜色
    @Published var glowColor: Color? = nil

    /// 发光强度
    @Published var glowIntensity: Double = 0.0

    // MARK: - Animation Methods

    /// 触发点击动画（眨眼 + 小跳）
    func triggerTap() {
        guard !isBlinking && !isJumping else { return }

        // 眨眼
        withAnimation(.linear(duration: 0.1)) {
            isBlinking = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.linear(duration: 0.1)) {
                self.isBlinking = false
            }
        }

        // 小跳
        withAnimation(AppDesign.AnimationCurve.softSpring) {
            isJumping = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(AppDesign.AnimationCurve.softSpring) {
                self.isJumping = false
            }
        }
    }

    /// 触发拍照完成动画（比赞）
    func triggerCapture() {
        guard !isThumbsUp else { return }

        withAnimation(AppDesign.AnimationCurve.spring) {
            isThumbsUp = true
            animationState = .thumbsUp
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            withAnimation(AppDesign.AnimationCurve.spring) {
                self.isThumbsUp = false
                self.animationState = .idle
            }
        }
    }

    /// 更新发光颜色
    func updateGlowColor(_ color: Color) {
        withAnimation(.easeInOut(duration: 0.3)) {
            glowColor = color
            glowIntensity = 0.6
        }

        // 发光渐隐
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation(.easeOut(duration: 0.5)) {
                self.glowIntensity = 0.0
            }
        }
    }

    /// 清除发光
    func clearGlow() {
        withAnimation(.easeOut(duration: 0.3)) {
            glowColor = nil
            glowIntensity = 0.0
        }
    }

    /// 触发发光动画
    func triggerGlow(color: Color, duration: Double = 0.5) {
        withAnimation(.easeOut(duration: 0.2)) {
            glowColor = color
            glowIntensity = 0.8
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            withAnimation(.easeOut(duration: 0.3)) {
                self.glowIntensity = 0.0
            }
        }
    }
}
