"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ListFilter, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n/use-i18n"

export default function AnalyticsLoadingPage() {
  const { t } = useI18n()
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('analytics.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.dailyStats')}</CardTitle>
          <CardDescription>{t('analytics.description')}</CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('common.channelPlaceholder')}
                className="w-full rounded-lg bg-background pl-8"
                disabled
              />
            </div>
            <Button
              id="date"
              variant={"outline"}
              className="w-[300px] justify-start text-left font-normal text-muted-foreground"
              disabled
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{t('analytics.pickDateRange')}</span>
            </Button>
            <Button variant="outline" className="gap-1 bg-transparent" disabled>
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('videos.sortBy')}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
