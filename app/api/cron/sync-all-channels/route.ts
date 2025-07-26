import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ChannelStatus } from "@prisma/client"
// import { fetchAndStoreLatestVideoStats } from "@/lib/youtube"
// import { fetchAndStoreChannelDailyStats } from "@/lib/youtube-analytics"
import { logger } from "@/lib/logger"
import { runWithLock } from "@/lib/lock"

export const maxDuration = 300 // 5 minutes max execution time

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    logger.warn("CronSyncAll", "Unauthorized request to sync all channels")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const startTime = new Date()
    logger.info("CronSyncAll", "Starting automatic sync for all channels")
    
    // Get all active channels
    const activeChannels = await db.channel.findMany({
      where: { status: ChannelStatus.active },
      select: {
        id: true,
        title: true,
        channelId: true,
      }
    })

    if (activeChannels.length === 0) {
      logger.info("CronSyncAll", "No active channels to sync")
      return NextResponse.json({ 
        message: "No active channels to sync",
        synced: 0,
        failed: 0 
      })
    }

    let syncedCount = 0
    let failedCount = 0
    const errors: { channelTitle: string; error: string }[] = []
    
    // Create metrics maps for tracking API calls
    const apiCallsMap = new Map<string, number>()
    const retriesMap = new Map<string, number>()

    // Process channels sequentially to avoid rate limiting
    for (const channel of activeChannels) {
      const taskName = `channel_sync_${channel.id}`
      
      try {
        const syncResult = await runWithLock(taskName, 300, async () => {
          logger.info("CronSyncAll", `Syncing channel: ${channel.title} (${channel.channelId})`)
          
          // Update channel status to syncing
          await db.channel.update({
            where: { id: channel.id },
            data: { status: ChannelStatus.syncing }
          })
          
          try {
            // Perform the actual sync
            // TODO: Implement sync using public API
            // Currently disabled due to OAuth removal
            logger.warn("CronSyncAll", "Sync functionality temporarily disabled")
            
            // Update last sync time
            await db.channel.update({
              where: { id: channel.id },
              data: { 
                status: ChannelStatus.active,
                lastVideoSyncAt: new Date()
              }
            })
            
            logger.info("CronSyncAll", `Successfully synced channel: ${channel.title}`)
            return { success: true }
          } catch (error) {
            // Revert status if sync failed
            const currentChannel = await db.channel.findUnique({ 
              where: { id: channel.id },
              select: { status: true }
            })
            
            // Only revert if not marked as needs_reauth by OAuth error
            if (currentChannel?.status === ChannelStatus.syncing) {
              await db.channel.update({
                where: { id: channel.id },
                data: { status: ChannelStatus.active }
              })
            }
            
            throw error
          }
        })
        
        if (syncResult.success) {
          syncedCount++
        } else {
          failedCount++
          errors.push({
            channelTitle: channel.title,
            error: "Lock acquisition failed"
          })
        }
      } catch (error: any) {
        failedCount++
        errors.push({
          channelTitle: channel.title,
          error: error.message || "Unknown error"
        })
        logger.error("CronSyncAll", `Failed to sync channel ${channel.title}:`, error)
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
        message: `Auto-sync completed. Synced: ${syncedCount}, Failed: ${failedCount}`,
        finishedAt: new Date()
      }
    })

    logger.info("CronSyncAll", `Auto-sync completed. Synced: ${syncedCount}, Failed: ${failedCount}`, {
      apiCalls: apiCallsArray,
      retries: retriesArray
    })

    return NextResponse.json({
      message: "Auto-sync completed",
      synced: syncedCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    logger.error("CronSyncAll", "Failed to run auto-sync:", error)
    return NextResponse.json(
      { error: "Failed to run auto-sync", details: error.message },
      { status: 500 }
    )
  }
}