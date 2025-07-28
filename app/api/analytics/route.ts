import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { parseISO } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    
    // 如果没有任何查询参数，检查连接状态
    if (searchParams.toString() === '') {
      const refreshToken = req.cookies.get('youtube_analytics_refresh_token')?.value
      console.log('[Analytics API] Connection status check:', {
        hasRefreshToken: !!refreshToken,
        allCookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
      })
      return successResponse({
        hasRefreshToken: !!refreshToken
      })
    }

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

    // Daily stats functionality has been removed
    return successResponse({
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    })
  } catch (error: any) {
    logger.error("API/Analytics", "Failed to fetch daily analytics.", error)
    return errorResponse("Failed to fetch daily analytics.", error.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 删除 refresh token cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('youtube_analytics_refresh_token')
    
    logger.info("API/Analytics", "Refresh token cleared successfully")
    return response
  } catch (error: any) {
    logger.error("API/Analytics", "Failed to clear refresh token.", error)
    return errorResponse("Failed to clear refresh token.", error.message, 500)
  }
}
