document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const title = tab.title;

    // 设置网站名称
    document.getElementById('site-name').textContent = title;

    // 设置favicon
    const favicon = document.getElementById('favicon');
    if (tab.favIconUrl) {
      favicon.src = tab.favIconUrl;
    } else {
      favicon.style.display = 'none';
    }

    // 生成二维码
    new QRCode(document.getElementById('qrcode'), {
      text: url,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
      margin: 2
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    document.getElementById('site-name').textContent = '生成二维码时发生错误';
  }
}); 