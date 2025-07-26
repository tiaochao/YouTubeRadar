"use client"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useEffect, useState } from "react"
import type { ChannelDailyStat } from "@prisma/client"
import { format, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "@/lib/i18n/use-i18n"

// Client component to fetch data from an API route
async function fetchChannelDailyStats(
  channelId: string,
  startDate?: string,
  endDate?: string,
): Promise<ChannelDailyStat[]> {
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const res = await fetch(`/api/channels/${channelId}/daily-stats?${params.toString()}`)
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Failed to fetch daily stats")
  }
  const data = await res.json()
  // Convert BigInts back to numbers for charting
  return data.data.map((stat: any) => ({
    ...stat,
    views: Number(stat.views),
    estimatedMinutesWatched: Number(stat.estimatedMinutesWatched),
    impressions: Number(stat.impressions),
    date: new Date(stat.date), // Ensure date is a Date object
  }))
}

export default function ChannelAnalyticsPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params)
  const { t } = useI18n()
  const [dailyStats, setDailyStats] = useState<ChannelDailyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7), // Default to last 7 days
    to: new Date(),
  })

  useEffect(() => {
    const getStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
        const stats = await fetchChannelDailyStats(channelId, startDate, endDate)
        setDailyStats(stats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    getStats()
  }, [channelId, dateRange])

  // Calculate summary metrics (e.g., for the selected date range)
  const totalViews = dailyStats.reduce((sum, stat) => sum + Number(stat.views), 0)
  const totalWatchTimeHours = dailyStats.reduce((sum, stat) => sum + stat.watchTimeHours, 0)
  const totalSubscribersGained = dailyStats.reduce((sum, stat) => sum + stat.subscribersGained, 0)

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>{t('analytics.pickDateRange')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('analytics.totalViewsRange')}</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? <Skeleton className="h-10 w-32" /> : totalViews.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">{t('analytics.basedOnDailyData')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('analytics.watchTimeHoursRange')}</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? <Skeleton className="h-10 w-32" /> : totalWatchTimeHours.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">{t('analytics.basedOnDailyData')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('analytics.subscribersGainedRange')}</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? <Skeleton className="h-10 w-32" /> : totalSubscribersGained.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">{t('analytics.basedOnDailyData')}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">{t('common.error')}: {error}</CardContent>
        </Card>
      ) : dailyStats.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('analytics.noDataAvailable')}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.dailyViewsWatchTime')}</CardTitle>
              <CardDescription>{t('analytics.viewsWatchTimeTrend')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  views: {
                    label: t('analytics.views'),
                    color: "hsl(var(--chart-1))",
                  },
                  watchTimeHours: {
                    label: t('analytics.watchTimeHours'),
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyStats.map((d) => ({
                      ...d,
                      date: format(d.date, "MMM dd"), // Format date for X-axis
                    }))}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="var(--color-views)" />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-watchTimeHours)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="views"
                      stroke="var(--color-views)"
                      name={t('analytics.views')}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="watchTimeHours"
                      stroke="var(--color-watchTimeHours)"
                      name={t('analytics.watchTimeHours')}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.dailySubscribersCTR')}</CardTitle>
              <CardDescription>{t('analytics.subscribersCTRTrend')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  subscribersGained: {
                    label: t('analytics.subscribersGained'),
                    color: "hsl(var(--chart-3))",
                  },
                  subscribersLost: {
                    label: t('analytics.subscribersLost'),
                    color: "hsl(var(--chart-4))",
                  },
                  impressionCtr: {
                    label: t('analytics.impressionCTR'),
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyStats.map((d) => ({
                      ...d,
                      date: format(d.date, "MMM dd"), // Format date for X-axis
                    }))}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="var(--color-subscribersGained)" />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-impressionCtr)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="subscribersGained"
                      stroke="var(--color-subscribersGained)"
                      name={t('analytics.subscribersGained')}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="subscribersLost"
                      stroke="var(--color-subscribersLost)"
                      name={t('analytics.subscribersLost')}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="impressionCtr"
                      stroke="var(--color-impressionCtr)"
                      name={t('analytics.impressionCTR')}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
