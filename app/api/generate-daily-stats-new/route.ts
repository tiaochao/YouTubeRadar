import { NextRequest, NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"
import { YouTubeAnalyticsAPI, YouTubeOAuth } from "@/lib/youtube-analytics-api"
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
      
      // 尝试从 YouTube Analytics API 获取真实数据
      let analyticsData = {
        views: dailyVideoViews,
        estimatedMinutesWatched: 0,
        watchTimeHours: 0,
        subscribersGained: 0,
        subscribersLost: 0
      }
      
      // 检查是否配置了 Analytics API
      const refreshToken = req.cookies.get('youtube_analytics_refresh_token')?.value
      if (refreshToken) {
        try {
          // 获取 OAuth 凭据
          const clientId = req.cookies.get('youtube_analytics_client_id')?.value || ''
          const clientSecret = req.cookies.get('youtube_analytics_client_secret')?.value || ''
          
          if (clientId && clientSecret) {
            // 刷新访问令牌
            const tokenData = await YouTubeOAuth.refreshAccessToken(
              refreshToken,
              clientId,
              clientSecret
            )
            
            if (tokenData) {
              // 使用 Analytics API 获取数据
              const analyticsAPI = new YouTubeAnalyticsAPI(tokenData.access_token)
              const stats = await analyticsAPI.getChannelDailyStats(channel.channel_id, targetDateStr)
              
              if (stats) {
                analyticsData = {
                  views: stats.views,
                  estimatedMinutesWatched: stats.estimatedMinutesWatched,
                  watchTimeHours: Math.floor(stats.estimatedMinutesWatched / 60),
                  subscribersGained: stats.subscribersGained,
                  subscribersLost: stats.subscribersLost
                }
              }
            }
          }
        } catch (analyticsError) {
          console.log(`无法获取频道 ${channel.channel_id} 的 Analytics 数据:`, analyticsError)
        }
      }
      
      // 创建每日统计记录
      const dailyStat = {
        id: generateUUID(),
        channel_id: channel.channel_id,
        date: targetDateStr,
        views: analyticsData.views,
        watch_time_hours: analyticsData.watchTimeHours,
        subscribers_gained: analyticsData.subscribersGained,
        subscribers_lost: analyticsData.subscribersLost,
        estimated_minutes_watched: analyticsData.estimatedMinutesWatched,
        impressions: 0, // Analytics API v2 不提供展示次数
        impression_ctr: 0, // Analytics API v2 不提供点击率
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