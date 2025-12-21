import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          五险一金计算器
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          根据员工工资数据和社保标准，快速计算公司应缴纳的社保公积金费用
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 数据上传卡片 */}
          <Link
            href="/upload"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">数据上传</h2>
              <p className="text-gray-600">
                上传社保标准文件和员工工资数据，为计算做准备
              </p>
            </div>
          </Link>

          {/* 结果查询卡片 */}
          <Link
            href="/results"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a3 3 0 003 3h0a3 3 0 003-3v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v7m3-2h6" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">结果查询</h2>
              <p className="text-gray-600">
                查看已计算的社保公积金缴纳结果
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
