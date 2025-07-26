/**
 * YouTube Public API - 无需OAuth认证的数据获取
 * 使用YouTube Data API v3的公开接口
 */

interface ChannelInfo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  videoCount: number
  viewCount: number
}

interface VideoInfo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
}

export class YouTubePublicAPI {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 通过频道URL或ID获取频道信息
   */
  async getChannelInfo(channelIdentifier: string): Promise<ChannelInfo> {
    let channelId = channelIdentifier

    // 如果是URL，提取channel ID
    if (channelIdentifier.includes('youtube.com')) {
      const match = channelIdentifier.match(/channel\/([a-zA-Z0-9_-]+)/)
      if (match) {
        channelId = match[1]
      } else {
        // 尝试通过用户名查找
        const username = channelIdentifier.match(/@([a-zA-Z0-9_-]+)/)
        if (username) {
          const searchResult = await this.searchChannelByUsername(username[1])
          if (searchResult) {
            channelId = searchResult
          }
        }
      }
    }

    const url = `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw new Error('Channel not found')
    }

    const channel = data.items[0]
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnailUrl: channel.snippet.thumbnails.high.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      viewCount: parseInt(channel.statistics.viewCount)
    }
  }

  /**
   * 获取频道的视频列表
   */
  async getChannelVideos(
    channelId: string, 
    maxResults: number = 50,
    pageToken?: string
  ): Promise<{videos: VideoInfo[], nextPageToken?: string}> {
    const url = `${this.baseUrl}/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video${pageToken ? `&pageToken=${pageToken}` : ''}&key=${this.apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) {
      throw new Error('Failed to fetch videos')
    }

    // 获取视频ID列表
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
    
    // 批量获取视频详细信息
    const videoDetails = await this.getVideoDetails(videoIds)

    return {
      videos: videoDetails,
      nextPageToken: data.nextPageToken
    }
  }

  /**
   * 获取视频详细信息
   */
  private async getVideoDetails(videoIds: string): Promise<VideoInfo[]> {
    const url = `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${this.apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    return data.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0'),
      duration: this.parseDuration(video.contentDetails.duration)
    }))
  }

  /**
   * 搜索频道
   */
  private async searchChannelByUsername(username: string): Promise<string | null> {
    const url = `${this.baseUrl}/search?part=snippet&q=${username}&type=channel&key=${this.apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      return data.items[0].id.channelId
    }
    return null
  }

  /**
   * 解析ISO 8601持续时间格式
   */
  private parseDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return '0:00'

    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    const seconds = match[3] ? parseInt(match[3]) : 0

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  /**
   * 获取频道的播放列表
   */
  async getChannelPlaylists(channelId: string): Promise<any[]> {
    const url = `${this.baseUrl}/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${this.apiKey}`
    const response = await fetch(url)
    const data = await response.json()
    return data.items || []
  }

  /**
   * 计算频道统计数据
   */
  async getChannelAnalytics(channelId: string): Promise<{
    totalViews: number
    averageViews: number
    totalLikes: number
    engagementRate: number
    recentVideos: VideoInfo[]
  }> {
    // 获取最近50个视频
    const { videos } = await this.getChannelVideos(channelId, 50)
    
    const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0)
    const totalLikes = videos.reduce((sum, video) => sum + video.likeCount, 0)
    const averageViews = Math.round(totalViews / videos.length)
    const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0

    return {
      totalViews,
      averageViews,
      totalLikes,
      engagementRate: Math.round(engagementRate * 100) / 100,
      recentVideos: videos.slice(0, 10)
    }
  }
}

// 使用示例
export function createYouTubeClient(apiKey: string) {
  return new YouTubePublicAPI(apiKey)
}