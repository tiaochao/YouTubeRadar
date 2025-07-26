import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { generateHistoricalDailyStats } from "@/lib/daily-stats-generator"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const days = body.days || 30 // 默认生成30天的历史数据

    logger.info("GenerateAllDailyStats", `Starting bulk daily stats generation for all channels (${days} days)`)

    // 获取所有活跃频道
    const activeChannels = await db.channel.findMany({
      where: { status: 'active' },
      select: { id: true, title: true }
    })

    if (activeChannels.length === 0) {
      return successResponse({
        message: "没有找到活跃的频道",
        totalChannels: 0,
        processedChannels: 0
      })
    }

    logger.info("GenerateAllDailyStats", `Found ${activeChannels.length} active channels`)

    let successCount = 0
    let failureCount = 0
    const errors: { channelTitle: string; error: string }[] = []

    // 逐个处理频道，避免并发过高
    for (const channel of activeChannels) {
      try {
        logger.info("GenerateAllDailyStats", `Processing channel: ${channel.title}`)
        
        // 检查是否已有足够的日度统计数据
        const existingStats = await db.channelDailyStat.count({
          where: { channelId: channel.id }
        })

        // 如果已有的记录数达到预期天数的80%，则跳过
        if (existingStats >= days * 0.8) {
          logger.info("GenerateAllDailyStats", `Channel ${channel.title} already has ${existingStats} daily stats records (>= ${Math.floor(days * 0.8)}), skipping`)
          successCount++
          continue
        }

        // 生成历史日度统计
        await generateHistoricalDailyStats(channel.id, days)
        successCount++
        
        logger.info("GenerateAllDailyStats", `Successfully generated daily stats for channel: ${channel.title}`)
        
        // 添加延迟避免过载
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error: any) {
        failureCount++
        const errorMessage = error.message || "未知错误"
        errors.push({
          channelTitle: channel.title,
          error: errorMessage
        })
        logger.error("GenerateAllDailyStats", `Failed to generate daily stats for channel ${channel.title}:`, error)
      }
    }

    const result = {
      message: `批量生成日度统计完成`,
      totalChannels: activeChannels.length,
      successCount,
      failureCount,
      daysGenerated: days,
      errors: errors.length > 0 ? errors : undefined
    }

    logger.info("GenerateAllDailyStats", "Bulk daily stats generation completed", result)

    return successResponse(result)

  } catch (error: any) {
    logger.error("GenerateAllDailyStats", "Failed to generate bulk daily stats:", error)
    return errorResponse("批量生成日度统计失败", error.message, 500)
  }
}