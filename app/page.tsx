"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
  PlayCircle,
  Edit3,
  Check,
  X
} from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/use-i18n"
import { Logo } from "@/components/ui/logo"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"
import { AddChannelModal } from "@/components/add-channel-modal"

// 单独的添加频道组件，避免DOM操作问题
function AddChannelSection({ onChannelAdded }: { onChannelAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        <span>添加频道</span>
      </Button>
      
      <AddChannelModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onChannelAdded={onChannelAdded}
      />
    </>
  )
}

export default function HomePage() {
  const { t } = useI18n()
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'subscribers' | 'views' | 'videos' | 'recent'>('recent')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState("")
  
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  const setMessageWithTimeout = (msg: { type: 'success' | 'error', text: string }, timeout: number = 5000) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    setMessage(msg)
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null)
    }, timeout)
  }

  const loadChannels = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/channels-new')
      const data = await response.json()
      if (data.ok) {
        setChannels(data.data || [])
      } else {
        console.error('Failed to load channels:', data.error)
        setChannels([])
      }
    } catch (error) {
      console.error('Failed to load channels:', error)
      setChannels([])
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const totalViews = channels.reduce((sum, ch) => sum + (ch.viewCount || 0), 0)
    const totalSubscribers = channels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0)
    const totalVideos = channels.reduce((sum, ch) => sum + (ch.videoCount || 0), 0)
    
    return {
      totalChannels: channels.length,
      totalViews,
      totalSubscribers,
      totalVideos
    }
  }, [channels])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (confirm('确定要删除这个频道吗？')) {
      try {
        const response = await fetch('/api/channels-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            channelId
          })
        })
        
        const data = await response.json()
        if (data.ok) {
          loadChannels()
        } else {
          setMessageWithTimeout({ type: 'error', text: '删除频道失败' })
        }
      } catch (error) {
        console.error('Failed to delete channel:', error)
        setMessageWithTimeout({ type: 'error', text: '删除频道失败' })
      }
    }
  }

  const handleEditNote = (channelId: string, currentNote?: string) => {
    setEditingNoteId(channelId)
    setNoteInput(currentNote || "")
  }

  const handleSaveNote = async (channelId: string) => {
    const channel = channels.find(ch => (ch.channelId || ch.id) === channelId)
    if (channel) {
      try {
        const response = await fetch('/api/channels-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            channelId,
            channelData: { note: noteInput }
          })
        })
        
        const data = await response.json()
        if (data.ok) {
          loadChannels()
          setEditingNoteId(null)
          setNoteInput("")
        } else {
          setMessageWithTimeout({ type: 'error', text: '保存备注失败' })
        }
      } catch (error) {
        console.error('Failed to save note:', error)
        setMessageWithTimeout({ type: 'error', text: '保存备注失败' })
      }
    }
  }

  const handleCancelNote = () => {
    setEditingNoteId(null)
    setNoteInput("")
  }


  const handleSyncAll = async () => {
    setIsSyncing(true)
    setMessage(null)
    
    try {
      // 检查是否有频道
      if (channels.length === 0) {
        setMessageWithTimeout({ type: 'error', text: '没有可同步的频道' })
        return
      }

      const youtubeAPI = new ClientYouTubeAPI()
      let successCount = 0
      let failCount = 0
      let errors: string[] = []
      
      // 检查 API 密钥
      if (!youtubeAPI['apiKey']) {
        setMessageWithTimeout({ 
          type: 'error', 
          text: '请先在设置中配置 YouTube API 密钥' 
        })
        return
      }

      setMessageWithTimeout({ 
        type: 'success', 
        text: `开始同步 ${channels.length} 个频道...` 
      })
      
      for (const channel of channels) {
        try {
          console.log(`正在同步频道: ${channel.title} (${channel.channelId || channel.id})`)
          
          const updatedChannel = await youtubeAPI.getChannelById(channel.channelId || channel.id)
          if (updatedChannel) {
            const updated = {
              ...channel,
              viewCount: parseInt(updatedChannel.statistics.viewCount) || 0,
              subscriberCount: parseInt(updatedChannel.statistics.subscriberCount) || 0,
              videoCount: parseInt(updatedChannel.statistics.videoCount) || 0,
              updatedAt: new Date()
            }
            
            const updateResponse = await fetch('/api/channels-db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update',
                channelId: channel.channelId || channel.id,
                channelData: {
                  viewCount: updated.viewCount,
                  subscriberCount: updated.subscriberCount,
                  videoCount: updated.videoCount
                }
              })
            })
            
            const updateData = await updateResponse.json()
            if (updateData.ok) {
              successCount++
              console.log(`频道 ${channel.title} 同步成功`)
            } else {
              failCount++
              const error = `频道 ${channel.title}: ${updateData.error || '更新失败'}`
              errors.push(error)
              console.error(error)
            }
          } else {
            failCount++
            const error = `频道 ${channel.title}: 无法获取频道信息`
            errors.push(error)
            console.error(error)
          }
        } catch (error: any) {
          failCount++
          const errorMsg = `频道 ${channel.title}: ${error.message || '同步失败'}`
          errors.push(errorMsg)
          console.error(`Failed to sync channel ${channel.channelId || channel.id}:`, error)
        }
      }
      
      await loadChannels()
      
      if (failCount === 0) {
        setMessageWithTimeout({ 
          type: 'success', 
          text: `同步完成！成功更新 ${successCount} 个频道` 
        })
      } else {
        const errorDetails = errors.length > 0 ? `\n错误详情: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '等' : ''}` : ''
        setMessageWithTimeout({ 
          type: failCount === channels.length ? 'error' : 'success',
          text: `同步完成：成功 ${successCount} 个，失败 ${failCount} 个${errorDetails}` 
        })
      }
      
    } catch (error: any) {
      console.error('Sync failed:', error)
      setMessageWithTimeout({ 
        type: 'error', 
        text: `同步失败: ${error.message || '未知错误'}` 
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredChannels = useMemo(() => {
    return channels
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
  }, [channels, searchQuery, sortBy])

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
            <span>{isSyncing ? '同步中...' : '一键同步'}</span>
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
          <AlertDescription>
            <span>{message.text}</span>
          </AlertDescription>
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
          <AddChannelSection onChannelAdded={loadChannels} />
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
                <div key={channel.channelId || channel.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    {channel.thumbnailUrl && (
                      <img
                        src={channel.thumbnailUrl}
                        alt={channel.title}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{channel.title}</p>
                      <p className="text-sm text-muted-foreground">{channel.handle}</p>
                      {editingNoteId === (channel.channelId || channel.id) && (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="添加备注..."
                            className="h-7 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveNote(channel.channelId || channel.id)
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleSaveNote(channel.channelId || channel.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={handleCancelNote}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {editingNoteId !== (channel.channelId || channel.id) && channel.note && (
                        <p className="text-sm text-muted-foreground mt-1">{channel.note}</p>
                      )}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(channel.channelId || channel.id, channel.note)}
                        title="编辑备注"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={`https://youtube.com/${channel.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="在YouTube查看"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChannel(channel.channelId || channel.id)}
                        title="删除频道"
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

    </div>
  )
}