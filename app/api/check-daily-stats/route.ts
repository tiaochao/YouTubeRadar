import { NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"

export async function GET() {
  try {
    const supabase = getSupabaseWithNewKeys()
    
    // 获取最近的每日统计记录
    const { data: recentStats, error: statsError } = await supabase
      .from('channel_daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(10)
    
    if (statsError) {
      return NextResponse.json({
        error: 'Failed to fetch daily stats',
        details: statsError
      }, { status: 500 })
    }
    
    // 获取所有频道
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('channel_id, title')
    
    // 统计信息
    const today = new Date().toISOString().split('T')[0]
    const { data: todaysStats } = await supabase
      .from('channel_daily_stats')
      .select('*')
      .eq('date', today)
    
    // 获取日期范围
    const { data: dateRange } = await supabase
      .from('channel_daily_stats')
      .select('date')
      .order('date', { ascending: true })
      .limit(1)
    
    const { data: latestDate } = await supabase
      .from('channel_daily_stats')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
    
    return NextResponse.json({
      summary: {
        totalRecords: recentStats?.length || 0,
        todaysRecords: todaysStats?.length || 0,
        totalChannels: channels?.length || 0,
        dateRange: {
          earliest: dateRange?.[0]?.date || 'N/A',
          latest: latestDate?.[0]?.date || 'N/A'
        }
      },
      recentStats: recentStats?.map(stat => ({
        date: stat.date,
        channelId: stat.channel_id,
        views: stat.views,
        videosPublished: stat.videos_published,
        subscribersGained: stat.subscribers_gained,
        totalVideoViews: stat.total_video_views
      })),
      todaysStats: todaysStats?.map(stat => ({
        channelId: stat.channel_id,
        views: stat.views,
        videosPublished: stat.videos_published
      })),
      channels: channels?.map(ch => ({
        id: ch.channel_id,
        title: ch.title
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}