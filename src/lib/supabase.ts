/**
 * Supabase Client Configuration
 * Replaces MongoDB for job caching
 */

import { createClient } from '@supabase/supabase-js'
import type { Job, Company, SalaryData, DownloadHistory, JobSearchParams, JobSearchResult } from '@/types/supabase'

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      // During build, return a dummy client that won't be used
      if (typeof window === 'undefined' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('[Supabase] Environment variables not set during build - using dummy client')
        return createClient('https://dummy.supabase.co', 'dummy-key')
      }
      throw new Error('Missing Supabase environment variables')
    }
    
    _supabase = createClient(url, key)
  }
  return _supabase
}

function getSupabaseAdminClient() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      // During build, return a dummy client that won't be used
      if (typeof window === 'undefined' && !key) {
        console.warn('[Supabase] Service key not set during build - using dummy client')
        return createClient('https://dummy.supabase.co', 'dummy-key')
      }
      throw new Error('Missing Supabase environment variables')
    }
    
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

// Public client (for client-side operations)
export const supabase = getSupabaseClient()

// Service client (for server-side operations with elevated permissions)
export const supabaseAdmin = getSupabaseAdminClient()

/**
 * Insert jobs in bulk (upsert to handle duplicates)
 */
export async function bulkInsertJobs(jobs: Partial<Job>[]): Promise<{ success: number; errors: number }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .upsert(jobs, {
        onConflict: 'external_id,source',
        ignoreDuplicates: false
      })
      .select('id')

    if (error) {
      console.error('[Supabase] Bulk insert error:', error)
      return { success: 0, errors: jobs.length }
    }

    return { success: data?.length || 0, errors: 0 }
  } catch (error) {
    console.error('[Supabase] Bulk insert failed:', error)
    return { success: 0, errors: jobs.length }
  }
}

/**
 * Search jobs with full-text search
 */
export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  try {
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .gt('expires_at', new Date().toISOString())

    // Search on title, company, description using ILIKE (since fts column doesn't exist)
    if (params.query) {
      const searchTerms = params.query.split(' ').filter(term => term.length > 0)
      
      // Search across title, company, and description
      if (searchTerms.length > 0) {
        // Use OR conditions to search multiple fields
        const orConditions = searchTerms.map(term => {
          const escapedTerm = term.replace(/[%_]/g, '\\$&')
          return `title.ilike.%${escapedTerm}%,company.ilike.%${escapedTerm}%,description.ilike.%${escapedTerm}%`
        }).join(',')
        
        query = query.or(orConditions)
      }
    }

    // Location filter
    if (params.location) {
      query = query.ilike('location', `%${params.location}%`)
    }

    // Source filter
    if (params.source && params.source.length > 0) {
      query = query.in('source', params.source)
    }

    // Job type filter
    if (params.job_type) {
      query = query.eq('job_type', params.job_type)
    }

    // Remote type filter
    if (params.remote_type) {
      query = query.eq('remote_type', params.remote_type)
    }

    // Salary filter
    if (params.salary_min) {
      query = query.gte('salary_min', params.salary_min)
    }

    // Pagination
    const limit = params.limit || 50
    const offset = params.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Order by relevance (newest first)
    query = query.order('scraped_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('[Supabase] Search error:', error)
      return { jobs: [], total: 0, page: 1, limit }
    }

    return {
      jobs: data as Job[],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit
    }
  } catch (error) {
    console.error('[Supabase] Search failed:', error)
    return { jobs: [], total: 0, page: 1, limit: params.limit || 50 }
  }
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<{
  total: number
  active: number
  expired: number
  bySource: Record<string, number>
}> {
  try {
    // Total jobs
    const { count: total } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    // Active jobs
    const { count: active } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString())

    // Jobs by source
    const { data: sourceData } = await supabase
      .from('jobs')
      .select('source')
      .gt('expires_at', new Date().toISOString())

    const bySource: Record<string, number> = {}
    sourceData?.forEach(job => {
      bySource[job.source] = (bySource[job.source] || 0) + 1
    })

    return {
      total: total || 0,
      active: active || 0,
      expired: (total || 0) - (active || 0),
      bySource
    }
  } catch (error) {
    console.error('[Supabase] Stats failed:', error)
    return { total: 0, active: 0, expired: 0, bySource: {} }
  }
}

/**
 * Log download history
 */
export async function logDownloadHistory(history: Partial<DownloadHistory>): Promise<void> {
  try {
    await supabaseAdmin
      .from('download_history')
      .insert(history)
  } catch (error) {
    console.error('[Supabase] Failed to log download history:', error)
  }
}

/**
 * Get or create company
 */
export async function upsertCompany(company: Partial<Company>): Promise<Company | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .upsert(company, {
        onConflict: 'normalized_name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Company upsert error:', error)
      return null
    }

    return data as Company
  } catch (error) {
    console.error('[Supabase] Company upsert failed:', error)
    return null
  }
}

/**
 * Delete expired jobs (called by cron)
 */
export async function deleteExpiredJobs(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('[Supabase] Delete expired jobs error:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('[Supabase] Delete expired jobs failed:', error)
    return 0
  }
}
