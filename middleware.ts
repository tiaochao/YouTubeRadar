import { NextResponse, type NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export async function middleware(req: NextRequest) {
  // Apply cron authentication to /api/cron routes
  if (req.nextUrl.pathname.startsWith("/api/cron/")) {
    const cronToken = req.headers.get("X-CRON-TOKEN")
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken) {
      logger.error("Middleware", "CRON_SECRET_TOKEN environment variable is not set.")
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 })
    }

    if (!cronToken || cronToken !== expectedToken) {
      logger.warn("Middleware", "Unauthorized cron access attempt.", {
        path: req.nextUrl.pathname,
        ip: req.ip,
      })
      return NextResponse.json({ error: "Unauthorized", details: "Invalid X-CRON-TOKEN header." }, { status: 401 })
    }
  }

  // Apply user authentication to protected routes
  const protectedRoutes = [
    '/',           // 主页需要登录
    '/settings',   // 设置页面需要登录
    '/analytics'   // 分析页面需要登录
  ]

  const publicRoutes = [
    '/login',      // 登录页面
    '/api/auth'    // 认证API路由
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
  )
  
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // 如果是受保护的路由，检查用户认证
  if (isProtectedRoute && !isPublicRoute) {
    const token = req.cookies.get('auth_token')?.value
    
    if (!token) {
      // 没有token，重定向到登录页面
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 这里可以添加token验证逻辑，但为了避免在middleware中进行复杂的异步操作
    // 我们将token验证留给各个API路由处理
  }

  // 如果已登录用户访问登录页面，重定向到主页
  if (req.nextUrl.pathname === '/login') {
    const token = req.cookies.get('auth_token')?.value
    if (token) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/cron/:path*",
    "/",
    "/settings/:path*",
    "/analytics/:path*",
    "/login"
  ],
}
