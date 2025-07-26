import { type NextRequest, NextResponse } from "next/server"
import { runRefreshChannelMetricsTask } from "@/lib/tasks"

export async function POST(req: NextRequest) {
  try {
    await runRefreshChannelMetricsTask()
    return NextResponse.json({ message: "Channel metrics refresh task initiated successfully." }, { status: 200 })
  } catch (error: any) {
    console.error("API Error /api/cron/refresh-channel-metrics:", error)
    return NextResponse.json(
      { error: "Failed to initiate channel metrics refresh task.", details: error.message },
      { status: 500 },
    )
  }
}
