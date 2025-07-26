import { db } from "./db"
import { ChannelStatus, type TaskType } from "@prisma/client"
import { logger } from "./logger"
import { redis } from "./redis" // Import Redis client

// Utility to clear cache after data updates
export async function clearDailyStatsCache(channelId: string) {
  try {
    if ('keys' in redis) {
      const keys = await (redis as any).keys(`daily_stats:${channelId}:*`)
      if (keys && keys.length > 0) {
        await (redis as any).del(...keys)
        logger.info("Cache", `Cleared ${keys.length} daily stats cache keys for channel ${channelId}.`)
      }
    }
  } catch (error) {
    logger.error("Cache", `Failed to clear daily stats cache for channel ${channelId}.`, error)
  }
}

const MAX_TASK_MESSAGE_LENGTH = 1000 // Max length for task log messages

/**
 * Generic task runner function that iterates over active channels and logs task status.
 * @param taskType The type of task being run.
 * @param taskFunction The function to execute for each active channel. It should accept a channelId and API call/retry maps.
 */
export async function runTask(
  taskType: TaskType,
  taskFunction: (
    channelId: string,
    apiCalls: Map<string, number>,
    retries: Map<string, number>,
  ) => Promise<{ apiCalls: Map<string, number>; retries: Map<string, number> }>,
) {
  const startTime = process.hrtime.bigint()
  const taskLog = await db.taskLog.create({
    data: { taskType, success: false, message: "Task initiated." },
  })

  logger.info("TaskRunner", `Starting ${taskType} task.`)

  const totalApiCalls = new Map<string, number>()
  const totalRetries = new Map<string, number>()

  try {
    const activeChannels = await db.channel.findMany({
      where: { status: ChannelStatus.active },
    })

    if (activeChannels.length === 0) {
      await db.taskLog.update({
        where: { id: taskLog.id },
        data: { success: true, message: "No active channels to process.", finishedAt: new Date() },
      })
      logger.info("TaskRunner", `No active channels for ${taskType} task.`)
      return
    }

    let successCount = 0
    let failureCount = 0
    const failedChannels: { id: string; error: string }[] = []

    // The "max concurrent 3 channels" is not directly implemented here as runTask iterates sequentially.
    // If true concurrency is needed, this loop would need to be replaced with a Promise.all + p-limit.
    // For now, it processes channels one by one.
    for (const channel of activeChannels) {
      try {
        // Temporarily set channel status to syncing
        await db.channel.update({
          where: { id: channel.id },
          data: { status: ChannelStatus.syncing },
        })
        logger.info(taskType, `Processing channel: ${channel.title} (${channel.channelId})`)
        const { apiCalls, retries } = await taskFunction(channel.id, totalApiCalls, totalRetries)

        // Aggregate API call metrics
        apiCalls.forEach((count, endpoint) => {
          totalApiCalls.set(endpoint, (totalApiCalls.get(endpoint) || 0) + count)
        })
        retries.forEach((count, endpoint) => {
          totalRetries.set(endpoint, (totalRetries.get(endpoint) || 0) + count)
        })

        successCount++
        logger.info(taskType, `Successfully processed: ${channel.title}`)
        // Revert status to active if successful
        await db.channel.update({
          where: { id: channel.id },
          data: { status: ChannelStatus.active },
        })
      } catch (error: any) {
        failureCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        failedChannels.push({ id: channel.id, error: errorMessage })
        logger.error(taskType, `Failed for channel ${channel.title} (${channel.channelId}):`, error)
        // Revert status to active if it was syncing
        const currentChannel = await db.channel.findUnique({ where: { id: channel.id } })
        if (currentChannel?.status === ChannelStatus.syncing) {
          await db.channel.update({
            where: { id: channel.id },
            data: { status: ChannelStatus.active },
          })
        }
      }
    }

    const endTime = process.hrtime.bigint()
    const durationMs = Number(endTime - startTime) / 1_000_000 // Convert nanoseconds to milliseconds

    let message = `Completed. Success: ${successCount}, Failed: ${failureCount}.`
    if (failureCount > 0) {
      const errorDetails = JSON.stringify(failedChannels)
      message += ` Errors: ${errorDetails}`
    }

    // Add API call and retry stats to the message
    const apiStats = Array.from(totalApiCalls.entries())
      .map(([endpoint, count]) => `${endpoint}: ${count}`)
      .join(", ")
    const retryStats = Array.from(totalRetries.entries())
      .map(([endpoint, count]) => `${endpoint} retries: ${count}`)
      .join(", ")
    if (apiStats) message += ` API Calls: {${apiStats}}`
    if (retryStats) message += ` Retries: {${retryStats}}`

    if (message.length > MAX_TASK_MESSAGE_LENGTH) {
      message = message.substring(0, MAX_TASK_MESSAGE_LENGTH - 3) + "..."
    }

    await db.taskLog.update({
      where: { id: taskLog.id },
      data: {
        success: failureCount === 0,
        message: message,
        finishedAt: new Date(),
        durationMs: Math.round(durationMs),
      },
    })
    logger.info("TaskRunner", `${taskType} task finished. ${message}`)
  } catch (error: any) {
    const endTime = process.hrtime.bigint()
    const durationMs = Number(endTime - startTime) / 1_000_000
    logger.error("TaskRunner", `Critical error during ${taskType} task execution:`, error)

    let errorMessage = `Critical failure: ${error.message || "Unknown error"}`
    if (errorMessage.length > MAX_TASK_MESSAGE_LENGTH) {
      errorMessage = errorMessage.substring(0, MAX_TASK_MESSAGE_LENGTH - 3) + "..."
    }

    await db.taskLog.update({
      where: { id: taskLog.id },
      data: {
        success: false,
        message: errorMessage,
        finishedAt: new Date(),
        durationMs: Math.round(durationMs),
      },
    })
  }
}

// Wrapper functions for cron endpoints
export async function runRefreshVideoStatsTask() {
  const { run } = await import("./tasks/video-sync")
  await run()
}

export async function runDailyAnalyticsTask() {
  const { run } = await import("./tasks/channel-daily")
  await run()
}

export async function runRefreshChannelMetricsTask() {
  const { run } = await import("./tasks/channel-hourly")
  await run()
}
