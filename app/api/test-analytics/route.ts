import { NextRequest, NextResponse } from "next/server"
import { youtubeAnalyticsSync } from "@/lib/youtube-analytics-sync"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"

/**
 * 测试 YouTube Analytics API 集成
 * 验证 OAuth 配置和数据获取功能
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const channelId = searchParams.get("channelId")
    const testAuth = searchParams.get("testAuth") === "true"
    
    logger.info("TestAnalytics", "Starting YouTube Analytics API test")
    
    // 检查环境变量配置
    const config = {
      clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || '',
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
      apiKey: process.env.YOUTUBE_API_KEY || ''
    }
    
    const configStatus = {
      hasClientId: !!config.clientId,
      hasClientSecret: !!config.clientSecret,
      hasRefreshToken: !!config.refreshToken,
      hasApiKey: !!config.apiKey
    }
    
    logger.info("TestAnalytics", "Configuration status:", configStatus)
    
    // 如果只是测试认证
    if (testAuth) {
      return successResponse({
        message: "YouTube Analytics API configuration test",
        configStatus,
        recommendations: {
          needsOAuth: !configStatus.hasClientId || !configStatus.hasClientSecret || !configStatus.hasRefreshToken,
          setupInstructions: !configStatus.hasRefreshToken ? 
            "Run 'node scripts/setup-youtube-oauth.js' to get OAuth credentials" : null
        }
      })
    }
    
    // 获取测试频道
    let testChannelId = channelId
    if (!testChannelId) {
      // 获取第一个活跃频道作为测试
      const firstChannel = await db.channel.findFirst({
        where: { status: 'active' },
        select: { id: true, title: true, channelId: true }
      })
      
      if (!firstChannel) {
        return errorResponse(
          "No test channel available", 
          "Please add at least one active channel to test with", 
          404
        )
      }
      
      testChannelId = firstChannel.id
      logger.info("TestAnalytics", `Using test channel: ${firstChannel.title} (${firstChannel.channelId})`)
    }
    
    // 验证频道存在
    const channel = await db.channel.findUnique({
      where: { id: testChannelId },
      select: { 
        id: true, 
        title: true, 
        channelId: true, 
        timezone: true,
        status: true
      }
    })
    
    if (!channel) {
      return errorResponse(
        "Channel not found", 
        `Channel with ID ${testChannelId} not found`, 
        404
      )
    }
    
    // 测试数据同步
    const testDate = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    logger.info("TestAnalytics", `Testing data sync for channel ${channel.title}`)
    
    try {
      // 尝试同步昨天的数据（通常更稳定）
      await youtubeAnalyticsSync.syncChannelDailyAnalytics(testChannelId, yesterday)
      
      // 检查同步结果
      const syncedData = await db.channelDailyStat.findUnique({
        where: {
          channelId_date: {
            channelId: testChannelId,
            date: yesterday
          }
        }
      })
      
      const testResults = {
        configurationTest: {
          status: "✅ PASSED",
          details: configStatus
        },
        
        channelTest: {
          status: "✅ PASSED",
          channelInfo: {
            id: channel.id,
            title: channel.title,
            youtubeChannelId: channel.channelId,
            timezone: channel.timezone,
            status: channel.status
          }
        },
        
        apiSyncTest: {
          status: syncedData ? "✅ PASSED" : "⚠️  WARNING", 
          testDate: yesterday.toISOString().split('T')[0],
          syncedData: syncedData ? {
            views: syncedData.views.toString(),
            estimatedMinutesWatched: syncedData.estimatedMinutesWatched.toString(),
            watchTimeHours: syncedData.watchTimeHours,
            subscribersGained: syncedData.subscribersGained,
            subscribersLost: syncedData.subscribersLost
          } : null,
          message: syncedData ? 
            "Successfully synced real YouTube Analytics data" : 
            "Sync completed but no data returned (may be normal for new/inactive channels)"
        },
        
        recommendations: []
      }
      
      // 添加建议
      if (!configStatus.hasRefreshToken) {
        testResults.recommendations.push({
          priority: "HIGH",
          message: "Missing OAuth refresh token",
          action: "Run 'node scripts/setup-youtube-oauth.js' to complete OAuth setup"
        })
      }
      
      if (!syncedData) {
        testResults.recommendations.push({
          priority: "MEDIUM", 
          message: "No analytics data retrieved",
          action: "Verify the channel has recent activity or try with a different date range"
        })
      }
      
      return successResponse({
        message: "YouTube Analytics API integration test completed",
        testResults,
        timestamp: new Date().toISOString(),
        source: "YouTube Analytics API Test"
      })
      
    } catch (syncError: any) {
      logger.error("TestAnalytics", "Sync test failed:", syncError)
      
      const testResults = {
        configurationTest: {
          status: configStatus.hasClientId && configStatus.hasClientSecret && configStatus.hasRefreshToken ? 
            "✅ PASSED" : "❌ FAILED",
          details: configStatus
        },
        
        channelTest: {
          status: "✅ PASSED",
          channelInfo: {
            id: channel.id,
            title: channel.title,
            youtubeChannelId: channel.channelId,
            timezone: channel.timezone
          }
        },
        
        apiSyncTest: {
          status: "❌ FAILED",
          error: syncError.message,
          errorType: syncError.message.includes('refresh token') ? 'AUTH_ERROR' :
                     syncError.message.includes('quota') ? 'QUOTA_ERROR' :
                     syncError.message.includes('permission') ? 'PERMISSION_ERROR' : 'UNKNOWN_ERROR'
        },
        
        recommendations: []
      }
      
      // 根据错误类型提供建议
      if (syncError.message.includes('refresh token')) {
        testResults.recommendations.push({
          priority: "HIGH",
          message: "OAuth authentication failed",
          action: "Re-run OAuth setup to get new refresh token: 'node scripts/setup-youtube-oauth.js'"
        })
      } else if (syncError.message.includes('quota')) {
        testResults.recommendations.push({
          priority: "MEDIUM",
          message: "API quota exceeded",
          action: "Wait for quota reset or request quota increase in Google Cloud Console"
        })
      } else {
        testResults.recommendations.push({
          priority: "HIGH",
          message: "API integration error",
          action: "Check logs and verify API credentials in environment variables"
        })
      }
      
      return successResponse({
        message: "YouTube Analytics API integration test completed with errors",
        testResults,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error: any) {
    logger.error("TestAnalytics", "Test failed:", error)
    return errorResponse("Test failed", error.message, 500)
  }
}

/**
 * 触发测试数据同步 (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const { channelId, date, testMode } = await req.json()
    
    if (!channelId) {
      return errorResponse("Channel ID required", "Please provide a channel ID to test", 400)
    }
    
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { title: true, channelId: true }
    })
    
    if (!channel) {
      return errorResponse("Channel not found", `Channel ${channelId} not found`, 404)
    }
    
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setDate(targetDate.getDate() - 1) // 使用昨天的数据
    
    logger.info("TestAnalytics", `Manual test sync for ${channel.title} on ${targetDate.toISOString().split('T')[0]}`)
    
    if (testMode) {
      // 测试模式：只验证配置不实际同步
      const hasCredentials = !!(
        process.env.YOUTUBE_OAUTH_CLIENT_ID && 
        process.env.YOUTUBE_OAUTH_CLIENT_SECRET && 
        process.env.YOUTUBE_REFRESH_TOKEN
      )
      
      return successResponse({
        message: `Test mode for channel ${channel.title}`,
        hasCredentials,
        targetDate: targetDate.toISOString().split('T')[0],
        channel: {
          id: channelId,
          title: channel.title,
          youtubeChannelId: channel.channelId
        }
      })
    }
    
    // 实际同步
    await youtubeAnalyticsSync.syncChannelDailyAnalytics(channelId, targetDate)
    
    // 获取同步结果
    const syncedData = await db.channelDailyStat.findUnique({
      where: {
        channelId_date: {
          channelId: channelId,
          date: targetDate
        }
      }
    })
    
    return successResponse({
      message: `Manual sync completed for ${channel.title}`,
      channel: {
        id: channelId,
        title: channel.title,
        youtubeChannelId: channel.channelId
      },
      date: targetDate.toISOString().split('T')[0],
      syncedData: syncedData ? {
        views: syncedData.views.toString(),
        estimatedMinutesWatched: syncedData.estimatedMinutesWatched.toString(),
        watchTimeHours: syncedData.watchTimeHours,
        subscribersGained: syncedData.subscribersGained,
        subscribersLost: syncedData.subscribersLost
      } : null,
      source: "Manual Test Sync"
    })
    
  } catch (error: any) {
    logger.error("TestAnalytics", "Manual sync test failed:", error)
    return errorResponse("Manual sync failed", error.message, 500)
  }
}