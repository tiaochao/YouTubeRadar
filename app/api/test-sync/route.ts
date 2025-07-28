import { NextRequest, NextResponse } from "next/server"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"
import { databaseAdapter } from "@/lib/database-adapter"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const testType = searchParams.get('type') || 'all'
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }
    
    // 测试数据库连接
    if (testType === 'all' || testType === 'database') {
      try {
        const dbConnected = await databaseAdapter.isConnected()
        results.tests.database = {
          status: dbConnected ? 'success' : 'failed',
          message: dbConnected ? 'Database connection successful' : 'Database connection failed'
        }
      } catch (error: any) {
        results.tests.database = {
          status: 'error',
          message: error.message
        }
      }
    }
    
    // 测试 YouTube API
    if (testType === 'all' || testType === 'youtube') {
      try {
        const youtubeAPI = new ClientYouTubeAPI()
        
        // 尝试获取一个知名频道 (YouTube Creators)
        const testChannel = await youtubeAPI.getChannelById('UCkRfArvrzheW2E7b6SVT7vQ')
        
        results.tests.youtube = {
          status: testChannel ? 'success' : 'failed',
          message: testChannel ? 'YouTube API working' : 'YouTube API failed to fetch test channel',
          testChannel: testChannel ? {
            title: testChannel.snippet.title,
            subscriberCount: testChannel.statistics.subscriberCount
          } : null
        }
      } catch (error: any) {
        results.tests.youtube = {
          status: 'error',
          message: error.message
        }
      }
    }
    
    // 测试频道获取
    if (testType === 'all' || testType === 'channels') {
      try {
        const channels = await databaseAdapter.getChannels()
        results.tests.channels = {
          status: 'success',
          message: `Found ${channels.length} channels in database`,
          count: channels.length,
          channels: channels.slice(0, 3).map(ch => ({
            title: ch.title,
            channelId: ch.channelId
          }))
        }
      } catch (error: any) {
        results.tests.channels = {
          status: 'error',
          message: error.message
        }
      }
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    return errorResponse("Test failed", error.message, 500)
  }
}