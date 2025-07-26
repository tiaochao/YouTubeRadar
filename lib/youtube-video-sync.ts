import { db } from "./db"
import { logger } from "./logger"
import { createYouTubeClient } from "./youtube-public-api"
import { generateChannelDailyStats } from "./daily-stats-generator"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || ''

export async function syncChannelVideos(channelId: string) {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key not configured")
  }

  try {
    // 获取配置的最大视频数量
    let maxVideosToSync = 50 // 默认值
    try {
      const configResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/system-config?key=max_videos_per_sync`)
      const configData = await configResponse.json()
      if (configData.ok && configData.data?.value) {
        maxVideosToSync = parseInt(configData.data.value)
      }
    } catch (err) {
      logger.warn("VideoSync", "Failed to get max videos config, using default:", err)
    }
    // 获取频道信息
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      throw new Error("Channel not found")
    }

    logger.info("VideoSync", `Starting video sync for channel: ${channel.title}`)

    const client = createYouTubeClient(YOUTUBE_API_KEY)
    
    // 首先获取频道的实际上传播放列表ID
    let uploadsPlaylistId: string
    try {
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.channelId}&key=${YOUTUBE_API_KEY}`
      )
      const channelData = await channelResponse.json()
      
      if (channelData.error) {
        throw new Error(`YouTube API error: ${channelData.error.message}`)
      }
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel not found on YouTube")
      }
      
      uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads
      
      if (!uploadsPlaylistId) {
        logger.warn("VideoSync", `No uploads playlist found for channel: ${channel.title}`)
        // 更新频道的最后同步时间，即使没有视频
        await db.channel.update({
          where: { id: channelId },
          data: { 
            lastVideoSyncAt: new Date(),
            videoCount: 0
          }
        })
        return { success: true, totalVideos: 0 }
      }
    } catch (error: any) {
      logger.error("VideoSync", `Failed to get uploads playlist for channel ${channel.title}:`, error)
      throw new Error(`Unable to access channel videos: ${error.message}`)
    }
    
    // 获取视频列表
    let pageToken: string | undefined
    let totalVideos = 0
    const maxResults = 50 // YouTube API 每次最多返回50个

    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?` +
        `part=snippet,contentDetails&` +
        `playlistId=${uploadsPlaylistId}&` +
        `maxResults=${maxResults}&` +
        `key=${YOUTUBE_API_KEY}` +
        (pageToken ? `&pageToken=${pageToken}` : '')

      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        if (data.error.reason === 'playlistNotFound') {
          logger.warn("VideoSync", `Uploads playlist not found for channel: ${channel.title}`)
          // 更新频道的最后同步时间，即使没有视频
          await db.channel.update({
            where: { id: channelId },
            data: { 
              lastVideoSyncAt: new Date(),
              videoCount: 0
            }
          })
          return { success: true, totalVideos: 0 }
        }
        throw new Error(`YouTube API error: ${data.error.message}`)
      }

      if (!data.items || data.items.length === 0) {
        logger.info("VideoSync", `No videos found for channel: ${channel.title}`)
        break
      }

      // 获取视频IDs
      const videoIds = data.items.map((item: any) => item.contentDetails.videoId).join(',')
      
      if (videoIds) {
        // 批量获取视频详细信息
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
          `part=snippet,statistics,contentDetails&` +
          `id=${videoIds}&` +
          `key=${YOUTUBE_API_KEY}`

        const videoResponse = await fetch(videoDetailsUrl)
        const videoData = await videoResponse.json()

        if (videoData.items) {
          // 批量保存视频到数据库
          for (const video of videoData.items) {
            try {
              // 检查视频是否已存在
              const existingVideo = await db.video.findUnique({
                where: { videoId: video.id }
              })

              if (existingVideo) {
                // 更新视频统计快照
                await db.videoStatSnapshot.create({
                  data: {
                    videoId: existingVideo.id,
                    channelId: channel.id,
                    viewCount: BigInt(video.statistics.viewCount || 0),
                    likeCount: BigInt(video.statistics.likeCount || 0),
                    commentCount: BigInt(video.statistics.commentCount || 0)
                  }
                })
              } else {
                // 创建新视频
                const newVideo = await db.video.create({
                  data: {
                    videoId: video.id,
                    channelId: channel.id,
                    title: video.snippet.title,
                    publishedAt: new Date(video.snippet.publishedAt),
                    live: video.snippet.liveBroadcastContent !== 'none',
                    duration: video.contentDetails?.duration || null
                  }
                })

                // 创建初始统计快照
                await db.videoStatSnapshot.create({
                  data: {
                    videoId: newVideo.id,
                    channelId: channel.id,
                    viewCount: BigInt(video.statistics.viewCount || 0),
                    likeCount: BigInt(video.statistics.likeCount || 0),
                    commentCount: BigInt(video.statistics.commentCount || 0)
                  }
                })
              }

              totalVideos++
            } catch (err) {
              logger.error("VideoSync", `Failed to save video ${video.id}:`, err)
            }
          }
        }
      }

      pageToken = data.nextPageToken
      
      // 为了避免超过API配额，每页之间稍作延迟
      if (pageToken) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } while (pageToken && totalVideos < maxVideosToSync) // 使用配置的限制

    // 更新频道的最后同步时间
    await db.channel.update({
      where: { id: channelId },
      data: { 
        lastVideoSyncAt: new Date(),
        videoCount: totalVideos
      }
    })

    logger.info("VideoSync", `Completed video sync for channel: ${channel.title}. Synced ${totalVideos} videos.`)

    // Generate daily stats for today
    try {
      await generateChannelDailyStats(channelId, new Date())
      logger.info("VideoSync", `Generated daily stats for channel: ${channel.title}`)
    } catch (error) {
      logger.warn("VideoSync", `Failed to generate daily stats for channel ${channel.title}:`, error)
      // Don't fail the whole sync if daily stats generation fails
    }

    return { success: true, totalVideos }

  } catch (error: any) {
    logger.error("VideoSync", "Failed to sync videos:", error)
    throw error
  }
}

// 获取频道的视频列表（从数据库）
export async function getChannelVideos(channelId: string, page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize

  const [videos, total] = await Promise.all([
    db.video.findMany({
      where: { channelId },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        channel: {
          select: {
            title: true,
            thumbnailUrl: true
          }
        },
        snapshots: {
          orderBy: { collectedAt: 'desc' },
          take: 1
        }
      }
    }),
    db.video.count({
      where: { channelId }
    })
  ])

  // 转换BigInt为字符串
  const serializedVideos = videos.map(video => ({
    ...video,
    snapshots: video.snapshots.map(snapshot => ({
      ...snapshot,
      viewCount: snapshot.viewCount.toString(),
      likeCount: snapshot.likeCount.toString(),
      commentCount: snapshot.commentCount.toString()
    }))
  }))

  return {
    data: serializedVideos,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}