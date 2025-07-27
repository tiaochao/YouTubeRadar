import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const { channels } = await req.json()
    
    if (!channels || !Array.isArray(channels)) {
      return NextResponse.json({ 
        ok: false, 
        error: "请提供要同步的频道数据" 
      }, { status: 400 })
    }
    
    logger.info("ManualSync", `开始同步 ${channels.length} 个频道`)
    
    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    for (const channel of channels) {
      try {
        // 1. 保存或更新频道到数据库
        await db.channel.upsert({
          where: { id: channel.id },
          update: {
            title: channel.title,
            handle: channel.handle,
            thumbnailUrl: channel.thumbnailUrl,
            viewCount: channel.viewCount || 0,
            subscriberCount: channel.subscriberCount || 0,
            videoCount: channel.videoCount || 0,
            updatedAt: new Date()
          },
          create: {
            id: channel.id,
            title: channel.title,
            handle: channel.handle,
            thumbnailUrl: channel.thumbnailUrl,
            viewCount: channel.viewCount || 0,
            subscriberCount: channel.subscriberCount || 0,
            videoCount: channel.videoCount || 0,
            status: 'active'
          }
        })
        
        // 不自动创建模拟的每日统计数据
        // 真实的每日统计数据应该通过其他 API 端点或定时任务获取
        
        results.synced++
      } catch (error: any) {
        logger.error("ManualSync", `同步频道 ${channel.id} 失败:`, error)
        results.failed++
        results.errors.push(`${channel.title}: ${error.message}`)
      }
    }
    
    logger.info("ManualSync", `同步完成: 成功 ${results.synced}, 失败 ${results.failed}`)
    
    return NextResponse.json({ 
      ok: true, 
      data: results,
      message: `同步完成：成功 ${results.synced} 个，失败 ${results.failed} 个`
    })
    
  } catch (error: any) {
    logger.error("ManualSync", "同步失败:", error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "同步失败" 
    }, { status: 500 })
  }
}