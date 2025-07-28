// 统一存储适配器 - 自动选择GitHub、文件存储、内存存储或浏览器本地存储
import { githubStorageAdapter } from "./github-storage-adapter"
import { fileStorageAdapter } from "./file-storage-adapter"
import { memoryStorageAdapter } from "./memory-storage-adapter"
import { localStorageAdapter } from "./local-storage-adapter"

interface Channel {
  id: string
  channelId: string
  title: string
  handle: string
  thumbnailUrl?: string
  viewCount?: number
  subscriberCount?: number
  videoCount?: number
  note?: string
  createdAt: Date
  updatedAt: Date
}

type StorageType = 'github' | 'fileStorage' | 'memoryStorage' | 'localStorage'

class StorageAdapter {
  private _storageType: StorageType | null = null
  
  // 检查并确定使用哪种存储方式
  private async detectStorageType(): Promise<StorageType> {
    if (this._storageType !== null) {
      return this._storageType
    }
    
    // 检查是否在服务器端环境
    const isServer = typeof window === 'undefined'
    
    if (isServer) {
      // 服务器端优先级: GitHub > FileStorage > MemoryStorage
      
      // 1. 首先尝试GitHub存储
      const githubConnected = await githubStorageAdapter.isConnected()
      if (githubConnected) {
        this._storageType = 'github'
        console.log('Storage adapter using: GitHub Storage')
        return 'github'
      }
      
      // 2. 然后尝试文件存储
      const fileConnected = await fileStorageAdapter.isConnected()
      if (fileConnected) {
        this._storageType = 'fileStorage'
        console.log('Storage adapter using: File Storage')
        return 'fileStorage'
      }
      
      // 3. 最后使用内存存储作为服务器端回退
      this._storageType = 'memoryStorage'
      console.log('Storage adapter using: Memory Storage (server fallback)')
      return 'memoryStorage'
    } else {
      // 客户端使用localStorage
      this._storageType = 'localStorage'
      console.log('Storage adapter using: LocalStorage (client-side)')
      return 'localStorage'
    }
  }
  
  // 获取当前存储适配器
  private async getAdapter() {
    const storageType = await this.detectStorageType()
    
    switch (storageType) {
      case 'github':
        return githubStorageAdapter
      case 'fileStorage':
        return fileStorageAdapter
      case 'memoryStorage':
        return memoryStorageAdapter
      case 'localStorage':
      default:
        return localStorageAdapter
    }
  }
  
  // 获取所有频道
  async getChannels(): Promise<Channel[]> {
    const adapter = await this.getAdapter()
    return adapter.getChannels()
  }

  // 添加频道
  async addChannel(channel: Omit<Channel, 'createdAt' | 'updatedAt'>): Promise<Channel | null> {
    const adapter = await this.getAdapter()
    return adapter.addChannel(channel)
  }

  // 更新频道
  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    const adapter = await this.getAdapter()
    return adapter.updateChannel(channelId, updatedData)
  }

  // 删除频道
  async deleteChannel(channelId: string): Promise<boolean> {
    const adapter = await this.getAdapter()
    return adapter.deleteChannel(channelId)
  }

  // 检查连接
  async isConnected(): Promise<boolean> {
    const adapter = await this.getAdapter()
    return adapter.isConnected()
  }
  
  // 获取存储类型信息
  async getStorageInfo(): Promise<{ type: StorageType, connected: boolean, details?: any }> {
    const storageType = await this.detectStorageType()
    const adapter = await this.getAdapter()
    const connected = await adapter.isConnected()
    
    let details: any = {}
    
    // 如果是GitHub存储，添加仓库信息
    if (storageType === 'github' && 'getRepoInfo' in adapter) {
      details.repoInfo = (adapter as any).getRepoInfo()
    }
    
    return {
      type: storageType,
      connected,
      details
    }
  }
}

export const storageAdapter = new StorageAdapter()