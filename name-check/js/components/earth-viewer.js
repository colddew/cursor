// 3D地球查看器组件
class EarthViewer {
    constructor(container) {
        this.container = container;
        this.earthElement = null;
        this.rotationSpeed = 10;
        this.isRotating = true;
        this.currentTheme = 'normal';
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.createEarth();
        this.addStars();
        this.addRing();
        this.bindEvents();
        this.startRotation();
    }

    /**
     * 创建地球
     */
    createEarth() {
        this.earthElement = document.createElement('div');
        this.earthElement.className = 'earth';
        this.earthElement.innerHTML = `
            <div class="earth-surface"></div>
            <div class="earth-grid"></div>
        `;

        if (this.container) {
            this.container.appendChild(this.earthElement);
        }
    }

    /**
     * 添加星星背景
     */
    addStars() {
        const stars = document.createElement('div');
        stars.className = 'stars';
        if (this.container) {
            this.container.appendChild(stars);
        }
    }

    /**
     * 添加环带效果
     */
    addRing() {
        if (this.earthElement) {
            const ring = document.createElement('div');
            ring.className = 'earth-ring';
            this.earthElement.appendChild(ring);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 鼠标悬停时减速
        if (this.earthElement) {
            this.earthElement.addEventListener('mouseenter', () => {
                this.rotationSpeed = 2;
            });

            this.earthElement.addEventListener('mouseleave', () => {
                this.rotationSpeed = 10;
            });
        }
    }

    /**
     * 开始旋转
     */
    startRotation() {
        if (this.earthElement) {
            this.earthElement.style.animation = `earthRotate ${this.rotationSpeed}s linear infinite`;
        }
    }

    /**
     * 停止旋转
     */
    stopRotation() {
        if (this.earthElement) {
            this.earthElement.style.animationPlayState = 'paused';
        }
    }

    /**
     * 恢复旋转
     */
    resumeRotation() {
        if (this.earthElement) {
            this.earthElement.style.animationPlayState = 'running';
        }
    }

    /**
     * 设置旋转速度
     * @param {number} speed - 速度（秒）
     */
    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
        if (this.earthElement) {
            this.earthElement.style.animationDuration = `${speed}s`;
        }
    }

    /**
     * 设置主题颜色
     * @param {string} theme - 主题 (normal|good|warning|danger)
     */
    setTheme(theme) {
        if (this.earthElement) {
            this.earthElement.classList.remove('earth-good', 'earth-warning', 'earth-danger');
            if (theme !== 'normal') {
                this.earthElement.classList.add(`earth-${theme}`);
            }
        }
        this.currentTheme = theme;
    }

    /**
     * 根据出勤率设置主题
     * @param {number} rate - 出勤率 (0-100)
     */
    setThemeByAttendanceRate(rate) {
        if (rate >= 90) {
            this.setTheme('good');
        } else if (rate >= 70) {
            this.setTheme('warning');
        } else {
            this.setTheme('danger');
        }
    }

    /**
     * 执行选择动画
     * @param {Function} callback - 动画完成回调
     */
    performSelectionAnimation(callback) {
        if (this.earthElement) {
            this.earthElement.classList.add('selecting');

            // 2秒后移除动画类
            setTimeout(() => {
                if (this.earthElement) {
                    this.earthElement.classList.remove('selecting');
                }
                if (callback) callback();
            }, 2000);
        }
    }

    /**
     * 显示选中的名字
     * @param {Array} names - 名字数组
     * @param {HTMLElement} container - 显示容器
     */
    showSelectedNames(names, container) {
        if (!container) return;

        container.innerHTML = '';

        names.forEach((name, index) => {
            setTimeout(() => {
                const nameElement = document.createElement('div');
                nameElement.className = 'selected-name';
                nameElement.textContent = name;
                container.appendChild(nameElement);
            }, index * 200);
        });
    }

    /**
     * 添加学生位置标记
     * @param {Array} students - 学生数组
     */
    addStudentMarkers(students) {
        if (!this.earthElement) return;

        // 清除现有标记
        const existingMarkers = this.earthElement.querySelectorAll('.student-marker');
        existingMarkers.forEach(marker => marker.remove());

        // 添加新标记
        students.forEach(student => {
            if (student.location && student.location.coordinates) {
                const marker = document.createElement('div');
                marker.className = 'student-marker';
                marker.title = student.name;

                // 将经纬度转换为地球表面的位置
                const position = this._latLngToPosition(
                    student.location.coordinates.lat,
                    student.location.coordinates.lng
                );

                marker.style.left = `${position.x}%`;
                marker.style.top = `${position.y}%`;

                this.earthElement.appendChild(marker);
            }
        });
    }

    /**
     * 经纬度转换为位置百分比
     * @param {number} lat - 纬度
     * @param {number} lng - 经度
     * @returns {Object} 位置对象 {x, y}
     */
    _latLngToPosition(lat, lng) {
        // 简单的墨卡托投影转换
        const x = ((lng + 180) / 360) * 100;
        const y = (90 - lat) / 180 * 100;

        return { x, y };
    }

    /**
     * 调整地球大小
     * @param {number} size - 大小（像素）
     */
    setSize(size) {
        if (this.earthElement) {
            this.earthElement.style.width = `${size}px`;
            this.earthElement.style.height = `${size}px`;
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.earthElement = null;
    }
}