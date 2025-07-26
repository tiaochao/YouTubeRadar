import { run as runVideoSyncTask } from "../lib/tasks/videoSync" // Updated import path
import { logger } from "../lib/logger"

async function manualVideoSync() {
  logger.info("ManualFetch", "Starting manual video sync for all active channels...")
  try {
    await runVideoSyncTask()
    logger.info("ManualFetch", "Manual video sync completed successfully.")
  } catch (error) {
    logger.error("ManualFetch", "Manual video sync failed.", error)
    process.exit(1) // Exit with error code
  } finally {
    process.exit(0) // Exit cleanly
  }
}

manualVideoSync()
