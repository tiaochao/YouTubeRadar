import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const { target } = await req.json()
    
    if (target === "test_data") {
      // Clean up test channel data
      const testChannels = await db.channel.findMany({
        where: {
          OR: [
            { channelId: { startsWith: "UCtest" } },
            { title: { contains: "Test" } }
          ]
        },
        include: {
          videos: {
            include: {
              snapshots: true
            }
          },
          dailyStats: true
        }
      })

      let deletedCount = 0
      
      for (const channel of testChannels) {
        // Delete associated data first
        await db.videoStatSnapshot.deleteMany({
          where: { channelId: channel.id }
        })
        
        await db.video.deleteMany({
          where: { channelId: channel.id }
        })
        
        await db.channelDailyStat.deleteMany({
          where: { channelId: channel.id }
        })
        
        await db.channel.delete({
          where: { id: channel.id }
        })
        
        deletedCount++
        logger.info("AdminCleanup", `Deleted test channel: ${channel.title} (${channel.channelId})`)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${deletedCount} test channels and associated data`,
        deletedChannels: testChannels.map(c => ({ id: c.id, title: c.title, channelId: c.channelId }))
      })
    }
    
    return NextResponse.json({ error: "Invalid target" }, { status: 400 })
    
  } catch (error: any) {
    logger.error("AdminCleanup", "Failed to clean up data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}