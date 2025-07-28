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
    
    // 按日期分组数据
    const groupedByDate = new Map<string, any[]>()
    
    dailyStats.forEach(stat => {
      const date = stat.date
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, [])
      }
      
      groupedByDate.get(date)!.push({
        id: stat.channel_id,
        title: channelMap.get(stat.channel_id) || 'Unknown Channel',
        videosPublished: stat.videos_published || 0,
        videosPublishedLive: stat.videos_published_live || 0,
        totalVideoViews: stat.total_video_views?.toString() || '0',
        dailyViews: stat.views?.toString() || '0',
        subscribersGained: stat.subscribers_gained || 0
      })
    })
    
    // 转换为页面期望的格式
    const formattedActivity = Array.from(groupedByDate.entries()).map(([date, channels]) => {
      const totalVideos = channels.reduce((sum, ch) => sum + ch.videosPublished + ch.videosPublishedLive, 0)
      const totalViews = channels.reduce((sum, ch) => sum + parseInt(ch.dailyViews), 0)
      const totalSubscribersGained = channels.reduce((sum, ch) => sum + ch.subscribersGained, 0)
      
      return {
        date,
        channels,
        totalVideos,
        totalChannels: channels.length,
        totalViews: totalViews.toString(),
        totalSubscribersGained
      }
    })
    
    // 按日期倒序排序
    formattedActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return successResponse(formattedActivity)
    
  } catch (error: any) {
    console.error("Failed to fetch daily activity:", error)
    return successResponse([]) // 即使出错也返回空数组
  }
}