import { db } from "./db"
import { logger } from "./logger"

export interface DailyStatsData {
  views: bigint
  watchTimeHours: number
  subscribersGained: number
  subscribersLost: number
  estimatedMinutesWatched: bigint
  impressions: bigint
  impressionCtr: number
  videosPublished: number
  videosPublishedLive: number
  totalVideoViews: bigint
  avgViewsPerVideo: number
}

/**
 * Generate and store daily statistics for a channel using real YouTube Analytics data
 * Uses channel timezone for accurate date calculation
 */
export async function generateChannelDailyStats(channelId: string, date: Date): Promise<void> {
  try {
    logger.info("DailyStatsGenerator", `Starting real analytics sync for channel ${channelId}`)
    
    // 使用YouTube Analytics API同步真实数据
    const { youtubeAnalyticsSync } = await import("./youtube-analytics-sync")
    await youtubeAnalyticsSync.syncChannelDailyAnalytics(channelId, date)
    
    logger.info("DailyStatsGenerator", `Successfully synced real analytics data for channel ${channelId}`)
    
  } catch (error: any) {
    logger.error("DailyStatsGenerator", `Failed to generate daily stats for channel ${channelId}:`, error)
    
    // 如果YouTube Analytics API失败，记录错误但不抛出异常
    // 这样可以让其他频道继续处理
    logger.warn("DailyStatsGenerator", `Analytics API failed for channel ${channelId}, will retry later`)
  }
}

/**
 * Generate daily stats for the last N days for a channel using real YouTube Analytics
 */
export async function generateHistoricalDailyStats(channelId: string, days: number = 30): Promise<void> {
  try {
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { title: true }
    })

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`)
    }

    logger.info("DailyStatsGenerator", `Generating ${days} days of real analytics data for channel ${channel.title}`)

    const { youtubeAnalyticsSync } = await import("./youtube-analytics-sync")
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      try {
        await youtubeAnalyticsSync.syncChannelDailyAnalytics(channelId, date)
        logger.info("DailyStatsGenerator", `✓ Synced data for ${channel.title} on ${date.toISOString().split('T')[0]}`)
      } catch (error: any) {
        logger.error("DailyStatsGenerator", `✗ Failed to sync ${channel.title} on ${date.toISOString().split('T')[0]}:`, error)
      }
    }
    
    logger.info("DailyStatsGenerator", `Completed generating real analytics data for channel ${channel.title}`)

  } catch (error: any) {
    logger.error("DailyStatsGenerator", `Failed to generate historical daily stats for channel ${channelId}:`, error)
    throw error
  }
}

/**
 * Generate daily stats for all active channels for a specific date using real YouTube Analytics
 */
export async function generateAllChannelsDailyStats(date: Date = new Date()): Promise<void> {
  try {
    const activeChannels = await db.channel.findMany({
      where: { status: 'active' },
      select: { id: true, title: true }
    })

    logger.info("DailyStatsGenerator", `Generating real analytics data for ${activeChannels.length} channels on ${date.toISOString().split('T')[0]}`)

    const { youtubeAnalyticsSync } = await import("./youtube-analytics-sync")
    
    const results = { success: 0, failed: 0 }
    
    for (const channel of activeChannels) {
      try {
        await youtubeAnalyticsSync.syncChannelDailyAnalytics(channel.id, date)
        results.success++
        logger.info("DailyStatsGenerator", `✓ Synced ${channel.title}`)
      } catch (error: any) {
        results.failed++
        logger.error("DailyStatsGenerator", `✗ Failed to sync ${channel.title}:`, error)
      }
    }

    logger.info("DailyStatsGenerator", `Completed real analytics sync. Success: ${results.success}, Failed: ${results.failed}`)

  } catch (error: any) {
    logger.error("DailyStatsGenerator", `Failed to generate daily stats for all channels:`, error)
    throw error
  }
}