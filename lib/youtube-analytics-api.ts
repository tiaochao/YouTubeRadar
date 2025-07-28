// YouTube Analytics API 客户端
// 用于获取频道的详细分析数据

interface AnalyticsData {
  views: number
  estimatedMinutesWatched: number
  averageViewDuration: number
  subscribersGained: number
  subscribersLost: number
}

export class YouTubeAnalyticsAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // 获取频道的每日统计数据
  async getChannelDailyStats(channelId: string, date: string): Promise<AnalyticsData | null> {
    try {
      const startDate = date
      const endDate = date
      
      // YouTube Analytics API v2 端点
      const url = `https://youtubeanalytics.googleapis.com/v2/reports`
      
      const params = new URLSearchParams({
        ids: `channel==${channelId}`,
        startDate: startDate,
        endDate: endDate,
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
        dimensions: 'day'
      })
      
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Analytics API error:', response.status, await response.text())
        return null
      }
      
      const data = await response.json()
      
      // 解析返回的数据
      if (data.rows && data.rows.length > 0) {
        const row = data.rows[0]
        return {
          views: row[1] || 0,
          estimatedMinutesWatched: row[2] || 0,
          averageViewDuration: row[3] || 0,
          subscribersGained: row[4] || 0,
          subscribersLost: row[5] || 0
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      return null
    }
  }
  
  // 获取视频级别的统计数据
  async getVideoDailyStats(videoIds: string[], date: string): Promise<Record<string, any>> {
    try {
      const startDate = date
      const endDate = date
      
      const url = `https://youtubeanalytics.googleapis.com/v2/reports`
      
      const params = new URLSearchParams({
        ids: `channel==MINE`,
        startDate: startDate,
        endDate: endDate,
        metrics: 'views,estimatedMinutesWatched,likes,comments',
        dimensions: 'video',
        filters: `video==${videoIds.join(',')}`
      })
      
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Analytics API error:', response.status, await response.text())
        return {}
      }
      
      const data = await response.json()
      const videoStats: Record<string, any> = {}
      
      if (data.rows) {
        data.rows.forEach((row: any[]) => {
          const videoId = row[0]
          videoStats[videoId] = {
            views: row[1] || 0,
            estimatedMinutesWatched: row[2] || 0,
            likes: row[3] || 0,
            comments: row[4] || 0
          }
        })
      }
      
      return videoStats
    } catch (error) {
      console.error('Failed to fetch video analytics:', error)
      return {}
    }
  }
}

// OAuth 2.0 流程辅助函数
export const YouTubeOAuth = {
  // 生成 OAuth 授权 URL
  getAuthUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      access_type: 'offline',
      prompt: 'consent'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  },
  
  // 用授权码交换访问令牌
  async exchangeCodeForToken(
    code: string, 
    clientId: string, 
    clientSecret: string, 
    redirectUri: string
  ): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      })
      
      if (!response.ok) {
        console.error('Failed to exchange code:', await response.text())
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to exchange code for token:', error)
      return null
    }
  },
  
  // 刷新访问令牌
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ access_token: string } | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token'
        })
      })
      
      if (!response.ok) {
        console.error('Failed to refresh token:', await response.text())
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to refresh access token:', error)
      return null
    }
  }
}