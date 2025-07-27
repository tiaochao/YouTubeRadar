// 数据库适配器 - 替代本地存储
import { db } from "./db"

interface Channel {
  id: string
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
        title: ch.title,
        handle: ch.handle,
        thumbnailUrl: ch.thumbnailUrl,
        viewCount: ch.viewCount,
        subscriberCount: ch.subscriberCount,
        videoCount: ch.videoCount,
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
      const newChannel = await db.channel.create({
        data: {
          id: channel.id,
          title: channel.title,
          handle: channel.handle,
          thumbnailUrl: channel.thumbnailUrl,
          viewCount: channel.viewCount || 0,
          subscriberCount: channel.subscriberCount || 0,
          videoCount: channel.videoCount || 0,
          note: channel.note,
          status: 'active'
        }
      })
      
      return {
        id: newChannel.id,
        title: newChannel.title,
        handle: newChannel.handle,
        thumbnailUrl: newChannel.thumbnailUrl,
        viewCount: newChannel.viewCount,
        subscriberCount: newChannel.subscriberCount,
        videoCount: newChannel.videoCount,
        note: newChannel.note,
        createdAt: newChannel.createdAt,
        updatedAt: newChannel.updatedAt
      }
    } catch (error) {
      console.error('Failed to add channel to database:', error)
      return null
    }
  }

  // 更新频道
  async updateChannel(channelId: string, updatedData: Partial<Channel>): Promise<Channel | null> {
    try {
      const updatedChannel = await db.channel.update({
        where: { id: channelId },
        data: {
          ...(updatedData.title && { title: updatedData.title }),
          ...(updatedData.handle && { handle: updatedData.handle }),
          ...(updatedData.thumbnailUrl && { thumbnailUrl: updatedData.thumbnailUrl }),
          ...(updatedData.viewCount !== undefined && { viewCount: updatedData.viewCount }),
          ...(updatedData.subscriberCount !== undefined && { subscriberCount: updatedData.subscriberCount }),
          ...(updatedData.videoCount !== undefined && { videoCount: updatedData.videoCount }),
          ...(updatedData.note !== undefined && { note: updatedData.note }),
          updatedAt: new Date()
        }
      })
      
      return {
        id: updatedChannel.id,
        title: updatedChannel.title,
        handle: updatedChannel.handle,
        thumbnailUrl: updatedChannel.thumbnailUrl,
        viewCount: updatedChannel.viewCount,
        subscriberCount: updatedChannel.subscriberCount,
        videoCount: updatedChannel.videoCount,
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
        where: { id: channelId }
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
      await db.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      return false
    }
  }
}

export const databaseAdapter = new DatabaseAdapter()