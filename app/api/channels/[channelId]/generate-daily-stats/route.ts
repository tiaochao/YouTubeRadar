import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { generateHistoricalDailyStats } from "@/lib/daily-stats-generator"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const body = await req.json().catch(() => ({}))
    const days = body.days || 30 // Default to 30 days

    // Verify channel exists
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { title: true }
    })

    if (!channel) {
      return errorResponse("Channel not found", "Channel not found", 404)
    }

    logger.info("GenerateDailyStats", `Starting historical daily stats generation for channel: ${channel.title} (${days} days)`)

    // Generate historical daily stats
    await generateHistoricalDailyStats(channelId, days)

    logger.info("GenerateDailyStats", `Completed historical daily stats generation for channel: ${channel.title}`)

    return successResponse({
      message: `Generated ${days} days of historical daily stats for ${channel.title}`,
      channelId,
      channelTitle: channel.title,
      daysGenerated: days
    })

  } catch (error: any) {
    logger.error("GenerateDailyStats", "Failed to generate historical daily stats:", error)
    return errorResponse("Failed to generate daily stats", error.message, 500)
  }
}