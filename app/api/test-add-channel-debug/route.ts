import { NextRequest, NextResponse } from "next/server"
import { databaseAdapter } from "@/lib/database-adapter"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log("接收到的数据:", JSON.stringify(data, null, 2))
    
    // 检查数据库适配器是否正常
    const testConnection = await databaseAdapter.testConnection()
    console.log("数据库连接测试:", testConnection)
    
    if (!testConnection.success) {
      return NextResponse.json({
        error: "数据库连接失败",
        details: testConnection.error
      }, { status: 500 })
    }
    
    // 尝试添加频道
    console.log("尝试添加频道...")
    const result = await databaseAdapter.addChannel(data.channelData)
    console.log("添加结果:", result)
    
    if (result) {
      return NextResponse.json({
        success: true,
        data: result
      })
    } else {
      return NextResponse.json({
        error: "添加频道失败",
        details: "addChannel 返回 null"
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("添加频道错误:", error)
    return NextResponse.json({
      error: "处理请求失败",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}