import { runTask } from "../tasks"
import { TaskType } from "@prisma/client"
import { runWithLock } from "../lock"
import { logger } from "../logger"

const TASK_NAME = "channel_hourly"
const LOCK_TTL_SECONDS = 60 * 30 // 30 minutes lock TTL for hourly metrics

export async function run() {
  logger.info(TASK_NAME, `Attempting to run ${TASK_NAME} task.`)
  const result = await runWithLock(
    TASK_NAME,
    async () => {
      const apiCalls = new Map<string, number>()
      const retries = new Map<string, number>()
      // TODO: Implement channel hourly sync using public API
      logger.warn(TASK_NAME, "Channel hourly sync functionality temporarily disabled")
      await runTask(TaskType.CHANNEL_HOURLY, async () => ({ apiCalls, retries }))
    },
    LOCK_TTL_SECONDS,
  )

  if (result === undefined) {
    logger.warn(TASK_NAME, `Task ${TASK_NAME} skipped due to existing lock.`)
  }
}
