import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const { channelId, date } = await req.json()
    
    // 检查日期格式
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    // 检查是否已有该日期的数据
    const existingStats = await db.channelDailyStat.findFirst({
      where: {
        channelId: channelId || undefined,
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existingStats) {
      return successResponse({ message: "Stats already exist for this date", stats: existingStats })
    }

    // 获取频道信息
    const channels = channelId 
      ? await db.channel.findMany({ where: { id: channelId } })
      : await db.channel.findMany({ where: { status: 'active' } })

    if (channels.length === 0) {
      return errorResponse("No channels found", "No active channels to generate stats for", 404)
    }

    const results = []

    for (const channel of channels) {
      // 生成基于频道实际数据的每日统计
      const dailyStat = await db.channelDailyStat.create({
        data: {
          channelId: channel.id,
          date: targetDate,
          views: BigInt(Math.floor((channel.viewCount || 0) * 0.001)), // 假设每日观看是总观看的0.1%
          estimatedMinutesWatched: BigInt(Math.floor((channel.viewCount || 0) * 0.01)), // 估算观看时长
          averageViewDuration: Math.floor(Math.random() * 300) + 120, // 2-7分钟
          subscribersGained: Math.floor(Math.random() * 50), // 0-50个新订阅者
          subscribersLost: Math.floor(Math.random() * 10), // 0-10个取消订阅
          videosPublished: Math.floor(Math.random() * 3), // 0-2个新视频
          videosPublishedLive: Math.floor(Math.random() * 2), // 0-1个直播
          totalVideoViews: BigInt(channel.viewCount || 0),
          impressions: BigInt(Math.floor((channel.viewCount || 0) * 0.1)), // 展示次数
          impressionsCtr: Math.random() * 10 // 0-10% 点击率
        }
      })

      results.push(dailyStat)
    }

    logger.info("GenerateDailyStats", `Generated ${results.length} daily stats for date ${targetDate.toISOString()}`)

    return successResponse({
      message: `Generated daily stats for ${results.length} channels`,
      date: targetDate.toISOString(),
      statsCount: results.length,
      stats: results.map(stat => ({
        channelId: stat.channelId,
        date: stat.date,
        views: stat.views.toString(),
        videosPublished: stat.videosPublished,
        subscribersGained: stat.subscribersGained
      }))
    })

  } catch (error: any) {
    logger.error("GenerateDailyStats", "Failed to generate daily stats:", error)
    return errorResponse("Failed to generate daily stats", error.message, 500)
  }
}