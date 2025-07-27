import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const health = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: {
        status: 'unknown',
        message: '',
        hasUrl: false,
      },
      youtube: {
        hasApiKey: false,
        hasPublicApiKey: false,
      },
      deployment: {
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        region: process.env.VERCEL_REGION || 'unknown',
      }
    }
  }

  // 检查环境变量
  health.checks.database.hasUrl = !!process.env.DATABASE_URL
  health.checks.youtube.hasApiKey = !!process.env.YOUTUBE_API_KEY
  health.checks.youtube.hasPublicApiKey = !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

  // 测试数据库连接
  try {
    if (!process.env.DATABASE_URL) {
      health.checks.database.status = 'error'
      health.checks.database.message = 'DATABASE_URL not configured'
    } else {
      // 尝试查询数据库
      const startTime = Date.now()
      await db.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime
      
      health.checks.database.status = 'connected'
      health.checks.database.message = `Connected successfully (${responseTime}ms)`
      
      // 获取表信息
      const channelCount = await db.channel.count()
      const videoCount = await db.video.count()
      
      health.checks.database.tables = {
        channels: channelCount,
        videos: videoCount
      }
    }
  } catch (error: any) {
    health.checks.database.status = 'error'
    health.checks.database.message = error.message || 'Unknown database error'
    health.checks.database.error = {
      code: error.code,
      name: error.name,
      // 在生产环境中隐藏敏感信息
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }
  }

  // 确定总体状态
  if (health.checks.database.status === 'error') {
    health.status = 'unhealthy'
  } else if (!health.checks.youtube.hasApiKey || !health.checks.youtube.hasPublicApiKey) {
    health.status = 'degraded'
  } else {
    health.status = 'healthy'
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503
  })
}