import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret } = await req.json()
    
    console.log('[OAuth Prepare] Setting client credentials cookies:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    })
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing client credentials' },
        { status: 400 }
      )
    }
    
    const response = NextResponse.json({ success: true })
    
    // 设置 client credentials 到 cookies，供 OAuth 回调使用
    response.cookies.set('youtube_analytics_client_id', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour - 足够完成 OAuth 流程
      path: '/'
    })
    
    response.cookies.set('youtube_analytics_client_secret', clientSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    })
    
    console.log('[OAuth Prepare] Client credentials cookies set successfully')
    return response
    
  } catch (error) {
    console.error('[OAuth Prepare] Error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare OAuth' },
      { status: 500 }
    )
  }
}