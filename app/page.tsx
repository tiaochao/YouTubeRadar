"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Eye, 
  Settings,
  Radar,
  Activity,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Video,
  Search,
  PlayCircle
} from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/use-i18n"
import { Logo } from "@/components/ui/logo"
import { LocalStorageAdapter } from "@/lib/local-storage-adapter"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function HomePage() {
  const { t } = useI18n()
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [channelInput, setChannelInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'subscribers' | 'views' | 'videos' | 'recent'>('recent')
  
  const adapter = new LocalStorageAdapter()

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = () => {
    try {
      const storedChannels = adapter.getChannels()
      setChannels(storedChannels)
    } catch (error) {
      console.error('Failed to load channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalStats = () => {
    const totalViews = channels.reduce((sum, ch) => sum + (ch.viewCount || 0), 0)
    const totalSubscribers = channels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0)
    const totalVideos = channels.reduce((sum, ch) => sum + (ch.videoCount || 0), 0)
    
    return {
      totalChannels: channels.length,
      totalViews,
      totalSubscribers,
      totalVideos
    }
  }

  const stats = calculateTotalStats()

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const handleAddChannel = async () => {
    if (!channelInput.trim()) return
    
    setIsSearching(true)
    try {
      // 每次创建新实例以获取最新的 API 密钥
      const youtubeAPI = new ClientYouTubeAPI()
      let channel = null
      
      if (channelInput.startsWith('@')) {
        channel = await youtubeAPI.getChannelById(channelInput)
      } else if (channelInput.includes('youtube.com')) {
        const match = channelInput.match(/channel\/(UC[\w-]+)/) || 
                     channelInput.match(/@([\w-]+)/)
        if (match) {
          const id = match[0].includes('@') ? `@${match[1]}` : match[1]
          channel = await youtubeAPI.getChannelById(id)
        }
      } else {
        channel = await youtubeAPI.searchChannel(channelInput)
      }

      if (channel) {
        const newChannel = {
          id: channel.id,
          title: channel.snippet.title,
          handle: channel.snippet.customUrl || `@${channel.id}`,
          thumbnailUrl: channel.snippet.thumbnails.medium.url,
          viewCount: parseInt(channel.statistics.viewCount) || 0,
          subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
          videoCount: parseInt(channel.statistics.videoCount) || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        adapter.addChannel(newChannel)
        loadChannels()
        setIsAddDialogOpen(false)
        setChannelInput("")
      } else {
        setMessage({ type: 'error', text: '未找到频道' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Failed to add channel:', error)
      setMessage({ type: 'error', text: '添加频道失败' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDeleteChannel = (channelId: string) => {
    if (confirm('确定要删除这个频道吗？')) {
      adapter.deleteChannel(channelId)
      loadChannels()
    }
  }

  const handleSyncAll = async () => {
    setIsSyncing(true)
    setMessage(null)
    
    try {
      // 每次创建新实例以获取最新的 API 密钥
      const youtubeAPI = new ClientYouTubeAPI()
      
      // 同步所有频道的最新数据
      let successCount = 0
      let failCount = 0
      
      for (const channel of channels) {
        try {
          const updatedChannel = await youtubeAPI.getChannelById(channel.id)
          if (updatedChannel) {
            const updated = {
              ...channel,
              viewCount: parseInt(updatedChannel.statistics.viewCount) || 0,
              subscriberCount: parseInt(updatedChannel.statistics.subscriberCount) || 0,
              videoCount: parseInt(updatedChannel.statistics.videoCount) || 0,
              updatedAt: new Date()
            }
            adapter.updateChannel(channel.id, updated)
            successCount++
          }
        } catch (error) {
          console.error(`Failed to sync channel ${channel.id}:`, error)
          failCount++
        }
      }
      
      // 同步到数据库
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: adapter.getChannels() })
      })
      
      const data = await response.json()
      
      loadChannels()
      setMessage({ 
        type: 'success', 
        text: `同步完成：更新 ${successCount} 个频道，失败 ${failCount} 个` 
      })
      setTimeout(() => setMessage(null), 5000)
      
    } catch (error) {
      console.error('Sync failed:', error)
      setMessage({ type: 'error', text: '同步失败' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredChannels = channels
    .filter(channel =>
      channel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.handle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'subscribers':
          return (b.subscriberCount || 0) - (a.subscriberCount || 0)
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0)
        case 'videos':
          return (b.videoCount || 0) - (a.videoCount || 0)
        case 'recent':
        default:
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      }
    })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncAll}
            variant="outline"
            disabled={isSyncing || channels.length === 0}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                一键同步
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              {t('common.settings', '设置')}
            </Link>
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              监控频道
            </CardTitle>
            <Radar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.totalChannels}</div>
            <p className="text-xs text-red-600">
              正在监控中
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              总观看数
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatNumber(stats.totalViews)}</div>
            <p className="text-xs text-blue-600">
              所有频道累计
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              订阅者
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatNumber(stats.totalSubscribers)}</div>
            <p className="text-xs text-green-600">
              合计订阅者数
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              视频数
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.totalVideos}</div>
            <p className="text-xs text-purple-600">
              已发布视频
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 频道管理区域 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>频道列表</CardTitle>
            <CardDescription>管理和监控您的 YouTube 频道</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            添加频道
          </Button>
        </CardHeader>
        <CardContent>
          {/* 搜索和排序 */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索频道..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">最近更新</SelectItem>
                <SelectItem value="name">按名称</SelectItem>
                <SelectItem value="subscribers">按订阅者</SelectItem>
                <SelectItem value="views">按观看数</SelectItem>
                <SelectItem value="videos">按视频数</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 频道列表 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {channels.length === 0 ? '还没有添加任何频道' : '没有找到匹配的频道'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChannels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {channel.thumbnailUrl && (
                      <img
                        src={channel.thumbnailUrl}
                        alt={channel.title}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{channel.title}</p>
                      <p className="text-sm text-muted-foreground">{channel.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {formatNumber(channel.subscriberCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(channel.viewCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        {channel.videoCount || 0}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={`https://youtube.com/${channel.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速链接 */}
      <div className="flex justify-center">
        <Button variant="outline" asChild className="h-auto py-4 px-8">
          <Link href="/daily-activity" className="flex flex-col items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
            <span>每日活动</span>
          </Link>
        </Button>
      </div>

      {/* 添加频道对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加频道</DialogTitle>
            <DialogDescription>
              输入频道名称、@handle 或 YouTube 链接
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="channel">频道</Label>
              <Input
                id="channel"
                placeholder="例如: @mkbhd 或 Marques Brownlee"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddChannel} disabled={isSearching || !channelInput.trim()}>
              {isSearching && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}