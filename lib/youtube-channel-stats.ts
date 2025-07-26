import { db } from "./db"
import { logger } from "./logger"
import { ChannelStatus } from "@prisma/client"

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"

export async function syncChannelStats(channelId: string) {
  try {
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      throw new Error("Channel not found")
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error("YouTube API key not configured")
    }

    // Fetch channel statistics from YouTube API
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/channels?` +
      `part=statistics,snippet&` +
      `id=${channel.channelId}&` +
      `key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      throw new Error("Channel not found on YouTube")
    }

    const channelData = data.items[0]
    const statistics = channelData.statistics
    const snippet = channelData.snippet

    // Update channel information
    await db.channel.update({
      where: { id: channelId },
      data: {
        title: snippet.title,
        thumbnailUrl: snippet.thumbnails?.default?.url,
        totalViews: BigInt(statistics.viewCount || 0),
        totalSubscribers: BigInt(statistics.subscriberCount || 0),
        status: ChannelStatus.active,
        lastAnalyticsAt: new Date()
      }
    })

    // Get today's date at midnight (UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Check if we already have stats for today
    const existingStats = await db.channelDailyStat.findUnique({
      where: {
        channelId_date: {
          channelId: channelId,
          date: today
        }
      }
    })

    if (!existingStats) {
      // Create new daily stats record
      await db.channelDailyStat.create({
        data: {
          channelId: channelId,
          date: today,
          views: BigInt(statistics.viewCount || 0),
          watchTimeHours: 0,
          subscribersGained: 0,
          subscribersLost: 0,
          // YouTube API doesn't provide these metrics for public access
          estimatedMinutesWatched: BigInt(0),
          impressions: BigInt(0),
          impressionCtr: 0
        }
      })

      logger.info("ChannelStats", `Created daily stats for channel: ${channel.title}`)
    } else {
      // Update existing stats
      await db.channelDailyStat.update({
        where: {
          channelId_date: {
            channelId: channelId,
            date: today
          }
        },
        data: {
          views: BigInt(statistics.viewCount || 0),
          updatedAt: new Date()
        }
      })

      logger.info("ChannelStats", `Updated daily stats for channel: ${channel.title}`)
    }

    // Clear cache
    const { clearDailyStatsCache } = await import("./tasks")
    await clearDailyStatsCache(channelId)

    return {
      success: true,
      channelTitle: channel.title,
      viewCount: statistics.viewCount,
      subscriberCount: statistics.subscriberCount
    }

  } catch (error: any) {
    logger.error("ChannelStats", `Failed to sync stats for channel ${channelId}:`, error)
    throw error
  }
}

// Sync stats for all active channels
export async function syncAllChannelStats() {
  const activeChannels = await db.channel.findMany({
    where: { status: ChannelStatus.active }
  })

  logger.info("ChannelStats", `Starting daily stats sync for ${activeChannels.length} channels`)

  const results = {
    success: 0,
    failed: 0,
    errors: [] as { channelId: string, error: string }[]
  }

  for (const channel of activeChannels) {
    try {
      await syncChannelStats(channel.id)
      results.success++
    } catch (error: any) {
      results.failed++
      results.errors.push({
        channelId: channel.id,
        error: error.message
      })
    }
  }

  logger.info("ChannelStats", `Daily stats sync completed. Success: ${results.success}, Failed: ${results.failed}`)
  
  return results
}