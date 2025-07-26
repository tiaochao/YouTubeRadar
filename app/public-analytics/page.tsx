"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Users, Eye, Video, TrendingUp, AlertCircle, ExternalLink, Settings, Radar, Target, Activity, Zap } from "lucide-react"
import { RadarScan } from "@/components/ui/logo"

interface ChannelData {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  customUrl?: string
  country?: string
  publishedAt?: string
}

interface VideoData {
  id: string
  title: string
  thumbnailUrl: string
  viewCount: number
  likeCount: number
  publishedAt: string
  duration?: string
}

export default function PublicAnalyticsPage() {
  const [channelUrl, setChannelUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [channelData, setChannelData] = useState<ChannelData | null>(null)
  const [videos, setVideos] = useState<VideoData[]>([])

  const analyzeChannel = async () => {
    if (!channelUrl.trim()) {
      setError('请输入频道链接')
      return
    }

    setLoading(true)
    setError('')
    setChannelData(null)
    setVideos([])
    
    try {
      // 使用后端API
      const response = await fetch(`/api/youtube/channel?url=${encodeURIComponent(channelUrl)}`)
      const data = await response.json()
      
      if (!data.ok) {
        throw new Error(data.error || '获取频道信息失败')
      }
      
      // 设置频道数据
      setChannelData(data.data.channel)
      setVideos(data.data.videos)
      
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || '获取数据失败')
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 1) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays} 天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`
    return `${Math.floor(diffDays / 365)} 年前`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <RadarScan size={48} className="animate-pulse" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2">
            <Target className="h-8 w-8 text-red-600" />
            公开频道分析
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-500" />
            临时扫描任意 YouTube 频道数据
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild className="border-red-200 hover:bg-red-50">
            <a href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              配置 API
            </a>
          </Button>
        </div>
        <p className="text-muted-foreground">
          无需登录即可分析任何YouTube频道的公开数据
        </p>
      </div>

      {/* 雷达扫描器 */}
      <Card className="border-red-100 bg-gradient-to-br from-red-50/30 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Radar className="h-5 w-5 text-red-600" />
            雷达目标锁定
          </CardTitle>
          <CardDescription className="text-red-600">
            支持多种格式：
            <ul className="mt-2 text-xs space-y-1">
              <li>• 频道链接：https://youtube.com/channel/UCxxxxx</li>
              <li>• 用户名：https://youtube.com/@username</li>
              <li>• 自定义URL：https://youtube.com/c/customname</li>
              <li>• 或直接输入频道ID</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="粘贴YouTube频道链接..."
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeChannel()}
            />
            <Button 
              onClick={analyzeChannel} 
              disabled={loading || !channelUrl.trim()}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
            >
              <Zap className="w-4 h-4 mr-2" />
              {loading ? '扫描中...' : '开始扫描'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              {error.includes('API') && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="/settings">配置 API 密钥</a>
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {channelData && !loading && (
        <>
          {/* 频道信息 */}
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <img
                src={channelData.thumbnailUrl}
                alt={channelData.title}
                className="w-20 h-20 rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{channelData.title}</h2>
                {channelData.customUrl && (
                  <p className="text-sm text-muted-foreground">{channelData.customUrl}</p>
                )}
                <p className="text-muted-foreground line-clamp-2 mt-1">
                  {channelData.description}
                </p>
                {channelData.publishedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    创建于 {new Date(channelData.publishedAt).toLocaleDateString('zh-CN')}
                    {channelData.country && ` · ${channelData.country}`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">订阅者</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(channelData.subscriberCount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总观看次数</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(channelData.viewCount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">视频数量</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(channelData.videoCount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均观看</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {channelData.videoCount > 0 
                    ? formatNumber(Math.round(channelData.viewCount / channelData.videoCount))
                    : '0'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最新视频 */}
          {videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>最新视频</CardTitle>
                <CardDescription>
                  频道最近发布的视频表现
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <a
                      key={video.id}
                      href={`https://youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="rounded-lg aspect-video object-cover w-full"
                        />
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium line-clamp-2 text-sm">{video.title}</h3>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{formatNumber(video.viewCount)} 次观看</span>
                        <span>{formatNumber(video.likeCount)} 点赞</span>
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}