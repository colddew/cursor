// 轻量修复：只阻止自动模态框，让应用正常初始化
(function() {
    'use strict';

    console.log('[轻量修复] 开始修复模态框问题');

    // 只在初始化阶段阻止模态框显示
    let isInitializing = true;
    setTimeout(() => {
        isInitializing = false;
        console.log('[轻量修复] 初始化完成，恢复正常功能');
    }, 3000);

    // 简单的模态框隐藏函数
    const hideAutoModals = () => {
        if (!isInitializing) return;

        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    };

    // 初始化时隐藏
    hideAutoModals();

    // 确保页面正常
    document.addEventListener('DOMContentLoaded', () => {
        document.body.style.overflow = '';
    });

    console.log('[轻量修复] 脚本加载完成');
})();