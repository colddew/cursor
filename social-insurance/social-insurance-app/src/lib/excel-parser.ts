import * as XLSX from 'xlsx'
import { City, Salary } from './types'

// 解析 cities.xlsx 文件
export function parseCitiesExcel(buffer: ArrayBuffer): Omit<City, 'id'>[] {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch (error) {
    console.error('读取 Excel 文件失败:', error)
    throw new Error('无法读取 Excel 文件，请确保文件格式正确')
  }

  const sheetNames = workbook.SheetNames
  console.log('工作表列表:', sheetNames)

  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Excel 文件中没有工作表')
  }

  const sheetName = sheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  if (!worksheet) {
    throw new Error(`无法读取工作表: ${sheetName}`)
  }

  const data = XLSX.utils.sheet_to_json(worksheet) as any[]
  console.log('Excel 原始数据行数:', data.length)

  console.log('Cities Excel 原始数据:', data.slice(0, 3)) // 调试日志

  const cities: Omit<City, 'id'>[] = data.map((row, index) => {
    // 跳过空的行
    if (!row || Object.keys(row).length === 0) return null

    // 尝试多种可能的列名
    const city_name = String(
      row.city_name ||
      row['城市名'] ||
      row['城市'] ||
      row['cityName'] ||
      row['city_namte'] || // 修正拼写错误
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('city'))] ||
      row[Object.keys(row)[0]] || ''
    ).trim()

    const year = String(
      row.year ||
      row['年份'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('year'))] ||
      row[Object.keys(row)[1]] || ''
    ).trim()

    const base_min = Number(
      row.base_min ||
      row['基数下限'] ||
      row['社保基数下限'] ||
      row['baseMin'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('min'))] ||
      row[Object.keys(row)[2]] || 0
    )

    const base_max = Number(
      row.base_max ||
      row['基数上限'] ||
      row['社保基数上限'] ||
      row['baseMax'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('max'))] ||
      row[Object.keys(row)[3]] || 0
    )

    const rate = Number(
      row.rate ||
      row['比例'] ||
      row['缴纳比例'] ||
      row['缴费比例'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('rate'))] ||
      row[Object.keys(row)[4]] || 0
    )

    return {
      city_name,
      year,
      base_min,
      base_max,
      rate
    }
  }).filter(item => item !== null) as Omit<City, 'id'>[]

  console.log('Cities 解析结果:', cities.slice(0, 3)) // 调试日志

  // 过滤掉无效数据
  const validCities = cities.filter(city => {
    const isValid = city.city_name && city.year && city.base_min > 0 && city.base_max > 0 && city.rate > 0
    if (!isValid) {
      console.log('无效的城市数据:', city)
    }
    return isValid
  })

  return validCities
}

// 解析 salaries.xlsx 文件
export function parseSalariesExcel(buffer: ArrayBuffer): Omit<Salary, 'id'>[] {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch (error) {
    console.error('读取 Excel 文件失败:', error)
    throw new Error('无法读取 Excel 文件，请确保文件格式正确')
  }

  const sheetNames = workbook.SheetNames
  console.log('工作表列表:', sheetNames)

  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Excel 文件中没有工作表')
  }

  const sheetName = sheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  if (!worksheet) {
    throw new Error(`无法读取工作表: ${sheetName}`)
  }

  const data = XLSX.utils.sheet_to_json(worksheet) as any[]
  console.log('Excel 原始数据行数:', data.length)

  console.log('Salaries Excel 原始数据:', data.slice(0, 3)) // 调试日志

  const salaries: Omit<Salary, 'id'>[] = data.map((row, index) => {
    // 跳过空的行
    if (!row || Object.keys(row).length === 0) return null

    // 尝试多种可能的列名
    const employee_id = String(
      row.employee_id ||
      row['员工工号'] ||
      row['工号'] ||
      row['employeeId'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('id'))] ||
      row[Object.keys(row)[0]] || ''
    ).trim()

    const employee_name = String(
      row.employee_name ||
      row['员工姓名'] ||
      row['姓名'] ||
      row['employeeName'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('name'))] ||
      row[Object.keys(row)[1]] || ''
    ).trim()

    const month = String(
      row.month ||
      row['月份'] ||
      row['年月'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('month'))] ||
      row[Object.keys(row)[2]] || ''
    ).trim()

    const salary_amount = Number(
      row.salary_amount ||
      row['工资金额'] ||
      row['工资'] ||
      row['salaryAmount'] ||
      row[Object.keys(row).find(k => k.toString().toLowerCase().includes('salary'))] ||
      row[Object.keys(row)[3]] || 0
    )

    return {
      employee_id,
      employee_name,
      month,
      salary_amount
    }
  }).filter(item => item !== null) as Omit<Salary, 'id'>[]

  console.log('Salaries 解析结果:', salaries.slice(0, 3)) // 调试日志

  // 过滤掉无效数据
  const validSalaries = salaries.filter(salary => {
    const isValid = salary.employee_id && salary.employee_name && salary.month && salary.salary_amount > 0
    if (!isValid) {
      console.log('无效的工资数据:', salary)
    }
    return isValid
  })

  return validSalaries
}