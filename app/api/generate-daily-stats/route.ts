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
      const viewsValue = Math.floor((channel.viewCount || 0) * 0.001)
      const estimatedMinutesValue = Math.floor((channel.viewCount || 0) * 0.01)
      const totalVideoViewsValue = channel.viewCount || 0
      const impressionsValue = Math.floor((channel.viewCount || 0) * 0.1)
      
      const dailyStat = await db.channelDailyStat.create({
        data: {
          channelId: channel.id,
          date: targetDate,
          views: BigInt(viewsValue), // 假设每日观看是总观看的0.1%
          estimatedMinutesWatched: BigInt(estimatedMinutesValue), // 估算观看时长
          watchTimeHours: estimatedMinutesValue / 60, // 观看时长小时数
          subscribersGained: Math.floor(Math.random() * 50), // 0-50个新订阅者
          subscribersLost: Math.floor(Math.random() * 10), // 0-10个取消订阅
          videosPublished: Math.floor(Math.random() * 3), // 0-2个新视频
          videosPublishedLive: Math.floor(Math.random() * 2), // 0-1个直播
          totalVideoViews: BigInt(totalVideoViewsValue),
          impressions: BigInt(impressionsValue), // 展示次数
          impressionCtr: Math.random() * 0.1, // 0-10% 点击率 (修正为小数)
          avgViewsPerVideo: viewsValue > 0 ? viewsValue / Math.max(1, Math.floor(Math.random() * 3)) : 0
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
        estimatedMinutesWatched: stat.estimatedMinutesWatched.toString(),
        totalVideoViews: stat.totalVideoViews.toString(),
        impressions: stat.impressions.toString(),
        impressionCtr: stat.impressionCtr,
        watchTimeHours: stat.watchTimeHours,
        avgViewsPerVideo: stat.avgViewsPerVideo,
        videosPublished: stat.videosPublished,
        subscribersGained: stat.subscribersGained
      }))
    })

  } catch (error: any) {
    logger.error("GenerateDailyStats", "Failed to generate daily stats:", error)
    return errorResponse("Failed to generate daily stats", error.message, 500)
  }
}