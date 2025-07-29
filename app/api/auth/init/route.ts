import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // 创建默认管理员用户
    await AuthService.createDefaultAdmin()
    
    return NextResponse.json({
      ok: true,
      message: "认证系统初始化完成"
    })

  } catch (error: any) {
    console.error('Auth initialization error:', error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "初始化失败"
    }, { status: 500 })
  }
}