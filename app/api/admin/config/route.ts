import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-response"
import { writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"

const ENV_FILE_PATH = join(process.cwd(), '.env.local')

// 获取当前配置
export async function GET() {
  try {
    const config = {
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      databaseUrl: process.env.DATABASE_URL || '',
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      hasRedisConfig: !!process.env.KV_REST_API_URL,
      hasCronSecret: !!process.env.CRON_SECRET_TOKEN,
      // 不返回敏感信息
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? '••••••••' : '',
      encryptionKey: process.env.ENCRYPTION_KEY ? '••••••••' : '',
      redisUrl: process.env.KV_REST_API_URL ? '••••••••' : '',
      redisToken: process.env.KV_REST_API_TOKEN ? '••••••••' : '',
      cronSecret: process.env.CRON_SECRET_TOKEN ? '••••••••' : '',
    }

    return successResponse(config)
  } catch (error: any) {
    return errorResponse("Failed to get configuration", error.message, 500)
  }
}

// 更新配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      googleClientId,
      googleClientSecret,
      googleRedirectUri,
      databaseUrl,
      encryptionKey,
      redisUrl,
      redisToken,
      cronSecret
    } = body

    // 读取现有的.env.local文件
    let envContent = ''
    if (existsSync(ENV_FILE_PATH)) {
      envContent = readFileSync(ENV_FILE_PATH, 'utf8')
    }

    // 更新环境变量
    const updateEnvVar = (key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      const line = `${key}="${value}"`
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, line)
      } else {
        envContent += `\n${line}`
      }
    }

    // 只更新提供的值
    if (googleClientId !== undefined) updateEnvVar('GOOGLE_CLIENT_ID', googleClientId)
    if (googleClientSecret !== undefined && googleClientSecret !== '••••••••') {
      updateEnvVar('GOOGLE_CLIENT_SECRET', googleClientSecret)
    }
    if (googleRedirectUri !== undefined) updateEnvVar('GOOGLE_REDIRECT_URI', googleRedirectUri)
    if (databaseUrl !== undefined) updateEnvVar('DATABASE_URL', databaseUrl)
    if (encryptionKey !== undefined && encryptionKey !== '••••••••') {
      updateEnvVar('ENCRYPTION_KEY', encryptionKey)
    }
    if (redisUrl !== undefined && redisUrl !== '••••••••') {
      updateEnvVar('KV_REST_API_URL', redisUrl)
    }
    if (redisToken !== undefined && redisToken !== '••••••••') {
      updateEnvVar('KV_REST_API_TOKEN', redisToken)
    }
    if (cronSecret !== undefined && cronSecret !== '••••••••') {
      updateEnvVar('CRON_SECRET_TOKEN', cronSecret)
    }

    // 写入文件
    writeFileSync(ENV_FILE_PATH, envContent.trim() + '\n')

    return successResponse({ 
      message: "Configuration updated successfully. Please restart the application for changes to take effect.",
      requiresRestart: true 
    })
  } catch (error: any) {
    return errorResponse("Failed to update configuration", error.message, 500)
  }
}

// 验证OAuth配置
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { googleClientId, googleClientSecret } = body

    if (!googleClientId || !googleClientSecret) {
      return errorResponse("Missing required OAuth credentials", "", 400)
    }

    // 这里可以添加对Google OAuth凭据的验证逻辑
    // 例如尝试创建OAuth客户端或验证凭据格式
    
    const { google } = await import('googleapis')
    
    try {
      const oauth2Client = new google.auth.OAuth2(
        googleClientId,
        googleClientSecret,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
      )
      
      // 尝试生成授权URL来验证凭据有效性
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/yt-analytics.readonly',
          'openid',
          'email'
        ]
      })

      return successResponse({ 
        valid: true, 
        message: "OAuth credentials are valid",
        authUrl: authUrl.substring(0, 100) + "..." // 截断URL用于验证
      })
    } catch (authError: any) {
      return errorResponse("Invalid OAuth credentials", authError.message, 400)
    }
  } catch (error: any) {
    return errorResponse("Failed to validate OAuth credentials", error.message, 500)
  }
}