import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // 检查数据库连接
    const dbConnected = !!process.env.DATABASE_URL
    
    // 检查各个表的数据
    let channelsCount = 0
    let dailyStatsCount = 0
    let error = null
    
    try {
      // 检查 channels 表
      const channels = await db.channel.count()
      channelsCount = channels
      
      // 检查 channel_daily_stats 表
      const dailyStats = await db.channelDailyStat.count()
      dailyStatsCount = dailyStats
      
    } catch (e: any) {
      error = e.message
    }
    
    return NextResponse.json({
      status: "ok",
      database: {
        connected: dbConnected,
        url: dbConnected ? "已配置" : "未配置"
      },
      tables: {
        channels: channelsCount,
        channelDailyStats: dailyStatsCount
      },
      error: error,
      note: "如果 channelDailyStats 为 0，说明还没有每日统计数据",
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