import type { NextRequest } from "next/server"
import { errorResponse, successResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { TaskType } from "@prisma/client"

// Import individual task run functions
import { run as runVideoSyncTask } from "@/lib/tasks/video-sync"
import { run as runChannelHourlyTask } from "@/lib/tasks/channel-hourly"
import { run as runChannelDailyTask } from "@/lib/tasks/channel-daily"

export async function POST(req: NextRequest) {
  // X-CRON-TOKEN validation is now handled by middleware.ts
  // const cronToken = req.headers.get("X-CRON-TOKEN")
  // const expectedToken = process.env.CRON_SECRET_TOKEN

  // if (!cronToken || cronToken !== expectedToken) {
  //   logger.warn("CronAuth", "Unauthorized cron access attempt.")
  //   return errorResponse("Unauthorized", "Invalid X-CRON-TOKEN header.", 401)
  // }

  const searchParams = req.nextUrl.searchParams
  const task = searchParams.get("task") as TaskType

  if (!task) {
    logger.warn("CronRun", "Missing task parameter in cron request.")
    return errorResponse("Bad Request", "Missing 'task' parameter.", 400)
  }

  logger.info("CronRun", `Received request to run task: ${task}`)

  try {
    switch (task) {
      case TaskType.VIDEO_SYNC:
        await runVideoSyncTask()
        break
      case TaskType.CHANNEL_HOURLY:
        await runChannelHourlyTask()
        break
      case TaskType.CHANNEL_DAILY:
        await runChannelDailyTask()
        break
      // case TaskType.PUBSUB_NEW_VIDEO: // Future implementation
      //   break
      default:
        logger.warn("CronRun", `Unknown task type: ${task}`)
        return errorResponse("Bad Request", `Unknown task type: ${task}`, 400)
    }
    return successResponse({ message: `${task} task initiated successfully.` })
  } catch (error: any) {
    logger.error("CronRun", `Error running task ${task}:`, error)
    return errorResponse(`Failed to run task ${task}.`, error.message, 500)
  }
}
