import { NextResponse } from "next/server"
import { storageAdapter } from "@/lib/storage-adapter"

export async function GET() {
  try {
    const channels = await storageAdapter.getChannels()
    
    return NextResponse.json({ ok: true, data: channels })
  } catch (error: any) {
    console.error('Failed to fetch channels:', error)
    
    // 如果存储查询失败，返回空数组
    return NextResponse.json({ 
      ok: true, 
      data: [],
      error: error.message
    })
  }
}