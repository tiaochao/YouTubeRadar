import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

async function testConnection() {
  console.log('🔍 测试数据库连接...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...')
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  try {
    // 测试基本连接
    console.log('\n1️⃣ 测试基本连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功！')

    // 测试查询
    console.log('\n2️⃣ 测试数据库查询...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ 查询测试成功:', result)

    // 检查表是否存在
    console.log('\n3️⃣ 检查数据库表...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[]
    
    console.log('📋 找到的表:')
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`)
    })

    // 计数统计
    console.log('\n4️⃣ 数据统计...')
    try {
      const channelCount = await prisma.channel.count()
      console.log(`  - 频道数量: ${channelCount}`)
    } catch (e) {
      console.log('  - 频道表不存在或为空')
    }

    try {
      const videoCount = await prisma.video.count()
      console.log(`  - 视频数量: ${videoCount}`)
    } catch (e) {
      console.log('  - 视频表不存在或为空')
    }

    console.log('\n✨ 所有测试通过！数据库连接正常。')

  } catch (error: any) {
    console.error('\n❌ 数据库连接失败！')
    console.error('错误类型:', error.constructor.name)
    console.error('错误信息:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n💡 提示: 无法连接到数据库服务器')
      console.error('   请检查:')
      console.error('   1. 数据库服务器是否运行')
      console.error('   2. 连接字符串是否正确')
      console.error('   3. 防火墙设置')
    } else if (error.code === 'P1002') {
      console.error('\n💡 提示: 连接超时')
      console.error('   数据库服务器可能已休眠，请在 Neon 控制台激活')
    } else if (error.message.includes('password')) {
      console.error('\n💡 提示: 认证失败')
      console.error('   请检查用户名和密码是否正确')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testConnection().catch(console.error)