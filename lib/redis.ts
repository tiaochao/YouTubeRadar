import { Redis as UpstashRedis } from "@upstash/redis"

// Simple in-memory store fallback
class MemoryStore {
  private store = new Map<string, { value: string; expiresAt?: number }>()

  async set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<string | null> {
    if (options?.nx && this.store.has(key)) {
      const existingItem = this.store.get(key)
      if (existingItem && existingItem.expiresAt && Date.now() > existingItem.expiresAt) {
        this.store.delete(key)
      } else {
        return null
      }
    }
    
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    
    if (expiresAt) {
      setTimeout(() => {
        const item = this.store.get(key)
        if (item && item.expiresAt && Date.now() > item.expiresAt) {
          this.store.delete(key)
        }
      }, options.ex * 1000)
    }
    
    return "OK"
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    
    return item.value
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
}

const memoryStore = new MemoryStore()

// IORedis adapter for compatibility with upstash/redis interface
class IORedisAdapter {
  private client: any
  
  constructor() {
    const IORedis = require('ioredis')
    this.client = new IORedis(process.env.KV_REST_API_URL)
  }

  async set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<string | null> {
    if (options?.nx && options?.ex) {
      // SET key value NX EX seconds
      const result = await this.client.set(key, value, 'NX', 'EX', options.ex)
      return result
    } else if (options?.nx) {
      // SET key value NX
      const result = await this.client.set(key, value, 'NX')
      return result
    } else if (options?.ex) {
      // SET key value EX seconds
      await this.client.setex(key, options.ex, value)
      return "OK"
    } else {
      // SET key value
      await this.client.set(key, value)
      return "OK"
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key)
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }
}

let redis: UpstashRedis | IORedisAdapter | typeof memoryStore

// This is needed because in development, Next.js hot-loads modules,
// which can cause multiple instances of Redis to be created.
// This global variable ensures only one instance is used.
if (process.env.KV_REST_API_URL) {
  if (process.env.KV_REST_API_URL.startsWith('redis://') || process.env.KV_REST_API_URL.startsWith('rediss://')) {
    // Local Redis using ioredis with adapter
    if (process.env.NODE_ENV === "production") {
      redis = new IORedisAdapter()
    } else {
      if (!(global as any).ioredisGlobal) {
        ;(global as any).ioredisGlobal = new IORedisAdapter()
      }
      redis = (global as any).ioredisGlobal
    }
    console.log("Using local Redis (ioredis) for caching")
  } else if (process.env.KV_REST_API_TOKEN) {
    // Upstash Redis
    if (process.env.NODE_ENV === "production") {
      redis = new UpstashRedis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    } else {
      if (!(global as any).redisGlobal) {
        ;(global as any).redisGlobal = new UpstashRedis({
          url: process.env.KV_REST_API_URL,
          token: process.env.KV_REST_API_TOKEN,
        })
      }
      redis = (global as any).redisGlobal
    }
    console.log("Using Upstash Redis for caching")
  } else {
    console.warn("Redis URL provided but no token - using in-memory store")
    redis = memoryStore
  }
} else {
  console.warn("Redis not configured - using in-memory store for development")
  redis = memoryStore
}

export { redis }
