import { NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"

export async function GET() {
  try {
    const supabase = getSupabaseWithNewKeys()
    
    // 1. 获取第一个频道进行测试
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .limit(1)
    
    if (channelsError) {
      return NextResponse.json({
        step: 'fetch_channels',
        error: channelsError.message,
        details: channelsError
      }, { status: 500 })
    }
    
    if (!channels || channels.length === 0) {
      return NextResponse.json({
        step: 'fetch_channels',
        error: 'No channels found in database'
      }, { status: 404 })
    }
    
    const channel = channels[0]
    console.log('Testing with channel:', channel.title, channel.channel_id)
    
    // 2. 测试 YouTube API 获取视频
    try {
      const youtubeAPI = new ClientYouTubeAPI()
      const videos = await youtubeAPI.getChannelVideos(channel.channel_id, 10)
      
      // 获取今天的日期
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      // 筛选今天发布的视频
      const todaysVideos = videos.filter(video => {
        const publishedAt = new Date(video.snippet.publishedAt)
        const videoDateStr = publishedAt.toISOString().split('T')[0]
        return videoDateStr === todayStr
      })
      
      // 3. 检查数据库中是否已有今天的统计
      const { data: existingStats, error: statsError } = await supabase
        .from('channel_daily_stats')
        .select('*')
        .eq('channel_id', channel.channel_id)
        .eq('date', todayStr)
      
      return NextResponse.json({
        success: true,
        channel: {
          id: channel.channel_id,
          title: channel.title,
          totalViews: channel.view_count,
          videoCount: channel.video_count
        },
        todaysDate: todayStr,
        recentVideos: {
          total: videos.length,
          titles: videos.slice(0, 3).map(v => ({
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            views: v.statistics.viewCount
          }))
        },
        todaysVideos: {
          count: todaysVideos.length,
          videos: todaysVideos.map(v => ({
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            views: v.statistics.viewCount
          }))
        },
        existingDailyStats: {
          found: existingStats && existingStats.length > 0,
          count: existingStats?.length || 0,
          data: existingStats
        },
        apiKeyConfigured: !!youtubeAPI.apiKey
      })
    } catch (apiError: any) {
      return NextResponse.json({
        step: 'youtube_api',
        error: apiError.message,
        details: apiError.stack,
        channel: {
          id: channel.channel_id,
          title: channel.title
        }
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      step: 'general',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}