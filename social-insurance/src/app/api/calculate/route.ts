import { NextRequest, NextResponse } from 'next/server'
import { calculateSocialInsurance } from '@/lib/calculator'

export async function POST(request: NextRequest) {
  try {
    const { year } = await request.json()

    if (!year) {
      return NextResponse.json(
        { error: '请选择计算年份' },
        { status: 400 }
      )
    }

    // 执行计算
    const result = await calculateSocialInsurance(year)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('计算失败:', error)
    return NextResponse.json(
      { error: error.message || '计算失败' },
      { status: 500 }
    )
  }
}