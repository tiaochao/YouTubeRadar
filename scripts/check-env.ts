// 检查环境变量配置
console.log('🔍 环境变量检查\n')

// 检查 DATABASE_URL
const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.log('❌ DATABASE_URL 未设置')
} else {
  console.log('✅ DATABASE_URL 已设置')
  
  // 解析连接字符串（隐藏敏感信息）
  try {
    const url = new URL(dbUrl)
    console.log('  - 协议:', url.protocol)
    console.log('  - 用户:', url.username)
    console.log('  - 密码:', url.password ? '***' + url.password.slice(-4) : '未设置')
    console.log('  - 主机:', url.hostname)
    console.log('  - 端口:', url.port || '5432')
    console.log('  - 数据库:', url.pathname.slice(1))
    console.log('  - SSL:', url.searchParams.get('sslmode'))
  } catch (e) {
    console.log('  ⚠️ 连接字符串格式无效')
  }
}

console.log('\n📋 其他环境变量:')
console.log('  - YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? '已设置' : '未设置')
console.log('  - NEXT_PUBLIC_YOUTUBE_API_KEY:', process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? '已设置' : '未设置')
console.log('  - NODE_ENV:', process.env.NODE_ENV)
console.log('  - VERCEL:', process.env.VERCEL ? '是' : '否')

console.log('\n💡 提示:')
console.log('1. 从 Neon 控制台复制完整的 Pooled Connection 连接字符串')
console.log('2. 确保密码中没有特殊字符，或已正确编码')
console.log('3. 使用 .env.local 文件设置本地环境变量')