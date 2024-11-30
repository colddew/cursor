// 获取DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片文件
let currentFile = null;

// 绑定拖放事件
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// 防止默认行为
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 高亮拖放区域
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('highlight');
}

function unhighlight(e) {
    dropZone.classList.remove('highlight');
}

// 处理文件拖放
dropZone.addEventListener('drop', handleDrop, false);
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.match('image.*')) {
        alert('请上传图片文件！');
        return;
    }

    currentFile = file;
    displayOriginalImage(file);
    compressImage(file);
}

// 显示原始图片
function displayOriginalImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        originalPreview.src = e.target.result;
        originalSize.textContent = formatFileSize(file.size);
        previewSection.style.display = 'block';
    }
    reader.readAsDataURL(file);
}

// 压缩图片
async function compressImage(file) {
    try {
        // 计算目标文件大小
        const quality = qualitySlider.value / 100;
        const targetSizeMB = Math.min(1, file.size / (1024 * 1024) * quality);

        const options = {
            maxSizeMB: targetSizeMB,
            maxWidthOrHeight: 2048,
            useWebWorker: true,
            fileType: file.type,
            initialQuality: quality
        };

        console.log('开始压缩，参数：', {
            原始大小: formatFileSize(file.size),
            目标大小: formatFileSize(targetSizeMB * 1024 * 1024),
            压缩质量: quality,
            文件类型: file.type
        });

        const compressedFile = await imageCompression(file, options);
        console.log('压缩完成：', {
            压缩后大小: formatFileSize(compressedFile.size),
            压缩率: ((1 - compressedFile.size / file.size) * 100).toFixed(2) + '%'
        });

        displayCompressedImage(compressedFile);
        downloadBtn.onclick = () => downloadImage(compressedFile);
        
    } catch (error) {
        console.error('压缩失败:', error);
        let errorMsg = '图片压缩失败！\n';
        
        if (error.name === 'ImageCompressError') {
            errorMsg += '原因：图片格式不支持或文件损坏';
        } else if (error.message.includes('image format')) {
            errorMsg += '原因：不支持的图片格式，请使用 JPG 或 PNG 格式';
        } else {
            errorMsg += '原因：' + error.message;
        }
        
        alert(errorMsg);
    }
}

// 显示压缩后的图片
function displayCompressedImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        compressedPreview.src = e.target.result;
        compressedSize.textContent = formatFileSize(file.size);
        
        // 显示压缩率
        const compressionRatio = ((1 - file.size / currentFile.size) * 100).toFixed(2);
        compressedSize.textContent += ` (压缩率: ${compressionRatio}%)`;
    }
    reader.readAsDataURL(file);
}

// 下载压缩后的图片
function downloadImage(file) {
    const link = document.createElement('a');
    link.download = `compressed_${currentFile.name}`;
    link.href = URL.createObjectURL(file);
    link.click();
    URL.revokeObjectURL(link.href);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 监听质量滑块变化
qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value + '%';
    if (currentFile) {
        compressImage(currentFile);
    }
}); 