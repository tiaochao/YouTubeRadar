import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { parseISO } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const channelId = searchParams.get("channelId") || ""
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * pageSize

    const whereClause: any = {}
    if (channelId) {
      whereClause.channelId = channelId
    }
    if (startDateParam) {
      whereClause.date = { ...whereClause.date, gte: parseISO(startDateParam) }
    }
    if (endDateParam) {
      whereClause.date = { ...whereClause.date, lte: parseISO(endDateParam) }
    }

    const orderBy: any = { [sortBy]: sortOrder }

    const dailyStats = await db.channelDailyStat.findMany({
      where: whereClause,
      orderBy: orderBy,
      skip,
      take: pageSize,
      include: {
        channel: {
          select: { title: true, thumbnailUrl: true },
        },
      },
    })

    const totalStats = await db.channelDailyStat.count({ where: whereClause })

    // Convert BigInts to string for serialization
    const serializableStats = dailyStats.map((stat) => ({
      ...stat,
      views: stat.views.toString(),
      estimatedMinutesWatched: stat.estimatedMinutesWatched.toString(),
      impressions: stat.impressions.toString(),
      totalVideoViews: stat.totalVideoViews.toString(),
    }))

    return successResponse({
      data: serializableStats,
      total: totalStats,
      page,
      pageSize,
      totalPages: Math.ceil(totalStats / pageSize),
    })
  } catch (error: any) {
    logger.error("API/Analytics", "Failed to fetch daily analytics.", error)
    return errorResponse("Failed to fetch daily analytics.", error.message, 500)
  }
}
