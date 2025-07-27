import { NextResponse } from 'next/server'

export async function GET() {
  // 收集环境信息
  const envInfo = {
    // 检查环境变量（不暴露实际值）
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlLength: process.env.DATABASE_URL?.length || 0,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 10) || 'not set',
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
    hasPublicYoutubeKey: !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    
    // 环境信息
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    
    // 时间戳
    timestamp: new Date().toISOString()
  }

  // 基本的数据库连接测试
  let dbTest = {
    canImportPrisma: false,
    canCreateClient: false,
    error: null as any
  }

  try {
    // 尝试导入 Prisma
    const { PrismaClient } = await import('@prisma/client')
    dbTest.canImportPrisma = true

    // 尝试创建客户端
    if (process.env.DATABASE_URL) {
      const prisma = new PrismaClient()
      dbTest.canCreateClient = true
      
      // 尝试断开连接
      await prisma.$disconnect()
    }
  } catch (error: any) {
    dbTest.error = {
      message: error.message,
      name: error.name,
      code: error.code
    }
  }

  return NextResponse.json({
    status: 'test endpoint',
    env: envInfo,
    dbTest: dbTest
  })
}