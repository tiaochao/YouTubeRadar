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
 * Generate and store daily statistics for a channel
 * This creates placeholder data based on video statistics until real YouTube Analytics API is integrated
 */
export async function generateChannelDailyStats(channelId: string, date: Date): Promise<void> {
  try {
    // Create a proper date at midnight in local timezone
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)

    // Check if daily stats already exist for this date
    const existingStats = await db.channelDailyStat.findUnique({
      where: {
        channelId_date: {
          channelId,
          date: targetDate
        }
      }
    })

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

    // Get channel information including timezone
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { title: true, totalViews: true, totalSubscribers: true, timezone: true }
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

    // Generate realistic but placeholder data
    // In a real implementation, this would come from YouTube Analytics API
    const dailyStats: DailyStatsData = {
      views: totalViews,
      watchTimeHours: Number(estimatedMinutesWatched) / 60,
      subscribersGained: Math.max(0, Math.floor(Math.random() * 50)), // Placeholder
      subscribersLost: Math.max(0, Math.floor(Math.random() * 10)), // Placeholder
      estimatedMinutesWatched: estimatedMinutesWatched,
      impressions: totalViews * BigInt(Math.floor(Math.random() * 20) + 10), // Placeholder: 10-30x views
      impressionCtr: Math.random() * 0.1 + 0.02, // Placeholder: 2-12% CTR
      videosPublished,
      videosPublishedLive,
      totalVideoViews,
      avgViewsPerVideo
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