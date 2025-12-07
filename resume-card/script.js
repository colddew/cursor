document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const nameInput = document.getElementById('name');
    const titleInput = document.getElementById('title');
    const companyInput = document.getElementById('company');
    const bioInput = document.getElementById('bio');
    const wechatInput = document.getElementById('wechat');
    const phoneInput = document.getElementById('phone');
    const avatarInput = document.getElementById('avatar');
    const avatarBtn = document.getElementById('avatarBtn');

    // 获取卡片元素
    const cardName = document.getElementById('cardName');
    const cardTitle = document.getElementById('cardTitle');
    const cardCompany = document.getElementById('cardCompany');
    const cardBio = document.getElementById('cardBio');
    const cardWechat = document.getElementById('cardWechat');
    const cardPhone = document.getElementById('cardPhone');
    const cardAvatar = document.getElementById('cardAvatar');

    // 获取卡片容器
    const businessCard = document.getElementById('businessCard');
    const styleOptions = document.querySelectorAll('.style-option');

    // 获取下载按钮
    const downloadBtn = document.getElementById('downloadBtn');

    // 当前选中的风格
    let currentStyle = 'apple';

    // 实时更新卡片内容
    nameInput.addEventListener('input', function() {
        cardName.textContent = this.value || '您的姓名';
    });

    titleInput.addEventListener('input', function() {
        cardTitle.textContent = this.value || '您的职位';
    });

    companyInput.addEventListener('input', function() {
        cardCompany.textContent = this.value || '公司名称';
    });

    bioInput.addEventListener('input', function() {
        let bioText = this.value || '个人简介将显示在这里...';
        if (this.value && this.value.length > 30) {
            bioText = this.value.substring(0, 30) + '...';
            // 限制实际输入长度
            this.value = this.value.substring(0, 30);
        }
        cardBio.textContent = bioText;
    });

    wechatInput.addEventListener('input', function() {
        cardWechat.textContent = this.value || '微信号';
    });

    phoneInput.addEventListener('input', function() {
        cardPhone.textContent = this.value || '+86 138 0000 0000';
    });

    // 头像上传功能
    avatarBtn.addEventListener('click', function() {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                cardAvatar.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    
    // 风格切换功能
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有active类
            styleOptions.forEach(opt => opt.classList.remove('active'));
            // 添加active类到当前选中的选项
            this.classList.add('active');

            // 获取选中的风格
            const selectedStyle = this.getAttribute('data-style');
            currentStyle = selectedStyle;

            // 移除所有风格类
            businessCard.classList.remove('apple-style', 'professional-style', 'tech-style', 'cool-style');
            // 添加新的风格类
            businessCard.classList.add(selectedStyle + '-style');

            // 为炫酷风格重置动画
            if (selectedStyle === 'cool') {
                const beforeElement = businessCard.querySelector('::before');
                if (beforeElement) {
                    beforeElement.style.animation = 'none';
                    setTimeout(() => {
                        beforeElement.style.animation = 'rotate 20s linear infinite';
                    }, 10);
                }
            }
        });
    });

    // 下载名片功能
    downloadBtn.addEventListener('click', function() {
        const businessCard = document.getElementById('businessCard');

        // 显示加载状态
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '生成中...';
        downloadBtn.disabled = true;

        // 临时修复炫酷风动画
        const coolStyle = businessCard.classList.contains('cool-style');
        if (coolStyle) {
            businessCard.style.setProperty('--temp-animation', 'none');
        }

        // 使用 html2canvas 生成图片
        html2canvas(businessCard, {
            scale: 3,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            width: businessCard.offsetWidth,
            height: businessCard.offsetHeight,
            foreignObjectRendering: false
        }).then(canvas => {
            // 创建下载链接
            const link = document.createElement('a');
            const timestamp = new Date().getTime();
            link.download = `名片_${nameInput.value || '未命名'}_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');

            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 恢复按钮状态
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;

            // 恢复炫酷风动画
            if (coolStyle) {
                businessCard.style.removeProperty('--temp-animation');
            }

            // 显示成功提示
            showNotification('名片已成功下载！');
        }).catch(error => {
            console.error('生成名片失败:', error);
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;

            // 恢复炫酷风动画
            if (coolStyle) {
                businessCard.style.removeProperty('--temp-animation');
            }

            showNotification('生成名片失败，请重试', 'error');
        });
    });

    // 显示通知函数
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'success' ? '#4a7c59' : '#e74c3c'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 表单验证
    const cardForm = document.getElementById('cardForm');
    cardForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 检查必填字段
        if (!nameInput.value.trim()) {
            showNotification('请输入您的姓名', 'error');
            nameInput.focus();
            return;
        }

        // 如果验证通过，触发下载
        downloadBtn.click();
    });

    // 修复炫酷风动画问题
    function fixCoolStyleAnimation() {
        const coolCard = document.querySelector('.cool-style');
        if (coolCard) {
            coolCard.style.setProperty('--rotate-animation', 'rotate 20s linear infinite');
        }
    }

    // 添加输入框聚焦效果
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // 添加键盘快捷键 Ctrl+S 或 Cmd+S 下载
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            downloadBtn.click();
        }
    });
});