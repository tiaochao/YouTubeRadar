import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const channels = await db.channel.findMany({ 
      where: { status: 'active' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        totalViews: true,
        totalSubscribers: true,
        videoCount: true
      }
    })

    if (channels.length === 0) {
      return NextResponse.json({ error: "No channels found" }, { status: 404 })
    }

    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 1) // Use tomorrow's date
    targetDate.setHours(0, 0, 0, 0)

    const results = []

    for (const channel of channels) {
      // Convert BigInt values to numbers safely
      const channelViewCount = channel.viewCount ? Number(channel.viewCount) : 0
      const channelSubscribers = channel.totalSubscribers ? Number(channel.totalSubscribers) : 0
      const channelVideos = channel.videoCount || 0
      
      // Generate simple estimates
      const viewsValue = Math.max(100, Math.floor(Math.random() * 1000))
      const estimatedMinutes = viewsValue * 3
      
      const dailyStat = await db.channelDailyStat.create({
        data: {
          channelId: channel.id,
          date: targetDate,
          views: BigInt(viewsValue),
          estimatedMinutesWatched: BigInt(estimatedMinutes),
          watchTimeHours: estimatedMinutes / 60,
          subscribersGained: Math.floor(Math.random() * 20) + 5,
          subscribersLost: Math.floor(Math.random() * 5),
          videosPublished: Math.floor(Math.random() * 3),
          videosPublishedLive: Math.floor(Math.random() * 2),
          totalVideoViews: BigInt(viewsValue),
          impressions: BigInt(viewsValue * 15),
          impressionCtr: Math.random() * 0.1,
          avgViewsPerVideo: viewsValue / 2
        }
      })

      results.push({
        channelId: dailyStat.channelId,
        date: dailyStat.date.toISOString(),
        views: dailyStat.views.toString(),
        subscribersGained: dailyStat.subscribersGained
      })
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${results.length} daily stats`,
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Failed to generate daily stats",
      details: String(error.message)
    }, { status: 500 })
  }
}