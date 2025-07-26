import { runTask, clearDailyStatsCache } from "../tasks"
import { TaskType } from "@prisma/client"
import { runWithLock } from "../lock"
import { logger } from "../logger"
import { subDays } from "date-fns"

const TASK_NAME = "channel_daily"
const LOCK_TTL_SECONDS = 60 * 60 * 2 // 2 hour lock TTL for daily analytics

export async function run() {
  logger.info(TASK_NAME, `Attempting to run ${TASK_NAME} task.`)
  const result = await runWithLock(
    TASK_NAME,
    async () => {
      // Fetch data for the previous day
      const yesterday = subDays(new Date(), 1)
      const apiCalls = new Map<string, number>()
      const retries = new Map<string, number>()
      await runTask(TaskType.CHANNEL_DAILY, async (channelId: string) => {
        try {
          const { syncChannelStats } = await import("../youtube-channel-stats")
          await syncChannelStats(channelId)
          apiCalls.set("youtube.channels", (apiCalls.get("youtube.channels") || 0) + 1)
        } catch (error: any) {
          logger.error(TASK_NAME, `Failed to sync daily stats for channel ${channelId}:`, error)
          retries.set("youtube.channels", (retries.get("youtube.channels") || 0) + 1)
          throw error
        }
        return { apiCalls, retries }
      })
    },
    LOCK_TTL_SECONDS,
  )

  if (result === undefined) {
    logger.warn(TASK_NAME, `Task ${TASK_NAME} skipped due to existing lock.`)
  }
}
