import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 2) // 最近2天
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    console.log('查询日期范围:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() })

    const dailyActivity = await db.$queryRaw`
      SELECT 
        DATE(cds.date) as date,
        c.id as channel_id,
        c.title as channel_title,
        cds.videos_published,
        cds.videos_published_live,
        cds.total_video_views,
        cds.views as daily_views,
        cds.subscribers_gained
      FROM channel_daily_stats cds
      JOIN channels c ON cds.channel_id = c.id
      WHERE cds.date >= ${startDate}
        AND cds.date <= ${endDate}
        AND (cds.videos_published > 0 OR cds.views > 0)
      ORDER BY cds.date DESC, cds.videos_published DESC
    ` as Array<any>

    console.log('查询结果数量:', dailyActivity.length)

    const result = dailyActivity.map(record => ({
      date: record.date.toISOString().split('T')[0],
      channelId: record.channel_id,
      channelTitle: record.channel_title,
      videosPublished: record.videos_published,
      videosPublishedLive: record.videos_published_live || 0,
      totalVideoViews: record.total_video_views?.toString() || "0",
      dailyViews: record.daily_views?.toString() || "0",
      subscribersGained: record.subscribers_gained
    }))

    return NextResponse.json({
      success: true,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      count: result.length,
      data: result
    })

  } catch (error: any) {
    console.error('查询失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}