/**
 * PRODUCTION LOGGER
 * 
 * Hides debug/log output in production
 * CRITICAL FIX #1 from UI Redesign Plan
 */

export function initProductionLogger() {
  if (process.env.NODE_ENV === 'production') {
    // Disable console methods in production
    console.log = () => {}
    console.debug = () => {}
    console.info = () => {}
    
    // Keep errors and warnings for monitoring
    const originalError = console.error
    const originalWarn = console.warn
    
    console.error = (...args: any[]) => {
      // Send to error tracking service (Sentry, etc.)
      originalError.apply(console, args)
    }
    
    console.warn = (...args: any[]) => {
      // Send to monitoring service
      originalWarn.apply(console, args)
    }
  }
}

// Development-only logger
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args)
  }
}

export const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('[DEV ERROR]', ...args)
  }
}
