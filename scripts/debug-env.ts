import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'

console.log('🔍 调试环境变量加载\n')

// 检查文件是否存在
const envPath = resolve(process.cwd(), '.env')
const envLocalPath = resolve(process.cwd(), '.env.local')

console.log('.env 文件存在:', fs.existsSync(envPath))
console.log('.env.local 文件存在:', fs.existsSync(envLocalPath))

// 读取文件内容
console.log('\n📄 .env 文件内容:')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  console.log(content.substring(0, 200) + '...')
}

// 加载环境变量
const result1 = dotenv.config({ path: envLocalPath })
const result2 = dotenv.config({ path: envPath })

console.log('\n✅ 加载结果:')
console.log('.env.local 加载:', result1.error ? '失败' : '成功')
console.log('.env 加载:', result2.error ? '失败' : '成功')

console.log('\n🔑 DATABASE_URL:')
const dbUrl = process.env.DATABASE_URL
if (dbUrl) {
  console.log('长度:', dbUrl.length)
  console.log('前30字符:', dbUrl.substring(0, 30))
  console.log('后30字符:', dbUrl.substring(dbUrl.length - 30))
  
  // 尝试解析
  try {
    const url = new URL(dbUrl)
    console.log('\n解析成功:')
    console.log('- 用户:', url.username)
    console.log('- 密码长度:', url.password.length)
    console.log('- 主机:', url.hostname)
  } catch (e) {
    console.log('解析失败:', e)
  }
} else {
  console.log('未设置!')
}