import { NextRequest, NextResponse } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const url = searchParams.get("url") || ""
    
    if (!url) {
      return errorResponse("请提供频道URL", "", 400)
    }
    
    if (!YOUTUBE_API_KEY) {
      return errorResponse("YouTube API未配置", "请在环境变量中设置YOUTUBE_API_KEY", 500)
    }
    
    logger.info("YouTube API", `Analyzing channel: ${url}`)
    
    // 提取频道ID
    let channelId = ""
    
    // 1. 尝试匹配标准频道URL
    const channelMatch = url.match(/channel\/([a-zA-Z0-9_-]+)/)
    if (channelMatch) {
      channelId = channelMatch[1]
      logger.info("YouTube API", `Found channel ID: ${channelId}`)
    }
    
    // 2. 尝试匹配@用户名
    const userMatch = url.match(/@([a-zA-Z0-9_.-]+)/)
    if (!channelId && userMatch) {
      const username = userMatch[1]
      logger.info("YouTube API", `Searching for username: @${username}`)
      
      // 使用channels.list搜索用户名
      const channelByUsernameUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${YOUTUBE_API_KEY}`
      const usernameResponse = await fetch(channelByUsernameUrl)
      const usernameData = await usernameResponse.json()
      
      if (usernameData.items && usernameData.items.length > 0) {
        channelId = usernameData.items[0].id
        logger.info("YouTube API", `Found channel by username: ${channelId}`)
      } else {
        // 尝试搜索频道
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${username}&type=channel&maxResults=5&key=${YOUTUBE_API_KEY}`
        const searchResponse = await fetch(searchUrl)
        const searchData = await searchResponse.json()
        
        if (searchData.items && searchData.items.length > 0) {
          // 查找最匹配的结果
          const exactMatch = searchData.items.find((item: any) => {
            const title = item.snippet.title.toLowerCase()
            const customUrl = item.snippet.customUrl?.toLowerCase()
            return title === username.toLowerCase() || 
                   customUrl === `@${username.toLowerCase()}` ||
                   title.includes(username.toLowerCase())
          })
          
          channelId = exactMatch ? exactMatch.id.channelId : searchData.items[0].id.channelId
          logger.info("YouTube API", `Found channel by search: ${channelId}`)
        }
      }
    }
    
    // 3. 如果直接是频道ID
    if (!channelId && url.startsWith("UC") && url.length === 24) {
      channelId = url
      logger.info("YouTube API", `Using direct channel ID: ${channelId}`)
    }
    
    if (!channelId) {
      return errorResponse("无法识别的频道URL", "请提供有效的YouTube频道链接", 400)
    }
    
    // 获取频道详细信息
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    const channelResponse = await fetch(channelUrl)
    const channelData = await channelResponse.json()
    
    if (channelData.error) {
      logger.error("YouTube API", "API Error:", channelData.error)
      return errorResponse("YouTube API错误", channelData.error.message, 400)
    }
    
    if (!channelData.items || channelData.items.length === 0) {
      return errorResponse("频道未找到", `找不到ID为 ${channelId} 的频道`, 404)
    }
    
    const channel = channelData.items[0]
    
    // 获取最新视频
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=12&order=date&type=video&key=${YOUTUBE_API_KEY}`
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()
    
    let videos = []
    if (videosData.items && videosData.items.length > 0) {
      // 获取视频详细统计
      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(",")
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      const statsResponse = await fetch(statsUrl)
      const statsData = await statsResponse.json()
      
      videos = videosData.items.map((item: any, index: number) => {
        const stats = statsData.items[index]
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.high.url,
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(stats?.statistics.viewCount || "0"),
          likeCount: parseInt(stats?.statistics.likeCount || "0"),
          commentCount: parseInt(stats?.statistics.commentCount || "0"),
          duration: parseDuration(stats?.contentDetails.duration || "PT0S")
        }
      })
    }
    
    return successResponse({
      channel: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        customUrl: channel.snippet.customUrl,
        country: channel.snippet.country,
        publishedAt: channel.snippet.publishedAt,
        subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
        videoCount: parseInt(channel.statistics.videoCount || "0"),
        viewCount: parseInt(channel.statistics.viewCount || "0"),
        hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount,
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
      },
      videos: videos,
      quotaUsed: videos.length > 0 ? 3 : 1 // 1 for channel, 2 for videos
    })
    
  } catch (error: any) {
    logger.error("YouTube API", "Unexpected error:", error)
    return errorResponse("获取频道信息失败", error.message, 500)
  }
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return "0:00"
  
  const hours = parseInt(match[1] || "0")
  const minutes = parseInt(match[2] || "0") 
  const seconds = parseInt(match[3] || "0")
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}