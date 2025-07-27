import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"

export async function POST(req: NextRequest) {
  try {
    const { channelInput } = await req.json()
    
    if (!channelInput?.trim()) {
      return NextResponse.json({ ok: false, error: "请输入频道信息" }, { status: 400 })
    }
    
    const youtubeAPI = new ClientYouTubeAPI()
    let channel = null
    
    // 支持多种输入格式
    if (channelInput.startsWith('@')) {
      channel = await youtubeAPI.getChannelById(channelInput)
    } else if (channelInput.includes('youtube.com')) {
      const match = channelInput.match(/channel\/(UC[\w-]+)/) || 
                   channelInput.match(/@([\w-]+)/)
      if (match) {
        const id = match[0].includes('@') ? `@${match[1]}` : match[1]
        channel = await youtubeAPI.getChannelById(id)
      }
    } else {
      channel = await youtubeAPI.searchChannel(channelInput)
    }
    
    if (!channel) {
      return NextResponse.json({ ok: false, error: "未找到频道" }, { status: 404 })
    }
    
    // 保存到数据库
    const savedChannel = await db.channel.create({
      data: {
        id: channel.id,
        title: channel.snippet.title,
        handle: channel.snippet.customUrl || `@${channel.id}`,
        thumbnailUrl: channel.snippet.thumbnails.medium.url,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
      }
    })
    
    return NextResponse.json({ ok: true, data: savedChannel })
  } catch (error: any) {
    console.error('Failed to add channel:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "添加频道失败" 
    }, { status: 500 })
  }
}