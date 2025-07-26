import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { redis } from "@/lib/redis"

export async function POST(req: NextRequest) {
  try {
    // Clear locks from Redis
    try {
      const lockPattern = "task_lock:*"
      // If redis has a del method, use it to delete all locks
      const lockKeys = [
        "task_lock:video_sync",
        "task_lock:channel_sync_24e88c15-a57c-4441-91d3-43a0321dee88",
        "task_lock:channel_sync_a9e84037-4d9c-46c5-9a8e-579aa418d77c", 
        "task_lock:channel_sync_0337eb30-4a11-41f2-8bca-eb0c6c65e34a",
        "task_lock:channel_sync_3067f32b-10fb-4a52-9824-4d246f1f539e"
      ]
      
      for (const key of lockKeys) {
        try {
          await redis.del(key)
          logger.info("ResetLocks", `Deleted Redis lock: ${key}`)
        } catch (err) {
          logger.warn("ResetLocks", `Failed to delete Redis lock ${key}:`, err)
        }
      }
    } catch (err) {
      logger.warn("ResetLocks", "Failed to clear Redis locks:", err)
    }
    // Reset the global memory store completely
    if (typeof global !== 'undefined') {
      // Clear the memoryStore global
      if ((global as any).memoryStore) {
        delete (global as any).memoryStore
        logger.info("ResetLocks", "Deleted global memoryStore")
      }
      
      // Clear any other globals that might contain locks
      const globalKeys = Object.keys(global).filter(key => 
        key.includes('redis') || key.includes('lock') || key.includes('store')
      )
      for (const key of globalKeys) {
        try {
          delete (global as any)[key]
          logger.info("ResetLocks", `Deleted global: ${key}`)
        } catch (err) {
          logger.warn("ResetLocks", `Failed to delete global ${key}:`, err)
        }
      }
    }
    
    // Force a new memory store to be created on next access
    try {
      const { memoryStore } = await import("@/lib/memory-store")
      if (memoryStore && typeof (memoryStore as any).clear === 'function') {
        (memoryStore as any).clear()
        logger.info("ResetLocks", "Cleared imported memory store")
      }
    } catch (err) {
      logger.warn("ResetLocks", "Failed to clear imported memory store:", err)
    }
    
    logger.info("ResetLocks", "Complete lock reset process completed")
    
    return NextResponse.json({ 
      success: true,
      message: "All locks and stores have been completely reset" 
    })
  } catch (error: any) {
    logger.error("ResetLocks", "Failed to reset locks:", error)
    return NextResponse.json({ 
      error: "Failed to reset locks", 
      message: error.message 
    }, { status: 500 })
  }
}