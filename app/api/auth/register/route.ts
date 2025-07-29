import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { z } from "zod"

const registerSchema = z.object({
  username: z.string().min(3, "用户名至少3个字符").max(50, "用户名最多50个字符"),
  password: z.string().min(6, "密码至少6个字符").max(100, "密码最多100个字符"),
  email: z.string().email("邮箱格式不正确").optional().or(z.literal(""))
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 验证请求数据
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        ok: false,
        error: validation.error.errors[0].message
      }, { status: 400 })
    }

    const { username, password, email } = validation.data
    
    // 注册用户
    const user = await AuthService.register(
      username, 
      password, 
      email || undefined
    )

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: "注册失败"
      }, { status: 500 })
    }

    // 返回成功响应（不包含密码哈希）
    const { passwordHash, ...userWithoutPassword } = user
    
    return NextResponse.json({
      ok: true,
      data: {
        user: userWithoutPassword,
        message: "注册成功"
      }
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "注册失败"
    }, { status: 400 })
  }
}