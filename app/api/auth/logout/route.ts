import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // 创建响应
    const response = NextResponse.json({
      ok: true,
      message: "登出成功"
    })

    // 清除认证cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Logout error:', error)
    
    return NextResponse.json({
      ok: false,
      error: "登出失败"
    }, { status: 500 })
  }
}