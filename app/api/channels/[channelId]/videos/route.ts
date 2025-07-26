import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getChannelVideos } from "@/lib/youtube-video-sync"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 验证频道是否存在
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // 获取视频列表
    const result = await getChannelVideos(channelId, page, pageSize)

    return NextResponse.json({
      ok: true,
      data: result
    })

  } catch (error: any) {
    logger.error("API/ChannelVideos", "Failed to fetch channel videos:", error)
    return NextResponse.json({ 
      error: "Failed to fetch videos", 
      message: error.message 
    }, { status: 500 })
  }
}