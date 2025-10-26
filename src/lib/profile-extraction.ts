import { PerplexityIntelligenceService } from './perplexity-intelligence'

export interface SmartProfile {
  location: string
  experience_years: number
  salary_min: number
  salary_max: number
  salary_currency: string
  preferred_roles: string[]
  industries: string[]
  work_type: 'remote' | 'hybrid' | 'onsite' | 'flexible'
  commute_max_km: number
  auto_apply_ready: boolean
  skill_confidence: number
  seniority_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive'
}

export class ProfileExtractionService {
  /**
   * PHASE 1B: Extract complete job search profile with smart defaults
   * Uses Perplexity AI to analyze resume and infer preferences
   */
  static async extractCompleteProfile(resumeText: string): Promise<SmartProfile> {
    try {
      console.log('[PROFILE_EXTRACTION] Starting analysis, resume length:', resumeText.length)
      
      const prompt = `Extract a complete job search profile from this resume. Use market intelligence and context clues to infer missing information.

RESUME TEXT:
${resumeText.slice(0, 4000)}

ANALYSIS REQUIREMENTS:

1. **Location**: Extract city and province/state from contact info, recent job locations, or address
2. **Experience Years**: Calculate total years from work history (add up all employment periods)
3. **Salary Range**: 
   - Research current market rates for this person's role + experience + location
   - Use salary data for similar positions in their region
   - Factor in seniority level and industry
   - Return in local currency (CAD for Canada, USD for USA)
4. **Preferred Roles**: Extract from 3 most recent job titles (what they've been doing)
5. **Industries**: Identify industries from work history (Tech, Finance, Healthcare, etc.)
6. **Work Type Preference**: 
   - If recent roles mention "remote" → remote
   - If mix of office/home → hybrid
   - If all office-based → onsite
   - Default to "flexible" if unclear
7. **Commute Radius**:
   - Urban location (Toronto, Vancouver, Montreal) → 30km
   - Suburban → 45km
   - Rural/small city → 60km
8. **Auto-Apply Ready**: true if 3+ years experience, false if entry-level
9. **Skill Confidence**: 
   - 90-100: Extensive experience, clear achievements, strong keywords
   - 70-89: Good experience, some achievements
   - 50-69: Basic experience, limited detail
   - Below 50: Entry-level or unclear resume
10. **Seniority Level**:
    - entry: 0-1 years, student, intern
    - junior: 1-3 years
    - mid: 3-6 years
    - senior: 6-10 years
    - lead: 10-15 years, team lead mentioned
    - executive: 15+ years, director/vp/c-level titles

Return STRICT JSON (no markdown, no explanation):
{
  "location": "City, Province/State",
  "experience_years": number,
  "salary_min": number,
  "salary_max": number,
  "salary_currency": "CAD" | "USD" | "EUR",
  "preferred_roles": ["role1", "role2", "role3"],
  "industries": ["industry1", "industry2"],
  "work_type": "remote" | "hybrid" | "onsite" | "flexible",
  "commute_max_km": 30 | 45 | 60,
  "auto_apply_ready": boolean,
  "skill_confidence": 0-100,
  "seniority_level": "entry" | "junior" | "mid" | "senior" | "lead" | "executive"
}

CRITICAL: Use REAL market salary data for their location and role. Do NOT guess or use placeholder values.`

      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt: "You extract complete job seeker profiles from resumes with accurate market-rate salary research. You have access to real-time salary data and market intelligence.",
        userPrompt: prompt,
        temperature: 0.3,
        maxTokens: 1000
      })
      
      // Parse JSON response
      try {
        const parsed = JSON.parse(result.content)
        if (
          typeof parsed === 'object' && 
          parsed !== null && 
          'location' in parsed && 
          'experience_years' in parsed &&
          'salary_min' in parsed
        ) {
          const profile = parsed as SmartProfile
        
        console.log('[PROFILE_EXTRACTION] Analysis complete:', {
          location: profile.location,
          experience: profile.experience_years,
          salary: `${profile.salary_currency} ${profile.salary_min}-${profile.salary_max}`,
          work_type: profile.work_type,
          seniority: profile.seniority_level
        })
        
        return profile
        }
      } catch (parseError) {
        console.warn('[PROFILE_EXTRACTION] JSON parse error:', parseError)
      }
      
