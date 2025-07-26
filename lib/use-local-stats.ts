// 客户端本地存储统计钩子
import { useState, useEffect } from 'react'
import { LocalStorageAdapter } from './local-storage-adapter'

interface DashboardStats {
  totalChannels: number
  totalViews: string
  totalSubscribers: string
  totalVideos: number
  recentChannels: Array<{
    id: string
    title: string
    thumbnailUrl?: string
    totalSubscribers?: string
    totalViews?: string
    lastSyncAt?: string
  }>
  recentVideos: Array<{
    id: string
    title: string
    channelTitle: string
    publishedAt: string
    viewCount: string
  }>
}

export function useLocalStats() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const adapter = new LocalStorageAdapter()

  const fetchStats = async () => {
    try {
      const channels = adapter.getChannels()
      const videos = adapter.getVideos()
      
      // 计算总数据
      const totalViews = channels.reduce((sum, ch) => sum + Number(ch.viewCount || 0), 0)
      const totalSubscribers = channels.reduce((sum, ch) => sum + Number(ch.subscriberCount || 0), 0)
      const totalVideos = videos.length
      
      // 最近的频道（按更新时间排序）
      const recentChannels = channels
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || 0).getTime()
          const dateB = new Date(b.updatedAt || 0).getTime()
          return dateB - dateA
        })
        .slice(0, 5)
        .map(ch => ({
          id: ch.id,
          title: ch.title,
          thumbnailUrl: ch.thumbnailUrl || undefined,
          totalSubscribers: ch.subscriberCount?.toString(),
          totalViews: ch.viewCount?.toString(),
          lastSyncAt: ch.updatedAt?.toString()
        }))
      
      // 最近的视频（按发布时间排序）
      const recentVideos = videos
        .sort((a, b) => {
          const dateA = new Date(a.publishedAt || 0).getTime()
          const dateB = new Date(b.publishedAt || 0).getTime()
          return dateB - dateA
        })
        .slice(0, 10)
        .map(v => {
          const channel = channels.find(ch => ch.id === v.channelId)
          return {
            id: v.id,
            title: v.title,
            channelTitle: channel?.title || 'Unknown',
            publishedAt: v.publishedAt?.toString() || new Date().toISOString(),
            viewCount: v.viewCount?.toString() || '0'
          }
        })
      
      setStats({
        totalChannels: channels.length,
        totalViews: totalViews.toString(),
        totalSubscribers: totalSubscribers.toString(),
        totalVideos,
        recentChannels,
        recentVideos
      })
    } catch (error) {
      console.error('Failed to fetch local stats:', error)
      setStats({
        totalChannels: 0,
        totalViews: '0',
        totalSubscribers: '0',
        totalVideos: 0,
        recentChannels: [],
        recentVideos: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    loading,
    stats,
    refresh: fetchStats
  }
}