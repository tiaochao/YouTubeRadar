import { NextRequest, NextResponse } from "next/server"
import { supabaseOps } from "@/lib/supabase-new"
import { successResponse, errorResponse } from "@/lib/api-response"

// 获取所有频道
export async function GET() {
  try {
    // 先测试连接
    const testResult = await supabaseOps.testConnection()
    if (!testResult.success) {
      return errorResponse("Database connection failed", testResult.error || "Unknown error", 500)
    }
    
    const channels = await supabaseOps.getChannels()
    
    // 转换数据格式以匹配前端期望
    const formattedChannels = channels.map(ch => ({
      id: ch.id,
      channelId: ch.channel_id,
      title: ch.title,
      handle: ch.custom_url || ch.channel_id,
      thumbnailUrl: ch.thumbnail_url,
      viewCount: Number(ch.view_count || 0),
      subscriberCount: Number(ch.total_subscribers || 0),
      videoCount: ch.video_count || 0,
      note: ch.note,
      createdAt: ch.created_at,
      updatedAt: ch.updated_at
    }))
    
    return successResponse(formattedChannels)
  } catch (error: any) {
    console.error('获取频道失败:', error)
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
        const newChannel = await supabaseOps.addChannel(channelData)
        
        // 转换返回的数据格式
        const formatted = {
          id: newChannel.id,
          channelId: newChannel.channel_id,
          title: newChannel.title,
          handle: newChannel.custom_url || newChannel.channel_id,
          thumbnailUrl: newChannel.thumbnail_url,
          viewCount: Number(newChannel.view_count || 0),
          subscriberCount: Number(newChannel.total_subscribers || 0),
          videoCount: newChannel.video_count || 0,
          note: newChannel.note,
          createdAt: newChannel.created_at,
          updatedAt: newChannel.updated_at
        }
        
        return successResponse(formatted)
      } catch (addError: any) {
        console.error('添加频道时出错:', addError)
        if (addError.message === '频道已存在') {
          return errorResponse("Channel already exists", "频道已存在", 409)
        }
        if (addError.message.includes('权限被拒绝')) {
          return errorResponse("Permission denied", addError.message, 403)
        }
        return errorResponse("Failed to add channel", addError.message || "Database operation failed", 500)
      }
    } else if (action === 'update') {
      const updatedChannel = await supabaseOps.updateChannel(channelId, channelData)
      
      const formatted = {
        id: updatedChannel.id,
        channelId: updatedChannel.channel_id,
        title: updatedChannel.title,
        handle: updatedChannel.custom_url || updatedChannel.channel_id,
        thumbnailUrl: updatedChannel.thumbnail_url,
        viewCount: Number(updatedChannel.view_count || 0),
        subscriberCount: Number(updatedChannel.total_subscribers || 0),
        videoCount: updatedChannel.video_count || 0,
        note: updatedChannel.note,
        createdAt: updatedChannel.created_at,
        updatedAt: updatedChannel.updated_at
      }
      
      return successResponse(formatted)
    } else if (action === 'delete') {
      const success = await supabaseOps.deleteChannel(channelId)
      return successResponse({ success })
    }

    return errorResponse("Invalid action", "Action must be add, update, or delete", 400)
  } catch (error: any) {
    console.error('处理请求失败:', error)
    if (error.message.includes('权限被拒绝')) {
      return errorResponse("Permission denied", error.message, 403)
    }
    return errorResponse("Failed to process request", error.message, 500)
  }
}