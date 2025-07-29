import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空")
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 验证请求数据
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        ok: false,
        error: validation.error.errors[0].message
      }, { status: 400 })
    }

    const { username, password } = validation.data
    
    // 验证用户登录
    const result = await AuthService.login(username, password)
    
    if (!result) {
      return NextResponse.json({
        ok: false,
        error: "用户名或密码错误"
      }, { status: 401 })
    }

    const { user, token } = result
    
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
    
    return NextResponse.json({
      ok: false,
      error: error.message || "登录失败"
    }, { status: 500 })
  }
}