"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ChannelStatus } from "@prisma/client"
import { AlertCircle, CheckCircle2, LinkIcon, RefreshCw, Search, XCircle, SettingsIcon, Trash2, Edit3, Save, X, Play, Plus, Radar, Activity, Target, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBigInt, formatRelativeTime } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ListFilter } from "lucide-react"
import { useI18n } from "@/lib/i18n/use-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadarScan } from "@/components/ui/logo"

interface ChannelData {
  id: string
  channelId: string
  title: string
  note: string | null
  thumbnailUrl: string | null
  status: ChannelStatus
  country: string | null
  createdAt: string
  updatedAt: string
  lastAnalyticsAt: string | null
  lastVideoSyncAt: string | null
  totalViews: string | null
  totalSubscribers: string | null
  dailyStats: {
    date: string
    views: string
  }[]
  videos: {
    title: string
  }[]
}

async function fetchChannels(query: string, sortBy: string, sortOrder: string): Promise<{ data: ChannelData[] }> {
  const params = new URLSearchParams()
  if (query) params.set("query", query)
  params.set("sortBy", sortBy)
  params.set("sortOrder", sortOrder)
  const res = await fetch(`/api/channels?${params.toString()}`)
  if (!res.ok) {
    throw new Error("Failed to fetch channels")
  }
  const data = await res.json()
  return data
}

