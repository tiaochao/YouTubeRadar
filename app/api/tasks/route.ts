import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const taskType = searchParams.get("taskType") || ""
    const successFilter = searchParams.get("success") // 'true', 'false', or ''

    const skip = (page - 1) * pageSize

    const whereClause: any = {}
    if (taskType) {
      whereClause.taskType = taskType
    }
    if (successFilter !== "") {
      whereClause.success = successFilter === "true"
    }

    const taskLogs = await db.taskLog.findMany({
      where: whereClause,
      orderBy: { startedAt: "desc" },
      skip,
      take: pageSize,
    })

    const totalLogs = await db.taskLog.count({ where: whereClause })

    return successResponse({
      data: taskLogs,
      total: totalLogs,
      page,
      pageSize,
      totalPages: Math.ceil(totalLogs / pageSize),
    })
  } catch (error: any) {
    logger.error("API/Tasks", "Failed to fetch task logs.", error)
    return errorResponse("Failed to fetch task logs.", error.message, 500)
  }
}
