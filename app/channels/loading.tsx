"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { LinkIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Search, ListFilter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n/use-i18n"

export default function ChannelsLoadingPage() {
  const { t } = useI18n()
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('channels.title')}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button disabled>
            <LinkIcon className="mr-2 h-4 w-4" />
            {t('channels.connectNew')}
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('channels.searchPlaceholder')}
            className="w-full rounded-lg bg-background pl-8"
            disabled
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1 bg-transparent" disabled>
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('channels.sortBy')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>{t('sorting.createdAtNewest')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.createdAtOldest')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.titleAZ')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.titleZA')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.totalViewsHighest')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.totalViewsLowest')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.totalSubscribersHighest')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('sorting.totalSubscribersLowest')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('taskLogs.title')}</CardTitle>
          <CardDescription>{t('taskLogs.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
