// 本地存储适配器 - 当没有数据库时使用
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

export class LocalStorageAdapter {
  private isClient = typeof window !== 'undefined'
  private storageKey = 'youtube-radar-channels'

  // 获取所有频道
  async getChannels(): Promise<Channel[]> {
    if (!this.isClient) return []
    
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return []
      
      const channels = JSON.parse(data)
      return channels.map((ch: any) => ({
        ...ch,
        createdAt: new Date(ch.createdAt),
        updatedAt: new Date(ch.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to get channels from localStorage:', error)
      return []
    }
  }

  // 添加频道
  async addChannel(channel: Omit<Channel, 'createdAt' | 'updatedAt'>): Promise<Channel | null> {
    if (!this.isClient) return null
    
    try {
      const channels = await this.getChannels()
      
      // 检查是否已存在
      if (channels.find(ch => ch.channelId === channel.channelId)) {
        throw new Error('频道已存在')
      }
      
      const newChannel: Channel = {
        ...channel,
        id: channel.id || Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      channels.push(newChannel)
      localStorage.setItem(this.storageKey, JSON.stringify(channels))
      
      return newChannel
    } catch (error) {
      console.error('Failed to add channel to localStorage:', error)
      throw error
    }
  }

  // 更新频道
  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    if (!this.isClient) return null
    
    try {
      const channels = await this.getChannels()
      const index = channels.findIndex(ch => ch.channelId === channelId)
      
      if (index === -1) {
        throw new Error('频道不存在')
      }
      
      channels[index] = {
        ...channels[index],
        ...updatedData,
        id: channels[index].id, // 保持原ID
        channelId: channels[index].channelId, // 保持原channelId
        updatedAt: new Date()
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(channels))
      return channels[index]
    } catch (error) {
      console.error('Failed to update channel in localStorage:', error)
      throw error
    }
  }

  // 删除频道
  async deleteChannel(channelId: string): Promise<boolean> {
    if (!this.isClient) return false
    
    try {
      const channels = await this.getChannels()
      const filteredChannels = channels.filter(ch => ch.channelId !== channelId)
      
      if (filteredChannels.length === channels.length) {
        return false // 没有找到要删除的频道
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredChannels))
      return true
    } catch (error) {
      console.error('Failed to delete channel from localStorage:', error)
      return false
    }
  }

  // 检查连接
  async isConnected(): Promise<boolean> {
    if (!this.isClient) return false
    
    try {
      // 测试localStorage是否可用
      const testKey = 'youtube-radar-test'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }
}

export const localStorageAdapter = new LocalStorageAdapter()