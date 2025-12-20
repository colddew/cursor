import { citiesService, salariesService, resultsService } from './db-service'
import { Salary, Result } from './types'

// 计算社保公积金
export async function calculateSocialInsurance(year: string, cityName: string = '广州') {
  try {
    // 1. 获取城市的社保标准
    const cityStandard = await citiesService.getCityStandard(cityName, year)
    if (!cityStandard) {
      throw new Error(`未找到 ${cityName} ${year} 年的社保标准`)
    }

    // 2. 获取该年度的所有工资数据
    const salaries = await salariesService.getSalariesByYear(year)
    if (salaries.length === 0) {
      throw new Error(`未找到 ${year} 年的工资数据`)
    }

    // 3. 按员工分组计算平均工资
    const employeeSalaries = new Map<string, number[]>()

    salaries.forEach(salary => {
      if (!employeeSalaries.has(salary.employee_name)) {
        employeeSalaries.set(salary.employee_name, [])
      }
      employeeSalaries.get(salary.employee_name)!.push(salary.salary_amount)
    })

    // 4. 计算每个员工的结果
    const results: Omit<Result, 'id'>[] = []

    for (const [employeeName, monthlySalaries] of employeeSalaries.entries()) {
      // 计算年度月平均工资
      const avgSalary = monthlySalaries.reduce((sum, salary) => sum + salary, 0) / monthlySalaries.length

      // 确定缴费基数
      let contributionBase: number
      if (avgSalary < cityStandard.base_min) {
        contributionBase = cityStandard.base_min
      } else if (avgSalary > cityStandard.base_max) {
        contributionBase = cityStandard.base_max
      } else {
        contributionBase = avgSalary
      }

      // 计算公司缴纳金额
      const companyFee = contributionBase * cityStandard.rate

      results.push({
        employee_name: employeeName,
        year: year,
        avg_salary: Math.round(avgSalary * 100) / 100, // 保留两位小数
        contribution_base: Math.round(contributionBase * 100) / 100,
        company_fee: Math.round(companyFee * 100) / 100
      })
    }

    // 5. 使用 upsert 插入或更新结果（根据 employee_name 和 year 判断）
    await resultsService.upsert(results)

    return {
      success: true,
      message: `成功计算 ${results.length} 名员工的社保费用`,
      results
    }
  } catch (error) {
    console.error('计算社保费用失败:', error)
    throw error
  }
}