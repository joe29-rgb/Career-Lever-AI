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
  
  // TIER 1: Fast Primary Sources (Always Use - <2s response)
  sources.push('google-jobs')      // 520ms - FASTEST! Show results first
  sources.push('active-jobs-db')   // 851ms - 130K+ sources, comprehensive
  sources.push('linkedin-jobs')    // 1796ms - Professional roles
  sources.push('jobs-api')         // 1892ms - LinkedIn/Bing/Xing aggregator
  
  console.log('[SOURCE_SELECTOR] Tier 1 (Fast): google-jobs, active-jobs-db, linkedin-jobs, jobs-api')
  
  // TIER 2: Medium Speed Sources (2-4s response)
  sources.push('jsearch')          // 3425ms - LinkedIn/Indeed/Glassdoor aggregator
  
  console.log('[SOURCE_SELECTOR] Tier 2 (Medium): jsearch')
  
  // TIER 3: Conditional Sources (Only When Needed)
  
  // Remote work preference
  if (searchPreferences?.remote || 
      userProfile?.careerPreferences?.remote ||
      userProfile?.careerPreferences?.workType?.includes('remote')) {
    sources.push('remote-jobs')    // 4549ms - Remote-specific
    console.log('[SOURCE_SELECTOR] Adding remote-jobs (user prefers remote)')
  }
  
  // Freelance/contract work
  if (searchPreferences?.workType?.includes('freelance') || 
      searchPreferences?.workType?.includes('contract') ||
      searchPreferences?.includeFreelance) {
    sources.push('freelancer')     // 16148ms - SLOW! Only for freelance
    console.log('[SOURCE_SELECTOR] Adding freelancer (freelance/contract work)')
  }
  
  // TIER 4: Fallback Sources (Only if primary sources fail or return <10 jobs)
  // Indeed is SLOW (8084ms) - only use as last resort
  // We'll add this dynamically in the aggregator if needed
  
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
