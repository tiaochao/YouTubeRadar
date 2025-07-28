import { NextRequest, NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // 设置日期范围
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)
    
    // 从 YouTube API 获取频道视频
    const youtubeAPI = new ClientYouTubeAPI()
    const videos = await youtubeAPI.getChannelVideos(params.channelId, 50) // 获取最近50个视频
    
    // 筛选出当日发布的视频
    const videosPublishedToday = videos.filter(video => {
      const publishedAt = new Date(video.snippet.publishedAt)
      return publishedAt >= startDate && publishedAt <= endDate
    })
    
    // 统计视频类型
    const regularVideos = videosPublishedToday.filter(v => !v.snippet.title.toLowerCase().includes('live'))
    const liveVideos = videosPublishedToday.filter(v => v.snippet.title.toLowerCase().includes('live'))
    
    // 计算总观看数
    const totalViews = videosPublishedToday.reduce((sum, video) => {
      return sum + parseInt(video.statistics.viewCount || '0')
    }, 0)
    
    return successResponse({
      date,
      channelId: params.channelId,
      videosPublished: regularVideos.length,
      videosPublishedLive: liveVideos.length,
      totalVideosPublished: videosPublishedToday.length,
      totalViewsFromNewVideos: totalViews,
      videos: videosPublishedToday.map(v => ({
        id: v.id,
        title: v.snippet.title,
        publishedAt: v.snippet.publishedAt,
        viewCount: v.statistics.viewCount,
        likeCount: v.statistics.likeCount,
        commentCount: v.statistics.commentCount
      }))
    })
    
  } catch (error: any) {
    console.error('Failed to fetch videos by date:', error)
    return errorResponse("Failed to fetch videos", error.message, 500)
  }
}