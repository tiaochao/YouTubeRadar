import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    // Find the channel first
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Delete all associated data in correct order (due to foreign key constraints)
    await db.videoStatSnapshot.deleteMany({
      where: { channelId: channel.id }
    })

    await db.video.deleteMany({
      where: { channelId: channel.id }
    })

    await db.channelDailyStat.deleteMany({
      where: { channelId: channel.id }
    })


    await db.channel.delete({
      where: { id: channel.id }
    })

    logger.info("ChannelDelete", `Deleted channel: ${channel.title} (${channel.channelId})`)

    return NextResponse.json({ 
      success: true,
      message: `Channel "${channel.title}" deleted successfully`
    })

  } catch (error: any) {
    logger.error("ChannelDelete", "Failed to delete channel:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      include: {
        videos: {
          orderBy: { publishedAt: "desc" },
          take: 10,
          include: {
            snapshots: {
              orderBy: { collectedAt: "desc" },
              take: 1
            }
          }
        },
        dailyStats: {
          orderBy: { date: "desc" },
          take: 30
        }
      }
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Convert BigInt fields to strings for JSON serialization
    const channelData = {
      ...channel,
      totalViews: channel.totalViews?.toString() || "0",
      totalSubscribers: channel.totalSubscribers?.toString() || "0",
      viewCount: channel.viewCount?.toString() || "0",
      videos: channel.videos.map(video => ({
        ...video,
        snapshots: video.snapshots.map(snapshot => ({
          ...snapshot,
          viewCount: snapshot.viewCount.toString(),
          likeCount: snapshot.likeCount.toString(),
          commentCount: snapshot.commentCount.toString()
        }))
      })),
      dailyStats: channel.dailyStats.map(stat => ({
        ...stat,
        views: stat.views.toString(),
        estimatedMinutesWatched: stat.estimatedMinutesWatched.toString(),
        impressions: stat.impressions.toString(),
        totalVideoViews: stat.totalVideoViews.toString()
      }))
    }

    return NextResponse.json({ ok: true, data: channelData })

  } catch (error: any) {
    logger.error("ChannelGet", "Failed to get channel:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const body = await req.json()

    // Find the channel first
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Update channel note
    if ('note' in body) {
      const updatedChannel = await db.channel.update({
        where: { id: channelId },
        data: { 
          note: body.note || null // Allow empty string to clear note
        }
      })

      logger.info("ChannelUpdate", `Updated note for channel: ${channel.title} (${channel.channelId})`)

      return NextResponse.json({ 
        success: true,
        message: "Channel note updated successfully",
        note: updatedChannel.note
      })
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })

  } catch (error: any) {
    logger.error("ChannelUpdate", "Failed to update channel:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}