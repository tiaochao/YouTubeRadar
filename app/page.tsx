"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Eye, 
  Settings,
  BarChart3,
  PlayCircle,
  Radar,
  Activity,
  Zap,
  ExternalLink,
  Clock
} from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/use-i18n"
import { Logo, RadarScan } from "@/components/ui/logo"
import { LocalStorageAdapter } from "@/lib/local-storage-adapter"
import { formatRelativeTime } from "@/lib/utils"

export default function HomePage() {
  const { t } = useI18n()
  const [stats, setStats] = useState({
    totalChannels: 0,
    totalViews: 0,
    totalSubscribers: 0,
    totalVideos: 0
  })
  const [recentChannels, setRecentChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const adapter = new LocalStorageAdapter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = () => {
    try {
      const channels = adapter.getChannels()
      
      // Calculate total stats
      const totalViews = channels.reduce((sum, ch) => sum + (ch.viewCount || 0), 0)
      const totalSubscribers = channels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0)
      const totalVideos = channels.reduce((sum, ch) => sum + (ch.videoCount || 0), 0)
      
      setStats({
        totalChannels: channels.length,
        totalViews,
        totalSubscribers,
        totalVideos
      })
      
      // Get recent channels (sorted by updatedAt)
      const sortedChannels = [...channels].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ).slice(0, 3)
      
      setRecentChannels(sortedChannels)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo size="lg" showText={false} animated={false} />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                YouTube Radar
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                {t('dashboard.description', '实时监控您的 YouTube 频道活动')}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="border-gray-200 hover:bg-gray-50">
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t('common.settings', '设置')}
          </Link>
        </Button>
      </div>

      {/* 简单的欢迎卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              {t('dashboard.totalChannels', '监控频道')}
            </CardTitle>
            <Radar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.totalChannels}</div>
            {stats.totalChannels === 0 ? (
              <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto" asChild>
                <Link href="/channels" className="text-xs text-red-600 hover:text-red-800">
                  {t('dashboard.addChannel', '添加频道')} →
                </Link>
              </Button>
            ) : (
              <p className="text-xs text-red-600">
                {t('dashboard.acrossAllChannels', '正在监控中')}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              {t('dashboard.totalViews', '总观看数')}
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatNumber(stats.totalViews)}</div>
            <p className="text-xs text-blue-600">
              {t('dashboard.acrossAllChannels', '所有频道累计')}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              {t('dashboard.totalSubscribers', '订阅者')}
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatNumber(stats.totalSubscribers)}</div>
            <p className="text-xs text-green-600">
              {t('dashboard.combinedSubscribers', '合计订阅者数')}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              {t('dashboard.totalVideos', '视频数')}
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.totalVideos}</div>
            <p className="text-xs text-purple-600">
              {t('dashboard.publishedVideos', '已发布视频')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Zap className="h-5 w-5 text-red-600" />
              {t('dashboard.quickActions', '快速开始')}
            </CardTitle>
            <CardDescription className="text-red-600">
              {t('dashboard.commonTasks', '开始监控您的 YouTube 频道')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="justify-start hover:bg-red-50 border-red-200" variant="outline" asChild>
              <Link href="/channels">
                <Radar className="mr-2 h-4 w-4 text-red-600" />
                {stats.totalChannels === 0 
                  ? t('dashboard.addChannel', '添加第一个频道')
                  : t('dashboard.viewChannels', '查看频道列表')}
              </Link>
            </Button>
            <Button className="justify-start hover:bg-blue-50 border-blue-200" variant="outline" asChild>
              <Link href="/public-analytics">
                <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
                {t('dashboard.viewAnalytics', '公共分析工具')}
              </Link>
            </Button>
            <Button className="justify-start hover:bg-green-50 border-green-200" variant="outline" asChild>
              <Link href="/daily-activity">
                <Activity className="mr-2 h-4 w-4 text-green-600" />
                {t('dashboard.viewDailyActivity', '每日活动')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <RadarScan className="text-blue-600" size={20} />
              {stats.totalChannels > 0 
                ? t('dashboard.recentChannels', '最近更新的频道')
                : t('dashboard.recentChannels', '功能介绍')}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {stats.totalChannels > 0
                ? t('dashboard.recentlyUpdated', '最近同步或更新的频道')
                : t('dashboard.recentlyUpdated', '了解 YouTube Radar 的功能')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.totalChannels > 0 ? (
              <>
                {recentChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {channel.thumbnailUrl && (
                        <img
                          src={channel.thumbnailUrl}
                          alt={channel.title}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{channel.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(new Date(channel.updatedAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatNumber(channel.subscriberCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(channel.viewCount || 0)}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.totalChannels > 3 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/channels">
                      {t('dashboard.viewAll', '查看全部')} →
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">1</Badge>
                  <p className="text-sm">添加您想要监控的 YouTube 频道</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">2</Badge>
                  <p className="text-sm">实时查看频道数据和视频统计</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">3</Badge>
                  <p className="text-sm">分析频道增长趋势和表现</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">4</Badge>
                  <p className="text-sm">数据保存在本地，随时可用</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}