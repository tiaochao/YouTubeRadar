// GitHub存储适配器 - 使用GitHub仓库作为数据存储
import { Octokit } from '@octokit/rest'

// 数据类型定义（与file-storage-adapter.ts保持一致）
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

interface StorageData {
  channels: Channel[]
  videos: Video[]
  videoStatSnapshots: VideoStatSnapshot[]
  taskLogs: TaskLog[]
  systemConfig: SystemConfig[]
  lastUpdated: Date
  version: string
}

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch?: string
  filePath?: string
}

export class GitHubStorageAdapter {
  private octokit: Octokit | null = null
  private config: GitHubConfig | null = null
  private defaultBranch: string
  private defaultFilePath: string
  
  constructor() {
    this.defaultBranch = 'main'
    this.defaultFilePath = 'data/youtube-radar-data.json'
    this.initializeFromEnv()
  }

  // 从环境变量初始化配置
  private initializeFromEnv() {
    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    
    if (token && owner && repo) {
      this.configure({
        token,
        owner,
        repo,
        branch: process.env.GITHUB_BRANCH || this.defaultBranch,
        filePath: process.env.GITHUB_FILE_PATH || this.defaultFilePath
      })
    }
  }

  // 从进程环境变量加载GitHub配置
  private async loadConfigFromSystem(): Promise<boolean> {
    if (this.isConfigured()) {
      return true // 已经配置过了
    }

    try {
      // 尝试从进程环境变量加载
      const token = process.env.__GITHUB_TOKEN
      const owner = process.env.__GITHUB_OWNER
      const repo = process.env.__GITHUB_REPO
      const branch = process.env.__GITHUB_BRANCH
      const filePath = process.env.__GITHUB_FILE_PATH
      
      if (token && owner && repo) {
        this.config = {
          token,
          owner,
          repo,
          branch: branch || this.defaultBranch,
          filePath: filePath || this.defaultFilePath
        }
        
        this.octokit = new Octokit({
          auth: token,
        })
        
        console.log('GitHub config loaded from process environment')
        return true
      }
    } catch (error) {
      console.log('Failed to load GitHub config from process:', error)
    }
    
    return false
  }

  // 保存配置到进程环境变量（临时方案）
  private saveConfigToProcess(config: GitHubConfig) {
    try {
      // 将配置保存到进程环境变量中
      process.env.__GITHUB_TOKEN = config.token
      process.env.__GITHUB_OWNER = config.owner
      process.env.__GITHUB_REPO = config.repo
      process.env.__GITHUB_BRANCH = config.branch || this.defaultBranch
      process.env.__GITHUB_FILE_PATH = config.filePath || this.defaultFilePath
      console.log('GitHub config saved to process environment')
    } catch (error) {
      console.error('Failed to save GitHub config to process:', error)
    }
  }

  // 配置GitHub存储
  configure(config: GitHubConfig): void {
    this.config = {
      ...config,
      branch: config.branch || this.defaultBranch,
      filePath: config.filePath || this.defaultFilePath
    }
    
    this.octokit = new Octokit({
      auth: config.token,
    })

    // 保存配置到进程环境
    this.saveConfigToProcess(this.config)
  }

  // 检查是否已配置
  isConfigured(): boolean {
    return !!(this.config && this.octokit)
  }

  // 确保配置已加载
  private async ensureConfigured(): Promise<boolean> {
    if (this.isConfigured()) {
      return true
    }
    
    return await this.loadConfigFromSystem()
  }

