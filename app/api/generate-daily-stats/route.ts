import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const { channelId, date } = await req.json()
    
    // 检查日期格式
    const targetDate = date ? new Date(date) : new Date()
    if (!date) {
      targetDate.setDate(targetDate.getDate() + 2) // Use day after tomorrow for testing
    }
    targetDate.setHours(0, 0, 0, 0)
    
    // Check if stats already exist and skip this check for now to allow regeneration

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
      // Use fallback values if channel data is missing, handle BigInt properly
      const channelViewCount = Number(channel.viewCount || channel.totalViews || BigInt(0))
      const channelSubscribers = Number(channel.totalSubscribers || BigInt(0))
      const channelVideos = channel.videoCount || 0
      
      // Generate realistic estimates based on channel metrics
      const baseViews = channelViewCount > 0 ? Math.max(1, Math.floor(channelViewCount * 0.002)) : Math.floor(Math.random() * 1000) + 100
      const baseSubscriberGrowth = channelSubscribers > 0 ? Math.max(1, Math.floor(Math.sqrt(channelSubscribers) * 0.1)) : Math.floor(Math.random() * 20) + 5
      
      // Activity multiplier based on video count
      const activityMultiplier = Math.max(0.5, Math.min(2.0, channelVideos / 20))
      
      const viewsValue = Math.floor(baseViews * activityMultiplier)
      const estimatedMinutesValue = Math.floor(viewsValue * 3) // ~3 minutes per view
      const totalVideoViewsValue = viewsValue
      const impressionsValue = Math.floor(viewsValue * 15) // 15x impression ratio
      
      const dailyStat = await db.channelDailyStat.create({
        data: {
          channelId: channel.id,
          date: targetDate,
          views: BigInt(viewsValue),
          estimatedMinutesWatched: BigInt(estimatedMinutesValue),
          watchTimeHours: estimatedMinutesValue / 60,
          subscribersGained: Math.floor(baseSubscriberGrowth * activityMultiplier),
          subscribersLost: Math.max(0, Math.floor(baseSubscriberGrowth * activityMultiplier * 0.15)), // ~15% churn
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
        channelId: String(stat.channelId),
        date: stat.date.toISOString(),
        views: stat.views.toString(),
        estimatedMinutesWatched: stat.estimatedMinutesWatched.toString(),
        totalVideoViews: stat.totalVideoViews.toString(),
        impressions: stat.impressions.toString(),
        impressionCtr: Number(stat.impressionCtr),
        watchTimeHours: Number(stat.watchTimeHours),
        avgViewsPerVideo: Number(stat.avgViewsPerVideo),
        videosPublished: Number(stat.videosPublished),
        subscribersGained: Number(stat.subscribersGained)
      }))
    })

  } catch (error: any) {
    logger.error("GenerateDailyStats", "Failed to generate daily stats:", error)
    return errorResponse("Failed to generate daily stats", String(error.message || error), 500)
  }
}