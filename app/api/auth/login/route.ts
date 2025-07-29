import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空")
})

export async function POST(req: NextRequest) {
  try {
    console.log('Login request received')
    
    const body = await req.json()
    console.log('Login attempt for username:', body.username)
    
    // 验证请求数据
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      console.error('Login validation failed:', validation.error.errors)
      return NextResponse.json({
        ok: false,
        error: validation.error.errors[0].message
      }, { status: 400 })
    }

    const { username, password } = validation.data
    
    // 验证用户登录
    console.log('Attempting login for user:', username)
    const result = await AuthService.login(username, password)
    
    if (!result) {
      console.log('Login failed for user:', username)
      return NextResponse.json({
        ok: false,
        error: "用户名或密码错误"
      }, { status: 401 })
    }

    const { user, token } = result
    console.log('Login successful for user:', username)
    
    // 创建响应
    const response = NextResponse.json({
      ok: true,
      data: {
        user,
        token,
        message: "登录成功"
      }
    })

    // 将token设置为HttpOnly cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Login error:', error)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "登录失败",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}