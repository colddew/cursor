//
//  GIFPlayerView.swift
//  DragonLight
//
//  GIF 动画播放组件
//

import SwiftUI
import UIKit
import ImageIO

struct GIFPlayerView: UIViewRepresentable {
    let gifName: String

    func makeUIView(context: Context) -> UIImageView {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        if let gifURL = Bundle.main.url(forResource: gifName, withExtension: "gif") {
            imageView.loadGIF(from: gifURL)
        } else {
            print("GIFPlayerView: 无法找到 \(gifName).gif")
        }
        return imageView
    }

    func updateUIView(_ uiView: UIImageView, context: Context) {
        // 不需要更新
    }
}

extension UIImageView {
    func loadGIF(from url: URL) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let data: Data
            do {
                data = try Data(contentsOf: url)
            } catch {
                print("GIFPlayerView: 加载数据失败 - \(error)")
                return
            }

            guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
                print("GIFPlayerView: 创建图片源失败")
                return
            }

            let count = CGImageSourceGetCount(source)
            print("GIFPlayerView: 图片帧数 = \(count)")

            // 无论是否为动画 GIF，都尝试提取所有帧
            var images: [UIImage] = []
            var duration: Double = 0

            for i in 0..<count {
                guard let cgImage = CGImageSourceCreateImageAtIndex(source, i, nil) else {
                    print("GIFPlayerView: 第 \(i) 帧加载失败")
                    continue
                }
                let image = UIImage(cgImage: cgImage)
                images.append(image)

                // 获取每帧的持续时间
                if let properties = CGImageSourceCopyPropertiesAtIndex(source, i, nil) as? [String: Any],
                   let gifInfo = properties[kCGImagePropertyGIFDictionary as String] as? [String: Any],
                   let frameDelay = gifInfo[kCGImagePropertyGIFDelayTime as String] as? Double {
                    duration += frameDelay
                } else {
                    duration += 0.1 // 默认帧间隔
                }
            }

            DispatchQueue.main.async {
                if count > 1 && !images.isEmpty {
                    // 多帧图片，创建动画
                    let finalDuration = duration > 0 ? duration : Double(count) * 0.1
                    self?.image = UIImage.animatedImage(with: images, duration: finalDuration)
                    self?.startAnimating()
                    print("GIFPlayerView: 动画创建成功，帧数=\(count)，时长=\(finalDuration)")
                } else if let firstImage = images.first {
                    // 单帧图片
                    self?.image = firstImage
                    print("GIFPlayerView: 单帧图片")
                }
            }
        }
    }
}
