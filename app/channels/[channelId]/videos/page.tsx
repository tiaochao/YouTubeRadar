"use client"

import type React from "react"
import { use } from "react"
import { useI18n } from "@/lib/i18n/use-i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ListFilter, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBigInt } from "@/lib/utils"

interface VideoData {
  id: string
  videoId: string
  channelId: string
  title: string
  publishedAt: string
  live: boolean
  createdAt: string
  snapshots: {
    id: string
    videoId: string
    channelId: string
    collectedAt: string
    viewCount: string
    likeCount: string
    commentCount: string
  }[]
  channel: {
    title: string
    thumbnailUrl: string | null
  }
}

interface VideosApiResponse {
  data: VideoData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchVideos(
  channelId: string,
  page: number,
  pageSize: number,
  query: string,
  sortBy: string,
  sortOrder: string,
): Promise<VideosApiResponse> {
  const params = new URLSearchParams()
  params.set("page", page.toString())
  params.set("pageSize", pageSize.toString())
  if (query) params.set("query", query)
  params.set("sortBy", sortBy)
  params.set("sortOrder", sortOrder)
  params.set("channelId", channelId) // Filter by channelId

  const res = await fetch(`/api/channels/${channelId}/videos?${params.toString()}`)
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Failed to fetch videos")
  }
  const data = await res.json()
  return data.data || { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
}

export default function ChannelVideosPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params)
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalVideos, setTotalVideos] = useState(0)
  const [currentPage, setCurrentPage] = useState(Number.parseInt(searchParams.get("page") || "1"))
  const [pageSize, setPageSize] = useState(Number.parseInt(searchParams.get("pageSize") || "10"))
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "publishedAt")
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc")

  const totalPages = Math.ceil(totalVideos / pageSize)

  useEffect(() => {
    const getVideos = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVideos(channelId, currentPage, pageSize, searchQuery, sortBy, sortOrder)
        setVideos(data.data || [])
        setTotalVideos(data.total || 0)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    getVideos()
  }, [channelId, currentPage, pageSize, searchQuery, sortBy, sortOrder])

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page on search
    router.push(`${pathname}?${createQueryString("query", e.target.value)}`, { scroll: false })
  }

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1) // Reset to first page on sort
    router.push(
      `${pathname}?${createQueryString("sortBy", newSortBy)}&${createQueryString("sortOrder", newSortOrder)}`,
      { scroll: false },
    )
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    router.push(`${pathname}?${createQueryString("page", newPage.toString())}`, { scroll: false })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('channelDetails.videos')}</CardTitle>
        <CardDescription>{t('channelDetails.latestVideos')}</CardDescription>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('videos.searchPlaceholder')}
              className="w-full rounded-lg bg-background pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1 bg-transparent">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('videos.sortBy')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortChange("publishedAt", "desc")}>
                {t('videos.publishedDateNewest')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("publishedAt", "asc")}>
                {t('videos.publishedDateOldest')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("viewCount", "desc")}>{t('videos.viewsHighest')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("viewCount", "asc")}>{t('videos.viewsLowest')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-16 w-24 rounded-sm" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-8">{t('videos.error', { message: error })}</p>
        ) : videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('videos.noVideosChannel')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('videos.thumbnail')}</TableHead>
                  <TableHead>{t('videos.title_col')}</TableHead>
                  <TableHead>{t('videos.publishedAt')}</TableHead>
                  <TableHead className="text-right">{t('videos.views')}</TableHead>
                  <TableHead className="text-right">{t('videos.likes')}</TableHead>
                  <TableHead className="text-right">{t('videos.comments')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <Image
                        src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`}
                        alt={`${video.title} thumbnail`}
                        width={80}
                        height={60}
                        className="rounded-sm object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>{format(new Date(video.publishedAt), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell className="text-right">{video.snapshots && video.snapshots.length > 0 ? formatBigInt(video.snapshots[0].viewCount, t) : t('common.notAvailable')}</TableCell>
                    <TableCell className="text-right">{video.snapshots && video.snapshots.length > 0 ? formatBigInt(video.snapshots[0].likeCount, t) : t('common.notAvailable')}</TableCell>
                    <TableCell className="text-right">
                      {video.snapshots && video.snapshots.length > 0 ? formatBigInt(video.snapshots[0].commentCount, t) : t('common.notAvailable')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                {t('videos.previous')}
              </Button>
              <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                {t('videos.next')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
