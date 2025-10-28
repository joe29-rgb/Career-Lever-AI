/**
 * Smart Job Source Selection
 * 
 * Determines which job APIs to query based on user profile and search preferences
 * Optimizes for relevance and cost
 */

import { JOB_SOURCES } from './rapidapi-client'

export interface UserProfile {
  skills?: {
    weighted?: {
      primarySkills: Array<{ skill: string; weight: number; category: string }>
      secondarySkills: Array<{ skill: string; weight: number; category: string }>
    }
  }
  location?: {
    city?: string
    province?: string
  }
  careerPreferences?: {
    targetRoles?: string[]
    targetIndustries?: string[]
    targetCompanies?: string[]
    workType?: string[]
    remote?: boolean
  }
}

export interface SearchPreferences {
  keywords?: string[]
  location?: string
  remote?: boolean
  workType?: string[]
  jobType?: string[]
  includeLinkedIn?: boolean
  includeFreelance?: boolean
  includeStartups?: boolean
  includeCompanyReviews?: boolean
  companySize?: string[]
  maxSources?: number
}

/**
 * Select optimal job sources based on user profile and preferences
 */
export function selectJobSources(
  userProfile?: UserProfile,
  searchPreferences?: SearchPreferences
): string[] {
  const sources: string[] = []
  
  // TIER 1: Always query core sources (best coverage)
  sources.push('active-jobs-db', 'jsearch', 'indeed')
  
  console.log('[SOURCE_SELECTOR] Tier 1 (Core): active-jobs-db, jsearch, indeed')
  
  // TIER 2: Conditional based on preferences
  
  // Remote work preference
  if (searchPreferences?.remote || 
      userProfile?.careerPreferences?.remote ||
      userProfile?.careerPreferences?.workType?.includes('remote')) {
    sources.push('remote-jobs')
    console.log('[SOURCE_SELECTOR] Adding remote-jobs (user prefers remote)')
  }
  
  // Freelance/contract work
  if (searchPreferences?.workType?.includes('freelance') || 
      searchPreferences?.workType?.includes('contract') ||
      searchPreferences?.includeFreelance) {
    sources.push('upwork', 'freelancer')
    console.log('[SOURCE_SELECTOR] Adding upwork, freelancer (freelance/contract work)')
  }
  
  // LinkedIn preference (high-quality matches, unless explicitly disabled)
  if (searchPreferences?.includeLinkedIn !== false) {
    sources.push('linkedin')
    console.log('[SOURCE_SELECTOR] Adding linkedin (high-quality matches)')
  }
  
  // TIER 3: Specialized based on user profile
  
  // Startup preference
  if (userProfile?.careerPreferences?.targetCompanies?.some(c => 
        c.toLowerCase().includes('startup') || c.toLowerCase().includes('early-stage')
      ) ||
      searchPreferences?.companySize?.includes('startup') ||
      searchPreferences?.includeStartups) {
    sources.push('startup-jobs')
    console.log('[SOURCE_SELECTOR] Adding startup-jobs (user targets startups)')
  }
  
  // Limit sources if specified
  if (searchPreferences?.maxSources && sources.length > searchPreferences.maxSources) {
    const limited = sources.slice(0, searchPreferences.maxSources)
    console.log(`[SOURCE_SELECTOR] Limiting to ${searchPreferences.maxSources} sources:`, limited)
    return limited
  }
  
  // Remove disabled sources
  const enabledSources = sources.filter(id => JOB_SOURCES[id]?.enabled)
  
  console.log(`[SOURCE_SELECTOR] Selected ${enabledSources.length} sources:`, enabledSources)
  
  return enabledSources
}

/**
 * Get estimated cost for querying selected sources
 */
export function estimateQueryCost(sourceIds: string[]): number {
  return sourceIds.reduce((total, id) => {
    const source = JOB_SOURCES[id]
    return total + (source?.cost || 0)
  }, 0)
}

/**
 * Get estimated job count for selected sources
 */
export function estimateJobCount(sourceIds: string[]): number {
  return sourceIds.reduce((total, id) => {
    const source = JOB_SOURCES[id]
    return total + (source?.maxResults || 0)
  }, 0)
}

/**
 * Recommend sources based on job type
 */
export function recommendSourcesForJobType(jobType: string): string[] {
  const recommendations: Record<string, string[]> = {
    'remote': ['remote-jobs', 'linkedin', 'active-jobs-db', 'jsearch'],
    'freelance': ['upwork', 'freelancer', 'remote-jobs'],
    'contract': ['upwork', 'freelancer', 'active-jobs-db'],
    'full-time': ['active-jobs-db', 'jsearch', 'indeed', 'linkedin'],
    'part-time': ['indeed', 'jsearch', 'active-jobs-db'],
    'startup': ['startup-jobs', 'linkedin', 'active-jobs-db'],
    'internship': ['active-jobs-db', 'linkedin', 'indeed']
  }
  
  return recommendations[jobType.toLowerCase()] || ['active-jobs-db', 'jsearch', 'indeed']
}
