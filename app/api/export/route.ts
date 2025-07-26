import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const channelId = searchParams.get("channelId")
  const type = searchParams.get("type") // 'videos' or 'daily-stats'
  const formatType = searchParams.get("format") || "json" // 'json' or 'csv'

  if (!channelId || !type) {
    return errorResponse("Missing channelId or type parameter.", undefined, 400)
  }

  let data: any[] = []
  let filename = `export-${channelId}-${type}`

  try {
    if (type === "videos") {
      data = await db.video.findMany({
        where: { channelId },
        orderBy: { publishedAt: "desc" },
        include: {
          snapshots: {
            orderBy: { collectedAt: "desc" },
            take: 1, // Get the latest snapshot for each video
          },
        },
      })
      filename += "-videos"
    } else if (type === "daily-stats") {
      data = await db.channelDailyStat.findMany({
        where: { channelId },
        orderBy: { date: "asc" },
      })
      filename += "-daily-stats"
    } else {
      return errorResponse('Invalid export type. Must be "videos" or "daily-stats".', undefined, 400)
    }

    if (formatType === "json") {
      return new NextResponse(
        JSON.stringify(
          data,
          (key, value) => (typeof value === "bigint" ? value.toString() : value), // Handle BigInt serialization
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${filename}.json"`,
          },
        },
      )
    } else if (formatType === "csv") {
      if (data.length === 0) {
        return new NextResponse("", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}.csv"`,
          },
        })
      }

      // Simple CSV conversion (can be improved for nested objects)
      const headers = Object.keys(data[0]).filter((key) => key !== "snapshots" && key !== "channel" && key !== "video") // Exclude relations
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              let value = row[header]
              if (typeof value === "bigint") {
                value = value.toString()
              } else if (value instanceof Date) {
                value = format(value, "yyyy-MM-dd") // Format dates
              }
              // Escape commas and quotes for CSV
              return `"${String(value).replace(/"/g, '""')}"`
            })
            .join(","),
        ),
      ]

      return new NextResponse(csvRows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    } else {
      return errorResponse('Invalid format type. Must be "json" or "csv".', undefined, 400)
    }
  } catch (error: any) {
    logger.error("API/Export", "Failed to export data.", error)
    return errorResponse("Failed to export data.", error.message, 500)
  }
}
