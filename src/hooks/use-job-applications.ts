/**
 * React Query Hooks for Job Applications
 * 
 * Provides hooks for fetching, creating, updating job applications
 * with automatic caching, refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/logger'

interface JobApplication {
  _id: string
  jobTitle: string
  companyName: string
  jobDescription: string
  applicationStatus: string
  appliedDate?: string
  createdAt: string
  updatedAt: string
}

interface CreateApplicationData {
  jobTitle: string
  companyName: string
  jobDescription: string
  jobUrl?: string
  notes?: string
}

// Query Keys
export const jobApplicationKeys = {
  all: ['jobApplications'] as const,
  lists: () => [...jobApplicationKeys.all, 'list'] as const,
  list: (filters?: any) => [...jobApplicationKeys.lists(), filters] as const,
  details: () => [...jobApplicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobApplicationKeys.details(), id] as const,
  stats: () => [...jobApplicationKeys.all, 'stats'] as const,
}

/**
 * Fetch all job applications for the current user
 */
export function useJobApplications(filters?: {
  status?: string[]
  limit?: number
  skip?: number
}) {
  return useQuery({
    queryKey: jobApplicationKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status.join(','))
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.skip) params.append('skip', filters.skip.toString())
      
      const response = await fetch(`/api/applications?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      return response.json() as Promise<JobApplication[]>
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch a single job application by ID
 */
export function useJobApplication(id: string) {
  return useQuery({
    queryKey: jobApplicationKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch application')
      }
      return response.json() as Promise<JobApplication>
    },
    enabled: !!id,
  })
}

/**
 * Fetch application statistics
 */
export function useApplicationStats() {
  return useQuery({
    queryKey: jobApplicationKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Create a new job application
 */
export function useCreateJobApplication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      logger.info('Creating job application', { jobTitle: data.jobTitle })
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create application')
      }
      
      return response.json() as Promise<JobApplication>
    },
    onSuccess: (newApplication) => {
      // Invalidate and refetch applications list
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.stats() })
      
      // Add to cache
      queryClient.setQueryData(
        jobApplicationKeys.detail(newApplication._id),
        newApplication
      )
      
      logger.info('Job application created successfully', {
        id: newApplication._id,
      })
    },
    onError: (error: Error) => {
      logger.error('Failed to create job application', {
        error: error.message,
      })
    },
  })
}

/**
 * Update a job application
 */
export function useUpdateJobApplication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<CreateApplicationData>
    }) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update application')
      }
      
      return response.json() as Promise<JobApplication>
    },
    onSuccess: (updatedApplication) => {
      // Update cache
      queryClient.setQueryData(
        jobApplicationKeys.detail(updatedApplication._id),
        updatedApplication
      )
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.lists() })
    },
  })
}

/**
 * Update application status
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: string
    }) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationStatus: status }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      return response.json()
    },
    // Optimistic update
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobApplicationKeys.detail(id) })
      
      // Snapshot previous value
      const previousApp = queryClient.getQueryData<JobApplication>(
        jobApplicationKeys.detail(id)
      )
      
      // Optimistically update
      if (previousApp) {
        queryClient.setQueryData<JobApplication>(
          jobApplicationKeys.detail(id),
          { ...previousApp, applicationStatus: status }
        )
      }
      
      return { previousApp }
    },
    // Rollback on error
    onError: (err, { id }, context) => {
      if (context?.previousApp) {
        queryClient.setQueryData(
          jobApplicationKeys.detail(id),
          context.previousApp
        )
      }
    },
    // Refetch after success or error
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.stats() })
    },
  })
}

/**
 * Delete a job application
 */
export function useDeleteJobApplication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete application')
      }
      
      return response.json()
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: jobApplicationKeys.detail(id) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.stats() })
    },
  })
}

