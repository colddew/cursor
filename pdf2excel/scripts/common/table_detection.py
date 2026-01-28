import cv2
import sys
sys.dont_write_bytecode = True
import numpy as np
from pathlib import Path

def detect_table(image_path, threshold=50, force_mode=None):
    """
    使用 OpenCV 检测图片中是否存在表格
    
    Args:
        image_path: 图片路径
        threshold: 阈值（已废弃，保留兼容性）
        force_mode: 强制模式 - 'ocr'=强制返回True, 'v3'=强制返回False, None=自动检测
    """
    # 如果指定了强制模式，直接返回
    if force_mode == 'ocr':
        return True, 0
    elif force_mode == 'v3':
        return False, 0
    
    image = cv2.imread(str(image_path))
    if image is None:
        return False, 0
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 二值化 - 使用反色
    binary = cv2.adaptiveThreshold(
        ~gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 15, -2
    )
    
    # 获取图片尺寸
    height, width = binary.shape
    
    # 提取横线
    h_size = max(40, width // 40)
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (h_size, 1))
    horizontal_lines = cv2.erode(binary, horizontal_kernel, iterations=1)
    horizontal_lines = cv2.dilate(horizontal_lines, horizontal_kernel, iterations=3)
    
    # 提取竖线
    v_size = max(40, height // 40)
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, v_size))
    vertical_lines = cv2.erode(binary, vertical_kernel, iterations=1)
    vertical_lines = cv2.dilate(vertical_lines, vertical_kernel, iterations=3)
    
    # 计算交点 (十字交叉处)
    intersections = cv2.bitwise_and(horizontal_lines, vertical_lines)
    
    # 统计交点数量
    cnts, _ = cv2.findContours(intersections, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    intersections_count = len(cnts)
    
    # 检测复杂布局（如 Page 05：多栏 + 上下分段 + 中间插入文字）
    # 关键：检测垂直方向是否有明显的文字密度变化（中间插入文字会导致某些行特别密集）
    is_complex_layout = False
    if intersections_count < 10:  # 只对无表格线的图片检测
        # 垂直投影：统计每一行的黑色像素数量
        vertical_projection = np.sum(binary == 0, axis=1)  # 0 = 黑色
        
        # 将高度分成 10 段，检查密度分布
        segment_size = height // 10
        segments = []
        for i in range(10):
            start = i * segment_size
            end = (i + 1) * segment_size if i < 9 else height
            segment_density = np.sum(vertical_projection[start:end])
            segments.append(segment_density)
        
        # 计算密度的标准差
        avg_segment = np.mean(segments)
        std_segment = np.std(segments)
        
        # 如果标准差很大（说明有些段特别密集，有些段很稀疏），可能是复杂布局
        # 同时检查是否有中间段密度特别高（插入文字的特征）
        max_segment = max(segments)
        variation_ratio = std_segment / avg_segment if avg_segment > 0 else 0
        
        # Page 05 的特征：
        # 1. 垂直密度变化大（variation_ratio > 0.5）
        # 2. 最密集的段不在开头或结尾（说明中间有插入）
        max_idx = segments.index(max_segment)
        is_middle_dense = 2 <= max_idx <= 7  # 中间段（不是开头或结尾）
        
        if variation_ratio > 0.5 and is_middle_dense:
            is_complex_layout = True
    
    # 判定逻辑：
    # 1. 有表格线（交点 >= 10）-> 用 PaddleOCR
    # 2. 复杂布局（上下分段+插入文字）-> 用 StructureV3
    # 3. 其他（包括简单多栏）-> 用 PaddleOCR
    if intersections_count >= 10:
        is_table = True  # 有表格线
    elif is_complex_layout:
        is_table = False  # 复杂布局，用 V3
    else:
        is_table = True  # 简单布局（包括简单多栏），用 OCR
    
    return is_table, intersections_count

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        res, count = detect_table(sys.argv[1])
        print(f"Intersections: {count}, Is Table: {res}")
