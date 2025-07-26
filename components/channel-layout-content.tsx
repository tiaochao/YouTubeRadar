"use client"

import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftIcon, BarChartIcon, Download, VideoIcon, Target, Activity, Radar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { formatBigInt } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/use-i18n"

interface ChannelLayoutContentProps {
  channel: {
    id: string
    title: string
    thumbnailUrl: string | null
    totalViews: any
    totalSubscribers: any
  }
  totalSubscribersGainedLast7Days: number
  children: React.ReactNode
}

export function ChannelLayoutContent({ channel, totalSubscribersGainedLast7Days, children }: ChannelLayoutContentProps) {
  const { t } = useI18n()
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-gradient-to-r from-red-50 to-white">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/channels" className="mr-4 flex items-center gap-2 text-lg font-semibold md:text-base hover:text-red-600 transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="sr-only">{t('channelDetails.backToChannels')}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={channel.thumbnailUrl || "/placeholder.svg?height=40&width=40&query=youtube channel thumbnail"}
                alt={`${channel.title} thumbnail`}
                width={40}
                height={40}
                className="rounded-full object-cover border-2 border-red-200"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white">
                <div className="w-full h-full bg-red-500 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-red-600" />
                <h1 className="text-xl font-semibold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">{channel.title}</h1>
              </div>
              {channel.totalSubscribers && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3 text-red-500" />
                  {formatBigInt(channel.totalSubscribers, t)} {t('stats.totalSubscribers').toLowerCase()}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 bg-transparent">
                  <Download className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('channelDetails.exportData')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/api/export?channelId=${channel.id}&type=videos&format=csv`} download>
                    {t('channelDetails.exportVideosCSV')}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/export?channelId=${channel.id}&type=videos&format=json`} download>
                    {t('channelDetails.exportVideosJSON')}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/export?channelId=${channel.id}&type=daily-stats&format=csv`} download>
                    {t('channelDetails.exportDailyStatsCSV')}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/export?channelId=${channel.id}&type=daily-stats&format=json`} download>
                    {t('channelDetails.exportDailyStatsJSON')}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('channelDetails.totalViews')}</CardDescription>
              <CardTitle className="text-4xl">{formatBigInt(channel.totalViews, t)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">{t('channelDetails.overallViews')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('channelDetails.totalSubscribers')}</CardDescription>
              <CardTitle className="text-4xl">{formatBigInt(channel.totalSubscribers, t)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">{t('channelDetails.overallSubscribers')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('channelDetails.subscribersGainedLast7Days')}</CardDescription>
              <CardTitle className="text-4xl">{totalSubscribersGainedLast7Days.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">{t('channelDetails.newSubscribersWeek')}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="videos" asChild>
              <Link href={`/channels/${channel.id}/videos`}>
                <VideoIcon className="mr-2 h-4 w-4" /> {t('channelDetails.videos')}
              </Link>
            </TabsTrigger>
            <TabsTrigger value="analytics" asChild>
              <Link href={`/channels/${channel.id}/analytics`}>
                <BarChartIcon className="mr-2 h-4 w-4" /> {t('channelDetails.dailyStats')}
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="videos" className="mt-4">
            {children}
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            {children}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}