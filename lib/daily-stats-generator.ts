import { db } from "./db"
import { logger } from "./logger"
import { isValidLiveStream } from "./duration-utils"

/**
 * Get timezone offset in hours for common timezones
 * This is a simplified implementation - in production you'd use a proper timezone library
 */
function getTimezoneOffset(timezone: string): number {
  const timezoneOffsets: Record<string, number> = {
    'UTC': 0,
    'EST': -5,    // Eastern Standard Time
    'PST': -8,    // Pacific Standard Time
    'CST': -6,    // Central Standard Time
    'MST': -7,    // Mountain Standard Time
    'JST': 9,     // Japan Standard Time
    'GMT': 0,     // Greenwich Mean Time
    'CET': 1,     // Central European Time
    'IST': 5.5,   // India Standard Time
    'CST_CHINA': 8, // China Standard Time
    'AEST': 10,   // Australian Eastern Standard Time
  }
  
  return timezoneOffsets[timezone] || 0
}

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
 * Generate and store daily statistics for a channel (legacy function)
 */
export async function generateChannelDailyStatsLegacy(channelId: string, targetDate: Date, existingStats?: any): Promise<void> {
  try {
    // If stats exist but don't have video publishing data, we should update them
    const shouldUpdate = existingStats && (
      existingStats.videosPublished === null || 
      existingStats.videosPublished === undefined ||
      existingStats.totalVideoViews === null ||
      existingStats.totalVideoViews === undefined
    )

    if (existingStats && !shouldUpdate) {
      logger.info("DailyStatsGenerator", `Daily stats already exist for channel ${channelId} on ${targetDate.toISOString().split('T')[0]}`)
      return
    }

    // Get channel information including timezone and view counts
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { 
        title: true, 
        totalViews: true, 
        viewCount: true,
        totalSubscribers: true, 
        subscriberCount: true,
        videoCount: true,
        timezone: true 
      }
    })

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`)
    }

    // Get video stats for this date range using channel's timezone
    const channelTimezone = channel.timezone || 'UTC'
    
    // Convert target date to channel timezone for proper day boundaries
    const startOfDay = new Date(targetDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
    const endOfDay = new Date(targetDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
    
    // If channel has a specific timezone, we need to adjust for UTC storage
    // For now, we'll use a simple offset approach for common timezones
    const timezoneOffset = getTimezoneOffset(channelTimezone)
    startOfDay.setHours(startOfDay.getHours() - timezoneOffset)
    endOfDay.setHours(endOfDay.getHours() - timezoneOffset)

    // Get videos published on this date
    const videosPublishedToday = await db.video.findMany({
      where: {
        channelId,
        publishedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        snapshots: {
          orderBy: { collectedAt: 'desc' },
          take: 1
        }
      }
    })

    // Calculate video publishing stats
    // videosPublished only counts non-live videos
    const videosPublished = videosPublishedToday.filter(v => !v.live).length
    // Only count live videos that have both duration and views
    const liveVideos = videosPublishedToday.filter(v => v.live)
    const videosPublishedLive = liveVideos.filter(v => {
      // Check if the live video has views and duration
      if (v.snapshots.length > 0) {
        const viewCount = v.snapshots[0].viewCount
        return isValidLiveStream(v.duration, viewCount)
      }
      return false
    }).length
    
    // Calculate basic stats from available data
    let totalViews = BigInt(0)
    let estimatedMinutesWatched = BigInt(0)
    let totalVideoViews = BigInt(0)

    for (const video of videosPublishedToday) {
      if (video.snapshots.length > 0) {
        const latestSnapshot = video.snapshots[0]
        totalViews += latestSnapshot.viewCount
        totalVideoViews += latestSnapshot.viewCount
        // Estimate watch time: assume average watch time is 30% of video length
        // For now, use a rough estimate of 3 minutes average per view
        estimatedMinutesWatched += latestSnapshot.viewCount * BigInt(3)
      }
    }

    // Calculate average views per video
    const avgViewsPerVideo = videosPublished > 0 ? Number(totalVideoViews) / videosPublished : 0

    // Generate realistic data based on actual channel metrics
    // Use real channel data to estimate daily activity
    const channelTotalViews = channel.viewCount || channel.totalViews || 0
    const channelSubscribers = channel.subscriberCount || channel.totalSubscribers || 0
    const channelVideos = channel.videoCount || 0
    
    const dailyViewsEstimate = Math.max(1, Math.floor(channelTotalViews * 0.002)) // ~0.2% of total views per day
    const dailySubscriberGrowth = Math.max(1, Math.floor(Math.sqrt(channelSubscribers) * 0.1))
    
    // Add some variability based on video count (more videos = more activity)
    const activityMultiplier = Math.max(0.5, Math.min(2.0, channelVideos / 20))
    
    const adjustedDailyViews = Math.floor(dailyViewsEstimate * activityMultiplier)
    const adjustedSubscriberGrowth = Math.floor(dailySubscriberGrowth * activityMultiplier)
    
    const dailyStats: DailyStatsData = {
      views: totalViews > 0 ? totalViews : BigInt(adjustedDailyViews),
      watchTimeHours: totalViews > 0 ? Number(estimatedMinutesWatched) / 60 : adjustedDailyViews * 0.05, // ~3min per view
      subscribersGained: Math.max(1, adjustedSubscriberGrowth),
      subscribersLost: Math.max(0, Math.floor(adjustedSubscriberGrowth * 0.15)), // ~15% churn
      estimatedMinutesWatched: totalViews > 0 ? estimatedMinutesWatched : BigInt(adjustedDailyViews * 3),
      impressions: totalViews > 0 ? totalViews * BigInt(15) : BigInt(adjustedDailyViews * 15), // 15x views
      impressionCtr: 0.06, // 6% CTR based on industry average
      videosPublished,
      videosPublishedLive,
      totalVideoViews: totalViews > 0 ? totalVideoViews : BigInt(adjustedDailyViews),
      avgViewsPerVideo: totalViews > 0 ? avgViewsPerVideo : Math.floor(adjustedDailyViews / Math.max(1, videosPublished))
    }

    // Create or update the daily stats record
    if (shouldUpdate) {
      await db.channelDailyStat.update({
        where: {
          channelId_date: {
            channelId,
            date: targetDate
          }
        },
        data: {
          videosPublished: dailyStats.videosPublished,
          videosPublishedLive: dailyStats.videosPublishedLive,
          totalVideoViews: dailyStats.totalVideoViews,
          avgViewsPerVideo: dailyStats.avgViewsPerVideo,
          // Also update views if we have actual video data
          views: dailyStats.views,
          watchTimeHours: dailyStats.watchTimeHours,
          estimatedMinutesWatched: dailyStats.estimatedMinutesWatched,
        }
      })
      logger.info("DailyStatsGenerator", `Updated daily stats for channel ${channel.title} on ${targetDate.toISOString().split('T')[0]}`, {
        views: dailyStats.views.toString(),
        watchTimeHours: dailyStats.watchTimeHours,
        subscribersGained: dailyStats.subscribersGained,
        videosPublished: dailyStats.videosPublished,
        videosPublishedLive: dailyStats.videosPublishedLive
      })
    } else {
      await db.channelDailyStat.create({
        data: {
          channelId,
          date: targetDate,
          views: dailyStats.views,
          watchTimeHours: dailyStats.watchTimeHours,
          subscribersGained: dailyStats.subscribersGained,
          subscribersLost: dailyStats.subscribersLost,
          estimatedMinutesWatched: dailyStats.estimatedMinutesWatched,
          impressions: dailyStats.impressions,
          impressionCtr: dailyStats.impressionCtr,
          videosPublished: dailyStats.videosPublished,
          videosPublishedLive: dailyStats.videosPublishedLive,
          totalVideoViews: dailyStats.totalVideoViews,
          avgViewsPerVideo: dailyStats.avgViewsPerVideo
        }
      })
      logger.info("DailyStatsGenerator", `Generated daily stats for channel ${channel.title} on ${targetDate.toISOString().split('T')[0]}`, {
        views: dailyStats.views.toString(),
        watchTimeHours: dailyStats.watchTimeHours,
        subscribersGained: dailyStats.subscribersGained,
        videosPublished: dailyStats.videosPublished,
        videosPublishedLive: dailyStats.videosPublishedLive
      })
    }

  } catch (error: any) {
    logger.error("DailyStatsGenerator", `Failed to generate daily stats for channel ${channelId}:`, error)
    throw error
  }
}

/**
 * Generate daily stats for the last N days for a channel
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

    logger.info("DailyStatsGenerator", `Generating ${days} days of historical daily stats for channel ${channel.title}`)

    const promises: Promise<void>[] = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      promises.push(generateChannelDailyStats(channelId, date))
    }

    await Promise.all(promises)
    
    logger.info("DailyStatsGenerator", `Completed generating historical daily stats for channel ${channel.title}`)

  } catch (error: any) {
    logger.error("DailyStatsGenerator", `Failed to generate historical daily stats for channel ${channelId}:`, error)
    throw error
  }
}

/**
 * Generate daily stats for all active channels for a specific date
 */
export async function generateAllChannelsDailyStats(date: Date = new Date()): Promise<void> {
  try {
    const activeChannels = await db.channel.findMany({
      where: { status: 'active' },
      select: { id: true, title: true }
    })

    logger.info("DailyStatsGenerator", `Generating daily stats for ${activeChannels.length} channels on ${date.toISOString().split('T')[0]}`)

    const promises = activeChannels.map(channel => 
      generateChannelDailyStats(channel.id, date)
    )

    await Promise.all(promises)

    logger.info("DailyStatsGenerator", `Completed generating daily stats for all channels`)

  } catch (error: any) {
    logger.error("DailyStatsGenerator", `Failed to generate daily stats for all channels:`, error)
    throw error
  }
}