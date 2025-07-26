import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { runWithLock } from "@/lib/lock"
import { syncChannelVideos } from "@/lib/youtube-video-sync"

export async function POST(req: NextRequest) {
  try {
    const startTime = new Date()
    logger.info("ManualSyncAll", "Starting manual sync for all channels")

    // Get all active channels
    const channels = await db.channel.findMany({
      where: {
        status: "active"
      },
      select: {
        id: true,
        channelId: true,
        title: true
      }
    })

    if (channels.length === 0) {
      logger.warn("ManualSyncAll", "No active channels found to sync")
      return NextResponse.json({
        message: "No active channels to sync",
        synced: 0,
        failed: 0
      })
    }

    let syncedCount = 0
    let failedCount = 0
    const errors: Array<{ channelId: string, error: string }> = []

    // Create metrics maps for tracking API calls
    const apiCallsMap = new Map<string, number>()
    const retriesMap = new Map<string, number>()

    // Process channels sequentially to avoid rate limiting
    for (const channel of channels) {
      const lockKey = `channel_sync_${channel.id}`
      
      const result = await runWithLock(lockKey, async () => {
        try {
          logger.info("ManualSyncAll", `Syncing channel: ${channel.title} (${channel.channelId})`)
          
          // Sync videos using public API
          const result = await syncChannelVideos(channel.id)
          logger.info("ManualSyncAll", `Synced ${result.totalVideos} videos for channel: ${channel.title}`)
          
          // Update last sync time
          await db.channel.update({
            where: { id: channel.id },
            data: { 
              lastVideoSyncAt: new Date()
            }
          })
          
          logger.info("ManualSyncAll", `Successfully synced channel: ${channel.title}`)
          return { success: true }
        } catch (error: any) {
          const errorMessage = error.message || "Unknown error"
          logger.error("ManualSyncAll", `Failed to sync channel ${channel.title}:`, error)
          return { success: false, error: errorMessage }
        }
      })
      
      if (result?.success) {
        syncedCount++
      } else {
        failedCount++
        errors.push({
          channelId: channel.channelId,
          error: result?.error || "Lock acquisition failed"
        })
      }

      // Add a small delay between channels to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Log task completion with API call statistics
    const apiCallsArray = Array.from(apiCallsMap.entries())
    const retriesArray = Array.from(retriesMap.entries())
    
    await db.taskLog.create({
      data: {
        taskType: "CHANNEL_HOURLY",
        startedAt: startTime,
        success: failedCount === 0,
        message: `Manual sync completed. Synced: ${syncedCount}, Failed: ${failedCount}`,
        finishedAt: new Date()
      }
    })

    logger.info("ManualSyncAll", `Manual sync completed. Synced: ${syncedCount}, Failed: ${failedCount}`, {
      apiCalls: apiCallsArray,
      retries: retriesArray
    })

    return NextResponse.json({
      message: "Manual sync completed",
      synced: syncedCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    logger.error("ManualSyncAll", "Failed to run manual sync:", error)
    return NextResponse.json(
      { error: "Failed to run manual sync", details: error.message },
      { status: 500 }
    )
  }
}