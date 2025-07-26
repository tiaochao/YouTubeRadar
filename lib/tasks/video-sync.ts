import { runTask } from "../tasks"
import { TaskType } from "@prisma/client"
import { runWithLock } from "../lock"
import { logger } from "../logger"

const TASK_NAME = "video_sync"
const LOCK_TTL_SECONDS = 60 * 60 // 1 hour lock TTL for video sync

export async function run() {
  logger.info(TASK_NAME, `Attempting to run ${TASK_NAME} task.`)
  const result = await runWithLock(
    TASK_NAME,
    async () => {
      // Initialize API call and retry maps for this task run
      const apiCalls = new Map<string, number>()
      const retries = new Map<string, number>()
      // TODO: Implement video sync using public API
      logger.warn(TASK_NAME, "Video sync functionality temporarily disabled")
      await runTask(TaskType.VIDEO_SYNC, async () => ({ apiCalls, retries }))
    },
    LOCK_TTL_SECONDS,
  )

  if (result === undefined) {
    logger.warn(TASK_NAME, `Task ${TASK_NAME} skipped due to existing lock.`)
  }
}
