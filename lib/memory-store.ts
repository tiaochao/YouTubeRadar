// Simple in-memory store for development when Redis is not available
class MemoryStore {
  private store = new Map<string, { value: string; expiresAt?: number }>()

  async set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<string | null> {
    // If nx is true, only set if key doesn't exist
    if (options?.nx && this.store.has(key)) {
      const existingItem = this.store.get(key)
      // Check if the existing item has expired
      if (existingItem && existingItem.expiresAt && Date.now() > existingItem.expiresAt) {
        this.store.delete(key)
      } else {
        return null // Key already exists, return null to indicate failure
      }
    }
    
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    
    // Auto cleanup expired items
    if (expiresAt) {
      setTimeout(() => {
        const item = this.store.get(key)
        if (item && item.expiresAt && Date.now() > item.expiresAt) {
          this.store.delete(key)
        }
      }, options.ex * 1000)
    }
    
    return "OK" // Return "OK" to match Redis behavior
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    
    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    
    return item.value
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  // Add a clear method for development purposes
  clear(): void {
    this.store.clear()
  }
}

// Global instance
let memoryStore: MemoryStore

if (typeof global !== 'undefined') {
  if (!(global as any).memoryStore) {
    (global as any).memoryStore = new MemoryStore()
  }
  memoryStore = (global as any).memoryStore
} else {
  memoryStore = new MemoryStore()
}

export { memoryStore }