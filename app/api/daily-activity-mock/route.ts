import { NextRequest, NextResponse } from "next/server"
import { LocalStorageAdapter } from "@/lib/local-storage-adapter"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "30")
    
    // 从本地存储获取频道
    // 注意：这是服务端代码，实际上无法访问浏览器的 localStorage
    // 这里只是为了演示，实际需要从数据库获取
    
    const mockData = []
    const today = new Date()
    
    // 生成过去几天的模拟数据
    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        channels: [
          {
            id: `channel-${i}`,
            title: `示例频道 ${i + 1}`,
            videosPublished: Math.floor(Math.random() * 3),
            videosPublishedLive: Math.floor(Math.random() * 2),
            totalVideoViews: String(Math.floor(Math.random() * 100000)),
            dailyViews: String(Math.floor(Math.random() * 10000)),
            subscribersGained: Math.floor(Math.random() * 1000) - 100
          }
        ],
        totalVideos: Math.floor(Math.random() * 5),
        totalChannels: 1,
        totalViews: String(Math.floor(Math.random() * 10000)),
        totalSubscribersGained: Math.floor(Math.random() * 1000)
      })
    }
    
    return NextResponse.json({ ok: true, data: mockData })
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "获取数据失败" 
    }, { status: 500 })
  }
}