import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { syncChannelStats } from "@/lib/youtube-channel-stats"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    logger.info("ChannelStatsSync", `Manual sync requested for channel: ${channelId}`)

    const result = await syncChannelStats(channelId)

    return NextResponse.json({
      success: true,
      message: "Channel statistics synced successfully",
      data: result
    })

  } catch (error: any) {
    logger.error("ChannelStatsSync", "Failed to sync channel statistics:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      }, 
      { status: 500 }
    )
  }
}