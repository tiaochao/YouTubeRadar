import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"

// 获取所有频道
export async function GET() {
  try {
    const channels = await db.channel.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return successResponse({ 
      channels, 
      storageInfo: { type: 'sqlite', connected: true },
      count: channels.length 
    })
  } catch (error: any) {
    return errorResponse("Failed to get channels", error.message, 500)
  }
}

// 添加或更新频道
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { action, channelData, channelId } = data

    if (action === 'add') {
      try {
        console.log('添加频道请求:', { channelData })
        
        // 检查频道是否已存在
        const existingChannel = await db.channel.findUnique({
          where: { channelId: channelData.channelId }
        })
        
        if (existingChannel) {
          return errorResponse("Channel already exists", "频道已存在", 409)
        }
        
        // 创建新频道
        const newChannel = await db.channel.create({
          data: {
            channelId: channelData.channelId,
            title: channelData.title,
            thumbnailUrl: channelData.thumbnailUrl,
            status: channelData.status || 'active',
            country: channelData.country,
            totalViews: channelData.totalViews?.toString() || "0",
            totalSubscribers: channelData.totalSubscribers?.toString() || "0",
            note: channelData.note
          }
        })
        
        console.log('频道添加成功:', newChannel)
        return successResponse(newChannel)
      } catch (addError: any) {
        console.error('添加频道时出错:', addError)
        return errorResponse("Failed to add channel", addError.message, 500)
      }
    } else if (action === 'update') {
      try {
        const updatedChannel = await db.channel.update({
          where: { channelId },
          data: {
            title: channelData.title,
            thumbnailUrl: channelData.thumbnailUrl,
            status: channelData.status,
            country: channelData.country,
            totalViews: channelData.totalViews?.toString(),
            totalSubscribers: channelData.totalSubscribers?.toString(),
            note: channelData.note
          }
        })
        return successResponse(updatedChannel)
      } catch (updateError: any) {
        return errorResponse("Failed to update channel", updateError.message, 500)
      }
    } else if (action === 'delete') {
      try {
        await db.channel.delete({
          where: { channelId }
        })
        return successResponse({ success: true })
      } catch (deleteError: any) {
        return errorResponse("Failed to delete channel", deleteError.message, 500)
      }
    }

    return errorResponse("Invalid action", "Action must be add, update, or delete", 400)
  } catch (error: any) {
    return errorResponse("Failed to process request", error.message, 500)
  }
}