// 客户端 YouTube API - 直接在浏览器中调用

const API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    customUrl?: string
    thumbnails: {
      default: { url: string }
      medium: { url: string }
    }
  }
  statistics: {
    viewCount: string
    subscriberCount: string
    videoCount: string
  }
}

interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    publishedAt: string
    channelId: string
  }
  statistics: {
    viewCount: string
    likeCount?: string
    commentCount?: string
  }
}

export class ClientYouTubeAPI {
  private apiKey: string

  constructor(apiKey?: string) {
    // 优先级：参数 > localStorage > 环境变量
    this.apiKey = apiKey || 
                  (typeof window !== 'undefined' ? localStorage.getItem('youtube_api_key') : null) || 
                  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 
                  ''
    
    if (!this.apiKey) {
      console.warn('YouTube API key not configured. Some features may not work.')
    }
  }

  // 搜索频道
  async searchChannel(query: string): Promise<YouTubeChannel | null> {
    try {
      const searchUrl = `${API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${this.apiKey}`
      console.log('搜索频道 URL:', searchUrl)
      const searchRes = await fetch(searchUrl)
      const searchData = await searchRes.json()
      console.log('搜索响应:', searchData)
      
      if (searchData.error) {
        console.error('API 错误:', searchData.error)
        throw new Error(searchData.error.message || 'API 请求失败')
      }
      
      if (!searchData.items || searchData.items.length === 0) {
        return null
      }
      
      const channelId = searchData.items[0].id.channelId
      return this.getChannelById(channelId)
    } catch (error) {
      console.error('搜索频道失败:', error)
      throw error
    }
  }

  // 通过 ID 或 handle 获取频道
  async getChannelById(channelId: string): Promise<YouTubeChannel | null> {
    if (!this.apiKey) {
      throw new Error('YouTube API key is not configured')
    }

    try {
      // 支持 @handle 格式
      const params = channelId.startsWith('@') 
        ? `forHandle=${channelId.substring(1)}`
        : `id=${channelId}`
        
      const url = `${API_BASE}/channels?part=snippet,statistics&${params}&key=${this.apiKey}`
      console.log('获取频道 URL:', url.replace(this.apiKey, '***'))
      
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log('频道响应状态:', { 
        hasItems: !!data.items, 
        itemCount: data.items?.length || 0,
        hasError: !!data.error 
      })
      
      if (data.error) {
        console.error('YouTube API 错误:', data.error)
        let errorMessage = data.error.message || 'API 请求失败'
        
        // 针对常见错误提供友好提示
        if (data.error.code === 403) {
          errorMessage = 'API 密钥无效或已超出配额限制'
        } else if (data.error.code === 404) {
          errorMessage = '找不到指定的频道'
        } else if (data.error.code === 400) {
          errorMessage = '请求参数错误'
        }
        
        throw new Error(errorMessage)
      }
      
      if (!data.items || data.items.length === 0) {
        console.warn(`频道 ${channelId} 未找到`)
        return null
      }
      
      return data.items[0]
    } catch (error: any) {
      console.error('获取频道失败:', error)
      
      // 网络错误友好提示
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接')
      }
      
      throw error
    }
  }

  // 获取频道最新视频
  async getChannelVideos(channelId: string, maxResults = 20): Promise<YouTubeVideo[]> {
    try {
      const url = `${API_BASE}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${this.apiKey}`
      const res = await fetch(url)
      const data = await res.json()
      
      if (!data.items) return []
      
      // 获取视频详细统计
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
      const statsUrl = `${API_BASE}/videos?part=statistics&id=${videoIds}&key=${this.apiKey}`
      const statsRes = await fetch(statsUrl)
      const statsData = await statsRes.json()
      
      // 合并数据
      return data.items.map((item: any, index: number) => ({
        id: item.id.videoId,
        snippet: item.snippet,
        statistics: statsData.items[index]?.statistics || {}
      }))
    } catch (error) {
      console.error('获取视频失败:', error)
      return []
    }
  }

  // 批量获取频道信息
  async getChannelsBatch(channelIds: string[]): Promise<YouTubeChannel[]> {
    if (channelIds.length === 0) return []
    
    try {
      const url = `${API_BASE}/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${this.apiKey}`
      const res = await fetch(url)
      const data = await res.json()
      
      return data.items || []
    } catch (error) {
      console.error('批量获取频道失败:', error)
      return []
    }
  }

  // 检查 API 密钥是否有效
  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${API_BASE}/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${this.apiKey}`
      const res = await fetch(url)
      return res.ok
    } catch {
      return false
    }
  }

  // 获取 API 配额使用情况（估算）
  getQuotaInfo(): { used: number; limit: number; resetTime: Date } {
    const used = parseInt(localStorage.getItem('youtube-api-quota-used') || '0')
    const resetTime = new Date()
    resetTime.setHours(0, 0, 0, 0)
    resetTime.setDate(resetTime.getDate() + 1)
    
    return {
      used,
      limit: 10000, // YouTube API 每日配额
      resetTime
    }
  }

  // 记录 API 使用
  private trackQuotaUsage(cost: number): void {
    const current = parseInt(localStorage.getItem('youtube-api-quota-used') || '0')
    const today = new Date().toDateString()
    const lastReset = localStorage.getItem('youtube-api-quota-reset')
    
    if (lastReset !== today) {
      localStorage.setItem('youtube-api-quota-used', cost.toString())
      localStorage.setItem('youtube-api-quota-reset', today)
    } else {
      localStorage.setItem('youtube-api-quota-used', (current + cost).toString())
    }
  }
}

// 创建默认实例
export const youtubeAPI = new ClientYouTubeAPI()