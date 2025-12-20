# 五险一金计算器项目 - 上下文管理中枢

## 项目概述

本项目是一个基于 Next.js 和 Supabase 构建的"五险一金"计算器 Web 应用，用于计算公司为每位员工应缴纳的社保公积金费用。

## 技术栈

- **前端框架**: Next.js (React)
- **UI/样式**: Tailwind CSS
- **后端/数据库**: Supabase
- **文件处理**: xlsx 或 similar (用于 Excel 文件处理)

## 数据库设计 (Supabase)

### 1. cities 表（城市标准表）
```sql
CREATE TABLE cities (
  id INT PRIMARY KEY,
  city_name TEXT NOT NULL,
  year TEXT NOT NULL,
  base_min INT NOT NULL,        -- 社保基数下限
  base_max INT NOT NULL,        -- 社保基数上限
  rate FLOAT NOT NULL           -- 综合缴纳比例 (如 0.15)
);
```

### 2. salaries 表（员工工资表）
```sql
CREATE TABLE salaries (
  id INT PRIMARY KEY,
  employee_id TEXT NOT NULL,    -- 员工工号
  employee_name TEXT NOT NULL,  -- 员工姓名
  month TEXT NOT NULL,          -- 年份月份 (YYYYMM)
  salary_amount INT NOT NULL    -- 该月工资金额
);
```

### 3. results 表（计算结果表）
```sql
CREATE TABLE results (
  id INT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  avg_salary FLOAT NOT NULL,        -- 年度月平均工资
  contribution_base FLOAT NOT NULL, -- 最终缴费基数
  company_fee FLOAT NOT NULL        -- 公司缴纳金额
);
```

## 核心业务逻辑

### 计算流程
1. 从 salaries 表读取指定年份的工资数据（通过 year 匹配 month 前4位）
2. 按 employee_name 分组，计算每位员工的年度月平均工资
3. 从 cities 表获取指定城市（当前为广州）的社保标准
4. 对每位员工：
   - 平均工资 < base_min → 使用 base_min 作为缴费基数
   - 平均工资 > base_max → 使用 base_max 作为缴费基数
   - 否则 → 使用平均工资作为缴费基数
5. 计算 company_fee = contribution_base × rate
6. 将结果存入 results 表

### 重要说明
- **数据来源**: 只从社保系统上传两个 Excel 文件
  - cities.xlsx: 社保标准数据
  - salaries.xlsx: 员工工资数据
- **计算范围**: 当前只计算广州市，后续可扩展到其他城市
- **年份匹配**: cities 表的 year 字段需要匹配 salaries 表 month 的前4位（YYYY）

## 前端页面设计

### 1. 主页 (/)
- **布局**: 两个功能卡片（可点击）
  - **数据上传卡片**: 跳转到 /upload
  - **结果查询卡片**: 跳转到 /results
- **样式**: 使用 Tailwind CSS，简洁现代的设计

### 2. 上传页 (/upload)
- **功能一**: 上传社保标准 Excel 文件 (cities.xlsx)
  - 解析并插入到 cities 表
- **功能二**: 上传工资数据 Excel 文件 (salaries.xlsx)
  - 解析并插入到 salaries 表
- **功能三**: 选择年份并"执行计算"按钮
  - 触发核心计算逻辑（根据选择的年份）
  - 将结果存储到 results 表

### 3. 结果页 (/results)
- **功能**: 展示所有计算结果
- **组件**: 使用表格展示以下字段
  - employee_name
  - avg_salary
  - contribution_base
  - company_fee

## 开发任务清单 (TodoList)

### Phase 1: 环境搭建与初始化
- [ ] 创建 Next.js 项目
- [ ] 安装并配置 Tailwind CSS
- [ ] 安装 Supabase 客户端库
- [ ] 配置环境变量（Supabase URL 和 Key）
- [ ] 创建项目基础文件结构

### Phase 2: Supabase 数据库设置
- [ ] 创建 Supabase 项目
- [ ] 在 Supabase 中创建三张数据表
- [ ] 设置适当的权限策略

### Phase 3: 页面结构搭建
- [ ] 创建基础布局组件
- [ ] 实现主页 (/) 的卡片布局
- [ ] 创建上传页面框架 (/upload)
- [ ] 创建结果页面框架 (/results)
- [ ] 实现页面间的导航

### Phase 4: 数据上传功能
- [ ] 安装 Excel 处理库（xlsx）
- [ ] 创建文件上传组件（支持两个独立的上传）
- [ ] 实现 cities.xlsx 文件解析逻辑
- [ ] 实现 salaries.xlsx 文件解析逻辑
- [ ] 实现 cities 表数据插入功能
- [ ] 实现 salaries 表数据插入功能
- [ ] 添加年份选择器组件
- [ ] 添加上传成功提示和数据验证

### Phase 5: 核心计算逻辑
- [ ] 创建 Supabase 数据访问函数
- [ ] 实现按年份过滤的工资数据聚合计算
- [ ] 实现缴费基数计算逻辑
- [ ] 实现公司缴纳金额计算
- [ ] 创建触发计算的 API 端点（接受年份参数）
- [ ] 实现"执行计算"按钮功能（包含年份选择）

### Phase 6: 结果展示功能
- [ ] 实现 results 表数据查询
- [ ] 创建结果展示表格组件
- [ ] 实现表格样式优化
- [ ] 添加数据格式化（金额显示等）
- [ ] 处理空数据状态

### Phase 7: 测试与优化
- [ ] 测试上传功能（使用用户提供的实际数据文件）
- [ ] 测试计算逻辑
- [ ] 测试结果展示
- [ ] 优化用户体验（加载状态、错误处理等）
- [ ] 响应式设计优化

### Phase 8: 部署准备
- [ ] 配置生产环境变量
- [ ] 构建生产版本
- [ ] 部署到 Vercel 或其他平台
- [ ] 最终测试与调试

## 注意事项

1. **数据验证**: 确保上传的 Excel 数据格式正确
2. **错误处理**: 提供清晰的错误提示信息
3. **用户体验**: 添加适当的加载状态和反馈
4. **数据安全**: 确保 Supabase 权限配置正确
5. **性能考虑**: 大量数据时的分页或虚拟滚动
6. **扩展性**: 为未来支持多城市计算预留扩展空间
7. **UI 设计**: 保持简洁大气的社保系统风格
8. **数据依赖**: 完全依赖用户上传的 Excel 文件，不内置任何测试数据