import type { TaskType } from "@prisma/client"
import { db } from "./db"

type LogLevel = "info" | "warn" | "error"

interface LogOptions {
  taskType?: TaskType
  channelId?: string
  message?: string
  error?: Error | unknown
  durationMs?: number
  success?: boolean
}

const MAX_MESSAGE_LENGTH = 1000 // Define a max length for database messages

export const logger = {
  /**
   * Logs a message to the console with structured JSON output.
   * @param level The log level (info, warn, error).
   * @param context The context or module where the log originated (e.g., "OAuth", "VideoSync").
   * @param message The main log message.
   * @param meta Optional metadata object to include in the log.
   */
  log: (level: LogLevel, context: string, message: string, meta?: Record<string, any>) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context,
      message,
      ...meta, // Spread additional metadata
    }
    console.log(JSON.stringify(logEntry))
  },

  info: (context: string, message: string, meta?: Record<string, any>) => {
    logger.log("info", context, message, meta)
  },

  warn: (context: string, message: string, meta?: Record<string, any>) => {
    logger.log("warn", context, message, meta)
  },

  error: (context: string, message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    logger.log("error", context, message, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
    })
  },

  /**
   * Logs task-specific events to the database.
   * @param options Options for the task log entry.
   */
  task: async (options: LogOptions) => {
    const { taskType, message, success, durationMs, error } = options
    if (!taskType) {
      logger.error("TaskLogger", "TaskType is required for database logging.", new Error("Missing TaskType"))
      return
    }

    let finalMessage = message || (error instanceof Error ? error.message : String(error || "No message provided."))
    if (finalMessage.length > MAX_MESSAGE_LENGTH) {
      finalMessage = finalMessage.substring(0, MAX_MESSAGE_LENGTH - 3) + "..."
    }

    try {
      await db.taskLog.create({
        data: {
          taskType,
          message: finalMessage,
          success: success ?? false, // Default to false if not explicitly set
          durationMs: durationMs,
          startedAt: new Date(), // This will be updated if it's a final log
          finishedAt: new Date(),
        },
      })
    } catch (dbError) {
      logger.error("TaskLogger", "Failed to write task log to database.", dbError, options)
    }
  },
}
