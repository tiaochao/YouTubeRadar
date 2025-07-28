import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // 直接查询7月29日的数据
    const july29Stats = await db.channelDailyStat.findMany({
      where: {
        date: {
          gte: new Date("2025-07-29T00:00:00.000Z"),
          lt: new Date("2025-07-30T00:00:00.000Z")
        }
      },
      select: {
        date: true,
        channelId: true,
        views: true,
        videosPublished: true,
        videosPublishedLive: true,
        subscribersGained: true
      }
    })

    const result = july29Stats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      channelId: stat.channelId,
      views: stat.views.toString(),
      videosPublished: stat.videosPublished,
      videosPublishedLive: stat.videosPublishedLive || 0,
      subscribersGained: stat.subscribersGained,
      meetsFilter: stat.videosPublished > 0 || stat.views > 0
    }))

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}