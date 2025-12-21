-- 五险一金计算器数据库创建脚本
-- 请在 Supabase SQL 编辑器中执行以下命令

-- 创建 cities 表（城市标准表）
CREATE TABLE IF NOT EXISTS cities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  city_name TEXT NOT NULL,
  year TEXT NOT NULL,
  base_min BIGINT NOT NULL,        -- 社保基数下限
  base_max BIGINT NOT NULL,        -- 社保基数上限
  rate NUMERIC NOT NULL,           -- 综合缴纳比例 (如 0.15)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 salaries 表（员工工资表）
CREATE TABLE IF NOT EXISTS salaries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id TEXT NOT NULL,    -- 员工工号
  employee_name TEXT NOT NULL,  -- 员工姓名
  month TEXT NOT NULL,          -- 年份月份 (YYYYMM)
  salary_amount BIGINT NOT NULL,    -- 该月工资金额
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 results 表（计算结果表）
CREATE TABLE IF NOT EXISTS results (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_name TEXT NOT NULL,
  avg_salary NUMERIC NOT NULL,        -- 年度月平均工资
  contribution_base NUMERIC NOT NULL, -- 最终缴费基数
  company_fee NUMERIC NOT NULL,        -- 公司缴纳金额
  year TEXT NOT NULL,                  -- 计算年份
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cities_city_year ON cities(city_name, year);
CREATE INDEX IF NOT EXISTS idx_salaries_name_month ON salaries(employee_name, month);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON salaries(month);
CREATE INDEX IF NOT EXISTS idx_results_year ON results(year);

-- 创建更新时间触发器函数（PostgreSQL）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间触发器
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略 (RLS)
-- 注意：根据您的实际需求调整权限策略

-- 启用 RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（开发阶段使用）
-- 生产环境中应该根据实际需求设置更严格的权限

-- Cities 表策略
CREATE POLICY "Enable all operations for cities" ON cities
    USING (true)
    WITH CHECK (true);

-- Salaries 表策略
CREATE POLICY "Enable all operations for salaries" ON salaries
    USING (true)
    WITH CHECK (true);

-- Results 表策略
CREATE POLICY "Enable all operations for results" ON results
    USING (true)
    WITH CHECK (true);

-- 插入测试数据（可选，用于测试）
-- 注意：实际使用时请删除这部分，使用用户上传的数据

-- 示例：广州2024年社保标准
INSERT INTO cities (city_name, year, base_min, base_max, rate) VALUES
('广州', '2024', 5284, 26421, 0.15)
ON CONFLICT DO NOTHING;

-- 示例：员工工资数据
INSERT INTO salaries (employee_id, employee_name, month, salary_amount) VALUES
('EMP001', '张三', '202401', 8000),
('EMP001', '张三', '202402', 8000),
('EMP001', '张三', '202403', 8000),
('EMP001', '张三', '202404', 8000),
('EMP001', '张三', '202405', 8000),
('EMP001', '张三', '202406', 8000),
('EMP001', '张三', '202407', 8000),
('EMP001', '张三', '202408', 8000),
('EMP001', '张三', '202409', 8000),
('EMP001', '张三', '202410', 8000),
('EMP001', '张三', '202411', 8000),
('EMP001', '张三', '202412', 8000),
('EMP002', '李四', '202401', 12000),
('EMP002', '李四', '202402', 12000),
('EMP002', '李四', '202403', 12000),
('EMP002', '李四', '202404', 12000),
('EMP002', '李四', '202405', 12000),
('EMP002', '李四', '202406', 12000),
('EMP002', '李四', '202407', 12000),
('EMP002', '李四', '202408', 12000),
('EMP002', '李四', '202409', 12000),
('EMP002', '李四', '202410', 12000),
('EMP002', '李四', '202411', 12000),
('EMP002', '李四', '202412', 12000)
ON CONFLICT DO NOTHING;

-- 查询验证数据
SELECT 'Cities 表数据：' as info;
SELECT * FROM cities;

SELECT 'Salaries 表数据示例（前5条）：' as info;
SELECT * FROM salaries LIMIT 5;

SELECT 'Results 表数据（计算后才会有）：' as info;
SELECT * FROM results;