/**
 * Job Ranking by Weighted Skills
 * 
 * Ranks jobs based on user's weighted skills from Phase 1
 * Primary skills get 2x weight, secondary skills get 1x weight
 */

import type { Job } from './rapidapi-client'

export interface WeightedSkill {
  skill: string
  weight: number
  years?: number | null
  category: string
}

export interface RankingParams {
  primarySkills: WeightedSkill[]
  secondarySkills: WeightedSkill[]
  location?: string
  remote?: boolean
  salaryMin?: number
}

export interface RankedJob extends Job {
  matchScore: number
  matchedSkills: string[]
  matchPercentage: number
  matchDetails: {
    primarySkillsMatched: number
    secondarySkillsMatched: number
    locationMatch: boolean
    remoteMatch: boolean
    salaryMatch: boolean
  }
}

/**
 * Rank jobs by weighted skills
 */
export function rankJobsByWeightedSkills(
  jobs: Job[],
  params: RankingParams
): RankedJob[] {
  console.log(`[RANKER] Ranking ${jobs.length} jobs by weighted skills`)
  console.log(`[RANKER] Primary skills: ${params.primarySkills.length}, Secondary: ${params.secondarySkills.length}`)
  
  const rankedJobs = jobs.map(job => {
    const result = calculateJobMatch(job, params)
    return {
      ...job,
      ...result
    }
  })
  
  // Sort by match score (descending)
  rankedJobs.sort((a, b) => b.matchScore - a.matchScore)
  
  console.log(`[RANKER] Top match: ${rankedJobs[0]?.matchPercentage.toFixed(1)}%`)
  console.log(`[RANKER] Average match: ${(rankedJobs.reduce((sum, j) => sum + j.matchPercentage, 0) / rankedJobs.length).toFixed(1)}%`)
  
  return rankedJobs
}

/**
 * Calculate match score for a single job
 */
function calculateJobMatch(
  job: Job,
  params: RankingParams
): {
  matchScore: number
  matchedSkills: string[]
  matchPercentage: number
  matchDetails: {
    primarySkillsMatched: number
    secondarySkillsMatched: number
    locationMatch: boolean
    remoteMatch: boolean
    salaryMatch: boolean
  }
} {
  let matchScore = 0
  const matchedSkills: string[] = []
  let primarySkillsMatched = 0
  let secondarySkillsMatched = 0
  
  // Prepare job text for matching
  const jobText = `${job.title} ${job.description}`.toLowerCase()
  
  // Match primary skills (2x weight)
  for (const skill of params.primarySkills) {
    if (skillMatchesJob(skill.skill, jobText, job.skills)) {
      matchScore += skill.weight * 2
      matchedSkills.push(skill.skill)
      primarySkillsMatched++
    }
  }
  
  // Match secondary skills (1x weight)
  for (const skill of params.secondarySkills) {
    if (skillMatchesJob(skill.skill, jobText, job.skills)) {
      matchScore += skill.weight
      matchedSkills.push(skill.skill)
      secondarySkillsMatched++
    }
  }
  
  // Bonus: Location match (0.5 points)
  const locationMatch = !!(params.location && job.location 
    && job.location.toLowerCase().includes(params.location.toLowerCase()))
  
  if (locationMatch) {
    matchScore += 0.5
  }
  
  // Bonus: Remote match (0.3 points)
  const remoteMatch = !!(params.remote && job.remote)
  if (remoteMatch) {
    matchScore += 0.3
  }
  
  // Bonus: Salary match (0.2 points)
  const salaryMatch = !!(params.salaryMin && job.salary
    && checkSalaryMatch(job.salary, params.salaryMin))
  
  if (salaryMatch) {
    matchScore += 0.2
  }
  
  // Calculate match percentage
  const maxPossibleScore = (params.primarySkills.length * 2) + params.secondarySkills.length + 1.0
  const matchPercentage = Math.min(100, (matchScore / maxPossibleScore) * 100)
  
  return {
    matchScore,
    matchedSkills,
    matchPercentage,
    matchDetails: {
      primarySkillsMatched,
      secondarySkillsMatched,
      locationMatch,
      remoteMatch,
      salaryMatch
    }
  }
}

