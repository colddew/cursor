# 课堂点名签到系统

## 项目概述
创建一个功能完整的课堂点名签到系统，支持CSV导入、迟到记录、加权随机选择、数据导出和3D地球动画效果。

## 技术栈
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **存储**: localStorage (适合20-100学生规模)
- **3D动画**: CSS 3D transforms (轻量级方案)
- **数据格式**: CSV导入导出

## 核心功能设计

### 1. 数据结构
```javascript
// 学生名单
Student: {
  id: string,
  name: string,
  studentId: string,
  email?: string,
  location?: {
    city: string,
    coordinates: {lat, lng}
  }
}

// 考勤记录
Attendance: {
  id: string,
  studentId: string,
  date: string,
  status: "present"|"tardy"|"absent"|"excused",
  checkInTime: string,
  tardyMinutes: number
}

// 课程会话
Session: {
  id: string,
  date: string,
  selectedStudents: string[],
  attendanceStats: {
    total: number,
    present: number,
    tardy: number,
    absent: number
  }
}
```

### 2. 加权随机算法
迟到学生选择权重计算：
- 基础权重: 1
- 迟到次数 × 2.5
- 最近7天迟到额外加成 × 0.5

### 3. 3D地球动画
- CSS 3D实现旋转地球效果
- 被选中学生从地球"升起"动画
- 根据出勤率改变地球颜色（绿色=良好，黄色=警告，红色=较差）

## 实施步骤

### 第一阶段：基础框架
1. 创建项目文件结构
2. 实现存储抽象层 (StorageManager)
3. 创建基础HTML/CSS布局
4. 实现标签页导航

### 第二阶段：核心功能
1. **CSV导入功能**
   - 文件拖放上传
   - CSV解析和列映射
   - 数据验证和预览

2. **学生名单管理**
   - CRUD操作
   - 搜索过滤
   - 批量操作

3. **考勤记录**
   - 快速标记（到场/迟到/缺勤）
   - 迟到时间记录
   - 批量更新

### 第三阶段：高级功能
1. **加权随机选择器**
   - 实现权重算法
   - 动画展示
   - 历史记录

2. **3D地球可视化**
   - CSS 3D地球动画
   - 与选择器集成
   - 出勤率可视化

3. **数据导出**
   - 时间范围选择
   - 自定义导出字段
   - 统计信息

### 第四阶段：优化完善
1. 性能优化（虚拟滚动、懒加载）
2. 响应式设计
3. 键盘快捷键
4. 离线支持

## 关键文件列表

### 核心文件
- `index.html` - 主页面入口
- `css/main.css` - 主样式文件
- `js/app.js` - 应用主控制器
- `js/storage/storage-manager.js` - 存储管理
- `js/services/attendance-service.js` - 考勤逻辑
- `js/services/selection-service.js` - 随机选择算法
- `js/components/earth-viewer.js` - 3D地球组件

### 辅助文件
- `js/utils/csv-parser.js` - CSV解析工具
- `js/utils/date-utils.js` - 日期处理
- `js/components/roster-manager.js` - 名单管理界面
- `js/components/attendance-tracker.js` - 考勤跟踪界面

## 预期成果
- 完整的单页应用，支持所有需求功能
- 响应式设计，支持桌面和移动设备
- 本地存储，无需服务器
- 酷炫的3D视觉效果提升用户体验
- 灵活的数据导入导出功能