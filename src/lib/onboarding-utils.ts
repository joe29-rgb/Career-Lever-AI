export type CurrentSituation = 'actively_searching' | 'open_to_offers' | 'employed_not_looking' | 'student' | 'career_change'
export type WorkPreference = 'remote' | 'onsite' | 'hybrid'
export type Timeline = 'asap' | '1-3_months' | '3-6_months' | 'flexible'
export type Urgency = 'high' | 'medium' | 'low'

export interface QuizAnswers {
  currentSituation: CurrentSituation
  yearsOfExperience: number
  targetRole?: string
  careerInterests?: string[] // Multi-select career areas
  workPreferences: WorkPreference[]
  preferredLocation: string
  timeline?: Timeline
  hasResume?: boolean // Whether user has a resume ready
}

export interface UserProfile extends QuizAnswers {
  onboardingComplete: boolean
  urgency: Urgency
  completedAt: Date
}

/**
 * Calculate urgency based on current situation and timeline
 */
export function calculateUrgency(
  currentSituation: CurrentSituation,
  timeline?: Timeline
): Urgency {
  // High urgency situations
  if (currentSituation === 'actively_searching' || currentSituation === 'career_change') {
    if (timeline === 'asap') return 'high'
    if (timeline === '1-3_months') return 'high'
    return 'medium'
  }

  // Medium urgency
  if (currentSituation === 'open_to_offers' || currentSituation === 'student') {
    return 'medium'
  }

  // Low urgency
  return 'low'
}

/**
 * Validate quiz answers
 */
export function validateQuizAnswers(answers: Partial<QuizAnswers>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Current situation
  if (!answers.currentSituation) {
    errors.push('Current situation is required')
  } else if (!['actively_searching', 'open_to_offers', 'employed_not_looking', 'student', 'career_change'].includes(answers.currentSituation)) {
    errors.push('Invalid current situation')
  }

  // Years of experience
  if (answers.yearsOfExperience === undefined || answers.yearsOfExperience === null) {
    errors.push('Years of experience is required')
  } else if (answers.yearsOfExperience < 0 || answers.yearsOfExperience > 30) {
    errors.push('Years of experience must be between 0 and 30')
  }

  // Target role
  if (!answers.targetRole || answers.targetRole.trim().length < 2) {
    errors.push('Target role is required (minimum 2 characters)')
  }

  // Work preferences
  if (!answers.workPreferences || answers.workPreferences.length === 0) {
    errors.push('At least one work preference is required')
  } else {
    const validPreferences = ['remote', 'onsite', 'hybrid']
    const invalidPrefs = answers.workPreferences.filter(p => !validPreferences.includes(p))
    if (invalidPrefs.length > 0) {
      errors.push('Invalid work preferences')
    }
  }

  // Timeline (required for actively searching or career change)
  if (answers.currentSituation === 'actively_searching' || answers.currentSituation === 'career_change') {
    if (!answers.timeline) {
      errors.push('Timeline is required for your current situation')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Common job titles for autocomplete
 */
export const COMMON_JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Data Analyst',
  'Product Manager',
  'Project Manager',
  'Marketing Manager',
  'Digital Marketing Specialist',
  'Sales Manager',
  'Account Executive',
  'Business Development Manager',
  'Customer Success Manager',
  'UX Designer',
  'UI Designer',
  'Graphic Designer',
  'Content Writer',
  'Copywriter',
  'HR Manager',
  'Recruiter',
  'Financial Analyst',
  'Accountant',
  'Operations Manager',
  'Supply Chain Manager',
  'Quality Assurance Engineer',
  'Technical Support Specialist',
  'Customer Service Representative',
  'Administrative Assistant',
  'Executive Assistant',
  'Nurse',
  'Registered Nurse',
  'Medical Assistant',
  'Teacher',
  'Professor',
  'Research Scientist',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Civil Engineer',
  'Architect',
  'Construction Manager',
  'Real Estate Agent',
  'Lawyer',
  'Paralegal',
  'Consultant',
  'Business Analyst',
  'Systems Analyst',
  'Network Administrator',
  'Database Administrator',
  'Security Analyst',
  'Chef',
  'Restaurant Manager',
  'Retail Manager',
  'Store Manager',
  'Warehouse Manager',
  'Logistics Coordinator',
  'Finance Manager',
  'Sales Associate',
  'Marketing Director',
  'Chief Technology Officer',
  'Chief Executive Officer',
  'Vice President'
].sort()

/**
 * Get experience level label based on years
 */
export function getExperienceLevelLabel(years: number): string {
  if (years === 0) return 'Entry-level'
  if (years <= 2) return 'Junior'
  if (years <= 5) return 'Mid-level'
  if (years <= 10) return 'Senior'
  if (years <= 15) return 'Lead/Principal'
  return 'Executive'
}

/**
 * Save quiz progress to localStorage
 */
export function saveQuizProgress(answers: Partial<QuizAnswers>, currentStep: number) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('onboarding:quiz:progress', JSON.stringify({
      answers,
      currentStep,
      savedAt: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[ONBOARDING] Failed to save quiz progress:', error)
  }
}

/**
 * Load quiz progress from localStorage
 */
export function loadQuizProgress(): { answers: Partial<QuizAnswers>; currentStep: number } | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('onboarding:quiz:progress')
    if (!stored) return null
    
    const data = JSON.parse(stored)
    
    // Check if saved within last 24 hours
    const savedAt = new Date(data.savedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      localStorage.removeItem('onboarding:quiz:progress')
      return null
    }
    
    return {
      answers: data.answers || {},
      currentStep: data.currentStep || 1
    }
  } catch (error) {
    console.error('[ONBOARDING] Failed to load quiz progress:', error)
    return null
  }
}

/**
 * Clear quiz progress from localStorage
 */
export function clearQuizProgress() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('onboarding:quiz:progress')
  } catch (error) {
    console.error('[ONBOARDING] Failed to clear quiz progress:', error)
  }
}
