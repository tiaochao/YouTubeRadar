import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    // Try multiple approaches to clear the locks
    
    // Method 1: Try to use the clear method if available
    if (typeof (redis as any).clear === 'function') {
      (redis as any).clear()
      logger.info("ClearLocks", "Cleared locks using redis.clear()")
    }
    
    // Method 2: Delete specific lock keys we know about (including any variations)
    const commonLockKeys = [
      'task_lock:video_sync',
      'task_lock:channel_sync_24e88c15-a57c-4441-91d3-43a0321dee88',
      'task_lock:channel_sync_a9e84037-4d9c-46c5-9a8e-579aa418d77c', 
      'task_lock:channel_sync_0337eb30-4a11-41f2-8bca-eb0c6c65e34a',
      // Add any pattern that might exist
      'channel_sync_24e88c15-a57c-4441-91d3-43a0321dee88',
      'channel_sync_a9e84037-4d9c-46c5-9a8e-579aa418d77c',
      'channel_sync_0337eb30-4a11-41f2-8bca-eb0c6c65e34a',
    ]
    
    for (const key of commonLockKeys) {
      try {
        await redis.del(key)
        logger.info("ClearLocks", `Deleted lock key: ${key}`)
      } catch (err) {
        logger.warn("ClearLocks", `Failed to delete key ${key}:`, err)
      }
    }
    
    // Method 3: If it's the global memory store, access it directly
    if (typeof global !== 'undefined' && (global as any).memoryStore) {
      const memStore = (global as any).memoryStore
      if (typeof memStore.clear === 'function') {
        memStore.clear()
        logger.info("ClearLocks", "Cleared global memory store")
      } else if (memStore.store && memStore.store instanceof Map) {
        // Manually clear specific lock keys from the Map
        const lockKeysToRemove = Array.from(memStore.store.keys()).filter((key: unknown) => 
          typeof key === 'string' && (key.includes('task_lock:') || key.includes('channel_sync') || key.includes('video_sync'))
        ) as string[]
        for (const key of lockKeysToRemove) {
          memStore.store.delete(key)
          logger.info("ClearLocks", `Manually removed key from memory store: ${key}`)
        }
      }
    }
    
    logger.info("ClearLocks", "Lock clearing process completed")
    
    return NextResponse.json({ 
      success: true,
      message: "All sync locks cleared successfully using multiple methods" 
    })
  } catch (error: any) {
    logger.error("ClearLocks", "Failed to clear locks:", error)
    return NextResponse.json({ 
      error: "Failed to clear locks", 
      message: error.message 
    }, { status: 500 })
  }
}