/**
 * React Query Hooks for Resumes
 * 
 * Provides hooks for fetching, uploading, customizing resumes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/logger'

interface Resume {
  _id: string
  originalFileName: string
  extractedText: string
  userName?: string
  contactEmail?: string
  createdAt: string
  updatedAt: string
}

// Query Keys
export const resumeKeys = {
  all: ['resumes'] as const,
  lists: () => [...resumeKeys.all, 'list'] as const,
  list: (filters?: any) => [...resumeKeys.lists(), filters] as const,
  details: () => [...resumeKeys.all, 'detail'] as const,
  detail: (id: string) => [...resumeKeys.details(), id] as const,
  latest: () => [...resumeKeys.all, 'latest'] as const,
}

/**
 * Fetch all resumes for the current user
 */
export function useResumes(options?: { limit?: number; skip?: number }) {
  return useQuery({
    queryKey: resumeKeys.list(options),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.skip) params.append('skip', options.skip.toString())
      
      const response = await fetch(`/api/resume/list?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch resumes')
      }
      return response.json() as Promise<Resume[]>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch a single resume by ID
 */
export function useResume(id: string) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/resume/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch resume')
      }
      return response.json() as Promise<Resume>
    },
    enabled: !!id,
  })
}

/**
 * Fetch the latest resume
 */
export function useLatestResume() {
  return useQuery({
    queryKey: resumeKeys.latest(),
    queryFn: async () => {
      const response = await fetch('/api/resume/latest')
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch latest resume')
      }
      return response.json() as Promise<Resume | null>
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Upload a new resume
 */
export function useUploadResume() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (file: File) => {
      logger.info('Uploading resume', { fileName: file.name })
      
      const formData = new FormData()
      formData.append('resume', file)
      
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload resume')
      }
      
      return response.json() as Promise<Resume>
    },
    onSuccess: (newResume) => {
      // Invalidate and refetch resumes
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: resumeKeys.latest() })
      
      // Add to cache
      queryClient.setQueryData(resumeKeys.detail(newResume._id), newResume)
      
      logger.info('Resume uploaded successfully', { id: newResume._id })
    },
    onError: (error: Error) => {
      logger.error('Failed to upload resume', { error: error.message })
    },
  })
}

/**
 * Customize resume for a job
 */
export function useCustomizeResume() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      resumeId,
      jobDescription,
      jobTitle,
      companyName,
    }: {
      resumeId: string
      jobDescription: string
      jobTitle: string
      companyName: string
    }) => {
      logger.info('Customizing resume', { resumeId, jobTitle })
      
      const response = await fetch('/api/resume/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          jobDescription,
          jobTitle,
          companyName,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to customize resume')
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate resume to refetch with new customized version
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(variables.resumeId),
      })
      
      logger.info('Resume customized successfully')
    },
    onError: (error: Error) => {
      logger.error('Failed to customize resume', { error: error.message })
    },
  })
}

/**
 * Delete a resume
 */
export function useDeleteResume() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/resume/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }
      
      return response.json()
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: resumeKeys.detail(id) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: resumeKeys.latest() })
      
      logger.info('Resume deleted successfully', { id })
    },
  })
}

