"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus, 
  Search, 
  Trash2,
  ExternalLink,
  RefreshCw,
  Users,
  Eye,
  Video
} from "lucide-react"
import { useI18n } from "@/lib/i18n/use-i18n"
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

export default function ChannelsPage() {
  const { t } = useI18n()
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [channelInput, setChannelInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  const adapter = new LocalStorageAdapter()
  const youtubeAPI = new ClientYouTubeAPI()

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

  const handleAddChannel = async () => {
    if (!channelInput.trim()) return
    
    setIsSearching(true)
    try {
      let channel = null
      
      // 支持多种输入格式
      if (channelInput.startsWith('@')) {
        // Handle 格式: @username
        channel = await youtubeAPI.getChannelById(channelInput)
      } else if (channelInput.includes('youtube.com')) {
        // URL 格式
        const match = channelInput.match(/channel\/(UC[\w-]+)/) || 
                     channelInput.match(/@([\w-]+)/)
        if (match) {
          const id = match[0].includes('@') ? `@${match[1]}` : match[1]
          channel = await youtubeAPI.getChannelById(id)
        }
      } else {
        // 搜索频道名称
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
        alert(t('channels.notFound', '未找到频道'))
      }
    } catch (error) {
      console.error('Failed to add channel:', error)
      alert(t('channels.addError', '添加频道失败'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleDeleteChannel = (channelId: string) => {
    if (confirm(t('channels.confirmDelete', '确定要删除这个频道吗？'))) {
      adapter.deleteChannel(channelId)
      loadChannels()
    }
  }

  const handleSyncChannel = async (channelId: string) => {
    try {
      const channel = await youtubeAPI.getChannelById(channelId)
      if (channel) {
        const updatedChannel = channels.find(ch => ch.id === channelId)
        if (updatedChannel) {
          updatedChannel.viewCount = parseInt(channel.statistics.viewCount) || 0
          updatedChannel.subscriberCount = parseInt(channel.statistics.subscriberCount) || 0
          updatedChannel.videoCount = parseInt(channel.statistics.videoCount) || 0
          updatedChannel.updatedAt = new Date()
          adapter.updateChannel(channelId, updatedChannel)
          loadChannels()
        }
      }
    } catch (error) {
      console.error('Failed to sync channel:', error)
    }
  }

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const filteredChannels = channels.filter(channel =>
    channel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('channels.title', '频道管理')}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('channels.addChannel', '添加频道')}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('channels.searchPlaceholder', '搜索频道...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredChannels.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {channels.length === 0 
                ? t('channels.noChannels', '还没有添加任何频道')
                : t('channels.noResults', '没有找到匹配的频道')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChannels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {channel.thumbnailUrl && (
                      <img
                        src={channel.thumbnailUrl}
                        alt={channel.title}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{channel.title}</CardTitle>
                      <CardDescription>{channel.handle}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncChannel(channel.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(channel.subscriberCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(channel.viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="h-3 w-3 text-muted-foreground" />
                    <span>{channel.videoCount || 0}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a 
                      href={`https://youtube.com/${channel.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      {t('channels.viewOnYouTube', '查看')}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('channels.addChannel', '添加频道')}</DialogTitle>
            <DialogDescription>
              {t('channels.addDescription', '输入频道名称、@handle 或 YouTube 链接')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="channel">{t('channels.channelInput', '频道')}</Label>
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
              {t('common.cancel', '取消')}
            </Button>
            <Button onClick={handleAddChannel} disabled={isSearching || !channelInput.trim()}>
              {isSearching && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.add', '添加')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}