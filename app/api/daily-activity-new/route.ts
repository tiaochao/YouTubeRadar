import type { NextRequest } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseWithNewKeys()
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "30")
    
    // 获取指定天数内的数据
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    const startDateStr = startDate.toISOString().split('T')[0]
    
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const endDateStr = endDate.toISOString().split('T')[0]
    
    // 获取每日统计数据
    const { data: dailyStats, error: statsError } = await supabase
      .from('channel_daily_stats')
      .select(`
        date,
        channel_id,
        videos_published,
        videos_published_live,
        total_video_views,
        views,
        subscribers_gained
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false })
    
    if (statsError) {
      console.error('Error fetching daily stats:', statsError)
      return successResponse([]) // 返回空数组而不是错误
    }
    
    if (!dailyStats || dailyStats.length === 0) {
      return successResponse([])
    }
    
    // 获取频道信息
    const channelIds = [...new Set(dailyStats.map(stat => stat.channel_id))]
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('channel_id, title')
      .in('channel_id', channelIds)
    
    if (channelsError) {
      console.error('Error fetching channels:', channelsError)
    }
    
    // 创建频道ID到标题的映射
    const channelMap = new Map(
      channels?.map(ch => [ch.channel_id, ch.title]) || []
    )
    
    // 格式化数据
    const formattedActivity = dailyStats.map(stat => ({
      date: stat.date,
      channel_id: stat.channel_id,
      channel_title: channelMap.get(stat.channel_id) || 'Unknown Channel',
      videos_published: stat.videos_published || 0,
      videos_published_live: stat.videos_published_live || 0,
      total_video_views: stat.total_video_views?.toString() || '0',
      daily_views: stat.views?.toString() || '0',
      subscribers_gained: stat.subscribers_gained || 0
    }))
    
    return successResponse(formattedActivity)
    
  } catch (error: any) {
    console.error("Failed to fetch daily activity:", error)
    return successResponse([]) // 即使出错也返回空数组
  }
}