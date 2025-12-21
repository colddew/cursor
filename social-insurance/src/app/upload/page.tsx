'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 上传社保标准文件
  const handleCitiesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-cities', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败，请重试' })
    } finally {
      setUploading(false)
    }
  }

  // 上传工资数据文件
  const handleSalariesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-salaries', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败，请重试' })
    } finally {
      setUploading(false)
    }
  }

  // 执行计算
  const handleCalculate = async () => {
    const yearSelect = document.getElementById('year-select') as HTMLSelectElement
    const year = yearSelect?.value

    if (!year) {
      setMessage({ type: 'error', text: '请选择计算年份' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '计算失败，请重试' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 返回首页链接 */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">数据上传与管理</h1>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-1 gap-6 max-w-2xl">
          {/* 上传社保标准文件 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. 上传社保标准文件
            </h2>
            <p className="text-gray-600 mb-4">
              请上传 cities.xlsx 文件，包含城市社保基数和缴纳比例信息
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleCitiesUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            <div className="mt-2 text-xs text-gray-500">
              文件格式要求：city_name, year, base_min, base_max, rate
            </div>
          </div>

          {/* 上传工资数据文件 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. 上传工资数据文件
            </h2>
            <p className="text-gray-600 mb-4">
              请上传 salaries.xlsx 文件，包含员工工资信息
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleSalariesUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            <div className="mt-2 text-xs text-gray-500">
              文件格式要求：employee_id, employee_name, month (YYYYMM), salary_amount
            </div>
          </div>

          {/* 执行计算 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. 执行计算
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择计算年份
                </label>
                <select
                  id="year-select"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploading}
                >
                  <option value="">请选择年份</option>
                  <option value="2024">2024年</option>
                  <option value="2025">2025年</option>
                </select>
              </div>
              <button
                onClick={handleCalculate}
                disabled={uploading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {uploading ? '处理中...' : '执行计算'}
              </button>
              <p className="text-sm text-gray-500">
                计算完成后可在 <Link href="/results" className="text-blue-600 hover:underline">结果查询页面</Link> 查看
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}