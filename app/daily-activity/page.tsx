"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/use-i18n"
import { formatNumber } from "@/lib/utils"
import { RadarScan } from "@/components/ui/logo"
import { Radar, Activity, Zap, Target } from "lucide-react"

interface ChannelActivity {
  id: string
  title: string
  videosPublished: number
  videosPublishedLive: number
  totalVideoViews: string
  dailyViews: string
  subscribersGained: number
}

interface DailyActivity {
  date: string
  channels: ChannelActivity[]
  totalVideos: number
  totalChannels: number
  totalViews: string
  totalSubscribersGained: number
}

export default function DailyActivityPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<DailyActivity[]>([])
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchDailyActivity()
  }, [days])

  const fetchDailyActivity = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 尝试从 API 获取数据
      const response = await fetch(`/api/daily-activity?days=${days}`)
      const data = await response.json()
      
      if (data.ok) {
        setActivities(data.data)
      } else {
        // 如果 API 失败，说明可能没有配置数据库
        setActivities([])
      }
    } catch (err) {
      // 如果出错，显示本地存储版本
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  // 计算每个日期需要的行数
  const getDateRowSpan = (dayActivities: DailyActivity) => {
    return dayActivities.channels.length || 1
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">{t('errors.error')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <RadarScan size={48} className="animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2">
                <Activity className="h-8 w-8 text-red-600" />
                {t('dailyActivity.title')}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                {t('dailyActivity.description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg border border-red-200">
            <Zap className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">{t('dailyActivity.showDays')}</span>
          </div>
          <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
            <SelectTrigger className="w-32 border-red-200 hover:border-red-300 focus:border-red-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 {t('common.days')}</SelectItem>
              <SelectItem value="15">15 {t('common.days')}</SelectItem>
              <SelectItem value="30">30 {t('common.days')}</SelectItem>
              <SelectItem value="60">60 {t('common.days')}</SelectItem>
              <SelectItem value="90">90 {t('common.days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activities.length === 0 ? (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Activity className="h-12 w-12 text-amber-500" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-amber-800">{t('dailyActivity.localStorageLimit')}</p>
              <p className="text-muted-foreground max-w-md">
                {t('dailyActivity.localStorageDescription')}
              </p>
              <p className="text-sm text-amber-600">
                {t('dailyActivity.configureDatabase')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-100 bg-gradient-to-br from-red-50/30 to-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gradient-to-r from-red-100 to-red-50">
                  <tr>
                    <th className="p-4 text-left font-medium text-red-800 flex items-center gap-2">
                      <Radar className="h-4 w-4" />
                      {t('dailyActivity.date')}
                    </th>
                    <th className="p-4 text-left font-medium text-red-800">{t('dailyActivity.channel')}</th>
                    <th className="p-4 text-center font-medium text-red-800">{t('dailyActivity.videosPublished')}</th>
                    <th className="p-4 text-center font-medium text-red-800">{t('dailyActivity.liveVideos')}</th>
                    <th className="p-4 text-right font-medium text-red-800">{t('dailyActivity.dailyViews')}</th>
                    <th className="p-4 text-right font-medium text-red-800">{t('dailyActivity.subscribersGained')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((dayActivity) => (
                    dayActivity.channels.map((channel, channelIndex) => (
                      <tr key={`${dayActivity.date}-${channel.id}`} className="border-b hover:bg-red-50/50 transition-colors">
                        {channelIndex === 0 && (
                          <td 
                            rowSpan={getDateRowSpan(dayActivity)} 
                            className="p-4 bg-gradient-to-r from-red-100/50 to-red-50/30 font-medium align-top border-r border-red-200"
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <div className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                              </div>
                              <div>
                                <div className="font-semibold text-red-800">{formatDate(dayActivity.date)}</div>
                                <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {dayActivity.totalChannels} {t('dailyActivity.activeChannels')}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{channel.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {t('dailyActivity.totalViews')}: {formatNumber(channel.totalVideoViews)}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {channel.videosPublished > 0 && (
                            <Badge variant="secondary">
                              {channel.videosPublished}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {channel.videosPublishedLive > 0 && (
                            <Badge variant="destructive">
                              {channel.videosPublishedLive}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right font-medium">
                          {formatNumber(channel.dailyViews)}
                        </td>
                        <td className="p-4 text-right">
                          {channel.subscribersGained > 0 ? (
                            <span className="text-green-600 font-medium">
                              +{formatNumber(channel.subscribersGained)}
                            </span>
                          ) : channel.subscribersGained < 0 ? (
                            <span className="text-red-600 font-medium">
                              {formatNumber(channel.subscribersGained)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}