  // 读取GitHub上的数据文件
  private async readDataFromGitHub(): Promise<StorageData> {
    if (!(await this.ensureConfigured())) {
      throw new Error('GitHub storage not configured')
    }

    try {
      const response = await this.octokit!.repos.getContent({
        owner: this.config!.owner,
        repo: this.config!.repo,
        path: this.config!.filePath!,
        ref: this.config!.branch
      })

      if ('content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
        const parsed = JSON.parse(content)
        
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
      } else {
        throw new Error('Expected file content, got directory')
      }
    } catch (error: any) {
      if (error.status === 404) {
        // 文件不存在，返回默认数据
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
      throw error
    }
  }

  // 写入数据到GitHub
  private async writeDataToGitHub(data: StorageData): Promise<void> {
    if (!(await this.ensureConfigured())) {
      throw new Error('GitHub storage not configured')
    }

    data.lastUpdated = new Date()
    const content = JSON.stringify(data, null, 2)
    const encodedContent = Buffer.from(content).toString('base64')

    try {
      // 首先尝试获取当前文件的SHA（如果存在）
      let sha: string | undefined
      try {
        const currentFile = await this.octokit!.repos.getContent({
          owner: this.config!.owner,
          repo: this.config!.repo,
          path: this.config!.filePath!,
          ref: this.config!.branch
        })
        
        if ('sha' in currentFile.data) {
          sha = currentFile.data.sha
        }
      } catch (error: any) {
        // 文件不存在，首次创建
        if (error.status !== 404) {
          throw error
        }
      }

      // 创建或更新文件
      await this.octokit!.repos.createOrUpdateFileContents({
        owner: this.config!.owner,
        repo: this.config!.repo,
        path: this.config!.filePath!,
        message: `Update YouTube Radar data - ${new Date().toISOString()}`,
        content: encodedContent,
        branch: this.config!.branch,
        ...(sha && { sha })
      })

      console.log('Data successfully saved to GitHub')
    } catch (error) {
      console.error('Failed to save data to GitHub:', error)
      throw error
    }
  }

  // 频道相关方法
  async getChannels(): Promise<Channel[]> {
    const data = await this.readDataFromGitHub()
    return data.channels.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async addChannel(channel: Omit<Channel, 'createdAt' | 'updatedAt'>): Promise<Channel | null> {
    try {
      const data = await this.readDataFromGitHub()
      
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
      await this.writeDataToGitHub(data)
      
      return newChannel
    } catch (error) {
      console.error('Failed to add channel:', error)
      throw error
    }
  }

  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    try {
      const data = await this.readDataFromGitHub()
      const index = data.channels.findIndex(ch => ch.channelId === channelId)
      
      if (index === -1) {
        throw new Error('频道不存在')
      }
      
      data.channels[index] = {
        ...data.channels[index],
        ...updatedData,
        id: data.channels[index].id,
        channelId: data.channels[index].channelId,
        updatedAt: new Date()
      }
      
      await this.writeDataToGitHub(data)
      return data.channels[index]
    } catch (error) {
      console.error('Failed to update channel:', error)
      throw error
    }
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    try {
      const data = await this.readDataFromGitHub()
      const initialLength = data.channels.length
      
      // 删除频道及相关数据
      data.channels = data.channels.filter(ch => ch.channelId !== channelId)
      data.videos = data.videos.filter(v => v.channelId !== channelId)
      data.videoStatSnapshots = data.videoStatSnapshots.filter(s => s.channelId !== channelId)
      
      if (data.channels.length === initialLength) {
        return false
      }
      
      await this.writeDataToGitHub(data)
      return true
    } catch (error) {
      console.error('Failed to delete channel:', error)
      return false
    }
  }

  // 视频相关方法
  async addVideo(video: Omit<Video, 'createdAt'>): Promise<Video | null> {
    try {
      const data = await this.readDataFromGitHub()
      
      if (data.videos.find(v => v.videoId === video.videoId)) {
        return null // 视频已存在
      }
      
      const newVideo: Video = {
        ...video,
        id: video.id || this.generateId(),
        createdAt: new Date()
      }
      
      data.videos.push(newVideo)
      await this.writeDataToGitHub(data)
      
      return newVideo
    } catch (error) {
      console.error('Failed to add video:', error)
      return null
    }
  }

  async getVideosByChannel(channelId: string): Promise<Video[]> {
    const data = await this.readDataFromGitHub()
    return data.videos
      .filter(v => v.channelId === channelId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  }

  // 视频统计快照相关方法
  async addVideoStatSnapshot(snapshot: Omit<VideoStatSnapshot, 'id'>): Promise<VideoStatSnapshot | null> {
    try {
      const data = await this.readDataFromGitHub()
      
      const newSnapshot: VideoStatSnapshot = {
        ...snapshot,
        id: this.generateId(),
        collectedAt: snapshot.collectedAt || new Date()
      }
      
      data.videoStatSnapshots.push(newSnapshot)
      await this.writeDataToGitHub(data)
      
      return newSnapshot
    } catch (error) {
      console.error('Failed to add video stat snapshot:', error)
      return null
    }
  }

  async getVideoStatSnapshots(videoId: string): Promise<VideoStatSnapshot[]> {
    const data = await this.readDataFromGitHub()
    return data.videoStatSnapshots
      .filter(s => s.videoId === videoId)
      .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
  }

  // 任务日志相关方法
  async addTaskLog(log: Omit<TaskLog, 'id' | 'startedAt'>): Promise<TaskLog> {
    const data = await this.readDataFromGitHub()
    
    const newLog: TaskLog = {
      ...log,
      id: this.generateId(),
      startedAt: new Date()
    }
    
    data.taskLogs.push(newLog)
    await this.writeDataToGitHub(data)
    
    return newLog
  }

  async updateTaskLog(id: string, updates: Partial<TaskLog>): Promise<TaskLog | null> {
    const data = await this.readDataFromGitHub()
    const index = data.taskLogs.findIndex(log => log.id === id)
    
    if (index === -1) return null
    
    data.taskLogs[index] = { ...data.taskLogs[index], ...updates }
    await this.writeDataToGitHub(data)
    
    return data.taskLogs[index]
  }

  // 系统配置相关方法
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    const data = await this.readDataFromGitHub()
    return data.systemConfig.find(config => config.key === key) || null
  }

  async setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    const data = await this.readDataFromGitHub()
    const index = data.systemConfig.findIndex(config => config.key === key)
    
    if (index !== -1) {
      data.systemConfig[index] = {
        ...data.systemConfig[index],
        value,
        description,
        updatedAt: new Date()
      }
      await this.writeDataToGitHub(data)
      return data.systemConfig[index]
    } else {
      const newConfig: SystemConfig = {
        id: this.generateId(),
        key,
        value,
        description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      data.systemConfig.push(newConfig)
      await this.writeDataToGitHub(data)
      return newConfig
    }
  }

  // 数据导出功能
  async exportData(): Promise<string> {
    const data = await this.readDataFromGitHub()
    return JSON.stringify(data, null, 2)
  }

  // 数据导入功能
  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData) as StorageData
      
