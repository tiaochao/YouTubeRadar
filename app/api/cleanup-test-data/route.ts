import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // 删除测试频道
    const deleteChannels = await db.channel.deleteMany({
      where: {
        OR: [
          { title: "Test Channel" },
          { title: "Test DB Channel" },
          { channelId: { startsWith: "UC_test" } }
        ]
      }
    })

    // 删除测试频道的每日统计数据
    const deleteStats = await db.channelDailyStat.deleteMany({
      where: {
        channelId: {
          in: []  // 会在删除频道后自动清理，因为有外键约束
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteChannels.count} test channels`,
      deletedChannels: deleteChannels.count
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}