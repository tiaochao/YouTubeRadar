import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const query = searchParams.get("query") || ""
    const sortBy = searchParams.get("sortBy") || "publishedAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const channelId = searchParams.get("channelId")

    const skip = (page - 1) * pageSize

    const whereClause: any = {}
    if (query) {
      whereClause.title = {
        contains: query,
        mode: "insensitive", // Case-insensitive search
      }
    }
    
    // Filter by channelId if provided
    if (channelId) {
      whereClause.channelId = channelId
    }

    const orderBy: any = {}
    if (sortBy === "publishedAt") {
      orderBy.publishedAt = sortOrder
    } else if (sortBy === "viewCount") {
      // Sorting by viewCount requires joining with snapshots, which is complex for Prisma's orderBy
      // For simplicity, we'll fetch and sort in memory for now, or recommend a more advanced DB query
      // For a large dataset, this would need a raw SQL query or a materialized view.
      // For this example, we'll just order by publishedAt if viewCount is selected for simplicity.
      orderBy.publishedAt = sortOrder
      logger.warn(
        "API/Videos",
        "Sorting by viewCount is not fully supported for pagination without complex queries. Defaulting to publishedAt.",
      )
    }

    const videos = await db.video.findMany({
      where: whereClause,
      orderBy: orderBy,
      skip,
      take: pageSize,
      include: {
        snapshots: {
          orderBy: { collectedAt: "desc" },
          take: 1, // Get the latest snapshot for each video
        },
        channel: {
          select: { title: true, thumbnailUrl: true },
        },
      },
    })

    const totalVideos = await db.video.count({ where: whereClause })

    // Convert BigInts to string for serialization
    const serializableVideos = videos.map((video) => ({
      ...video,
      snapshots: video.snapshots.map((s) => ({
        ...s,
        viewCount: s.viewCount.toString(),
        likeCount: s.likeCount.toString(),
        commentCount: s.commentCount.toString(),
      })),
    }))

    return successResponse({
      data: serializableVideos,
      total: totalVideos,
      page,
      pageSize,
      totalPages: Math.ceil(totalVideos / pageSize),
    })
  } catch (error: any) {
    logger.error("API/Videos", "Failed to fetch videos.", error)
    return errorResponse("Failed to fetch videos.", error.message, 500)
  }
}
