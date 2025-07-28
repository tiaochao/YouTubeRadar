// 统一存储适配器 - 自动选择文件存储或浏览器本地存储
import { fileStorageAdapter } from "./file-storage-adapter"
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

class StorageAdapter {
  private _usesDatabase: boolean | null = null
  
  // 检查并确定使用哪种存储方式
  private async detectStorageType(): Promise<boolean> {
    if (this._usesDatabase !== null) {
      return this._usesDatabase
    }
    
    // 检查是否在服务器端环境
    const isServer = typeof window === 'undefined'
    if (isServer) {
      // 服务器端使用文件存储
      const fileConnected = await fileStorageAdapter.isConnected()
      this._usesDatabase = fileConnected
      console.log(`Storage adapter using: ${fileConnected ? 'FileStorage' : 'Fallback'}`)
      return fileConnected
    } else {
      // 客户端使用localStorage
      this._usesDatabase = false
      console.log('Storage adapter using: LocalStorage (client-side)')
      return false
    }
  }
  
  // 获取当前存储适配器
  private async getAdapter() {
    const usesFileStorage = await this.detectStorageType()
    const isServer = typeof window === 'undefined'
    
    if (isServer) {
      return usesFileStorage ? fileStorageAdapter : localStorageAdapter
    } else {
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
  async getStorageInfo(): Promise<{ type: 'fileStorage' | 'localStorage', connected: boolean }> {
    const usesFileStorage = await this.detectStorageType()
    const adapter = await this.getAdapter()
    const connected = await adapter.isConnected()
    const isServer = typeof window === 'undefined'
    
    return {
      type: (isServer && usesFileStorage) ? 'fileStorage' : 'localStorage',
      connected
    }
  }
}

export const storageAdapter = new StorageAdapter()