import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { syncAllChannelStats } from "@/lib/youtube-channel-stats"

export async function POST() {
  try {
    logger.info("ChannelStatsSync", "Manual sync all stats requested")

    const result = await syncAllChannelStats()

    return NextResponse.json({
      success: true,
      message: "All channel statistics synced",
      data: result
    })

  } catch (error: any) {
    logger.error("ChannelStatsSync", "Failed to sync all channel statistics:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      }, 
      { status: 500 }
    )
  }
}