      // If result format is unexpected, use fallback
      console.warn('[PROFILE_EXTRACTION] Unexpected result format, using fallback')
      return this.extractBasicProfile(resumeText)
      
    } catch (error) {
      console.error('[PROFILE_EXTRACTION] Error:', error)
      
      // Fallback to basic extraction if Perplexity fails
      return this.extractBasicProfile(resumeText)
    }
  }
  
  /**
   * Fallback: Basic profile extraction without AI (if Perplexity fails)
   */
  private static extractBasicProfile(resumeText: string): SmartProfile {
    console.log('[PROFILE_EXTRACTION] Using fallback basic extraction')
    
    // Try to extract location from common patterns
    const locationMatch = resumeText.match(/([A-Z][a-z]+,\s*[A-Z]{2})/g)
    const location = locationMatch?.[0] || 'Canada'
    
    // Rough experience calculation (count years mentioned)
    const yearMatches = resumeText.match(/20\d{2}/g) || []
    const years = yearMatches.length > 0 ? Math.max(...yearMatches.map(y => parseInt(y))) - Math.min(...yearMatches.map(y => parseInt(y))) : 2
    const experience_years = Math.min(years, 30) // Cap at 30 years
    
    // Infer work type from keywords
    const hasRemote = /remote|work from home|wfh/i.test(resumeText)
    const hasHybrid = /hybrid|flexible/i.test(resumeText)
    const work_type: SmartProfile['work_type'] = hasRemote ? 'remote' : hasHybrid ? 'hybrid' : 'flexible'
    
    // Determine seniority
    let seniority_level: SmartProfile['seniority_level'] = 'mid'
    if (experience_years < 2) seniority_level = 'entry'
    else if (experience_years < 4) seniority_level = 'junior'
    else if (experience_years < 7) seniority_level = 'mid'
    else if (experience_years < 11) seniority_level = 'senior'
    else if (experience_years < 16) seniority_level = 'lead'
    else seniority_level = 'executive'
    
    // Rough salary estimation based on experience
    const baseCanadaSalary = 45000 + (experience_years * 5000)
    const salary_min = Math.max(40000, baseCanadaSalary - 10000)
    const salary_max = baseCanadaSalary + 20000
    
    return {
      location,
      experience_years,
      salary_min,
      salary_max,
      salary_currency: 'CAD',
      preferred_roles: ['Professional'], // Generic fallback
      industries: ['General'],
      work_type,
      commute_max_km: 45, // Default suburban
      auto_apply_ready: experience_years >= 3,
      skill_confidence: 60, // Medium confidence for fallback
      seniority_level
    }
  }
  
  /**
   * Cache profile to localStorage for reuse
   */
  static cacheProfile(profile: SmartProfile): void {
    try {
      localStorage.setItem('cf:profile', JSON.stringify(profile))
      console.log('[PROFILE_EXTRACTION] Cached profile:', profile.location, profile.seniority_level)
    } catch (error) {
      console.warn('[PROFILE_EXTRACTION] Failed to cache profile:', error)
    }
  }
  
  /**
   * Load cached profile from localStorage
   */
  static loadCachedProfile(): SmartProfile | null {
    try {
      const cached = localStorage.getItem('cf:profile')
      if (cached) {
        const profile = JSON.parse(cached) as SmartProfile
        console.log('[PROFILE_EXTRACTION] Loaded cached profile:', profile.location)
        return profile
      }
    } catch (error) {
      console.warn('[PROFILE_EXTRACTION] Failed to load cached profile:', error)
    }
    return null
  }
}

