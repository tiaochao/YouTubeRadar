import { NextRequest, NextResponse } from "next/server"
import { YouTubeOAuth } from "@/lib/youtube-analytics-api"

export async function GET(req: NextRequest) {
  try {
    console.log('[OAuth Callback] Request received:', {
      url: req.url,
      cookies: req.cookies.getAll(),
      params: Object.fromEntries(req.nextUrl.searchParams)
    })
    
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    console.log('[OAuth Callback] Parsed params:', { code: !!code, error })
    
    if (error) {
      console.log('[OAuth Callback] OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings/analytics?error=access_denied', req.url)
      )
    }
    
    if (!code) {
      console.log('[OAuth Callback] No code parameter')
      return NextResponse.redirect(
        new URL('/settings/analytics?error=no_code', req.url)
      )
    }
    
    // 从 cookie 或其他地方获取 client credentials
    // 注意：在实际应用中，这些应该安全地存储在服务器端
    const clientId = req.cookies.get('youtube_analytics_client_id')?.value || ''
    const clientSecret = req.cookies.get('youtube_analytics_client_secret')?.value || ''
    const redirectUri = new URL('/api/auth/youtube/callback', req.url).toString()
    
    console.log('[OAuth Callback] Credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri
    })
    
    if (!clientId || !clientSecret) {
      console.log('[OAuth Callback] Missing credentials')
      return NextResponse.redirect(
        new URL('/settings/analytics?error=missing_credentials', req.url)
      )
    }
    
    // 交换访问令牌
    console.log('[OAuth Callback] Exchanging code for token...')
    const tokens = await YouTubeOAuth.exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    )
    
    console.log('[OAuth Callback] Token exchange result:', {
      hasTokens: !!tokens,
      hasRefreshToken: !!(tokens?.refresh_token),
      hasAccessToken: !!(tokens?.access_token)
    })
    
    if (!tokens) {
      console.log('[OAuth Callback] Token exchange failed')
      return NextResponse.redirect(
        new URL('/settings/analytics?error=token_exchange_failed', req.url)
      )
    }
    
    // 创建响应并设置 cookie
    const response = NextResponse.redirect(
      new URL('/settings/analytics?success=true', req.url)
    )
    
    console.log('[OAuth Callback] Setting cookies...')
    
    // 将 refresh token 保存到 cookie（仅用于演示，实际应该保存在数据库）
    response.cookies.set('youtube_analytics_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })
    
    // 同时将 client credentials 保存到 cookie，供后续使用
    response.cookies.set('youtube_analytics_client_id', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })
    
    response.cookies.set('youtube_analytics_client_secret', clientSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })
    
    console.log('[OAuth Callback] Cookies set, redirecting to success page')
    return response
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/analytics?error=unknown', req.url)
    )
  }
}