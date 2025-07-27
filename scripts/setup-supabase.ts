import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

console.log('🚀 Supabase 数据库设置助手\n')

// 示例连接字符串格式
const exampleUrl = 'postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres'

console.log('📋 Supabase 连接字符串格式：')
console.log(exampleUrl)
console.log('\n请确保：')
console.log('1. 将 [YOUR-PASSWORD] 替换为您的实际密码')
console.log('2. 使用您项目的实际主机名（db.xxxx.supabase.co）')

const currentUrl = process.env.DATABASE_URL

if (!currentUrl) {
  console.log('\n❌ DATABASE_URL 未设置')
  console.log('\n请按以下步骤操作：')
  console.log('1. 在 Supabase 创建项目')
  console.log('2. 获取连接字符串')
  console.log('3. 更新 .env 和 .env.local 文件')
  process.exit(1)
}

console.log('\n🔍 当前配置：')
try {
  const url = new URL(currentUrl)
  console.log('- 用户:', url.username)
  console.log('- 主机:', url.hostname)
  console.log('- 数据库:', url.pathname.substring(1))
  console.log('- 是否为 Supabase:', url.hostname.includes('supabase.co') ? '✅ 是' : '❌ 否')
} catch (e) {
  console.log('❌ 无效的连接字符串')
}

// 测试连接函数
async function testSupabaseConnection() {
  console.log('\n🔄 测试数据库连接...')
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  try {
    await prisma.$connect()
    console.log('✅ 连接成功！')
    
    // 测试查询
    const result = await prisma.$queryRaw`SELECT current_database(), version()`
    console.log('✅ 数据库信息:', result)
    
    // 初始化数据库
    console.log('\n📦 准备初始化数据库...')
    console.log('运行以下命令：')
    console.log('1. npm run db:push  # 创建表结构')
    console.log('2. npm run db:seed  # 添加示例数据（可选）')
    
  } catch (error: any) {
    console.error('\n❌ 连接失败！')
    console.error('错误:', error.message)
    
    if (error.message.includes('password')) {
      console.log('\n💡 提示：请检查密码是否正确')
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 提示：请检查主机名是否正确')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// 如果已配置 Supabase，测试连接
if (currentUrl && currentUrl.includes('supabase.co')) {
  testSupabaseConnection()
} else {
  console.log('\n⚠️ 请先配置 Supabase 连接字符串')
}