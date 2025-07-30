import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const channels = await db.channel.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ ok: true, data: channels })
  } catch (error: any) {
    console.error('Failed to fetch channels:', error)
    
    // 如果数据库查询失败，返回空数组
    return NextResponse.json({ 
      ok: true, 
      data: [],
      error: error.message
    })
  }
}