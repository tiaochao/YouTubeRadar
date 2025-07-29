import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const config = {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      hasDefaultPassword: !!process.env.DEFAULT_ADMIN_PASSWORD,
      timestamp: new Date().toISOString()
    }

    console.log('Auth config check:', config)

    return NextResponse.json({
      ok: true,
      data: config
    })

  } catch (error: any) {
    console.error('Config check error:', error)
    
    return NextResponse.json({
      ok: false,
      error: error.message || "配置检查失败"
    }, { status: 500 })
  }
}