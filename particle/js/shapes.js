/**
 * 形状生成器 - 使用数学公式生成各种3D形状的粒子位置
 */
class ShapeGenerator {
    static guanyinPixels = null;

    static preloadGuanyin(src) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const w = 400, h = 600;
            canvas.width = w; canvas.height = h;

            // Draw image (Scale to fit)
            const scale = Math.min(w / img.width, h / img.height) * 0.9;
            const iw = img.width * scale;
            const ih = img.height * scale;
            const ix = (w - iw) / 2;
            const iy = (h - ih) / 2;

            // Fill background with white first
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            ctx.drawImage(img, ix, iy, iw, ih);

            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;
            const validPixels = [];
            const step = 2;

            for (let y = 0; y < h; y += step) {
                for (let x = 0; x < w; x += step) {
                    const i = (y * w + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const alpha = data[i + 3];

                    // Calculate brightness (0-255)
                    const brightness = (r + g + b) / 3;

                    // The Guanyin figure is dark on light background
                    // Pick pixels that are dark (brightness < 200) and have alpha
                    if (alpha > 128 && brightness < 200) {
                        validPixels.push({
                            x: (x - w / 2) / 100,
                            y: -(y - h / 2) / 100
                        });
                    }
                }
            }
            ShapeGenerator.guanyinPixels = validPixels;
            console.log("Guanyin loaded:", validPixels.length);
        };
        img.src = src;
    }

    /**
     * 生成指定形状的粒子位置数组
     * @param {string} shapeName - 形状名称
     * @param {number} count - 粒子数量
     * @returns {Float32Array} - 粒子位置数组 [x1,y1,z1, x2,y2,z2, ...]
     */
    static generate(shapeName, count) {
        switch (shapeName) {
            case 'sphere':
                return this.generateSphere(count);
            case 'heart':
                return this.generateHeart(count);
            case 'flower':
                return this.generateFlower(count);
            case 'saturn':
                return this.generateSaturn(count);
            case 'buddha':
                return this.generateGuanyin(count);
            case 'firework':
                return this.generateFirework(count);
            case 'love-text':
                return this.generateLoveText(count);
            case 'text':
                return this.generateText(count, 'I ❤️ You');
            case 'drift':
                return this.generateDrift(count);
            default:
                return this.generateHeart(count);
        }
    }

    /**
     * 生成密集球体（实心，中心高亮）
     */
    static generateSphere(count) {
        const positions = new Float32Array(count * 3);
        const radius = 2.0;

        for (let i = 0; i < count; i++) {
            // 随机方向
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // 随机半径: 线性分布会导致中心极其密集 (1/r^2 密度)，形成发光核心效果
            const r = radius * Math.random();

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        return positions;
    }

    /**
     * 生成3D心形 - 粗边空心轮廓
     * 粒子聚集在边缘，有一定的厚度，但中心是空的
     */
    static generateHeart(count) {
        const positions = new Float32Array(count * 3);
        const scale = 0.10; // 稍微缩小

        for (let i = 0; i < count; i++) {
            // 随机参数t
            const t = Math.random() * Math.PI * 2;

            // 心形参数方程 (轮廓)
            // x = 16sin³(t)
            // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
            let x = 16 * Math.pow(Math.sin(t), 3);
            let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

            // 添加 "厚度" (从轮廓向内外随机扩散)
            // 使用正态分布似的随机，让大部分粒子紧贴轮廓，少部分散开，形成毛茸茸的边缘
            const thickness = 1.5;
            const offsetDist = (Math.random() - 0.5) * thickness;

            // 简单的法向偏移近似：直接在位置上叠加随机偏移
            // 为了更好的效果，这里直接叠加随机噪声
            x += (Math.random() - 0.5) * thickness;
            y += (Math.random() - 0.5) * thickness;

            // Z轴厚度 (使心形立体但主要集中在平面)
            const z = (Math.random() - 0.5) * 4.0;

            positions[i * 3] = x * scale;
            positions[i * 3 + 1] = y * scale;
            positions[i * 3 + 2] = z * scale;
        }

        return positions;
    }

    /**
     * 生成2D小红花 (平面五瓣花)
     * 极坐标: r = cos(2.5 * theta) 或 sin(2.5 * theta) for 5 petals
     */
    static generateFlower(count) {
        const positions = new Float32Array(count * 3);
        const scale = 2.0; // 缩小尺寸

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const k = 2.5; // 5 petals
            // 使用 abs(sin) 使得花瓣饱满
            const r = Math.pow(Math.abs(Math.sin(k * theta)), 0.3) * scale;

            // 填充内部
            const dist = Math.sqrt(Math.random()) * r;

            positions[i * 3] = dist * Math.cos(theta);
            positions[i * 3 + 1] = dist * Math.sin(theta);
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // 稍微有一点厚度
        }
        return positions;
    }

    /**
     * 生成土星 (更小，光环极薄)
     */
    static generateSaturn(count) {
        const positions = new Float32Array(count * 3);
        const sphereCount = Math.floor(count * 0.60);
        const ringCount = count - sphereCount;
        const scale = 0.7; // 再次缩小
        let idx = 0;

        // 1. 本体
        for (let i = 0; i < sphereCount; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const r = 1.6 * scale;

            positions[idx++] = r * Math.sin(phi) * Math.cos(theta);
            positions[idx++] = r * Math.sin(phi) * Math.sin(theta);
            positions[idx++] = r * Math.cos(phi);
        }

        const tiltX = 0.5;

        // 2. 光环 (纸片薄)
        for (let i = 0; i < ringCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const t = Math.random();
            // 环分布
            let rNorm;
            if (t < 0.6) rNorm = t / 0.6 * 0.4;
            else rNorm = 0.5 + (t - 0.6) / 0.4 * 0.5;

            const r = (1.9 + rNorm * 1.8) * scale;

            let x = r * Math.cos(theta);
            let y = (Math.random() - 0.5) * 0.005; // 几乎是二维平面
            let z = r * Math.sin(theta);

            // 倾斜
            let y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
            let z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
            y = y1; z = z1;

            positions[idx++] = x;
            positions[idx++] = y;
            positions[idx++] = z;
        }

        return positions;
    }

    /**
     * 生成观音坐莲 (替代之前的弥勒佛)
     */
    static generateBuddha(count) { // 保持函数名兼容，但内容是观音
        const positions = new Float32Array(count * 3);
        const scale = 1.2;
        const yOffset = -1.2;

        const baseCount = Math.floor(count * 0.3); // 莲花座
        const bodyCount = Math.floor(count * 0.4); // 修长身体
        const headCount = Math.floor(count * 0.15); // 头 + 光环
        const armCount = count - baseCount - bodyCount - headCount;

        let idx = 0;

        // 1. 莲花座 (层叠的圆环/花瓣)
        for (let i = 0; i < baseCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const layer = Math.random(); // 0(底) -> 1(顶)

            // 花瓣波浪
            const petals = 12;
            const wave = Math.sin(theta * petals) * 0.1 * layer;

            const r = (1.5 - layer * 0.5) * scale; // 下大上小
            const y = (layer * 0.5 + wave + yOffset) * scale;

            positions[idx++] = r * Math.cos(theta);
            positions[idx++] = y;
            positions[idx++] = r * Math.sin(theta);
        }

        // 2. 身体 (修长的圆柱/椭球)
        for (let i = 0; i < bodyCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const h = Math.random(); // 0 -> 1

            // 细腰设计
            const width = (0.4 + 0.3 * Math.sin(h * Math.PI)) * scale;
            const y = (0.5 + h * 1.8 + yOffset) * scale; // 高度 1.8

            positions[idx++] = width * Math.cos(theta);
            positions[idx++] = y;
            positions[idx++] = width * Math.sin(theta) * 0.8; // Z轴略扁
        }

        // 3. 头 + 头光
        for (let i = 0; i < headCount; i++) {
            const t = Math.random();
            if (t > 0.4) { // 头
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 0.35 * scale;
                const cy = (2.6 + yOffset) * scale;

                positions[idx++] = r * Math.sin(phi) * Math.cos(theta);
                positions[idx++] = r * Math.sin(phi) * Math.sin(theta) + cy;
                positions[idx++] = r * Math.cos(phi);
            } else { // 垂直光环 (背光)
                const theta = Math.random() * Math.PI * 2;
                const r = (0.6 + Math.random() * 0.1) * scale;
                const cx = 0;
                const cy = (2.6 + yOffset) * scale;
                const cz = -0.3 * scale; // 头部后方

                positions[idx++] = r * Math.cos(theta);
                positions[idx++] = r * Math.sin(theta) + cy;
                positions[idx++] = cz; // 垂直于XY平面的环
            }
        }

        // 4. 手臂 (简单的合十或持瓶)
        for (let i = 0; i < armCount; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const t = Math.random();

            // 简单的下垂加弯曲
            const sx = side * 0.5 * scale; const sy = (2.0 + yOffset) * scale;
            const ex = 0; const ey = (1.5 + yOffset) * scale; const ez = 0.5 * scale; // 合十在胸前

            const mx = side * 0.8 * scale; const my = (1.6 + yOffset) * scale;

            // Line
            const x = (1 - t) * sx + t * ex + (Math.random() - 0.5) * 0.1;
            const y = (1 - t) * sy + t * ey + (Math.random() - 0.5) * 0.1;
            const z = (1 - t) * 0 + t * ez + (Math.random() - 0.5) * 0.1;

            positions[idx++] = x; positions[idx++] = y; positions[idx++] = z;
        }

        return positions;
    }

    /**
     * 生成烟花 (安全区域：中、右下、右上)
     */
    static generateFirework(count) {
        const positions = new Float32Array(count * 3);

        // 安全区域中心点
        const centers = [
            { x: 0, y: 0, z: 0 },       // 正中
            { x: 3.5, y: 1.5, z: 0 },   // 右上
            { x: 3.5, y: -1.5, z: 0 },  // 右下
            { x: 2.0, y: 0, z: 0.5 },   // 右中
            { x: 0, y: -2.0, z: -0.5 }, // 正下
            // {x: -3, ...} 避开左侧
        ];

        const numBursts = centers.length;
        const particlesPerBurst = Math.floor(count / numBursts);

        for (let burst = 0; burst < numBursts; burst++) {
            const c = centers[burst];
            // 加上一点随机抖动
            const cx = c.x + (Math.random() - 0.5) * 0.5;
            const cy = c.y + (Math.random() - 0.5) * 0.5;
            const cz = c.z + (Math.random() - 0.5) * 0.5;

            const burstScale = 0.7 + Math.random() * 0.6;
            const numRays = 40;
            const particlesPerRay = Math.floor(particlesPerBurst / numRays);

            let pIdx = burst * particlesPerBurst;
            const pEnd = (burst === numBursts - 1) ? count : (burst + 1) * particlesPerBurst;

            for (let r = 0; r < numRays; r++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const rayLen = (1.2 + Math.random() * 0.5) * burstScale;

                const dx = Math.sin(phi) * Math.cos(theta);
                const dy = Math.sin(phi) * Math.sin(theta);
                const dz = Math.cos(phi);

                for (let k = 0; k < particlesPerRay; k++) {
                    if (pIdx >= pEnd) break;
                    const t = k / particlesPerRay;
                    const noise = 0.08;

                    positions[pIdx * 3] = cx + (dx * rayLen * t) + (Math.random() - 0.5) * noise;
                    positions[pIdx * 3 + 1] = cy + (dy * rayLen * t) + (Math.random() - 0.5) * noise;
                    positions[pIdx * 3 + 2] = cz + (dz * rayLen * t) + (Math.random() - 0.5) * noise;
                    pIdx++;
                }
            }
            while (pIdx < pEnd) {
                positions[pIdx * 3] = cx; positions[pIdx * 3 + 1] = cy; positions[pIdx * 3 + 2] = cz;
                pIdx++;
            }
        }
        return positions;
    }

    /**
     * 生成"我爱你"汉字
     */
    static generateLoveText(count) {
        return this.generateText(count, '我爱你');
    }

    /**
     * 生成文字 (右移避开UI)
     */
    static generateText(count, textString) {
        const positions = new Float32Array(count * 3);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const fontSize = 200;
        const width = fontSize * textString.length + 200;
        const height = fontSize * 2;

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textString, width / 2, height / 2);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const validPixels = [];
        const step = 2;

        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const i = (y * width + x) * 4;
                if (data[i] > 128) {
                    validPixels.push({
                        x: (x - width / 2) / fontSize,
                        y: -(y - height / 2) / fontSize
                    });
                }
            }
        }

        if (validPixels.length === 0) return this.generateSphere(count);

        // 偏移量
        const offsetX = 0; // 居中
        const offsetY = 0; // 居中

        for (let i = 0; i < count; i++) {
            const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];

            const scale = 2.0; // 缩小

            positions[i * 3] = pixel.x * scale + offsetX;
            positions[i * 3 + 1] = pixel.y * scale + offsetY;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        return positions;
    }

    /**
     * 生成随机分布的粒子 (用于过渡效果)
     */
    static generateRandom(count, spread = 5) {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
        }

        return positions;
    }

    /**
     * 生成飘动粒子初始位置 - 从左侧开始，向右飘动
     */
    static generateDrift(count) {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // 粒子从左到右分布，大幅扩大范围覆盖满屏
            positions[i * 3] = -30 + Math.random() * 60;  // x: -30 到 30
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;  // y: -20 到 20
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;  // z: -10 到 10 (增加深度)
        }

        return positions;
    }

    /**
     * 生成观音 (使用预加载的图片数据)
     */
    static generateGuanyin(count) {
        if (!this.guanyinPixels || this.guanyinPixels.length === 0) {
            return this.generateSphere(count); // Fallback if not loaded
        }

        const positions = new Float32Array(count * 3);
        const validPixels = this.guanyinPixels;

        for (let i = 0; i < count; i++) {
            const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
            const s = 1.3; // Scale
            const z = (Math.random() - 0.5) * 0.2;

            positions[i * 3] = pixel.x * s;
            positions[i * 3 + 1] = pixel.y * s;
            positions[i * 3 + 2] = z;
        }

        return positions;
    }
}

// 导出到全局
window.ShapeGenerator = ShapeGenerator;
