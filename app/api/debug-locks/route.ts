import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const lockKeys = [
      'task_lock:video_sync',
      'task_lock:channel_sync_24e88c15-a57c-4441-91d3-43a0321dee88',
      'task_lock:channel_sync_a9e84037-4d9c-46c5-9a8e-579aa418d77c',
      'task_lock:channel_sync_0337eb30-4a11-41f2-8bca-eb0c6c65e34a',
      'channel_sync_24e88c15-a57c-4441-91d3-43a0321dee88',
      'channel_sync_a9e84037-4d9c-46c5-9a8e-579aa418d77c',
      'channel_sync_0337eb30-4a11-41f2-8bca-eb0c6c65e34a',
    ]
    
    const lockStatus: Record<string, any> = {}
    
    for (const key of lockKeys) {
      try {
        const value = await redis.get(key)
        lockStatus[key] = value ? 'LOCKED' : 'FREE'
      } catch (err) {
        lockStatus[key] = `ERROR: ${err}`
      }
    }
    
    // Also check if we can access the memory store directly
    let memoryStoreInfo = 'Not accessible'
    try {
      if (typeof global !== 'undefined' && (global as any).memoryStore) {
        const memStore = (global as any).memoryStore
        if (memStore.store && memStore.store instanceof Map) {
          const keys = Array.from(memStore.store.keys())
          memoryStoreInfo = {
            size: memStore.store.size,
            keys: keys.filter(k => k.includes('lock') || k.includes('sync'))
          }
        }
      }
    } catch (err) {
      memoryStoreInfo = `Error accessing: ${err}`
    }
    
    return NextResponse.json({
      lockStatus,
      memoryStoreInfo,
      redisType: typeof redis,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    logger.error("DebugLocks", "Failed to debug locks:", error)
    return NextResponse.json({ 
      error: "Failed to debug locks", 
      message: error.message 
    }, { status: 500 })
  }
}