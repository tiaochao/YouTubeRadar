import { NextRequest, NextResponse } from "next/server"
import { databaseAdapter } from "@/lib/database-adapter"
import { successResponse, errorResponse } from "@/lib/api-response"

// 获取所有频道
export async function GET() {
  try {
    const channels = await databaseAdapter.getChannels()
    return successResponse(channels)
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
        const newChannel = await databaseAdapter.addChannel(channelData)
        if (newChannel) {
          return successResponse(newChannel)
        } else {
          return errorResponse("Failed to add channel", "Database operation failed", 500)
        }
      } catch (addError: any) {
        console.error('添加频道时出错:', addError)
        if (addError.message === '频道已存在') {
          return errorResponse("Channel already exists", "频道已存在", 409)
        }
        return errorResponse("Failed to add channel", addError.message || "Database operation failed", 500)
      }
    } else if (action === 'update') {
      const updatedChannel = await databaseAdapter.updateChannel(channelId, channelData)
      if (updatedChannel) {
        return successResponse(updatedChannel)
      } else {
        return errorResponse("Failed to update channel", "Database operation failed", 500)
      }
    } else if (action === 'delete') {
      const success = await databaseAdapter.deleteChannel(channelId)
      if (success) {
        return successResponse({ success: true })
      } else {
        return errorResponse("Failed to delete channel", "Database operation failed", 500)
      }
    }

    return errorResponse("Invalid action", "Action must be add, update, or delete", 400)
  } catch (error: any) {
    return errorResponse("Failed to process request", error.message, 500)
  }
}