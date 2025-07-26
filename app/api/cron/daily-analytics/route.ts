import { type NextRequest, NextResponse } from "next/server"
import { runDailyAnalyticsTask } from "@/lib/tasks"

export async function POST(req: NextRequest) {
  try {
    // For daily analytics, we typically want to fetch data for the previous day.
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await runDailyAnalyticsTask()
    return NextResponse.json({ message: "Daily analytics task initiated successfully." }, { status: 200 })
  } catch (error: any) {
    console.error("API Error /api/cron/daily-analytics:", error)
    return NextResponse.json(
      { error: "Failed to initiate daily analytics task.", details: error.message },
      { status: 500 },
    )
  }
}
