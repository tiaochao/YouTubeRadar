import { NextResponse } from "next/server"

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || ''
  
  // 检查并清理密钥
  let cleanedKey = serviceKey
  
  // 移除可能的前缀
  if (cleanedKey.includes('sb_secret_')) {
    const parts = cleanedKey.split('.')
    if (parts.length > 3) {
      // 找到 JWT 的开始位置（eyJ...）
      const jwtStart = cleanedKey.indexOf('eyJ')
      if (jwtStart !== -1) {
        cleanedKey = cleanedKey.substring(jwtStart)
      }
    }
  }
  
  // 移除可能的后缀
  const jwtParts = cleanedKey.split('.')
  if (jwtParts.length === 3) {
    // 检查最后一部分是否包含额外的内容
    const lastPart = jwtParts[2]
    if (lastPart.includes('_')) {
      // 可能是 xxx.yyy.zzz_sb_secret_ABC 格式
      jwtParts[2] = lastPart.split('_')[0]
      cleanedKey = jwtParts.join('.')
    }
  }
  
  // 测试清理后的密钥
  const url = 'https://ufcszgnfhiurfzrknofr.supabase.co'
  
  try {
    const response = await fetch(`${url}/rest/v1/channels?select=count`, {
      headers: {
        'apikey': cleanedKey,
        'Authorization': `Bearer ${cleanedKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    })
    
    const responseText = await response.text()
    
    return NextResponse.json({
      originalLength: serviceKey.length,
      cleanedLength: cleanedKey.length,
      cleaned: cleanedKey !== serviceKey,
      testResult: {
        status: response.status,
        ok: response.ok,
        body: responseText
      },
      suggestion: response.ok 
        ? 'Key is working! Update SUPABASE_SERVICE_KEY in Vercel with the cleaned key.' 
        : 'Key still not working. Please copy the service_role key from Supabase Dashboard again.',
      cleanedKeyPreview: cleanedKey.substring(0, 20) + '...' + cleanedKey.substring(cleanedKey.length - 20)
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      cleanedKeyPreview: cleanedKey.substring(0, 20) + '...' + cleanedKey.substring(cleanedKey.length - 20)
    }, { status: 500 })
  }
}