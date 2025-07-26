"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Eye, 
  Video, 
  TrendingUp, 
  Settings,
  RefreshCw,
  BarChart3,
  Plus,
  ArrowUpRight,
  PlayCircle,
  Radar,
  Activity,
  Zap,
  Clock
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n/use-i18n"
import { Logo, RadarScan } from "@/components/ui/logo"

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

export default function HomePage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.ok) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncAllChannels = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/channels/sync-all', {
        method: 'POST'
      })
      if (response.ok) {
        await fetchDashboardStats()
      }
    } catch (error) {
      console.error('Failed to sync all channels:', error)
    } finally {
      setSyncing(false)
    }
  }

  const formatNumber = (num: string | number | undefined): string => {
    if (!num) return '0'
    const n = typeof num === 'string' ? parseInt(num) : num
    if (n >= 1000000000) {
      return (n / 1000000000).toFixed(1) + 'B'
    } else if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M'
    } else if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K'
    }
    return n.toString()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 页面标题 - 雷达主题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo size="lg" showText={false} animated={syncing} />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                {t('dashboard.title', 'YouTube Radar')}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                {t('dashboard.description', '实时监控您的 YouTube 频道活动')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncAllChannels} 
            disabled={syncing}
            className="border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin text-red-600' : 'text-red-500'}`} />
            {t('dashboard.syncAll', '扫描更新')}
          </Button>
          <Button variant="outline" size="sm" asChild className="border-gray-200 hover:bg-gray-50">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              {t('common.settings', '设置')}
            </Link>
          </Button>
        </div>
      </div>

      {/* 雷达监控面板 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              {t('dashboard.totalChannels', '监控频道')}
            </CardTitle>
            <div className="relative">
              <Radar className="h-4 w-4 text-red-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats?.totalChannels || 0}</div>
            <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto" asChild>
              <Link href="/channels" className="text-xs text-red-600 hover:text-red-800 flex items-center">
                {t('dashboard.viewAll', '查看全部')}
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              {t('dashboard.totalViews', '探测信号')}
            </CardTitle>
            <div className="relative">
              <Eye className="h-4 w-4 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatNumber(stats?.totalViews)}</div>
            <p className="text-xs text-blue-600">
              {t('dashboard.acrossAllChannels', '所有频道累计观看')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              {t('dashboard.totalSubscribers', '跟踪目标')}
            </CardTitle>
            <div className="relative">
              <Users className="h-4 w-4 text-green-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatNumber(stats?.totalSubscribers)}</div>
            <p className="text-xs text-green-600">
              {t('dashboard.combinedSubscribers', '合计订阅者数量')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              {t('dashboard.totalVideos', '数据收集')}
            </CardTitle>
            <div className="relative">
              <PlayCircle className="h-4 w-4 text-purple-500" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{formatNumber(stats?.totalVideos)}</div>
            <p className="text-xs text-purple-600">
              {t('dashboard.publishedVideos', '已采集视频数据')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 雷达控制中心 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Zap className="h-5 w-5 text-red-600" />
              {t('dashboard.quickActions', '雷达控制中心')}
            </CardTitle>
            <CardDescription className="text-red-600">
              {t('dashboard.commonTasks', '快速启动监控和分析功能')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="justify-start hover:bg-red-50 border-red-200" variant="outline" asChild>
              <Link href="/channels">
                <Radar className="mr-2 h-4 w-4 text-red-600" />
                {t('dashboard.addChannel', '连接新频道')}
              </Link>
            </Button>
            <Button className="justify-start hover:bg-blue-50 border-blue-200" variant="outline" asChild>
              <Link href="/channels">
                <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
                {t('dashboard.viewChannels', '频道管理')}
              </Link>
            </Button>
            <Button className="justify-start hover:bg-green-50 border-green-200" variant="outline" asChild>
              <Link href="/daily-activity">
                <Activity className="mr-2 h-4 w-4 text-green-600" />
                {t('dashboard.viewDailyActivity', '每日活动扫描')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 雷达检测目标 */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <RadarScan className="text-blue-600" size={20} />
              {t('dashboard.recentChannels', '雷达检测目标')}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {t('dashboard.recentlyUpdated', '最近有活动的频道信号')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentChannels && stats.recentChannels.length > 0 ? (
              <div className="space-y-4">
                {stats.recentChannels.slice(0, 3).map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {channel.thumbnailUrl && (
                        <img
                          src={channel.thumbnailUrl}
                          alt={channel.title}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <Link 
                          href={`/channels/${channel.id}`}
                          className="font-medium hover:underline"
                        >
                          {channel.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(channel.totalSubscribers)} {t('common.subscribers', '订阅者')}
                        </p>
                      </div>
                    </div>
                    {channel.lastSyncAt && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date(channel.lastSyncAt), { 
                          addSuffix: true
                        })}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.noChannels', '暂无频道数据')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近发布的视频 */}
      {stats?.recentVideos && stats.recentVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentVideos', '最新发布的视频')}</CardTitle>
            <CardDescription>
              {t('dashboard.latestVideos', '您的频道最近发布的视频')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentVideos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {video.channelTitle} • {formatNumber(video.viewCount)} {t('common.views', '观看')}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {formatDistanceToNow(new Date(video.publishedAt), { 
                      addSuffix: true
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}