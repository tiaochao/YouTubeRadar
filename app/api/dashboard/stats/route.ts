import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    // 获取所有频道的统计数据
    const channels = await db.channel.findMany({
      where: { status: 'active' },
      include: {
        videos: {
          orderBy: { publishedAt: 'desc' },
          take: 5,
          include: {
            snapshots: {
              orderBy: { collectedAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // 计算总体统计
    let totalViews = BigInt(0)
    let totalSubscribers = BigInt(0)
    let totalVideos = 0

    channels.forEach(channel => {
      if (channel.totalViews) totalViews += channel.totalViews
      if (channel.totalSubscribers) totalSubscribers += channel.totalSubscribers
      if (channel.videoCount) totalVideos += channel.videoCount
    })

    // 获取最近的频道（按更新时间）
    const recentChannels = channels.slice(0, 5).map(channel => ({
      id: channel.id,
      title: channel.title,
      thumbnailUrl: channel.thumbnailUrl,
      totalSubscribers: channel.totalSubscribers?.toString() || '0',
      totalViews: channel.totalViews?.toString() || '0',
      lastSyncAt: channel.lastVideoSyncAt || channel.updatedAt
    }))

    // 获取最近发布的视频
    const allRecentVideos: any[] = []
    channels.forEach(channel => {
      channel.videos.forEach(video => {
        if (video.snapshots.length > 0) {
          allRecentVideos.push({
            id: video.id,
            title: video.title,
            channelTitle: channel.title,
            publishedAt: video.publishedAt,
            viewCount: video.snapshots[0].viewCount.toString()
          })
        }
      })
    })

    // 按发布日期排序并取前10个
    const recentVideos = allRecentVideos
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10)

    const stats = {
      totalChannels: channels.length,
      totalViews: totalViews.toString(),
      totalSubscribers: totalSubscribers.toString(),
      totalVideos,
      recentChannels,
      recentVideos
    }

    return NextResponse.json({ ok: true, data: stats })

  } catch (error: any) {
    logger.error("DashboardStats", "Failed to fetch dashboard stats:", error)
    return NextResponse.json({ 
      ok: false,
      error: "Failed to fetch dashboard stats", 
      message: error.message 
    }, { status: 500 })
  }
}