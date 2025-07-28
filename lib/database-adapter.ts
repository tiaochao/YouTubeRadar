// 数据库适配器 - 替代本地存储
import { db } from "./db"

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

export class DatabaseAdapter {
  // 获取所有频道
  async getChannels(): Promise<Channel[]> {
    try {
      const channels = await db.channel.findMany({
        orderBy: { updatedAt: 'desc' }
      })
      
      return channels.map(ch => ({
        id: ch.id,
        channelId: ch.channelId,
        title: ch.title,
        handle: ch.customUrl || ch.channelId,
        thumbnailUrl: ch.thumbnailUrl,
        viewCount: Number(ch.viewCount || 0),
        subscriberCount: Number(ch.totalSubscribers || 0),
        videoCount: ch.videoCount || 0,
        note: ch.note,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt
      }))
    } catch (error) {
      console.error('Failed to get channels from database:', error)
      return []
    }
  }

  // 添加频道
  async addChannel(channel: Omit<Channel, 'createdAt' | 'updatedAt'>): Promise<Channel | null> {
    try {
      console.log('尝试添加频道到数据库:', channel)
      
      // 确保数字值的安全转换
      const viewCount = Math.max(0, parseInt(String(channel.viewCount || 0)))
      const subscriberCount = Math.max(0, parseInt(String(channel.subscriberCount || 0)))
      const videoCount = Math.max(0, parseInt(String(channel.videoCount || 0)))
      
      console.log('转换后的数值:', { viewCount, subscriberCount, videoCount })
      
      // 先检查频道是否已存在
      const existing = await db.channel.findUnique({
        where: { channelId: channel.channelId }
      })
      
      if (existing) {
        console.log('频道已存在:', existing.channelId)
        throw new Error('频道已存在')
      }
      
      const newChannel = await db.channel.create({
        data: {
          channelId: channel.channelId,
          title: channel.title,
          customUrl: channel.handle,
          thumbnailUrl: channel.thumbnailUrl,
          viewCount: BigInt(viewCount),
          totalViews: BigInt(viewCount),
          totalSubscribers: BigInt(subscriberCount),
          videoCount: videoCount,
          note: channel.note,
          status: 'active'
        }
      })
      
      console.log('频道添加成功:', newChannel.channelId)
      
      return {
        id: newChannel.id,
        channelId: newChannel.channelId,
        title: newChannel.title,
        handle: newChannel.customUrl || newChannel.channelId,
        thumbnailUrl: newChannel.thumbnailUrl,
        viewCount: Number(newChannel.viewCount || 0),
        subscriberCount: Number(newChannel.totalSubscribers || 0),
        videoCount: newChannel.videoCount || 0,
        note: newChannel.note,
        createdAt: newChannel.createdAt,
        updatedAt: newChannel.updatedAt
      }
    } catch (error: any) {
      console.error('Failed to add channel to database:', error)
      console.error('错误详情:', error.message)
      if (error.code === 'P2002') {
        throw new Error('频道已存在')
      }
      throw error
    }
  }

  // 更新频道
  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    try {
      const updatedChannel = await db.channel.update({
        where: { channelId: channelId },
        data: {
          ...(updatedData.title && { title: updatedData.title }),
          ...(updatedData.handle && { customUrl: updatedData.handle }),
          ...(updatedData.thumbnailUrl && { thumbnailUrl: updatedData.thumbnailUrl }),
          ...(updatedData.viewCount !== undefined && { viewCount: BigInt(updatedData.viewCount) }),
          ...(updatedData.subscriberCount !== undefined && { totalSubscribers: BigInt(updatedData.subscriberCount) }),
          ...(updatedData.videoCount !== undefined && { videoCount: updatedData.videoCount }),
          ...(updatedData.note !== undefined && { note: updatedData.note }),
          updatedAt: new Date()
        }
      })
      
      return {
        id: updatedChannel.id,
        channelId: updatedChannel.channelId,
        title: updatedChannel.title,
        handle: updatedChannel.customUrl || updatedChannel.channelId,
        thumbnailUrl: updatedChannel.thumbnailUrl,
        viewCount: Number(updatedChannel.viewCount || 0),
        subscriberCount: Number(updatedChannel.totalSubscribers || 0),
        videoCount: updatedChannel.videoCount || 0,
        note: updatedChannel.note,
        createdAt: updatedChannel.createdAt,
        updatedAt: updatedChannel.updatedAt
      }
    } catch (error) {
      console.error('Failed to update channel in database:', error)
      return null
    }
  }

  // 删除频道
  async deleteChannel(channelId: string): Promise<boolean> {
    try {
      await db.channel.delete({
        where: { channelId: channelId }
      })
      return true
    } catch (error) {
      console.error('Failed to delete channel from database:', error)
      return false
    }
  }

  // 检查数据库连接
  async isConnected(): Promise<boolean> {
    try {
      // 检查是否使用模拟客户端
      if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL configured, using mock client')
        return false
      }
      
      await db.$queryRaw`SELECT 1`
      console.log('Database connection test passed')
      return true
    } catch (error: any) {
      console.error('Database connection test failed:', {
        name: error.name,
        message: error.message,
        code: error.code
      })
      return false
    }
  }
}

export const databaseAdapter = new DatabaseAdapter()