import { redis } from "./redis"
import { logger } from "./logger"

const LOCK_PREFIX = "task_lock:"
const DEFAULT_LOCK_TTL_SECONDS = 60 * 30 // Default lock TTL: 30 minutes

/**
 * Acquires a Redis lock for a given task.
 * @param taskName Unique name for the task (e.g., "video_sync", "channel_daily").
 * @param ttlSeconds Time-to-live for the lock in seconds.
 * @returns True if the lock was acquired, false otherwise.
 */
async function acquireLock(taskName: string, ttlSeconds: number): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${taskName}`
  try {
    // First, check if the lock exists and if it's expired
    const existingValue = await redis.get(lockKey)
    
    // SET key value NX EX seconds
    // NX: Only set the key if it does not already exist.
    // EX seconds: Set the specified expire time, in seconds.
    const result = await redis.set(lockKey, "locked", { nx: true, ex: ttlSeconds })
    if (result === "OK") {
      logger.info("Lock", `Lock acquired for task: ${taskName}`)
      return true
    }
    
    // If we couldn't acquire the lock, log more details
    if (existingValue) {
      logger.warn("Lock", `Failed to acquire lock for task: ${taskName}. Lock exists with value: ${existingValue}`)
    } else {
      logger.warn("Lock", `Failed to acquire lock for task: ${taskName}. Redis set operation returned: ${result}`)
    }
    return false
  } catch (error) {
    logger.error("Lock", `Error acquiring lock for task: ${taskName}`, error)
    return false
  }
}

/**
 * Releases a Redis lock for a given task.
 * @param taskName Unique name for the task.
 */
async function releaseLock(taskName: string): Promise<void> {
  const lockKey = `${LOCK_PREFIX}${taskName}`
  try {
    await redis.del(lockKey)
    logger.info("Lock", `Lock released for task: ${taskName}`)
  } catch (error) {
    logger.error("Lock", `Error releasing lock for task: ${taskName}`, error)
  }
}

/**
 * Runs a function with a Redis-based distributed lock.
 * Prevents multiple instances of the same task from running concurrently.
 * @param taskName A unique identifier for the task.
 * @param fn The asynchronous function to execute if the lock is acquired.
 * @param ttlSeconds Optional. The time-to-live for the lock in seconds. Defaults to 30 minutes.
 * @returns The result of the executed function, or undefined if the lock could not be acquired.
 * @throws Re-throws any error thrown by the `fn` function.
 */
export async function runWithLock<T>(
  taskName: string,
  fn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_LOCK_TTL_SECONDS,
): Promise<T | undefined> {
  const lockAcquired = await acquireLock(taskName, ttlSeconds)

  if (!lockAcquired) {
    logger.info("Lock", `Skipping task ${taskName} due to existing lock.`)
    return undefined
  }

  try {
    const result = await fn()
    return result
  } finally {
    await releaseLock(taskName)
  }
}
