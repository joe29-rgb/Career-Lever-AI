/**
 * MUTEX LOCK UTILITY
 * 
 * Prevents race conditions in concurrent operations:
 * - Resume variant generation
 * - Application status updates
 * - API request throttling
 * - Database concurrent writes
 */

export class MutexLock {
  private locks = new Map<string, Promise<void>>()
  private timeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Acquire a lock for a specific key
   * Waits if lock is already held
   */
  async acquire(key: string, timeoutMs: number = 30000): Promise<() => void> {
    // Wait for existing lock to release
    while (this.locks.has(key)) {
      await this.locks.get(key)
    }

    // Create new lock
    let releaseFn: () => void
    const lockPromise = new Promise<void>((resolve) => {
      releaseFn = () => {
        this.locks.delete(key)
        const timeout = this.timeouts.get(key)
        if (timeout) {
          clearTimeout(timeout)
          this.timeouts.delete(key)
        }
        resolve()
      }
    })

    this.locks.set(key, lockPromise)

    // Auto-release after timeout to prevent deadlocks
    const timeout = setTimeout(() => {
      console.warn(`[MUTEX] Lock timeout for key: ${key}`)
      releaseFn!()
    }, timeoutMs)
    
    this.timeouts.set(key, timeout)

    return releaseFn!
  }

  /**
   * Execute function with lock protection
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const release = await this.acquire(key, timeoutMs)
    try {
      return await fn()
    } finally {
      release()
    }
  }

  /**
   * Check if key is locked
   */
  isLocked(key: string): boolean {
    return this.locks.has(key)
  }

  /**
   * Force release a lock (use with caution)
   */
  forceRelease(key: string): void {
    const timeout = this.timeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(key)
    }
    this.locks.delete(key)
  }

  /**
   * Clear all locks (use for cleanup)
   */
  clearAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()
    this.locks.clear()
  }
}

// Singleton instance
let mutexInstance: MutexLock | null = null

export function getMutex(): MutexLock {
  if (!mutexInstance) {
    mutexInstance = new MutexLock()
  }
  return mutexInstance
}

export default getMutex
