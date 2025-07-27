export default function TestPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">YouTube Radar - 测试页面</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">诊断步骤：</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>访问 <code className="bg-gray-100 px-1">/api/test</code> 查看环境信息</li>
            <li>在 Vercel 项目设置中检查环境变量</li>
            <li>确保设置了 DATABASE_URL</li>
            <li>查看 Vercel 函数日志</li>
          </ol>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">需要设置的环境变量：</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><code>DATABASE_URL</code> - PostgreSQL 连接字符串</li>
            <li><code>YOUTUBE_API_KEY</code> - YouTube API 密钥</li>
            <li><code>NEXT_PUBLIC_YOUTUBE_API_KEY</code> - 公开的 YouTube API 密钥</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">推荐的数据库服务：</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="https://neon.tech" className="text-blue-600 hover:underline">Neon</a> - 免费 PostgreSQL</li>
            <li><a href="https://supabase.com" className="text-blue-600 hover:underline">Supabase</a> - 免费 PostgreSQL</li>
            <li><a href="https://vercel.com/storage/postgres" className="text-blue-600 hover:underline">Vercel Postgres</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm text-gray-600">
            如果看到此页面，说明 Next.js 应用正常运行，但可能缺少数据库配置。
          </p>
        </div>
      </div>
    </div>
  )
}