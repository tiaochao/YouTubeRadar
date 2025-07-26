import { type NextRequest, NextResponse } from "next/server"
import { runRefreshVideoStatsTask } from "@/lib/tasks"

export async function POST(req: NextRequest) {
  // In a real application, you'd want to secure this endpoint
  // e.g., by checking a secret header or IP whitelist.
  // For Vercel Cron Jobs, you can use a secret in the cron job configuration.

  try {
    await runRefreshVideoStatsTask()
    return NextResponse.json({ message: "Video stats refresh task initiated successfully." }, { status: 200 })
  } catch (error: any) {
    console.error("API Error /api/cron/refresh-video-stats:", error)
    return NextResponse.json(
      { error: "Failed to initiate video stats refresh task.", details: error.message },
      { status: 500 },
    )
  }
}
