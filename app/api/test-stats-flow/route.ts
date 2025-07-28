import { NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"

export async function GET() {
  try {
    const supabase = getSupabaseWithNewKeys()
    
    // 1. 检查是否有频道
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('channel_id, title')
    
    if (channelsError) {
      return NextResponse.json({
        step: 1,
        error: 'Failed to fetch channels',
        details: channelsError
      })
    }
    
    // 2. 检查是否有每日统计数据
    const { data: stats, error: statsError } = await supabase
      .from('channel_daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(5)
    
    if (statsError) {
      return NextResponse.json({
        step: 2,
        error: 'Failed to fetch stats',
        details: statsError,
        channels: channels?.length || 0
      })
    }
    
    // 3. 分析数据
    const hasChannels = channels && channels.length > 0
    const hasStats = stats && stats.length > 0
    
    let recommendation = ''
    if (!hasChannels) {
      recommendation = '请先添加频道'
    } else if (!hasStats) {
      recommendation = '请点击"生成每日统计"按钮'
    } else {
      recommendation = '数据正常，请检查每日活动页面'
    }
    
    return NextResponse.json({
      success: true,
      channels: {
        count: channels?.length || 0,
        list: channels?.slice(0, 3) || []
      },
      stats: {
        count: stats?.length || 0,
        latest: stats?.[0] || null,
        sample: stats?.slice(0, 3).map(s => ({
          date: s.date,
          channelId: s.channel_id,
          views: s.views,
          videosPublished: s.videos_published,
          totalVideoViews: s.total_video_views
        }))
      },
      recommendation
    })
  } catch (error: any) {
    return NextResponse.json({
      step: 0,
      error: error.message,
      stack: error.stack
    })
  }
}