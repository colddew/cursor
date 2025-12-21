// Cities table type
export interface City {
  id: number
  city_name: string
  year: string
  base_min: number
  base_max: number
  rate: number
}

// Salaries table type
export interface Salary {
  id: number
  employee_id: string
  employee_name: string
  month: string  // YYYYMM format
  salary_amount: number
}

// Results table type
export interface Result {
  id: number
  employee_name: string
  year: string
  avg_salary: number
  contribution_base: number
  company_fee: number
}