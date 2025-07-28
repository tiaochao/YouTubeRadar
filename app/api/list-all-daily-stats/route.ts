import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const stats = await db.channelDailyStat.findMany({
      select: {
        date: true,
        channelId: true,
        views: true,
        subscribersGained: true,
        videosPublished: true,
        videosPublishedLive: true,
        totalVideoViews: true
      },
      orderBy: [
        { date: 'desc' },
        { views: 'desc' }
      ],
      take: 20
    })

    const result = stats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      channelId: stat.channelId,
      views: stat.views.toString(),
      subscribersGained: stat.subscribersGained,
      videosPublished: stat.videosPublished,
      videosPublishedLive: stat.videosPublishedLive || 0,
      totalVideoViews: stat.totalVideoViews?.toString() || "0"
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