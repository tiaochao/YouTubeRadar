import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { ChannelStatus } from "@prisma/client"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body
    
    if (!url) {
      return errorResponse("Missing channel URL", "", 400)
    }
    
    if (!YOUTUBE_API_KEY) {
      return errorResponse("YouTube API not configured", "Please configure YOUTUBE_API_KEY", 500)
    }
    
    // 提取频道ID
    let channelId = ""
    const channelMatch = url.match(/channel\/([a-zA-Z0-9_-]+)/)
    const userMatch = url.match(/@([a-zA-Z0-9_.-]+)/)
    
    if (channelMatch) {
      channelId = channelMatch[1]
    } else if (userMatch) {
      // 通过用户名搜索
      const username = userMatch[1]
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${username}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].id.channelId
      }
    } else if (url.startsWith("UC") && url.length === 24) {
      channelId = url
    }
    
    if (!channelId) {
      return errorResponse("Invalid channel URL", "Could not extract channel ID from URL", 400)
    }
    
    // 检查频道是否已存在
    const existingChannel = await db.channel.findUnique({
      where: { channelId }
    })
    
    if (existingChannel) {
      // 更新现有频道信息
      logger.info("AddPublicChannel", `Updating existing channel: ${existingChannel.title}`)
      
      // 获取最新数据
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
      const channelResponse = await fetch(channelUrl)
      const channelData = await channelResponse.json()
      
      if (!channelData.items || channelData.items.length === 0) {
        return errorResponse("Channel not found", `Channel with ID ${channelId} not found`, 404)
      }
      
      const channel = channelData.items[0]
      
      // 更新频道信息
      const updatedChannel = await db.channel.update({
        where: { id: existingChannel.id },
        data: {
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails.high.url,
          country: channel.snippet.country,
          customUrl: channel.snippet.customUrl,
          publishedAt: channel.snippet.publishedAt ? new Date(channel.snippet.publishedAt) : null,
          totalSubscribers: BigInt(channel.statistics.subscriberCount || "0"),
          viewCount: BigInt(channel.statistics.viewCount || "0"),
          videoCount: parseInt(channel.statistics.videoCount || "0"),
          totalViews: BigInt(channel.statistics.viewCount || "0"),
          updatedAt: new Date()
        }
      })
      
      return successResponse({
        channel: {
          ...updatedChannel,
          totalSubscribers: updatedChannel.totalSubscribers?.toString(),
          viewCount: updatedChannel.viewCount?.toString(),
          totalViews: updatedChannel.totalViews?.toString(),
          isNew: false
        }
      })
    }
    
    // 获取频道信息
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    const channelResponse = await fetch(channelUrl)
    const channelData = await channelResponse.json()
    
    if (channelData.error) {
      return errorResponse("YouTube API error", channelData.error.message, 400)
    }
    
    if (!channelData.items || channelData.items.length === 0) {
      return errorResponse("Channel not found", `Channel with ID ${channelId} not found`, 404)
    }
    
    const channel = channelData.items[0]
    
    // 创建新频道
    const newChannel = await db.channel.create({
      data: {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        country: channel.snippet.country,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt ? new Date(channel.snippet.publishedAt) : null,
        totalSubscribers: BigInt(channel.statistics.subscriberCount || "0"),
        viewCount: BigInt(channel.statistics.viewCount || "0"),
        videoCount: parseInt(channel.statistics.videoCount || "0"),
        totalViews: BigInt(channel.statistics.viewCount || "0"),
        status: ChannelStatus.active
      }
    })
    
    logger.info("AddPublicChannel", `Added new channel: ${newChannel.title}`)
    
    return successResponse({
      channel: {
        ...newChannel,
        totalSubscribers: newChannel.totalSubscribers?.toString(),
        viewCount: newChannel.viewCount?.toString(),
        totalViews: newChannel.totalViews?.toString(),
        isNew: true
      }
    })
    
  } catch (error: any) {
    logger.error("AddPublicChannel", "Failed to add channel:", error)
    return errorResponse("Failed to add channel", error.message, 500)
  }
}