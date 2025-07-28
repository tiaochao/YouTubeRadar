import { NextRequest, NextResponse } from "next/server"
import { youtubeAnalyticsSync } from "@/lib/youtube-analytics-sync"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { channelId, date } = await req.json()
    
    // 检查是否提供了有效的频道ID
    if (!channelId) {
      return errorResponse("Channel ID is required", "Please provide a valid channel ID", 400)
    }

    // 验证频道是否存在
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { title: true, channelId: true, timezone: true }
    })

    if (!channel) {
      return errorResponse("Channel not found", `Channel with ID ${channelId} not found`, 404)
    }

    const targetDate = date ? new Date(date) : new Date()
    const dateString = targetDate.toISOString().split('T')[0]

    logger.info("SyncRealAnalytics", `Starting real analytics sync for ${channel.title} on ${dateString}`)

    // 同步真实的YouTube Analytics数据
    await youtubeAnalyticsSync.syncChannelDailyAnalytics(channelId, targetDate)

    // 获取同步后的数据
    const syncedStats = await db.channelDailyStat.findUnique({
      where: {
        channelId_date: {
          channelId: channelId,
          date: targetDate
        }
      }
    })

    if (!syncedStats) {
      return errorResponse("Sync failed", "No data was synced from YouTube Analytics API", 500)
    }

    return successResponse({
      message: `Successfully synced real analytics data for ${channel.title}`,
      channel: {
        id: channelId,
        title: channel.title,
        youtubeChannelId: channel.channelId,
        timezone: channel.timezone
      },
      date: dateString,
      analyticsData: {
        views: syncedStats.views.toString(),
        estimatedMinutesWatched: syncedStats.estimatedMinutesWatched.toString(),
        watchTimeHours: syncedStats.watchTimeHours,
        subscribersGained: syncedStats.subscribersGained,
        subscribersLost: syncedStats.subscribersLost,
        impressions: syncedStats.impressions?.toString() || "0",
        impressionCtr: syncedStats.impressionCtr,
        totalVideoViews: syncedStats.totalVideoViews?.toString() || "0"
      },
      source: "YouTube Analytics API"
    })

  } catch (error: any) {
    logger.error("SyncRealAnalytics", "Failed to sync real analytics:", error)
    
    // 检查是否是认证相关的错误
    if (error.message?.includes('refresh token') || error.message?.includes('access token')) {
      return errorResponse(
        "Authentication failed", 
        "Please ensure YouTube Analytics API is properly configured in settings", 
        401
      )
    }
    
    // 检查是否是API配额错误
    if (error.message?.includes('quota') || error.message?.includes('quotaExceeded')) {
      return errorResponse(
        "API quota exceeded", 
        "YouTube Analytics API quota has been exceeded. Please try again later", 
        429
      )
    }
    
    return errorResponse("Sync failed", error.message || "Unknown error occurred", 500)
  }
}

// 同步所有频道的分析数据
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const date = searchParams.get("date")
    
    const targetDate = date ? new Date(date) : new Date()
    const dateString = targetDate.toISOString().split('T')[0]

    logger.info("SyncRealAnalytics", `Starting bulk analytics sync for all channels on ${dateString}`)

    // 获取所有活跃频道
    const activeChannels = await db.channel.findMany({
      where: { status: 'active' },
      select: { id: true, title: true }
    })

    const results = {
      date: dateString,
      totalChannels: activeChannels.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ channel: string, error: string }>
    }

    // 逐个同步频道数据
    for (const channel of activeChannels) {
      try {
        await youtubeAnalyticsSync.syncChannelDailyAnalytics(channel.id, targetDate)
        results.success++
        logger.info("SyncRealAnalytics", `✓ Synced ${channel.title}`)
      } catch (error: any) {
        results.failed++
        results.errors.push({
          channel: channel.title,
          error: error.message
        })
        logger.error("SyncRealAnalytics", `✗ Failed to sync ${channel.title}:`, error)
      }
    }

    logger.info("SyncRealAnalytics", `Bulk sync completed. Success: ${results.success}, Failed: ${results.failed}`)

    return successResponse({
      message: `Bulk analytics sync completed for ${results.totalChannels} channels`,
      results,
      source: "YouTube Analytics API"
    })

  } catch (error: any) {
    logger.error("SyncRealAnalytics", "Failed to perform bulk sync:", error)
    return errorResponse("Bulk sync failed", error.message, 500)
  }
}