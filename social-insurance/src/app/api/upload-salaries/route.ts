import { NextRequest, NextResponse } from 'next/server'
import { parseSalariesExcel } from '@/lib/excel-parser'
import { salariesService } from '@/lib/db-service'

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
    let salaries
    try {
      salaries = parseSalariesExcel(buffer)
    } catch (parseError) {
      console.error('解析工资文件失败:', parseError)
      return NextResponse.json(
        { error: `文件解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}` },
        { status: 400 }
      )
    }

    if (salaries.length === 0) {
      console.error('No valid salaries data parsed from file')
      return NextResponse.json(
        { error: '文件中没有有效数据，请确保Excel文件包含正确的列：员工工号、员工姓名、月份(YYYYMM)、工资金额' },
        { status: 400 }
      )
    }

    // 使用 upsert 插入或更新数据（根据 employee_id 和 month 判断）
    await salariesService.upsert(salaries)

    return NextResponse.json({
      message: `成功导入 ${salaries.length} 条工资数据`,
      count: salaries.length
    })
  } catch (error) {
    console.error('上传工资数据失败:', error)
    return NextResponse.json(
      { error: '上传失败，请检查文件格式' },
      { status: 500 }
    )
  }
}