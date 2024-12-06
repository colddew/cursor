// 创建二维码容器
function createQRContainer() {
  const container = document.createElement('div');
  container.className = 'web-qrcode-container';
  
  const qrcodeWrapper = document.createElement('div');
  qrcodeWrapper.className = 'web-qrcode-wrapper';
  
  const qrcodeElement = document.createElement('div');
  qrcodeElement.id = 'web-qrcode-' + Date.now(); // 使用唯一ID
  
  const favicon = document.createElement('img');
  favicon.className = 'web-favicon';
  favicon.src = document.querySelector('link[rel="icon"]')?.href || 
                document.querySelector('link[rel="shortcut icon"]')?.href || 
                window.location.origin + '/favicon.ico';
  
  const siteName = document.createElement('div');
  siteName.className = 'web-site-name';
  siteName.textContent = document.title;
  
  qrcodeWrapper.appendChild(qrcodeElement);
  qrcodeWrapper.appendChild(favicon);
  container.appendChild(qrcodeWrapper);
  container.appendChild(siteName);
  
  return { container, qrcodeElement };
}

// 初始化二维码
function initQRCode() {
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded');
    return;
  }
  
  try {
    // 检查是否已存在二维码容器
    const existingContainer = document.querySelector('.web-qrcode-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const { container, qrcodeElement } = createQRContainer();
    document.body.appendChild(container);
    
    // 生成二维码
    new QRCode(qrcodeElement, {
      text: window.location.href,
      width: 128,
      height: 128,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
      margin: 2
    });
    
    // 添加悬浮效果
    container.addEventListener('mouseenter', () => {
      container.classList.add('hover');
    });
    
    container.addEventListener('mouseleave', () => {
      container.classList.remove('hover');
    });
  } catch (error) {
    console.error('Error initializing QR code:', error);
  }
}

// 等待QRCode库加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initQRCode, 500));
} else {
  setTimeout(initQRCode, 500);
}

// 监听URL变化
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    initQRCode();
  }
}).observe(document, {subtree: true, childList: true}); 