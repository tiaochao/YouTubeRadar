"use client"

import Link from "next/link"
import { HomeIcon, BarChartIcon, VideoIcon, YoutubeIcon, SettingsIcon, TrendingUpIcon, Radar } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n/use-i18n"
import { Logo } from "@/components/ui/logo"

export function NavSidebar() {
  const { t } = useI18n()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 md:h-8 md:w-8 md:text-base"
        >
          <Radar className="h-4 w-4 transition-all group-hover:rotate-45" />
          <span className="sr-only">YouTube Radar</span>
        </Link>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <HomeIcon className="h-5 w-5" />
                <span className="sr-only">{t('navigation.home')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('navigation.home')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/channels"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <YoutubeIcon className="h-5 w-5" />
                <span className="sr-only">{t('navigation.channels')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('navigation.channels')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/videos"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <VideoIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.videos')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('common.videos')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/daily-activity"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-red-50 md:h-8 md:w-8"
              >
                <Radar className="h-5 w-5 transition-all hover:text-red-600" />
                <span className="sr-only">{t('navigation.dailyActivity')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('navigation.dailyActivity')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/public-analytics"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <YoutubeIcon className="h-5 w-5" />
                <span className="sr-only">{t('navigation.publicAnalytics')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('navigation.publicAnalytics')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <SettingsIcon className="h-5 w-5" />
                <span className="sr-only">{t('navigation.settings')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('navigation.settings')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  )
}