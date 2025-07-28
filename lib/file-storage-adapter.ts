// 本地文件存储适配器 - 替代数据库存储
import fs from 'fs/promises'
import path from 'path'

// 数据类型定义
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

// 存储数据结构
interface StorageData {
  channels: Channel[]
  videos: Video[]
  videoStatSnapshots: VideoStatSnapshot[]
  taskLogs: TaskLog[]
  systemConfig: SystemConfig[]
  lastUpdated: Date
  version: string
}

export class FileStorageAdapter {
  private dataDir: string
  private filePath: string
  private backupDir: string
  
  constructor() {
    // 在项目根目录创建 data 文件夹
    this.dataDir = path.join(process.cwd(), 'data')
    this.filePath = path.join(this.dataDir, 'youtube-radar-data.json')
    this.backupDir = path.join(this.dataDir, 'backups')
  }

  // 初始化存储目录
  private async ensureDirectories() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
      await fs.mkdir(this.backupDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create storage directories:', error)
    }
  }

  // 读取数据文件
  private async readData(): Promise<StorageData> {
    try {
      await this.ensureDirectories()
      const data = await fs.readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(data)
      
      // 转换日期字符串为Date对象
      return {
        ...parsed,
        channels: parsed.channels.map((ch: any) => ({
          ...ch,
          createdAt: new Date(ch.createdAt),
          updatedAt: new Date(ch.updatedAt),
          publishedAt: ch.publishedAt ? new Date(ch.publishedAt) : undefined,
          lastAnalyticsAt: ch.lastAnalyticsAt ? new Date(ch.lastAnalyticsAt) : undefined,
          lastVideoSyncAt: ch.lastVideoSyncAt ? new Date(ch.lastVideoSyncAt) : undefined,
        })),
        videos: parsed.videos.map((v: any) => ({
          ...v,
          publishedAt: new Date(v.publishedAt),
          createdAt: new Date(v.createdAt),
        })),
        videoStatSnapshots: parsed.videoStatSnapshots.map((s: any) => ({
          ...s,
          collectedAt: new Date(s.collectedAt),
        })),
        taskLogs: parsed.taskLogs.map((t: any) => ({
          ...t,
          startedAt: new Date(t.startedAt),
          finishedAt: t.finishedAt ? new Date(t.finishedAt) : undefined,
        })),
        systemConfig: parsed.systemConfig.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
        lastUpdated: new Date(parsed.lastUpdated),
      }
    } catch (error) {
      // 如果文件不存在，返回默认数据
      return {
        channels: [],
        videos: [],
        videoStatSnapshots: [],
        taskLogs: [],
        systemConfig: [],
        lastUpdated: new Date(),
        version: '1.0.0'
      }
    }
  }

  // 写入数据文件
  private async writeData(data: StorageData): Promise<void> {
    try {
      await this.ensureDirectories()
      
      // 创建备份
      await this.createBackup()
      
      // 更新最后修改时间
      data.lastUpdated = new Date()
      
      // 写入数据
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to write data file:', error)
      throw error
    }
  }

  // 创建备份
  private async createBackup(): Promise<void> {
    try {
      const exists = await fs.access(this.filePath).then(() => true).catch(() => false)
      if (exists) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = path.join(this.backupDir, `youtube-radar-data-${timestamp}.json`)
        await fs.copyFile(this.filePath, backupPath)
        
        // 只保留最新的10个备份
        await this.cleanupBackups()
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  // 清理旧备份
  private async cleanupBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir)
      const backupFiles = files
        .filter(file => file.startsWith('youtube-radar-data-') && file.endsWith('.json'))
        .sort()
        .reverse()

      // 删除超过10个的旧备份
      if (backupFiles.length > 10) {
        for (const file of backupFiles.slice(10)) {
          await fs.unlink(path.join(this.backupDir, file))
        }
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error)
    }
  }

  // 频道相关方法
  async getChannels(): Promise<Channel[]> {
    const data = await this.readData()
    return data.channels.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async addChannel(channel: Omit<Channel, 'createdAt' | 'updatedAt'>): Promise<Channel | null> {
    try {
      const data = await this.readData()
      
      // 检查是否已存在
      if (data.channels.find(ch => ch.channelId === channel.channelId)) {
        throw new Error('频道已存在')
      }
      
      const newChannel: Channel = {
        ...channel,
        id: channel.id || this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      data.channels.push(newChannel)
      await this.writeData(data)
      
      return newChannel
    } catch (error) {
      console.error('Failed to add channel:', error)
      throw error
    }
  }

  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    try {
      const data = await this.readData()
      const index = data.channels.findIndex(ch => ch.channelId === channelId)
      
      if (index === -1) {
        throw new Error('频道不存在')
      }
      
      data.channels[index] = {
        ...data.channels[index],
        ...updatedData,
        id: data.channels[index].id, // 保持原ID
        channelId: data.channels[index].channelId, // 保持原channelId
        updatedAt: new Date()
      }
      
      await this.writeData(data)
      return data.channels[index]
    } catch (error) {
      console.error('Failed to update channel:', error)
      throw error
    }
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    try {
      const data = await this.readData()
      const initialLength = data.channels.length
      
      // 删除频道
      data.channels = data.channels.filter(ch => ch.channelId !== channelId)
      
      // 删除相关的视频和统计数据
      data.videos = data.videos.filter(v => v.channelId !== channelId)
      data.videoStatSnapshots = data.videoStatSnapshots.filter(s => s.channelId !== channelId)
      
      if (data.channels.length === initialLength) {
        return false // 没有找到要删除的频道
      }
      
      await this.writeData(data)
      return true
    } catch (error) {
      console.error('Failed to delete channel:', error)
      return false
    }
  }

  // 视频相关方法
  async addVideo(video: Omit<Video, 'createdAt'>): Promise<Video | null> {
    try {
      const data = await this.readData()
      
      // 检查是否已存在
      if (data.videos.find(v => v.videoId === video.videoId)) {
        return null // 视频已存在
      }
      
      const newVideo: Video = {
        ...video,
        id: video.id || this.generateId(),
        createdAt: new Date()
      }
      
      data.videos.push(newVideo)
      await this.writeData(data)
      
      return newVideo
    } catch (error) {
      console.error('Failed to add video:', error)
      return null
    }
  }

  async getVideosByChannel(channelId: string): Promise<Video[]> {
    const data = await this.readData()
    return data.videos
      .filter(v => v.channelId === channelId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  }

  // 视频统计快照相关方法
  async addVideoStatSnapshot(snapshot: Omit<VideoStatSnapshot, 'id'>): Promise<VideoStatSnapshot | null> {
    try {
      const data = await this.readData()
      
      const newSnapshot: VideoStatSnapshot = {
        ...snapshot,
        id: this.generateId(),
        collectedAt: snapshot.collectedAt || new Date()
      }
      
      data.videoStatSnapshots.push(newSnapshot)
      await this.writeData(data)
      
      return newSnapshot
    } catch (error) {
      console.error('Failed to add video stat snapshot:', error)
      return null
    }
  }

  async getVideoStatSnapshots(videoId: string): Promise<VideoStatSnapshot[]> {
    const data = await this.readData()
    return data.videoStatSnapshots
      .filter(s => s.videoId === videoId)
      .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
  }

  // 任务日志相关方法
  async addTaskLog(log: Omit<TaskLog, 'id' | 'startedAt'>): Promise<TaskLog> {
    const data = await this.readData()
    
    const newLog: TaskLog = {
      ...log,
      id: this.generateId(),
      startedAt: new Date()
    }
    
    data.taskLogs.push(newLog)
    await this.writeData(data)
    
    return newLog
  }

  async updateTaskLog(id: string, updates: Partial<TaskLog>): Promise<TaskLog | null> {
    const data = await this.readData()
    const index = data.taskLogs.findIndex(log => log.id === id)
    
    if (index === -1) return null
    
    data.taskLogs[index] = { ...data.taskLogs[index], ...updates }
    await this.writeData(data)
    
    return data.taskLogs[index]
  }

  // 系统配置相关方法
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    const data = await this.readData()
    return data.systemConfig.find(config => config.key === key) || null
  }

  async setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    const data = await this.readData()
    const index = data.systemConfig.findIndex(config => config.key === key)
    
    if (index !== -1) {
      // 更新现有配置
      data.systemConfig[index] = {
        ...data.systemConfig[index],
        value,
        description,
        updatedAt: new Date()
      }
      await this.writeData(data)
      return data.systemConfig[index]
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
      data.systemConfig.push(newConfig)
      await this.writeData(data)
      return newConfig
    }
  }

  // 数据导出功能
  async exportData(): Promise<string> {
    const data = await this.readData()
    return JSON.stringify(data, null, 2)
  }

  // 数据导入功能
  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData) as StorageData
      
      // 验证数据结构
      if (!importedData.channels || !Array.isArray(importedData.channels)) {
        throw new Error('Invalid data format')
      }
      
      // 创建备份
      await this.createBackup()
      
      // 写入导入的数据
      await this.writeData(importedData)
      
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
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
    const data = await this.readData()
    
    let fileSize = '0 B'
    try {
      const stats = await fs.stat(this.filePath)
      fileSize = this.formatFileSize(stats.size)
    } catch (error) {
      // 文件不存在
    }
    
    return {
      channels: data.channels.length,
      videos: data.videos.length,
      snapshots: data.videoStatSnapshots.length,
      taskLogs: data.taskLogs.length,
      fileSize,
      lastUpdated: data.lastUpdated
    }
  }

  // 检查连接状态
  async isConnected(): Promise<boolean> {
    try {
      // 检查是否在只读文件系统中（如Vercel/Lambda）
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return false
      }
      
      await this.ensureDirectories()
      
      // 尝试写入测试文件来验证写入权限
      const testFile = path.join(this.dataDir, 'test-write-permission.tmp')
      try {
        await fs.writeFile(testFile, 'test')
        await fs.unlink(testFile) // 删除测试文件
        return true
      } catch (writeError) {
        console.log('File storage not available - no write permission:', writeError)
        return false
      }
    } catch (error) {
      console.log('File storage not available:', error)
      return false
    }
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
}

export const fileStorageAdapter = new FileStorageAdapter()