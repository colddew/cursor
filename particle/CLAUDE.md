# 3D粒子交互系统

基于手势控制的实时3D粒子系统，支持多种形状变换、颜色调整和全屏展示。

## 技术架构

```
摄像头 → MediaPipe Hands → 手势解析 → 粒子控制器 → Three.js渲染 → Canvas
                                          ↑
                                      UI控制面板
```

## 技术选型

| 模块 | 技术 | 说明 |
|------|------|------|
| 手势检测 | MediaPipe Hands | 21个手部关键点检测 |
| 3D渲染 | Three.js | BufferGeometry + Points + Shader |
| 形状算法 | 参数方程 | 心形/花朵/土星等数学公式 |
| UI风格 | Glassmorphism | 毛玻璃暗色主题 |

## 项目结构

```
particle/
├── index.html          # 主页面
├── css/style.css       # 样式 (Glassmorphism)
└── js/
    ├── main.js         # 入口，连接各模块
    ├── particle.js     # Three.js粒子系统
    ├── shapes.js       # 6种形状数学公式
    ├── gesture.js      # MediaPipe手势封装
    └── ui.js           # UI控制逻辑
```

## 形状公式

| 形状 | 算法 |
|------|------|
| 爱心 | `x=16sin³t, y=13cost-5cos2t-2cos3t-cost` |
| 花朵 | 极坐标玫瑰曲线 `r=cos(5θ)` |
| 土星 | 球体 + 环面参数方程 |
| 佛像 | 头(球)+身(椭圆)+底(莲花座) |
| 烟花 | 多点球形爆炸 |
| 我爱你 | Canvas文字采样 |

## 手势交互

- **双手张开** → 粒子扩散 (scale增大)
- **双手靠拢** → 粒子收缩 (scale减小)
- **单手张合** → 控制缩放程度

## 运行方式

```bash
cd particle
npx serve . -p 3000
# 访问 http://localhost:3000
```

## 快捷键

- `F` - 切换全屏
- `ESC` - 退出全屏
