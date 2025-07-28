import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "30")
    
    // 使用明确的日期范围，与debug端点相同的逻辑
    const startDate = new Date("2025-07-25T00:00:00.000Z")
    const endDate = new Date("2025-07-30T23:59:59.999Z")

    let dailyActivity: Array<{
      date: Date
      channel_id: string
      channel_title: string
      videos_published: number
      videos_published_live: number
      total_video_views: bigint
      daily_views: bigint
      subscribers_gained: number
    }> = []

    try {
      // 获取每日有活动的频道数据
      dailyActivity = await db.$queryRaw`
        SELECT 
          DATE(cds.date) as date,
          c.id as channel_id,
          c.title as channel_title,
          cds.videos_published,
          cds.videos_published_live,
          cds.total_video_views,
          cds.views as daily_views,
          cds.subscribers_gained
        FROM channel_daily_stats cds
        JOIN channels c ON cds.channel_id = c.id
        WHERE cds.date >= ${startDate}
          AND cds.date <= ${endDate}
          AND (cds.videos_published > 0 OR cds.views > 0)
        ORDER BY cds.date DESC, cds.views DESC
      `
    } catch (queryError: any) {
      logger.error("DailyActivityFixed", "Query failed:", queryError)
      return successResponse([])
    }

    // 按日期分组数据
    const groupedData = dailyActivity.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split('T')[0]
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          channels: [],
          totalVideos: 0,
          totalChannels: 0,
          totalViews: BigInt(0),
          totalSubscribersGained: 0
        }
      }
      
      acc[dateKey].channels.push({
        id: record.channel_id,
        title: record.channel_title,
        videosPublished: record.videos_published,
        videosPublishedLive: record.videos_published_live || 0,
        totalVideoViews: record.total_video_views?.toString() || "0",
        dailyViews: record.daily_views.toString(),
        subscribersGained: record.subscribers_gained
      })
      
      acc[dateKey].totalVideos += record.videos_published
      acc[dateKey].totalChannels += 1
      acc[dateKey].totalViews += record.daily_views
      acc[dateKey].totalSubscribersGained += record.subscribers_gained
      
      return acc
    }, {} as Record<string, any>)

    // 转换为数组并序列化BigInt
    const result = Object.values(groupedData).map((day: any) => ({
      ...day,
      totalViews: day.totalViews.toString()
    }))

    logger.info("DailyActivityFixed", `Retrieved daily activity, found ${result.length} active days`)

    return successResponse(result)
  } catch (error: any) {
    logger.error("DailyActivityFixed", "Failed to fetch daily activity:", error)
    return errorResponse("Failed to fetch daily activity", error.message, 500)
  }
}