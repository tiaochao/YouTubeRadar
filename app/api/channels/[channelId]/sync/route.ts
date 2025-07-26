import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { runWithLock } from "@/lib/lock"
import { syncChannelVideos } from "@/lib/youtube-video-sync"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const body = await req.json().catch(() => ({}))
    const forceClear = body.forceClear === true

    // Verify channel exists
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Use a channel-specific lock to prevent concurrent syncs for the same channel
    const lockName = `channel_sync_${channelId}`
    const lockTTL = 5 * 60 // Reduce to 5 minutes

    // If forceClear is requested, manually release any existing lock first
    if (forceClear) {
      try {
        const { redis } = await import("@/lib/redis")
        await redis.del(`task_lock:${lockName}`)
        logger.info("ChannelSync", `Force cleared lock for ${lockName}`)
      } catch (error) {
        logger.warn("ChannelSync", `Failed to force clear lock for ${lockName}:`, error)
      }
    }

    const result = await runWithLock(
      lockName,
      async () => {
        logger.info("ChannelSync", `Starting manual sync for channel: ${channel.title} (${channel.channelId})`)
        
        // Initialize tracking for this sync
        const apiCalls = new Map<string, number>()
        const retries = new Map<string, number>()
        
        // Perform video sync using public API
        const result = await syncChannelVideos(channelId)
        logger.info("ChannelSync", `Synced ${result.totalVideos} videos for channel: ${channel.title}`)
        
        // Update channel's last sync time
        await db.channel.update({
          where: { id: channelId },
          data: { lastVideoSyncAt: new Date() }
        })

        logger.info("ChannelSync", `Manual sync completed for channel: ${channel.title}`, {
          apiCalls: Array.from(apiCalls.entries()),
          retries: Array.from(retries.entries())
        })

        return {
          success: true,
          channelTitle: channel.title,
          syncedAt: new Date().toISOString(),
          metrics: {
            apiCalls: Object.fromEntries(apiCalls),
            retries: Object.fromEntries(retries)
          }
        }
      },
      lockTTL
    )

    if (result === undefined) {
      return NextResponse.json(
        { 
          error: "Channel sync is already in progress", 
          message: "另一个同步任务正在进行中，请稍后再试。" 
        }, 
        { status: 409 }
      )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    logger.error("ChannelSync", "Manual channel sync failed:", error)
    return NextResponse.json({ 
      error: "Sync failed", 
      message: error.message 
    }, { status: 500 })
  }
}