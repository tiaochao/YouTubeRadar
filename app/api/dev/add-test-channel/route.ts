import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"

// Only enable in development
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("Not available in production", "", 404)
  }

  try {
    // Try to find existing test channel first
    let testChannel = await db.channel.findUnique({
      where: { channelId: "UCtest123456789" }
    })
    
    if (!testChannel) {
      // Create a test channel if it doesn't exist
      testChannel = await db.channel.create({
        data: {
          channelId: "UCtest123456789", 
          title: "Test YouTube Channel",
          email: "test@example.com",
          thumbnailUrl: "/placeholder.svg?height=64&width=64&text=Test",
          status: "active",
          country: "US",
          totalViews: BigInt(1500000),
          totalSubscribers: BigInt(50000),
          lastAnalyticsAt: new Date(),
          lastVideoSyncAt: new Date(),
        },
      })
    }

    // Create some test daily stats
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Check if stats already exist for this date
      const existingStat = await db.channelDailyStat.findUnique({
        where: {
          channelId_date: {
            channelId: testChannel.id,
            date: date
          }
        }
      })
      
      if (!existingStat) {
        await db.channelDailyStat.create({
          data: {
            channelId: testChannel.id,
            date: date,
            views: BigInt(Math.floor(Math.random() * 10000) + 5000),
            watchTimeHours: Math.random() * 100 + 50,
            subscribersGained: Math.floor(Math.random() * 50) + 10,
            subscribersLost: Math.floor(Math.random() * 10) + 2,
            estimatedMinutesWatched: BigInt(Math.floor(Math.random() * 50000) + 10000),
            impressions: BigInt(Math.floor(Math.random() * 100000) + 50000),
            impressionCtr: Math.random() * 0.05 + 0.02,
          },
        })
      }
    }

    // Create some test videos
    for (let i = 0; i < 5; i++) {
      const videoId = `testvideo${i}123456`
      const existingVideo = await db.video.findUnique({
        where: { videoId: videoId }
      })
      
      if (!existingVideo) {
        const publishedAt = new Date()
        publishedAt.setDate(publishedAt.getDate() - i * 2)
        
        const video = await db.video.create({
          data: {
            videoId: videoId,
            channelId: testChannel.id,
            title: `Test Video ${i + 1}: Amazing Content`,
            publishedAt: publishedAt,
            live: false,
          },
        })

        // Create video stats snapshots
        await db.videoStatSnapshot.create({
          data: {
            videoId: video.id,
            channelId: testChannel.id,
            viewCount: BigInt(Math.floor(Math.random() * 100000) + 1000),
            likeCount: BigInt(Math.floor(Math.random() * 1000) + 50),
            commentCount: BigInt(Math.floor(Math.random() * 500) + 10),
          },
        })
      }
    }

    // Create test task logs only if none exist
    const existingLogs = await db.taskLog.count()
    if (existingLogs === 0) {
      const taskTypes = ["VIDEO_SYNC", "CHANNEL_HOURLY", "CHANNEL_DAILY", "REAUTH_CHECK"] as const
      for (let i = 0; i < 10; i++) {
        const startedAt = new Date()
        startedAt.setMinutes(startedAt.getMinutes() - i * 30)
        const finishedAt = new Date(startedAt)
        finishedAt.setSeconds(finishedAt.getSeconds() + Math.floor(Math.random() * 60) + 10)
        
        await db.taskLog.create({
          data: {
            taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
            startedAt: startedAt,
            finishedAt: finishedAt,
            success: Math.random() > 0.2, // 80% success rate
            message: Math.random() > 0.5 ? `Task completed successfully` : `Processed ${Math.floor(Math.random() * 100) + 1} items`,
            durationMs: Math.floor(Math.random() * 5000) + 500,
          },
        })
      }
    }

    return successResponse({ 
      message: "Test channel and data created successfully",
      channel: {
        id: testChannel.id,
        channelId: testChannel.channelId,
        title: testChannel.title,
      }
    })
  } catch (error: any) {
    console.error("Failed to create test data:", error)
    return errorResponse("Failed to create test data", error.message, 500)
  }
}