export default function ChannelsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("query") || ""
  const connectedChannelId = searchParams.get("connected")

  const [channels, setChannels] = useState<ChannelData[]>([])
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt")
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc")
  
  // New states for note editing and sync
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteValue, setEditingNoteValue] = useState("")
  const [syncingChannels, setSyncingChannels] = useState<Set<string>>(new Set())
  const [syncingAll, setSyncingAll] = useState(false)
  
  // Add channel dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [channelUrl, setChannelUrl] = useState("")
  const [addingChannel, setAddingChannel] = useState(false)
  const [addError, setAddError] = useState("")

  useEffect(() => {
    const getChannels = async () => {
      setLoadingChannels(true)
      setError(null)
      try {
        const fetchedChannels = await fetchChannels(searchQuery, sortBy, sortOrder)
        setChannels(fetchedChannels.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoadingChannels(false)
      }
    }
    getChannels()
  }, [searchQuery, sortBy, sortOrder])

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }


  const handleDeleteChannel = async (channelId: string, channelTitle: string) => {
    if (!confirm(t('channels.deleteConfirm', { title: channelTitle }))) {
      return
    }

    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        // Refresh the channels list
        const fetchedChannels = await fetchChannels(searchQuery, sortBy, sortOrder)
        setChannels(fetchedChannels.data)
      } else {
        setError(data.error || t('errors.failedToDelete'))
      }
    } catch (err: any) {
      setError(err.message || t('errors.unexpectedError'))
    }
  }


  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    router.push(
      `${pathname}?${createQueryString("sortBy", newSortBy)}&${createQueryString("sortOrder", newSortOrder)}`,
      { scroll: false },
    )
  }

  // Handle note editing
  const handleEditNote = (channelId: string, currentNote: string | null) => {
    setEditingNoteId(channelId)
    setEditingNoteValue(currentNote || "")
  }

  const handleSaveNote = async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editingNoteValue })
      })

      if (response.ok) {
        // Update local state
        setChannels(channels.map(channel => 
          channel.id === channelId 
            ? { ...channel, note: editingNoteValue || null }
            : channel
        ))
        setEditingNoteId(null)
        setEditingNoteValue("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update note')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update note')
    }
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditingNoteValue("")
  }

  // Handle channel sync
  const handleSyncChannel = async (channelId: string, channelTitle: string) => {
    setSyncingChannels(prev => new Set(prev).add(channelId))
    
    try {
      const response = await fetch(`/api/channels/${channelId}/sync`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        // Refresh channel data to show updated sync time
        const fetchedChannels = await fetchChannels(searchQuery, sortBy, sortOrder)
        setChannels(fetchedChannels.data)
        
        // Optional: Show success message
        console.log(`Channel "${channelTitle}" synced successfully`, result)
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          setError(`${channelTitle}: ${errorData.message}`)
        } else {
          setError(`Failed to sync ${channelTitle}: ${errorData.message}`)
        }
      }
    } catch (err: any) {
      setError(`Failed to sync ${channelTitle}: ${err.message}`)
    } finally {
      setSyncingChannels(prev => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        return newSet
      })
    }
  }

  // Handle sync all channels
  const handleSyncAllChannels = async () => {
    setSyncingAll(true)
    setError(null)
    
    try {
      const response = await fetch('/api/channels/sync-all', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Refresh channels list to show updated sync times
        const fetchedChannels = await fetchChannels(searchQuery, sortBy, sortOrder)
        setChannels(fetchedChannels.data)
        
        // Show success message
        const message = t('settings.syncCompleted', { 
          success: data.synced || 0, 
          failed: data.failed || 0 
        })
        
        // You could show a toast notification here instead of using setError
        console.log(message)
      } else {
        setError(data.error || t('settings.syncFailed'))
      }
    } catch (err: any) {
      setError(t('settings.syncRequestFailed'))
    } finally {
      setSyncingAll(false)
    }
  }

  const handleAddChannel = async () => {
    if (!channelUrl.trim()) {
      setAddError(t('channels.enterChannelUrl', '请输入频道链接'))
      return
    }

    setAddingChannel(true)
    setAddError('')
    
    try {
      const response = await fetch('/api/channels/add-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channelUrl })
      })
      
      const data = await response.json()
      
      if (!data.ok) {
        throw new Error(data.error || t('channels.addFailed', '添加频道失败'))
      }
      
      // 刷新频道列表
      const fetchedChannels = await fetchChannels(searchQuery, sortBy, sortOrder)
      setChannels(fetchedChannels.data)
      
      // 关闭对话框并重置
      setShowAddDialog(false)
      setChannelUrl('')
      
    } catch (err: any) {
      console.error('Error:', err)
      setAddError(err.message || t('channels.addFailed', '添加频道失败'))
    } finally {
      setAddingChannel(false)
    }
  }

  return (
    <>
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <RadarScan size={40} className="animate-pulse" />
          <div>
            <h1 className="font-semibold text-lg md:text-2xl bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-6 w-6 text-red-600" />
              {t('channels.title')}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Activity className="h-3 w-3 text-red-500" />
              监控和管理您的频道雷达目标
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          {connectedChannelId && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {t('channels.channelConnected')}
            </Badge>
          )}
          {searchParams.get("error") && (
            <Badge variant="destructive">Error: {searchParams.get("error")?.replace(/_/g, " ")}</Badge>
          )}
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
          >
            <Radar className="mr-2 h-4 w-4" />
            {t('channels.connectNew')}
          </Button>
          {channels.length > 0 && (
            <Button 
              onClick={handleSyncAllChannels}
              variant="outline"
              disabled={syncingAll}
              className="border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              {syncingAll ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-red-600" />
              ) : (
                <Zap className="mr-2 h-4 w-4 text-red-500" />
              )}
              {syncingAll ? t('channels.syncing') : t('channels.syncAllChannels')}
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('channels.searchPlaceholder')}
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1 bg-transparent">
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('channels.sortBy')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSortChange("createdAt", "desc")}>
              {t('sorting.createdAtNewest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("createdAt", "asc")}>
              {t('sorting.createdAtOldest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("title", "asc")}>{t('sorting.titleAZ')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("title", "desc")}>{t('sorting.titleZA')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("totalViews", "desc")}>
              {t('sorting.totalViewsHighest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("totalViews", "asc")}>
              {t('sorting.totalViewsLowest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("totalSubscribers", "desc")}>
              {t('sorting.totalSubscribersHighest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("totalSubscribers", "asc")}>
              {t('sorting.totalSubscribersLowest')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loadingChannels ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="grid gap-1">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card className="col-span-full text-center py-8">
            <CardHeader>
              <CardTitle className="text-destructive">{t('errors.loadingChannels')}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            {error.includes('OAuth configuration') || error.includes('Settings') ? (
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/settings">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    {t('settings.goToSettings')}
                  </Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : channels.length === 0 ? (
          <Card className="col-span-full text-center py-8">
            <CardHeader>
              <CardTitle>{t('channels.noChannels')}</CardTitle>
              <CardDescription>{t('channels.noChannelsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {t('channels.connectFirst')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Image
                  src={channel.thumbnailUrl || "/placeholder.svg?height=64&width=64&query=youtube channel thumbnail"}
                  alt={`${channel.title} thumbnail`}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
                <div className="grid gap-1">
                  <CardTitle>{channel.title}</CardTitle>
                  <CardDescription>
                    <span className="block text-xs text-muted-foreground">ID: {channel.channelId}</span>
                    <Badge
                      className="mt-1"
                      variant={
                        channel.status === ChannelStatus.active
                          ? "secondary"
                          : channel.status === ChannelStatus.syncing
                            ? "default"
                            : "outline"
                      }
                    >
                      {channel.status === ChannelStatus.active && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {channel.status === ChannelStatus.syncing && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                      {t(`status.${channel.status}`)}
                    </Badge>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                {channel.totalViews && (
                  <div className="text-sm">
                    {t('stats.totalViews')}: <span className="font-semibold">{formatBigInt(channel.totalViews, t)}</span>
                  </div>
                )}
                {channel.totalSubscribers && (
                  <div className="text-sm">
                    {t('stats.totalSubscribers')}: <span className="font-semibold">{formatBigInt(channel.totalSubscribers, t)}</span>
                  </div>
                )}
                {channel.dailyStats.length > 0 && (
                  <div className="text-sm">
                    {t('stats.latestDailyViews')} ({format(new Date(channel.dailyStats[0].date), "yyyy-MM-dd")}):{" "}
                    <span className="font-semibold">+{formatBigInt(channel.dailyStats[0].views, t)}</span>
                  </div>
                )}
                {channel.lastAnalyticsAt && (
                  <div className="text-sm text-muted-foreground">
                    {t('stats.lastAnalyticsSync')}: {formatRelativeTime(new Date(channel.lastAnalyticsAt), t)}
                  </div>
                )}
                {channel.lastVideoSyncAt && (
                  <div className="text-sm text-muted-foreground">
                    {t('stats.lastVideoSync')}: {formatRelativeTime(new Date(channel.lastVideoSyncAt), t)}
                  </div>
                )}
                
                {/* Channel Note Section */}
                <div className="border-t pt-2 mt-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {t('channels.note')}
                  </div>
                  {editingNoteId === channel.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingNoteValue}
                        onChange={(e) => setEditingNoteValue(e.target.value)}
                        placeholder={t('channels.notePlaceholder')}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveNote(channel.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEditNote()
                          }
                        }}
                      />
                      <Button size="sm" onClick={() => handleSaveNote(channel.id)}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEditNote}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex-1 min-h-[20px]">
                        {channel.note || (
                          <span className="text-muted-foreground italic">
                            {t('channels.noNote')}
                          </span>
                        )}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditNote(channel.id, channel.note)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <Link href={`/channels/${channel.id}/videos`} passHref>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    {t('channels.viewDetails')}
                  </Button>
                </Link>
                <div className="flex gap-2 mt-2">
                  {/* Sync Button */}
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handleSyncChannel(channel.id, channel.title)}
                    disabled={syncingChannels.has(channel.id)}
                  >
                    {syncingChannels.has(channel.id) ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {syncingChannels.has(channel.id) ? t('channels.syncing') : t('channels.syncData')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteChannel(channel.id, channel.title)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('channels.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </main>

    {/* 添加频道对话框 */}
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('channels.addChannel', '添加频道')}</DialogTitle>
          <DialogDescription>
            {t('channels.addChannelDescription', '输入 YouTube 频道链接来添加频道')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Input
              placeholder="https://youtube.com/@username 或频道链接..."
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !addingChannel && handleAddChannel()}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t('channels.supportedFormats', '支持格式：@用户名、频道链接、自定义URL 或频道ID')}
            </p>
          </div>
          
          {addError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{addError}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddDialog(false)
              setChannelUrl('')
              setAddError('')
            }}
            disabled={addingChannel}
          >
            {t('common.cancel', '取消')}
          </Button>
          <Button onClick={handleAddChannel} disabled={addingChannel}>
            {addingChannel ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('common.adding', '添加中...')}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t('common.add', '添加')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
