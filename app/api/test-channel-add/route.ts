import { NextRequest, NextResponse } from "next/server"
import { databaseAdapter } from "@/lib/database-adapter"

export async function POST(req: NextRequest) {
  try {
    // 测试数据
    const testChannel = {
      id: "test-" + Date.now(),
      channelId: "UC_test_" + Date.now(),
      title: "Test Channel",
      handle: "@testchannel",
      thumbnailUrl: "https://example.com/thumb.jpg",
      viewCount: 12345,
      subscriberCount: 678,
      videoCount: 10,
      note: "Test channel for debugging"
    }

    console.log('测试添加频道:', testChannel)

    // 测试数据库连接
    const isConnected = await databaseAdapter.isConnected()
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Database not connected"
      }, { status: 503 })
    }

    // 尝试添加频道
    const result = await databaseAdapter.addChannel(testChannel)
    
    return NextResponse.json({
      success: true,
      message: "Channel added successfully",
      data: result
    })

  } catch (error: any) {
    console.error('测试添加频道失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        stack: error.code === 'P2002' ? 'Unique constraint violation' : error.stack?.slice(0, 200)
      }
    }, { status: 500 })
  }
}