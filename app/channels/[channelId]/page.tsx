import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{
    channelId: string
  }>
}

export default async function ChannelDetailPage({ params }: PageProps) {
  const { channelId } = await params
  // 重定向到频道的视频页面
  redirect(`/channels/${channelId}/videos`)
}