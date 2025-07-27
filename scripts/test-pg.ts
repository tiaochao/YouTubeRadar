import { Client } from 'pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

async function testPgConnection() {
  const connectionString = process.env.DATABASE_URL
  
  console.log('🔍 使用 pg 库测试连接...')
  console.log('连接字符串长度:', connectionString?.length)
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL 未设置')
    return
  }

  const client = new Client({
    connectionString: connectionString,
  })

  try {
    console.log('\n1️⃣ 尝试连接...')
    await client.connect()
    console.log('✅ 连接成功！')

    console.log('\n2️⃣ 执行测试查询...')
    const result = await client.query('SELECT NOW()')
    console.log('✅ 查询成功:', result.rows[0])

    console.log('\n3️⃣ 检查数据库版本...')
    const version = await client.query('SELECT version()')
    console.log('✅ PostgreSQL 版本:', version.rows[0].version)

  } catch (error: any) {
    console.error('\n❌ 连接失败！')
    console.error('错误代码:', error.code)
    console.error('错误信息:', error.message)
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 提示: 无法解析主机名，请检查网络连接')
    } else if (error.code === '28P01') {
      console.error('\n💡 提示: 密码认证失败')
      console.error('   1. 确认密码是否正确')
      console.error('   2. 尝试在 Neon 控制台重置密码')
    }
  } finally {
    await client.end()
  }
}

testPgConnection().catch(console.error)