import { NextRequest, NextResponse } from "next/server"
import { YouTubeOAuth } from "@/lib/youtube-analytics-api"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      // 用户拒绝授权
      return NextResponse.redirect(
        new URL('/settings/analytics?error=access_denied', req.url)
      )
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/settings/analytics?error=no_code', req.url)
      )
    }
    
    // 从 cookie 或其他地方获取 client credentials
    // 注意：在实际应用中，这些应该安全地存储在服务器端
    const clientId = req.cookies.get('youtube_analytics_client_id')?.value || ''
    const clientSecret = req.cookies.get('youtube_analytics_client_secret')?.value || ''
    const redirectUri = new URL('/api/auth/youtube/callback', req.url).toString()
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings/analytics?error=missing_credentials', req.url)
      )
    }
    
    // 交换访问令牌
    const tokens = await YouTubeOAuth.exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    )
    
    if (!tokens) {
      return NextResponse.redirect(
        new URL('/settings/analytics?error=token_exchange_failed', req.url)
      )
    }
    
    // 创建响应并设置 cookie
    const response = NextResponse.redirect(
      new URL('/settings/analytics?success=true', req.url)
    )
    
    // 将 refresh token 保存到 cookie（仅用于演示，实际应该保存在数据库）
    response.cookies.set('youtube_analytics_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
    
    // 同时将 client credentials 保存到 cookie，供后续使用
    response.cookies.set('youtube_analytics_client_id', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
    
    response.cookies.set('youtube_analytics_client_secret', clientSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
    
    return response
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/analytics?error=unknown', req.url)
    )
  }
}