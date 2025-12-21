import { NextRequest, NextResponse } from 'next/server'
import { parseCitiesExcel } from '@/lib/excel-parser'
import { citiesService } from '@/lib/db-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '请选择文件' },
        { status: 400 }
      )
    }

    // 检查文件类型
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return NextResponse.json(
        { error: '请上传 Excel 文件 (.xlsx 或 .xls)' },
        { status: 400 }
      )
    }

    // 解析文件
    const buffer = await file.arrayBuffer()
    let cities
    try {
      cities = parseCitiesExcel(buffer)
    } catch (parseError) {
      console.error('解析城市文件失败:', parseError)
      return NextResponse.json(
        { error: `文件解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}` },
        { status: 400 }
      )
    }

    if (cities.length === 0) {
      console.error('No valid cities data parsed from file')
      return NextResponse.json(
        { error: '文件中没有有效数据，请确保Excel文件包含正确的列：城市名、年份、基数下限、基数上限、比例' },
        { status: 400 }
      )
    }

    // 使用 upsert 插入或更新数据（根据 city_name 和 year 判断）
    await citiesService.upsert(cities)

    return NextResponse.json({
      message: `成功导入 ${cities.length} 条城市社保标准数据`,
      count: cities.length
    })
  } catch (error) {
    console.error('上传城市数据失败:', error)
    return NextResponse.json(
      { error: '上传失败，请检查文件格式' },
      { status: 500 }
    )
  }
}