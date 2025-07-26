import { NextRequest, NextResponse } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { promises as fs } from "fs"
import path from "path"

// 获取配置
export async function GET(req: NextRequest) {
  try {
    const config = {
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? '******' : '',
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || '',
      youtubeApiKey: process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '',
      hasYoutubeApiKey: !!(process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY),
      databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
      hasEncryptionKey: !!process.env.CHANNEL_ENCRYPTION_KEY,
      hasRedisConfig: !!process.env.KV_REST_API_URL,
      hasCronSecret: !!process.env.CRON_SECRET_TOKEN,
    }
    
    return successResponse(config)
  } catch (error: any) {
    logger.error("Config", "Failed to get config:", error)
    return errorResponse("Failed to get configuration", error.message, 500)
  }
}

// 保存配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { youtubeApiKey } = body
    
    if (!youtubeApiKey) {
      return errorResponse("Missing required fields", "YouTube API key is required", 400)
    }
    
    // 更新 .env.local 文件
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = ''
    
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch (error) {
      // 文件不存在，创建新的
      envContent = ''
    }
    
    // 解析现有的环境变量
    const envLines = envContent.split('\n')
    const envVars = new Map<string, string>()
    
    for (const line of envLines) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        envVars.set(match[1].trim(), match[2].trim())
      }
    }
    
    // 更新YouTube API Key
    envVars.set('YOUTUBE_API_KEY', youtubeApiKey)
    envVars.set('NEXT_PUBLIC_YOUTUBE_API_KEY', youtubeApiKey)
    
    // 重建环境变量文件
    const newEnvContent = Array.from(envVars.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    // 写入文件
    await fs.writeFile(envPath, newEnvContent)
    
    logger.info("Config", "YouTube API key saved successfully")
    
    return successResponse({
      message: "配置已保存。请重启应用以使更改生效。",
      success: true
    })
  } catch (error: any) {
    logger.error("Config", "Failed to save config:", error)
    return errorResponse("Failed to save configuration", error.message, 500)
  }
}

// 测试YouTube API Key
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKey } = body
    
    if (!apiKey) {
      return errorResponse("Missing API key", "API key is required for testing", 400)
    }
    
    // 测试API密钥 - 使用一个知名的YouTube频道
    const testChannelId = "UCX6OQ3DkcsbYNE6H8uQQuVA" // MrBeast频道
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${testChannelId}&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.error) {
      return successResponse({
        valid: false,
        message: `API密钥无效: ${data.error.message}`,
        error: data.error
      })
    }
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0]
      return successResponse({
        valid: true,
        message: 'API密钥有效！',
        testResult: {
          channelTitle: channel.snippet.title,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount
        }
      })
    }
    
    return successResponse({
      valid: false,
      message: '无法验证API密钥'
    })
    
  } catch (error: any) {
    logger.error("Config", "Failed to test API key:", error)
    return errorResponse("Failed to test API key", error.message, 500)
  }
}