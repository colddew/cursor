/**
 * 粒子系统类 - 使用Three.js渲染高性能粒子效果
 */
class ParticleSystem {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            particleCount: options.particleCount || 10000,
            particleSize: options.particleSize || 0.05, // 极致微小的星尘粒子
            color: options.color || 0xffffff, // 纯白
            ...options
        };

        // Three.js核心对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.geometry = null;
        this.material = null;

        // 粒子状态
        this.currentPositions = null;
        this.targetPositions = null;
        this.originalPositions = null;

        // 控制参数
        this.scale = 1.0;
        this.targetScale = 1.0;
        this.rotationSpeed = 0.002;
        this.lerpFactor = 0.25; // 进一步提速，动作干脆利落
        this.currentShape = 'heart';
        this.selectedShape = 'heart'; // 用户选择的形状

        // 飘动模式
        this.isDrifting = true;  // 默认处于飘动状态
        this.driftSpeed = 0.03;  // 飘动速度
        this.speedMultiplier = 1.0; // 速度倍率

        // 动画
        this.animationId = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.createParticles();
        this.setupResizeHandler();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // 纯黑背景

        // 添加纯黑环境雾效，用于深度感
        this.scene.fog = new THREE.Fog(0x000000, 10, 30);
    }

    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.z = 8;
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false, // 关闭透明，使用纯色背景
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1); // 强制清除为黑色
        this.container.appendChild(this.renderer.domElement);
    }

    createParticles() {
        const count = this.options.particleCount;

        // 创建几何体
        this.geometry = new THREE.BufferGeometry();

        // 生成初始形状 (默认为飘动模式)
        const initialShape = this.isDrifting ? 'drift' : this.currentShape;
        this.targetPositions = ShapeGenerator.generate(initialShape, count);
        this.currentPositions = new Float32Array(this.targetPositions);
        this.originalPositions = new Float32Array(this.targetPositions);

        // 创建颜色数组 (支持渐变效果)
        const colors = new Float32Array(count * 3);
        const baseColor = new THREE.Color(this.options.color);

        for (let i = 0; i < count; i++) {
            // 添加颜色变化
            const hsl = {};
            baseColor.getHSL(hsl);
            const variedColor = new THREE.Color();
            variedColor.setHSL(
                hsl.h + (Math.random() - 0.5) * 0.1,
                hsl.s,
                hsl.l + (Math.random() - 0.5) * 0.2
            );

            colors[i * 3] = variedColor.r;
            colors[i * 3 + 1] = variedColor.g;
            colors[i * 3 + 2] = variedColor.b;
        }

        // 创建大小数组 (随机大小)
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            sizes[i] = this.options.particleSize * (0.5 + Math.random());
        }

        // 设置属性
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // 创建着色器材质
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: 1.0 },
                uPixelRatio: { value: this.renderer.getPixelRatio() }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float uTime;
                uniform float uScale;
                uniform float uPixelRatio;
                
                void main() {
                    vColor = color;
                    
                    vec3 pos = position * uScale;
                    
                    // 微弱呼吸效果 (减少浮动避免性能问题)
                    float breathe = sin(uTime * 0.5) * 0.01;
                    pos *= (1.0 + breathe);
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // 根据距离调整大小，但保证最小可见度
                    float calculatedSize = size * uPixelRatio * (300.0 / -mvPosition.z);
                    gl_PointSize = max(1.0, calculatedSize); // 最小1.0像素，防止彻底消失
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // 计算到中心的距离 (0.0 到 0.5)
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // 裁剪圆形
                    if (dist > 0.5) discard;
                    
                    // 硬边圆形，无光晕，模拟锐利的星星
                    float alpha = 1.0; 
                    if (dist > 0.45) alpha = 0.0; // 边缘抗锯齿稍微留一点点，但几乎是硬边
                    else alpha = 1.0;
                    
                    // 使用指数衰减模拟极亮的核心，但范围很小
                    float strength = exp(-dist * 3.0);
                    
                    gl_FragColor = vec4(vColor, alpha * strength);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // 创建点云
        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);
    }

    /**
     * 切换形状 (用户选择的目标形状)
     */
    setShape(shapeName) {
        this.selectedShape = shapeName;
        // 如果不在飘动模式，立即切换
        if (!this.isDrifting) {
            this.currentShape = shapeName;
            this.targetPositions = ShapeGenerator.generate(shapeName, this.options.particleCount);
        }
    }

    /**
     * 设置飘动模式
     * @param {boolean} drifting - 是否进入飘动模式
     */
    setDriftMode(drifting) {
        if (this.isDrifting === drifting) return;

        this.isDrifting = drifting;

        if (drifting) {
            // 进入飘动模式 - 粒子开始漂散
            this.currentShape = 'drift';
            this.targetPositions = ShapeGenerator.generate('drift', this.options.particleCount);
            this.particles.rotation.y = 0; // 重置旋转
        } else {
            // 退出飘动模式 - 粒子聚合成形状
            this.currentShape = this.selectedShape;
            this.targetPositions = ShapeGenerator.generate(this.selectedShape, this.options.particleCount);
        }
    }

    /**
     * 设置缩放 (由手势控制)
     */
    setScale(scale) {
        this.targetScale = Math.max(0.3, Math.min(2.5, scale));
    }

    /**
     * 设置颜色
     */
    setColor(hexColor) {
        const color = new THREE.Color(hexColor);
        const colors = this.geometry.attributes.color.array;
        const count = this.options.particleCount;

        for (let i = 0; i < count; i++) {
            const hsl = {};
            color.getHSL(hsl);
            const variedColor = new THREE.Color();
            variedColor.setHSL(
                hsl.h + (Math.random() - 0.5) * 0.1,
                hsl.s,
                hsl.l + (Math.random() - 0.5) * 0.2
            );

            colors[i * 3] = variedColor.r;
            colors[i * 3 + 1] = variedColor.g;
            colors[i * 3 + 2] = variedColor.b;
        }

        this.geometry.attributes.color.needsUpdate = true;
    }

    /**
     * 重置颜色
     */
    resetColor() {
        this.setColor(this.options.color);
    }

    /**
     * 设置粒子数量
     */
    setParticleCount(count) {
        if (count === this.options.particleCount) return;

        this.options.particleCount = count;

        // 移除旧粒子
        this.scene.remove(this.particles);
        this.geometry.dispose();
        this.material.dispose();

        // 重新创建
        this.createParticles();
        this.setShape(this.currentShape);
    }

    /**
     * 设置速度倍率
     */
    setSpeed(multiplier) {
        this.speedMultiplier = Math.max(0.1, Math.min(5, multiplier));
    }

    /**
     * 动画循环
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const elapsed = this.clock.getElapsedTime();

        // 更新uniform
        this.material.uniforms.uTime.value = elapsed;

        // 平滑缩放过渡
        this.scale += (this.targetScale - this.scale) * 0.05;
        this.material.uniforms.uScale.value = this.scale;

        const positions = this.geometry.attributes.position.array;

        if (this.isDrifting) {
            // 飘动模式 - 粒子从左到右快速移动
            const driftAmount = 0.02 * this.speedMultiplier;
            const waveAmount = 0.005 * this.speedMultiplier;
            for (let i = 0; i < positions.length; i += 3) {
                // 向右快速移动 (增加速度)
                positions[i] += driftAmount;

                // 轻微上下波动
                positions[i + 1] += Math.cos(i + elapsed) * waveAmount;

                // 循环逻辑：超出右侧后回到左侧
                if (positions[i] > 30) {
                    positions[i] = -30;
                    // 随机重置Y和Z，避免重复感
                    positions[i + 1] = (Math.random() - 0.5) * 40;
                    positions[i + 2] = (Math.random() - 0.5) * 20;
                }
            }
        } else {
            // 形状模式 - 粒子平滑插值到目标位置
            const adjustedLerp = this.lerpFactor * this.speedMultiplier;
            for (let i = 0; i < positions.length; i++) {
                positions[i] += (this.targetPositions[i] - positions[i]) * adjustedLerp;
            }
            // 缓慢旋转
            this.particles.rotation.y += this.rotationSpeed * this.speedMultiplier;
        }

        this.geometry.attributes.position.needsUpdate = true;

        // 渲染
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 处理窗口大小变化
     */
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
        });
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();

        this.container.removeChild(this.renderer.domElement);
    }
}

// 导出到全局
window.ParticleSystem = ParticleSystem;
