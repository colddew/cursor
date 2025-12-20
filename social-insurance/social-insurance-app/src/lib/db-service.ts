import { supabase } from './supabase'
import { City, Salary, Result } from './types'

// Cities 表操作
export const citiesService = {
  // 批量插入或更新城市数据
  async upsert(cities: Omit<City, 'id'>[]) {
    const { error } = await supabase
      .from('cities')
      .upsert(cities, {
        onConflict: 'city_name, year'
      })
    if (error) throw error
  },

  // 获取指定城市的社保标准
  async getCityStandard(cityName: string, year: string): Promise<City | null> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('city_name', cityName)
      .eq('year', year)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// Salaries 表操作
export const salariesService = {
  // 批量插入或更新工资数据
  async upsert(salaries: Omit<Salary, 'id'>[]) {
    const { error } = await supabase
      .from('salaries')
      .upsert(salaries, {
        onConflict: 'employee_id, month'
      })
    if (error) throw error
  },

  // 获取指定年份的工资数据
  async getSalariesByYear(year: string): Promise<Salary[]> {
    const { data, error } = await supabase
      .from('salaries')
      .select('*')
      .like('month', `${year}%`)

    if (error) throw error
    return data || []
  }
}

// Results 表操作
export const resultsService = {
  // 批量插入或更新计算结果
  async upsert(results: Omit<Result, 'id'>[]) {
    const { error } = await supabase
      .from('results')
      .upsert(results, {
        onConflict: 'employee_name, year'
      })
    if (error) throw error
  },

  // 获取所有计算结果
  async getAll(): Promise<Result[]> {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error
    return data || []
  }
}