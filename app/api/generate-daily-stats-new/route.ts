import { NextRequest, NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"
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
      
      // 生成基于频道实际数据的每日统计
      const viewCount = Number(channel.view_count || 0)
      const subscriberCount = Number(channel.total_subscribers || 0)
      
      const dailyStat = {
        id: generateUUID(),
        channel_id: channel.channel_id,
        date: targetDateStr,
        views: Math.floor(viewCount * 0.001), // 假设每日观看是总观看的0.1%
        watch_time_hours: Math.floor(viewCount * 0.001 * 5 / 60), // 假设平均观看5分钟
        subscribers_gained: Math.floor(Math.random() * 50), // 0-50个新订阅者
        subscribers_lost: Math.floor(Math.random() * 10), // 0-10个取消订阅
        estimated_minutes_watched: Math.floor(viewCount * 0.01), // 估算观看时长
        impressions: Math.floor(viewCount * 0.1), // 展示次数
        impression_ctr: Math.random() * 10, // 0-10% 点击率
        videos_published: Math.floor(Math.random() * 3), // 0-2个新视频
        videos_published_live: Math.floor(Math.random() * 2), // 0-1个直播
        total_video_views: viewCount,
        avg_views_per_video: channel.video_count ? Math.floor(viewCount / channel.video_count) : 0,
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