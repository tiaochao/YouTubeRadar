import { NextResponse } from "next/server"

export async function GET() {
  // 只显示密钥的前后部分，中间用星号隐藏
  const maskKey = (key: string | undefined) => {
    if (!key) return 'not set'
    if (key.length < 20) return key
    return key.substring(0, 10) + '...' + key.substring(key.length - 10)
  }
  
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  
  // 尝试解析 JWT 来查看是否格式正确
  let keyInfo = {}
  if (serviceKey) {
    try {
      const parts = serviceKey.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        keyInfo = {
          role: payload.role,
          ref: payload.ref,
          iat: new Date(payload.iat * 1000).toISOString(),
          exp: new Date(payload.exp * 1000).toISOString()
        }
      }
    } catch (e) {
      keyInfo = { error: 'Invalid JWT format' }
    }
  }
  
  return NextResponse.json({
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || 'not set',
      SUPABASE_SERVICE_KEY: maskKey(serviceKey),
      DATABASE_URL: maskKey(process.env.DATABASE_URL),
      keyLength: serviceKey?.length || 0,
      keyInfo
    },
    recommendation: !serviceKey || serviceKey.includes('sb_secret_') 
      ? 'Service key appears to be in wrong format. It should be a JWT token without sb_secret_ prefix.' 
      : 'Key format looks correct'
  })
}