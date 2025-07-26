import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { parseISO } from "date-fns"
import { redis } from "@/lib/redis" // Import Redis client
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params
    const searchParams = req.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    const cacheKey = `daily_stats:${channelId}:${startDateParam || "all"}:${endDateParam || "all"}`
    let dailyStats: any[] | null = null

    // Try to fetch from Redis cache first
    try {
      const cachedData = await redis.get(cacheKey)
      if (cachedData) {
        logger.info("API/DailyStats", `Cache hit for ${cacheKey}`)
        dailyStats = cachedData as any[]
      }
    } catch (cacheError) {
      logger.warn("API/DailyStats", `Redis cache read failed for ${cacheKey}:`, cacheError)
      // Continue to DB if cache read fails
    }

    if (!dailyStats) {
      logger.info("API/DailyStats", `Cache miss for ${cacheKey}, fetching from DB...`)
      const whereClause: { channelId: string; date?: { gte?: Date; lte?: Date } } = {
        channelId,
      }

      if (startDateParam) {
        whereClause.date = { ...whereClause.date, gte: parseISO(startDateParam) }
      }
      if (endDateParam) {
        whereClause.date = { ...whereClause.date, lte: parseISO(endDateParam) }
      }

      const dbStats = await db.channelDailyStat.findMany({
        where: whereClause,
        orderBy: { date: "asc" },
      })

      // Prisma returns BigInt for numeric types, convert to string for JSON serialization
      dailyStats = dbStats.map((stat) => ({
        ...stat,
        views: stat.views.toString(),
        estimatedMinutesWatched: stat.estimatedMinutesWatched.toString(),
        impressions: stat.impressions.toString(),
        totalVideoViews: stat.totalVideoViews?.toString() || "0",
      }))

      // Store in Redis cache (e.g., for 1 hour)
      try {
        await redis.set(cacheKey, dailyStats, { ex: 3600 }) // Cache for 1 hour
        logger.info("API/DailyStats", `Data cached for ${cacheKey}`)
      } catch (cacheError) {
        logger.warn("API/DailyStats", `Redis cache write failed for ${cacheKey}:`, cacheError)
      }
    }

    return successResponse(dailyStats)
  } catch (error: any) {
    logger.error("API/DailyStats", "Failed to fetch daily stats.", error)
    return errorResponse("Failed to fetch daily stats.", error.message, 500)
  }
}
