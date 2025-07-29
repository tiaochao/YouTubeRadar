import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticateRequest(req)
    
    if (!authResult) {
      return NextResponse.json({
        ok: false,
        error: "未授权访问"
      }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      data: {
        user: authResult.user
      }
    })

  } catch (error: any) {
    console.error('Get current user error:', error)
    
    return NextResponse.json({
      ok: false,
      error: "获取用户信息失败"
    }, { status: 500 })
  }
}