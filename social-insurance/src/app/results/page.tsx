'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('获取结果失败:', error)
      alert('获取结果失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', marginBottom: '32px', display: 'inline-block' }}>
          ← 返回首页
        </Link>

        <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px' }}>计算结果</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div>加载中...</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>暂无计算结果</p>
            <Link
              href="/upload"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              去上传数据
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    员工姓名
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    年份
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    年度月平均工资
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    缴费基数
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    公司缴纳金额
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      {result.employee_name}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      {result.year}年
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      ¥{result.avg_salary?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      ¥{result.contribution_base?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      ¥{result.company_fee?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}