/**
 * React Query Configuration
 * 
 * Centralized configuration for TanStack Query (React Query)
 * Handles caching, refetching, and error handling for server state
 */

import { QueryClient } from '@tanstack/react-query'
import { logger } from './logger'

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (good for user returning to tab)
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch on network reconnect
      refetchOnReconnect: true,
      
      // Error handling
      throwOnError: false,
      
      // Structural sharing for performance
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
      
      // Error handling
      throwOnError: false,
      
      // Log mutation errors
      onError: (error: any) => {
        logger.error('Mutation failed', {
          error: error?.message || 'Unknown mutation error',
          stack: error?.stack
        })
      },
    },
  },
}

// Create a single query client instance
export const createQueryClient = () => new QueryClient(queryClientConfig)

// Export singleton for app-wide use
export const queryClient = createQueryClient()

