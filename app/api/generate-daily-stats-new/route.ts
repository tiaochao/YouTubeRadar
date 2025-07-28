import { NextRequest, NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseWithNewKeys()
    const { channelId, date } = await req.json()
    
    // 检查日期格式
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const targetDateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    // 获取频道信息
    let channelsQuery = supabase
      .from('channels')
      .select('*')
      .eq('status', 'active')
    
    if (channelId) {
      channelsQuery = channelsQuery.eq('channel_id', channelId)
    }
    
    const { data: channels, error: channelsError } = await channelsQuery
    
    if (channelsError) {
      console.error('Error fetching channels:', channelsError)
      return errorResponse("Failed to fetch channels", channelsError.message, 500)
    }
    
    if (!channels || channels.length === 0) {
      return errorResponse("No channels found", "No active channels to generate stats for", 404)
    }
    
    const results = []
    let skippedCount = 0
    
    for (const channel of channels) {
      // 检查是否已有该日期的数据
      const { data: existingStats } = await supabase
        .from('channel_daily_stats')
        .select('id')
        .eq('channel_id', channel.channel_id)
        .eq('date', targetDateStr)
        .single()
      
      if (existingStats) {
        skippedCount++
        continue
      }
      
      // 生成 UUID
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      
      // 获取当日发布的视频数据
      let videosPublished = 0
      let videosPublishedLive = 0
      let dailyVideoViews = 0
      
      try {
        const youtubeAPI = new ClientYouTubeAPI()
        const videos = await youtubeAPI.getChannelVideos(channel.channel_id, 50)
        
        // 筛选当日发布的视频
        const todaysVideos = videos.filter(video => {
          const publishedAt = new Date(video.snippet.publishedAt)
          const videoDateStr = publishedAt.toISOString().split('T')[0]
          return videoDateStr === targetDateStr
        })
        
        // 统计视频类型
        videosPublished = todaysVideos.filter(v => 
          !v.snippet.title.toLowerCase().includes('live') && 
          !v.snippet.title.toLowerCase().includes('直播')
        ).length
        
        videosPublishedLive = todaysVideos.filter(v => 
          v.snippet.title.toLowerCase().includes('live') || 
          v.snippet.title.toLowerCase().includes('直播')
        ).length
        
        // 计算当日视频的总观看数
        dailyVideoViews = todaysVideos.reduce((sum, video) => {
          return sum + parseInt(video.statistics.viewCount || '0')
        }, 0)
      } catch (videoError) {
        console.log(`无法获取频道 ${channel.channel_id} 的视频数据:`, videoError)
      }
      
      // 创建每日统计记录
      // 注意：YouTube Data API v3 不提供历史每日统计数据
      // 只能记录当前快照和当日发布的视频信息
      const dailyStat = {
        id: generateUUID(),
        channel_id: channel.channel_id,
        date: targetDateStr,
        views: dailyVideoViews, // 当日发布视频的观看数
        watch_time_hours: 0, // 需要 Analytics API
        subscribers_gained: 0, // 需要 Analytics API
        subscribers_lost: 0, // 需要 Analytics API
        estimated_minutes_watched: 0, // 需要 Analytics API
        impressions: 0, // 需要 Analytics API
        impression_ctr: 0, // 需要 Analytics API
        videos_published: videosPublished,
        videos_published_live: videosPublishedLive,
        total_video_views: Number(channel.view_count || 0), // 频道总观看数快照
        avg_views_per_video: channel.video_count ? Math.floor(Number(channel.view_count || 0) / channel.video_count) : 0,
        updated_at: new Date().toISOString()
      }
      
      const { data: insertedStat, error: insertError } = await supabase
        .from('channel_daily_stats')
        .insert(dailyStat)
        .select()
        .single()
      
      if (insertError) {
        console.error(`Error inserting stats for channel ${channel.channel_id}:`, insertError)
      } else if (insertedStat) {
        results.push(insertedStat)
      }
    }
    
    console.log(`Generated ${results.length} daily stats, skipped ${skippedCount} existing`)
    
    return successResponse({
      message: `Generated daily stats for ${results.length} channels`,
      date: targetDateStr,
      statsCount: results.length,
      skippedCount,
      stats: results.map(stat => ({
        channelId: stat.channel_id,
        date: stat.date,
        views: stat.views.toString(),
        videosPublished: stat.videos_published,
        subscribersGained: stat.subscribers_gained
      }))
    })
    
  } catch (error: any) {
    console.error("Failed to generate daily stats:", error)
    return errorResponse("Failed to generate daily stats", error.message, 500)
  }
}