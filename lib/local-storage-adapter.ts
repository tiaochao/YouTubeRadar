// 本地存储适配器 - 支持离线使用

interface Channel {
  id: string
  title: string
  handle: string
  thumbnailUrl?: string
  viewCount?: bigint | number
  subscriberCount?: bigint | number
  createdAt: Date
  updatedAt: Date
}

interface Video {
  id: string
  channelId: string
  title: string
  publishedAt: Date
  viewCount: number
}

export class LocalStorageAdapter {
  private dbName = 'youtube-radar-local'

  // 获取所有频道
  getChannels(): Channel[] {
    const data = localStorage.getItem(`${this.dbName}-channels`)
    return data ? JSON.parse(data) : []
  }

  // 添加频道
  addChannel(channel: Channel): Channel {
    const channels = this.getChannels()
    const exists = channels.find(c => c.id === channel.id)
    
    if (!exists) {
      channels.push({
        ...channel,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      localStorage.setItem(`${this.dbName}-channels`, JSON.stringify(channels))
    }
    
    return channel
  }

  // 删除频道
  deleteChannel(channelId: string): boolean {
    const channels = this.getChannels()
    const filtered = channels.filter(c => c.id !== channelId)
    localStorage.setItem(`${this.dbName}-channels`, JSON.stringify(filtered))
    
    // 同时删除相关视频
    this.deleteVideosByChannel(channelId)
    
    return filtered.length < channels.length
  }

  // 获取频道的视频
  getVideos(channelId: string): Video[] {
    const data = localStorage.getItem(`${this.dbName}-videos-${channelId}`)
    return data ? JSON.parse(data) : []
  }

  // 保存视频
  saveVideos(channelId: string, videos: Video[]): void {
    localStorage.setItem(`${this.dbName}-videos-${channelId}`, JSON.stringify(videos))
  }

  // 删除频道的所有视频
  deleteVideosByChannel(channelId: string): void {
    localStorage.removeItem(`${this.dbName}-videos-${channelId}`)
  }

  // 获取统计数据
  getStats(channelId: string): any {
    const data = localStorage.getItem(`${this.dbName}-stats-${channelId}`)
    return data ? JSON.parse(data) : null
  }

  // 保存统计数据
  saveStats(channelId: string, stats: any): void {
    localStorage.setItem(`${this.dbName}-stats-${channelId}`, JSON.stringify({
      ...stats,
      updatedAt: new Date()
    }))
  }

  // 清除所有数据
  clearAll(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.dbName)) {
        localStorage.removeItem(key)
      }
    })
  }

  // 导出数据
  exportData(): string {
    const channels = this.getChannels()
    const data: any = { channels, videos: {}, stats: {} }
    
    channels.forEach(channel => {
      data.videos[channel.id] = this.getVideos(channel.id)
      data.stats[channel.id] = this.getStats(channel.id)
    })
    
    return JSON.stringify(data, null, 2)
  }

  // 导入数据
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      // 清除现有数据
      this.clearAll()
      
      // 导入频道
      if (data.channels) {
        localStorage.setItem(`${this.dbName}-channels`, JSON.stringify(data.channels))
      }
      
      // 导入视频
      if (data.videos) {
        Object.entries(data.videos).forEach(([channelId, videos]) => {
          this.saveVideos(channelId, videos as Video[])
        })
      }
      
      // 导入统计
      if (data.stats) {
        Object.entries(data.stats).forEach(([channelId, stats]) => {
          this.saveStats(channelId, stats)
        })
      }
      
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }
}

export const localDB = new LocalStorageAdapter()

// 检测是否在浏览器环境
export const isClientSide = typeof window !== 'undefined'

// 获取存储使用情况
export function getStorageUsage(): { used: number; limit: number } {
  if (!isClientSide) return { used: 0, limit: 0 }
  
  let used = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length
    }
  }
  
  // localStorage 通常限制为 5-10MB
  const limit = 5 * 1024 * 1024 // 5MB
  
  return { used, limit }
}