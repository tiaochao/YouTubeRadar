// 统一存储适配器 - 自动选择数据库或本地存储
import { databaseAdapter } from "./database-adapter"
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
    
    // 首先尝试数据库
    const dbConnected = await databaseAdapter.isConnected()
    this._usesDatabase = dbConnected
    
    console.log(`Storage adapter using: ${dbConnected ? 'Database' : 'LocalStorage'}`)
    return dbConnected
  }
  
  // 获取当前存储适配器
  private async getAdapter() {
    const usesDatabase = await this.detectStorageType()
    return usesDatabase ? databaseAdapter : localStorageAdapter
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
  async getStorageInfo(): Promise<{ type: 'database' | 'localStorage', connected: boolean }> {
    const usesDatabase = await this.detectStorageType()
    const adapter = await this.getAdapter()
    const connected = await adapter.isConnected()
    
    return {
      type: usesDatabase ? 'database' : 'localStorage',
      connected
    }
  }
}

export const storageAdapter = new StorageAdapter()