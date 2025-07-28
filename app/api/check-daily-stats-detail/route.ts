import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const date = searchParams.get("date") || "2025-07-28"
    
    // 查询指定日期的详细数据
    const dailyStats = await db.channelDailyStat.findMany({
      where: {
        date: {
          gte: new Date(date + "T00:00:00.000Z"),
          lt: new Date(date + "T23:59:59.999Z")
        }
      },
      include: {
        channel: {
          select: {
            id: true,
            channelId: true,
            title: true,
            viewCount: true,
            totalViews: true,
            totalSubscribers: true,
            videoCount: true
          }
        }
      },
      orderBy: {
        views: 'desc'
      }
    })

    const result = dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      channelId: stat.channelId,
      channelTitle: stat.channel.title,
      channelTotalViews: stat.channel.viewCount?.toString() || stat.channel.totalViews?.toString() || "0",
      channelSubscribers: stat.channel.totalSubscribers?.toString() || "0",
      channelVideos: stat.channel.videoCount || 0,
      dailyViews: stat.views.toString(),
      subscribersGained: stat.subscribersGained,
      videosPublished: stat.videosPublished,
      videosPublishedLive: stat.videosPublishedLive,
      totalVideoViews: stat.totalVideoViews?.toString() || "0",
      estimatedDailyViewsFromTotal: Math.floor(Number(stat.channel.viewCount || stat.channel.totalViews || 0) * 0.002).toString()
    }))

    return NextResponse.json({
      success: true,
      date,
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