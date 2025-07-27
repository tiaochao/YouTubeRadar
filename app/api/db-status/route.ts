import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // 检查环境变量
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    
    // 尝试执行简单查询
    let dbConnected = false
    let dbError = null
    
    if (hasDatabaseUrl) {
      try {
        await db.$queryRaw`SELECT 1`
        dbConnected = true
      } catch (error: any) {
        dbError = error.message
      }
    }
    
    return NextResponse.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      database: {
        hasDatabaseUrl,
        connected: dbConnected,
        error: dbError,
        url: hasDatabaseUrl ? "已配置" : "未配置"
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}