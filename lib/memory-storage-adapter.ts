// 内存存储适配器 - 服务器端临时存储
interface Channel {
  id: string
  channelId: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: 'active' | 'syncing'
  country?: string
  timezone?: string
  customUrl?: string
  publishedAt?: Date
  videoCount?: number
  viewCount?: number
  createdAt: Date
  updatedAt: Date
  lastAnalyticsAt?: Date
  lastVideoSyncAt?: Date
  totalViews?: number
  totalSubscribers?: number
  note?: string
}

interface Video {
  id: string
  videoId: string
  channelId: string
  title: string
  publishedAt: Date
  live: boolean
  duration?: string
  createdAt: Date
}

interface VideoStatSnapshot {
  id: string
  videoId: string
  channelId: string
  collectedAt: Date
  viewCount: number
  likeCount: number
  commentCount: number
}

interface TaskLog {
  id: string
  taskType: 'VIDEO_SYNC' | 'CHANNEL_HOURLY' | 'PUBSUB_NEW_VIDEO'
  startedAt: Date
  finishedAt?: Date
  success: boolean
  message?: string
  durationMs?: number
}

interface SystemConfig {
  id: string
  key: string
  value: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export class MemoryStorageAdapter {
  private channels: Channel[] = []
  private videos: Video[] = []
  private videoStatSnapshots: VideoStatSnapshot[] = []
  private taskLogs: TaskLog[] = []
  private systemConfig: SystemConfig[] = []
  private lastUpdated: Date = new Date()

  // 获取所有频道
  async getChannels(): Promise<Channel[]> {
    return [...this.channels].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // 添加频道
  async addChannel(channel: Omit<Channel, 'createdAt' | 'updatedAt'>): Promise<Channel | null> {
    try {
      // 检查是否已存在
      if (this.channels.find(ch => ch.channelId === channel.channelId)) {
        throw new Error('频道已存在')
      }
      
      const newChannel: Channel = {
        ...channel,
        id: channel.id || this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      this.channels.push(newChannel)
      this.lastUpdated = new Date()
      
      console.log(`Memory storage: Added channel ${newChannel.title}`)
      return newChannel
    } catch (error) {
      console.error('Failed to add channel to memory storage:', error)
      throw error
    }
  }

  // 更新频道
  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    try {
      const index = this.channels.findIndex(ch => ch.channelId === channelId)
      
      if (index === -1) {
        throw new Error('频道不存在')
      }
      
      this.channels[index] = {
        ...this.channels[index],
        ...updatedData,
        id: this.channels[index].id, // 保持原ID
        channelId: this.channels[index].channelId, // 保持原channelId
        updatedAt: new Date()
      }
      
      this.lastUpdated = new Date()
      console.log(`Memory storage: Updated channel ${this.channels[index].title}`)
      return this.channels[index]
    } catch (error) {
      console.error('Failed to update channel in memory storage:', error)
      throw error
    }
  }

  // 删除频道
  async deleteChannel(channelId: string): Promise<boolean> {
    try {
      const initialLength = this.channels.length
      
      // 删除频道
      this.channels = this.channels.filter(ch => ch.channelId !== channelId)
      
      // 删除相关的视频和统计数据
      this.videos = this.videos.filter(v => v.channelId !== channelId)
      this.videoStatSnapshots = this.videoStatSnapshots.filter(s => s.channelId !== channelId)
      
      if (this.channels.length === initialLength) {
        return false // 没有找到要删除的频道
      }
      
      this.lastUpdated = new Date()
      console.log(`Memory storage: Deleted channel ${channelId}`)
      return true
    } catch (error) {
      console.error('Failed to delete channel from memory storage:', error)
      return false
    }
  }

  // 视频相关方法
  async addVideo(video: Omit<Video, 'createdAt'>): Promise<Video | null> {
    try {
      // 检查是否已存在
      if (this.videos.find(v => v.videoId === video.videoId)) {
        return null // 视频已存在
      }
      
      const newVideo: Video = {
        ...video,
        id: video.id || this.generateId(),
        createdAt: new Date()
      }
      
      this.videos.push(newVideo)
      this.lastUpdated = new Date()
      
      return newVideo
    } catch (error) {
      console.error('Failed to add video to memory storage:', error)
      return null
    }
  }

  async getVideosByChannel(channelId: string): Promise<Video[]> {
    return this.videos
      .filter(v => v.channelId === channelId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  }

  // 视频统计快照相关方法
  async addVideoStatSnapshot(snapshot: Omit<VideoStatSnapshot, 'id'>): Promise<VideoStatSnapshot | null> {
    try {
      const newSnapshot: VideoStatSnapshot = {
        ...snapshot,
        id: this.generateId(),
        collectedAt: snapshot.collectedAt || new Date()
      }
      
      this.videoStatSnapshots.push(newSnapshot)
      this.lastUpdated = new Date()
      
      return newSnapshot
    } catch (error) {
      console.error('Failed to add video stat snapshot to memory storage:', error)
      return null
    }
  }

  async getVideoStatSnapshots(videoId: string): Promise<VideoStatSnapshot[]> {
    return this.videoStatSnapshots
      .filter(s => s.videoId === videoId)
      .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
  }

  // 任务日志相关方法
  async addTaskLog(log: Omit<TaskLog, 'id' | 'startedAt'>): Promise<TaskLog> {
    const newLog: TaskLog = {
      ...log,
      id: this.generateId(),
      startedAt: new Date()
    }
    
    this.taskLogs.push(newLog)
    this.lastUpdated = new Date()
    
    return newLog
  }

  async updateTaskLog(id: string, updates: Partial<TaskLog>): Promise<TaskLog | null> {
    const index = this.taskLogs.findIndex(log => log.id === id)
    
    if (index === -1) return null
    
    this.taskLogs[index] = { ...this.taskLogs[index], ...updates }
    this.lastUpdated = new Date()
    
    return this.taskLogs[index]
  }

  // 系统配置相关方法
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    return this.systemConfig.find(config => config.key === key) || null
  }

  async setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    const index = this.systemConfig.findIndex(config => config.key === key)
    
    if (index !== -1) {
      // 更新现有配置
      this.systemConfig[index] = {
        ...this.systemConfig[index],
        value,
        description,
        updatedAt: new Date()
      }
      this.lastUpdated = new Date()
      return this.systemConfig[index]
    } else {
      // 创建新配置
      const newConfig: SystemConfig = {
        id: this.generateId(),
        key,
        value,
        description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.systemConfig.push(newConfig)
      this.lastUpdated = new Date()
      return newConfig
    }
  }

  // 数据导出功能
  async exportData(): Promise<string> {
    const data = {
      channels: this.channels,
      videos: this.videos,
      videoStatSnapshots: this.videoStatSnapshots,
      taskLogs: this.taskLogs,
      systemConfig: this.systemConfig,
      lastUpdated: this.lastUpdated,
      version: '1.0.0'
    }
    return JSON.stringify(data, null, 2)
  }

  // 数据导入功能
  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData)
      
      if (!importedData.channels || !Array.isArray(importedData.channels)) {
        throw new Error('Invalid data format')
      }
      
      // 导入数据
      this.channels = importedData.channels || []
      this.videos = importedData.videos || []
      this.videoStatSnapshots = importedData.videoStatSnapshots || []
      this.taskLogs = importedData.taskLogs || []
      this.systemConfig = importedData.systemConfig || []
      this.lastUpdated = new Date()
      
      console.log('Memory storage: Data imported successfully')
      return true
    } catch (error) {
      console.error('Failed to import data to memory storage:', error)
      return false
    }
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<{
    channels: number
    videos: number
    snapshots: number
    taskLogs: number
    fileSize: string
    lastUpdated: Date
  }> {
    const dataString = JSON.stringify({
      channels: this.channels,
      videos: this.videos,
      videoStatSnapshots: this.videoStatSnapshots,
      taskLogs: this.taskLogs,
      systemConfig: this.systemConfig
    })
    
    const fileSize = this.formatFileSize(Buffer.byteLength(dataString, 'utf8'))
    
    return {
      channels: this.channels.length,
      videos: this.videos.length,
      snapshots: this.videoStatSnapshots.length,
      taskLogs: this.taskLogs.length,
      fileSize,
      lastUpdated: this.lastUpdated
    }
  }

  // 检查连接状态
  async isConnected(): Promise<boolean> {
    // 内存存储总是可用的
    return true
  }

  // 工具方法
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 清空所有数据（用于测试）
  async clearAll(): Promise<void> {
    this.channels = []
    this.videos = []
    this.videoStatSnapshots = []
    this.taskLogs = []
    this.systemConfig = []
    this.lastUpdated = new Date()
    console.log('Memory storage: All data cleared')
  }
}

export const memoryStorageAdapter = new MemoryStorageAdapter()