      if (!importedData.channels || !Array.isArray(importedData.channels)) {
        throw new Error('Invalid data format')
      }
      
      await this.writeDataToGitHub(importedData)
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
    githubRepo: string
  }> {
    const data = await this.readDataFromGitHub()
    const dataString = JSON.stringify(data, null, 2)
    const fileSize = this.formatFileSize(Buffer.byteLength(dataString, 'utf8'))
    
    return {
      channels: data.channels.length,
      videos: data.videos.length,
      snapshots: data.videoStatSnapshots.length,
      taskLogs: data.taskLogs.length,
      fileSize,
      lastUpdated: data.lastUpdated,
      githubRepo: this.config ? `${this.config.owner}/${this.config.repo}` : 'Not configured'
    }
  }

  // 检查连接状态
  async isConnected(): Promise<boolean> {
    if (!(await this.ensureConfigured())) {
      return false
    }

    try {
      // 测试GitHub连接
      await this.octokit!.users.getAuthenticated()
      return true
    } catch (error) {
      console.error('GitHub connection test failed:', error)
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

  // 获取GitHub仓库信息
  getRepoInfo(): { owner: string, repo: string, branch: string, filePath: string } | null {
    if (!this.config) return null
    
    return {
      owner: this.config.owner,
      repo: this.config.repo,
      branch: this.config.branch!,
      filePath: this.config.filePath!
    }
  }
}

export const githubStorageAdapter = new GitHubStorageAdapter()