/**
 * Shared Dashboard Stats Hook
 * 
 * Consolidates all dashboard data fetching into a single hook
 * Uses React Query for caching and deduplication
 */

import { useQuery } from '@tanstack/react-query'

export interface DashboardStats {
  totalApplications: number
  appliedThisWeek: number
  interviewRate: number
  averageResponseTime: number
  appliedWeekChangePct?: number
  pendingFollowUps?: number
  upcomingInterviews?: number
}

export interface DashboardData {
  stats: DashboardStats
  success: boolean
}

const DEFAULT_STATS: DashboardStats = {
  totalApplications: 0,
  appliedThisWeek: 0,
  interviewRate: 0,
  averageResponseTime: 0,
  appliedWeekChangePct: 0,
  pendingFollowUps: 0,
  upcomingInterviews: 0
}

/**
 * Fetch dashboard stats with automatic caching and deduplication
 * All dashboard components should use this hook instead of fetching directly
 */
export function useDashboardStats() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/analytics/dashboard')
        
        if (!res.ok) {
          console.warn('[DASHBOARD_STATS] API returned non-OK status:', res.status)
          return { stats: DEFAULT_STATS, success: false }
        }
        
        const data = await res.json()
        
        if (!data.success) {
          console.warn('[DASHBOARD_STATS] API returned success=false')
          return { stats: DEFAULT_STATS, success: false }
        }
        
        return {
          stats: { ...DEFAULT_STATS, ...data.stats },
          success: true
        }
      } catch (error) {
        console.error('[DASHBOARD_STATS] Fetch error:', error)
        return { stats: DEFAULT_STATS, success: false }
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1
  })
}

/**
 * Get just the stats object (convenience wrapper)
 */
export function useDashboardStatsData() {
  const { data, isLoading, error } = useDashboardStats()
  
  return {
    stats: data?.stats || DEFAULT_STATS,
    isLoading,
    error,
    success: data?.success || false
  }
}
