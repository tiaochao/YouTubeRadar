import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // 测试明确的日期范围
    const startDate = new Date("2025-07-25T00:00:00.000Z")
    const endDate = new Date("2025-07-30T23:59:59.999Z")

    console.log('查询范围:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    })

    const dailyActivity = await db.$queryRaw`
      SELECT 
        DATE(cds.date) as date,
        c.id as channel_id,
        c.title as channel_title,
        cds.videos_published,
        cds.videos_published_live,
        cds.total_video_views,
        cds.views as daily_views,
        cds.subscribers_gained,
        cds.date as original_date
      FROM channel_daily_stats cds
      JOIN channels c ON cds.channel_id = c.id
      WHERE cds.date >= ${startDate}
        AND cds.date <= ${endDate}
        AND (cds.videos_published > 0 OR cds.views > 0)
      ORDER BY cds.date DESC, cds.views DESC
    ` as Array<any>

    const result = dailyActivity.map(record => ({
      date: record.date.toISOString().split('T')[0],
      originalDate: record.original_date.toISOString(),
      channelId: record.channel_id,
      channelTitle: record.channel_title,
      dailyViews: record.daily_views?.toString() || "0",
      videosPublished: record.videos_published,
      subscribersGained: record.subscribers_gained
    }))

    return NextResponse.json({
      success: true,
      queryRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
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