import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const channels = await db.channel.findMany({
      select: {
        id: true,
        title: true,
        viewCount: true,
        totalViews: true,
        totalSubscribers: true,
        videoCount: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      channels: channels.map(channel => ({
        id: channel.id,
        title: channel.title,
        viewCount: channel.viewCount?.toString(),
        totalViews: channel.totalViews?.toString(),
        totalSubscribers: channel.totalSubscribers?.toString(),
        videoCount: channel.videoCount,
        status: channel.status
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}