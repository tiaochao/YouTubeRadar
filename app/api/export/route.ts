import { type NextRequest, NextResponse } from "next/server"
import { storageAdapter } from "@/lib/storage-adapter"
import { fileStorageAdapter } from "@/lib/file-storage-adapter"
import { format } from "date-fns"
import { errorResponse, successResponse } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const type = searchParams.get("type") || "all" // 'all', 'channels', 'videos', 'stats'
  const formatType = searchParams.get("format") || "json" // 'json' or 'csv'
  const channelId = searchParams.get("channelId") // 可选，用于导出特定频道数据

  let data: any = {}
  let filename = `youtube-radar-export`

  try {
    if (type === "all") {
      // 导出所有数据
      data = await fileStorageAdapter.exportData()
      filename += "-all"
      
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    } else if (type === "channels") {
      // 导出频道数据
      const channels = await storageAdapter.getChannels()
      data = channelId ? channels.filter(ch => ch.channelId === channelId) : channels
      filename += "-channels"
    } else if (type === "videos") {
      // 导出视频数据
      if (!channelId) {
        return errorResponse("channelId is required for videos export.", undefined, 400)
      }
      data = await fileStorageAdapter.getVideosByChannel(channelId)
      filename += `-videos-${channelId}`
    } else if (type === "stats") {
      // 导出统计信息
      data = await fileStorageAdapter.getStorageStats()
      filename += "-stats"
    } else {
      return errorResponse('Invalid export type. Must be "all", "channels", "videos", or "stats".', undefined, 400)
    }

    if (formatType === "json") {
      return new NextResponse(
        JSON.stringify(data, null, 2),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.json"`,
          },
        },
      )
    } else if (formatType === "csv") {
      if (!Array.isArray(data) || data.length === 0) {
        return new NextResponse("", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      // 转换为CSV格式
      const headers = Object.keys(data[0]).filter(key => 
        typeof data[0][key] !== 'object' || data[0][key] instanceof Date
      )
      
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              let value = row[header]
              if (value instanceof Date) {
                value = format(value, "yyyy-MM-dd HH:mm:ss")
              } else if (typeof value === 'number') {
                value = value.toString()
              } else if (value === null || value === undefined) {
                value = ""
              }
              // 转义CSV中的逗号和引号
              return `"${String(value).replace(/"/g, '""')}"`
            })
            .join(","),
        ),
      ]

      return new NextResponse(csvRows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      return errorResponse('Invalid format type. Must be "json" or "csv".', undefined, 400)
    }
  } catch (error: any) {
    console.error("Export API error:", error)
    return errorResponse("Failed to export data.", error.message, 500)
  }
}

// 数据导入API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data } = body
    
    if (!data) {
      return errorResponse("Missing data parameter.", undefined, 400)
    }
    
    const success = await fileStorageAdapter.importData(JSON.stringify(data))
    
    if (success) {
      return successResponse({ message: "Data imported successfully" })
    } else {
      return errorResponse("Failed to import data.", "Invalid data format or import error", 500)
    }
  } catch (error: any) {
    console.error("Import API error:", error)
    return errorResponse("Failed to import data.", error.message, 500)
  }
}
