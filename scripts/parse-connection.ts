import * as dotenv from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

// 解析和验证连接字符串
const connectionString = process.env.DATABASE_URL || ''

console.log('🔍 连接字符串分析\n')
console.log('原始字符串:', connectionString)
console.log('长度:', connectionString.length)

try {
  const url = new URL(connectionString)
  
  console.log('\n📋 解析结果:')
  console.log('- 协议:', url.protocol)
  console.log('- 用户名:', url.username)
  console.log('- 密码长度:', url.password.length)
  console.log('- 密码前4位:', url.password.substring(0, 4) + '...')
  console.log('- 密码后4位:', '...' + url.password.substring(url.password.length - 4))
  console.log('- 主机:', url.hostname)
  console.log('- 端口:', url.port || '5432')
  console.log('- 数据库:', url.pathname.substring(1))
  console.log('- 查询参数:', url.search)
  
  // 检查特殊字符
  const hasSpecialChars = /[^a-zA-Z0-9_-]/.test(url.password)
  console.log('- 密码包含特殊字符:', hasSpecialChars)
  
  // 重建连接字符串
  const rebuilt = `postgresql://${url.username}:${url.password}@${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}${url.search}`
  console.log('\n✅ 重建的连接字符串:')
  console.log(rebuilt)
  
} catch (error) {
  console.error('❌ 解析失败:', error)
}