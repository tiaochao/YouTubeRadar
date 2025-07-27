import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { withErrorHandler } from "@/lib/api-error-handler"

export const GET = withErrorHandler(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const whereClause: any = {}
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { channelId: { contains: query, mode: "insensitive" } },
      ]
    }

    const orderBy: any = {}
    switch (sortBy) {
      case "title":
        orderBy.title = sortOrder
        break
      case "totalViews":
        orderBy.totalViews = sortOrder
        break
      case "totalSubscribers":
        orderBy.totalSubscribers = sortOrder
        break
      case "createdAt":
      default:
        orderBy.createdAt = sortOrder
        break
    }

    const channels = await db.channel.findMany({
      where: whereClause,
      orderBy: orderBy,
      include: {
        dailyStats: {
          orderBy: { date: "desc" },
          take: 1, // Get the latest daily stat for recent views
        },
        videos: {
          orderBy: { publishedAt: "desc" },
          take: 1, // Get the latest video
        },
      },
    })

    // Convert BigInts to string for serialization
    const serializableChannels = channels.map((channel) => ({
      ...channel,
      totalViews: channel.totalViews?.toString() || null,
      totalSubscribers: channel.totalSubscribers?.toString() || null,
      viewCount: channel.viewCount?.toString() || null,
      dailyStats: channel.dailyStats.map((stat) => ({
        ...stat,
        views: stat.views.toString(),
        estimatedMinutesWatched: stat.estimatedMinutesWatched.toString(),
        impressions: stat.impressions.toString(),
        totalVideoViews: stat.totalVideoViews.toString(),
      })),
      videos: channel.videos.map((video) => ({
        ...video,
        viewCount: video.viewCount?.toString() || null,
      })),
    }))

    return successResponse(serializableChannels)
  } catch (error: any) {
    logger.error("API/Channels", "Failed to fetch channels.", error)
    throw error // 让错误处理器处理
  }
})
