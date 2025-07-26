import type React from "react"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { subDays } from "date-fns"
import { ChannelLayoutContent } from "@/components/channel-layout-content"

export default async function ChannelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: {
      dailyStats: {
        where: {
          date: {
            gte: subDays(new Date(), 7), // Last 7 days
            lte: new Date(),
          },
        },
        orderBy: { date: "desc" },
      },
    },
  })

  if (!channel) {
    notFound()
  }

  const totalSubscribersGainedLast7Days = channel.dailyStats.reduce((sum, stat) => sum + stat.subscribersGained, 0)

  return (
    <ChannelLayoutContent 
      channel={channel}
      totalSubscribersGainedLast7Days={totalSubscribersGainedLast7Days}
    >
      {children}
    </ChannelLayoutContent>
  )
}
