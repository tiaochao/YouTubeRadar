// 环境变量验证
export function validateEnv() {
  // 跳过验证如果设置了 SKIP_ENV_VALIDATION
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return {
      valid: true,
      missing: [],
      error: null
    }
  }
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  }

  const missing: string[] = []
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`
    
    // 在开发环境下，在控制台输出详细信息
    if (process.env.NODE_ENV === 'development') {
      console.error('Environment validation failed:')
      console.error(errorMessage)
      console.error('Please check your .env.local file')
    }
    
    return {
      valid: false,
      missing,
      error: errorMessage
    }
  }

  // 验证 DATABASE_URL 格式
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    return {
      valid: false,
      missing: [],
      error: 'DATABASE_URL must be a valid PostgreSQL connection string'
    }
  }

  return {
    valid: true,
    missing: [],
    error: null
  }
}

// 获取安全的环境变量（用于客户端）
export function getPublicEnv() {
  return {
    NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }
}