/**
 * Check if skill matches job
 */
function skillMatchesJob(skill: string, jobText: string, jobSkills?: string[]): boolean {
  const normalizedSkill = skill.toLowerCase()
  
  // Check in job skills array (if available)
  if (jobSkills && jobSkills.length > 0) {
    if (jobSkills.some(s => s.toLowerCase().includes(normalizedSkill))) {
      return true
    }
  }
  
  // Check in job text
  // Handle multi-word skills (e.g., "machine learning", "project management")
  if (normalizedSkill.includes(' ')) {
    return jobText.includes(normalizedSkill)
  }
  
  // For single-word skills, use word boundary matching
  const regex = new RegExp(`\\b${escapeRegex(normalizedSkill)}\\b`, 'i')
  return regex.test(jobText)
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Check if salary meets minimum requirement
 */
function checkSalaryMatch(salaryString: string, minSalary: number): boolean {
  // Extract numbers from salary string
  const numbers = salaryString.match(/\d+/g)
  if (!numbers || numbers.length === 0) return false
  
  // Get the highest number (usually the max salary)
  const maxSalaryInString = Math.max(...numbers.map(n => parseInt(n)))
  
  // Handle K notation (e.g., "80K")
  const multiplier = salaryString.toLowerCase().includes('k') ? 1000 : 1
  
  return (maxSalaryInString * multiplier) >= minSalary
}

/**
 * Filter jobs by minimum match percentage
 */
export function filterByMatchThreshold(
  rankedJobs: RankedJob[],
  minMatchPercentage: number = 30
): RankedJob[] {
  const filtered = rankedJobs.filter(job => job.matchPercentage >= minMatchPercentage)
  
  console.log(`[RANKER] Filtered to ${filtered.length} jobs with ≥${minMatchPercentage}% match`)
  
  return filtered
}

/**
 * Group jobs by match tier
 */
export function groupByMatchTier(rankedJobs: RankedJob[]): {
  excellent: RankedJob[]  // 80-100%
  good: RankedJob[]       // 60-79%
  fair: RankedJob[]       // 40-59%
  poor: RankedJob[]       // 0-39%
} {
  return {
    excellent: rankedJobs.filter(j => j.matchPercentage >= 80),
    good: rankedJobs.filter(j => j.matchPercentage >= 60 && j.matchPercentage < 80),
    fair: rankedJobs.filter(j => j.matchPercentage >= 40 && j.matchPercentage < 60),
    poor: rankedJobs.filter(j => j.matchPercentage < 40)
  }
}

/**
 * Get match statistics
 */
export function getMatchStatistics(rankedJobs: RankedJob[]): {
  totalJobs: number
  averageMatch: number
  medianMatch: number
  topMatch: number
  excellentMatches: number
  goodMatches: number
} {
  if (rankedJobs.length === 0) {
    return {
      totalJobs: 0,
      averageMatch: 0,
      medianMatch: 0,
      topMatch: 0,
      excellentMatches: 0,
      goodMatches: 0
    }
  }
  
  const sorted = [...rankedJobs].sort((a, b) => a.matchPercentage - b.matchPercentage)
  
  return {
    totalJobs: rankedJobs.length,
    averageMatch: rankedJobs.reduce((sum, j) => sum + j.matchPercentage, 0) / rankedJobs.length,
    medianMatch: sorted[Math.floor(sorted.length / 2)].matchPercentage,
    topMatch: rankedJobs[0].matchPercentage,
    excellentMatches: rankedJobs.filter(j => j.matchPercentage >= 80).length,
    goodMatches: rankedJobs.filter(j => j.matchPercentage >= 60).length
  }
}
