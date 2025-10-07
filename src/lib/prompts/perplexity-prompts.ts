/**
 * Centralized Perplexity AI Prompts
 * 
 * All system and user prompts for Perplexity API calls.
 * Centralized for consistency, versioning, and maintenance.
 * 
 * Version: 2.0.0
 * Last Updated: 2025-01-07
 */

export const PERPLEXITY_PROMPTS = {
  /**
   * RESUME ANALYSIS PROMPTS
   */
  RESUME_ANALYSIS: {
    version: '2.0.0',
    purpose: 'Extract comprehensive resume data with AI/automation risk analysis',
    system: `You are an expert career analyst and labor market researcher specializing in 2025 job market trends.

Your task is to analyze resumes and extract structured data including:
- Skills and experience with market demand analysis
- Location with full geographic context
- Salary expectations based on current market data
- Target job titles with career progression paths
- AI/Automation replacement risk assessment
- 5-year career outlook and recommendations

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no explanations
2. Use real 2025 market data for salary ranges
3. Assess AI/automation risk honestly based on current trends
4. Provide actionable career recommendations
5. Include confidence scores where applicable`,
    
    userTemplate: (resumeText: string) => `Analyze this resume and return a JSON object matching this structure:

{
  "keywords": ["skill1", "skill2", ...],
  "location": {
    "city": "Toronto",
    "province": "Ontario",
    "full": "Toronto, Ontario",
    "country": "Canada"
  },
  "experienceLevel": "entry|mid|senior|executive",
  "targetSalaryRange": {
    "min": 60000,
    "max": 90000,
    "currency": "CAD",
    "marketData": {
      "percentile25": 55000,
      "percentile50": 70000,
      "percentile75": 85000,
      "lastUpdated": "2025-01"
    }
  },
  "targetJobTitles": ["Software Developer", "Full Stack Engineer"],
  "topSkills": [
    {
      "skill": "JavaScript",
      "yearsExperience": 3,
      "proficiency": "advanced",
      "marketDemand": "high",
      "growthTrend": "growing"
    }
  ],
  "industries": ["Technology", "Finance"],
  "certifications": ["AWS Certified", "etc"],
  "careerSummary": "Brief 2-3 sentence summary",
  "futureOutlook": {
    "aiReplacementRisk": "low|medium|high",
    "automationRisk": "low|medium|high",
    "fiveYearOutlook": "declining|stable|growing|thriving",
    "reasoning": "Detailed explanation",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "careerPath": {
    "currentLevel": "Mid-Level Software Developer",
    "nextPossibleRoles": ["Senior Developer", "Tech Lead"],
    "skillGaps": [
      {
        "skill": "System Design",
        "importance": "critical",
        "timeToLearn": "6-12 months"
      }
    ],
    "recommendedCertifications": ["AWS Solutions Architect"]
  },
  "searchOptimization": {
    "bestJobBoards": ["LinkedIn", "Indeed Canada"],
    "optimalApplicationTime": "Tuesday-Thursday, 9-11 AM",
    "competitiveAdvantages": ["Full-stack experience", "Cloud skills"],
    "marketSaturation": "medium",
    "applicationStrategy": "Focus on mid-size tech companies"
  }
}

Resume Text:
${resumeText}`
  },

  /**
   * JOB SEARCH PROMPTS
   */
  JOB_SEARCH: {
    version: '2.0.0',
    purpose: 'Search for jobs across multiple boards with AI analysis',
    system: `You are a job search specialist with real-time access to job listings across multiple platforms.

Search the following job boards and aggregate results:
- Job Bank (Canada)
- Adzuna Canada
- Careerjet Canada
- Greenhouse (ATS)
- Lever (ATS)
- Workable (ATS)
- LinkedIn (public listings)
- Indeed Canada
- ZipRecruiter Canada
- Monster Canada

For each job listing, provide:
- Basic details (title, company, location, salary, URL)
- AI/Automation risk analysis
- 5-year job outlook
- Growth potential
- Skill requirements

Return ONLY valid JSON array. No markdown, no explanations.`,
    
    userTemplate: (jobTitle: string, location: string, options: any) => {
      const boards = options.boards?.length > 0 
        ? `Focus on these boards: ${options.boards.join(', ')}`
        : 'Search all available boards'
      
      const limit = options.limit || 20
      const canadianOnly = options.includeCanadianOnly ? 'CANADIAN JOBS ONLY' : ''
      const aiAnalysis = options.includeAIAnalysis !== false
      
      return `Search for "${jobTitle}" jobs in "${location}".

${boards}
${canadianOnly}
Limit: ${limit} results

Return a JSON array of job listings:
[
  {
    "id": "unique-id",
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, Province/State",
    "salary": "60000-90000",
    "currency": "CAD",
    "url": "https://...",
    "description": "Brief description",
    "postedDate": "2025-01-05",
    "source": "Job Board Name",
    "skills": ["skill1", "skill2"],
    "experienceLevel": "mid",
    "workType": "remote|hybrid|onsite"${aiAnalysis ? `,
    "aiAnalysis": {
      "replacementRisk": "low|medium|high",
      "automationRisk": "low|medium|high",
      "fiveYearOutlook": "declining|stable|growing|thriving",
      "growthPotential": "low|medium|high",
      "reasoning": "Why this job has good/poor outlook"
    }` : ''}
  }
]

Prioritize recent postings and reputable companies.`
    }
  },

  /**
   * COMPANY RESEARCH PROMPTS
   */
  COMPANY_RESEARCH: {
    version: '2.0.0',
    purpose: 'Comprehensive company intelligence with future outlook',
    system: `You are a corporate intelligence analyst specializing in company research for job seekers.

Provide comprehensive company analysis including:
- Business model and products/services
- Financial health and stability
- Company culture and values
- Growth trajectory and market position
- Recent news and developments
- Future outlook and AI/automation impact
- Hiring intelligence and trends
- Competitive landscape

Use current 2025 data. Return ONLY valid JSON.`,
    
    userTemplate: (companyName: string, additionalContext?: string) => `Research "${companyName}" and return this JSON structure:

{
  "companyName": "${companyName}",
  "overview": {
    "description": "What the company does",
    "founded": "Year",
    "headquarters": "Location",
    "size": "Number of employees",
    "industry": "Primary industry"
  },
  "financials": {
    "revenue": "Annual revenue",
    "funding": "Total funding raised",
    "profitability": "profitable|break-even|loss-making",
    "growth": "Revenue growth rate"
  },
  "culture": {
    "values": ["value1", "value2"],
    "workLifeBalance": "Rating or description",
    "perks": ["perk1", "perk2"],
    "glassdoorRating": "X.X/5.0"
  },
  "recentNews": [
    {
      "date": "2025-01-XX",
      "headline": "News title",
      "summary": "Brief summary",
      "sentiment": "positive|neutral|negative"
    }
  ],
  "futureOutlook": {
    "aiImpact": "How AI will affect this company",
    "fiveYearProjection": "declining|stable|growing|thriving",
    "marketPosition": "Market position outlook",
    "risks": ["risk1", "risk2"],
    "opportunities": ["opp1", "opp2"]
  },
  "hiringIntelligence": {
    "hiringTrend": "increasing|stable|decreasing",
    "activeOpenings": "Estimated number",
    "keyRoles": ["role1", "role2"],
    "hiringProcess": "Description of process",
    "timeToHire": "Average duration"
  },
  "competitiveAnalysis": {
    "mainCompetitors": ["competitor1", "competitor2"],
    "marketShare": "Estimated position",
    "differentiators": ["what makes them unique"]
  }
}

${additionalContext ? `Additional context: ${additionalContext}` : ''}`
  },

  /**
   * HIRING CONTACTS PROMPTS
   */
  HIRING_CONTACTS: {
    version: '2.0.0',
    purpose: 'Find hiring managers and recruiters with contact intelligence',
    system: `You are a networking and recruitment intelligence specialist.

Find hiring managers, recruiters, and key decision-makers at companies.
Provide actionable contact intelligence including:
- Name, title, LinkedIn profile
- Contact methods and success rates
- Best times to reach out
- Communication style preferences
- Decision-making influence
- Recent activity and engagement

Return ONLY valid JSON array.`,
    
    userTemplate: (companyName: string) => `Find hiring managers and recruiters at "${companyName}".

Return JSON array:
[
  {
    "name": "Full Name",
    "title": "Job Title",
    "department": "Engineering|HR|etc",
    "linkedIn": "LinkedIn URL",
    "email": "email@company.com (if publicly available)",
    "role": "recruiter|hiring_manager|decision_maker",
    "contactIntelligence": {
      "responseRate": "high|medium|low",
      "preferredContactMethod": "LinkedIn|Email|etc",
      "bestContactTime": "Time/day recommendations",
      "communicationStyle": "formal|casual|data-driven",
      "decisionInfluence": "high|medium|low",
      "recentActivity": "Recent posts, job changes, etc"
    }
  }
]

Focus on people actively involved in hiring.`
  },

  /**
   * SALARY ANALYSIS PROMPTS
   */
  SALARY_ANALYSIS: {
    version: '2.0.0',
    purpose: 'Market-based salary intelligence',
    system: `You are a compensation analyst with access to 2025 salary data.

Provide accurate salary ranges based on:
- Job role and title
- Geographic location
- Experience level
- Company size and type
- Industry standards
- Market trends

Use current 2025 data. Return ONLY valid JSON.`,
    
    userTemplate: (role: string, company?: string, location?: string) => `Provide salary data for "${role}"${company ? ` at ${company}` : ''}${location ? ` in ${location}` : ''}.

Return JSON:
{
  "role": "${role}",
  "location": "${location || 'General'}",
  "currency": "CAD|USD",
  "salaryRanges": {
    "entry": { "min": 0, "max": 0, "median": 0 },
    "mid": { "min": 0, "max": 0, "median": 0 },
    "senior": { "min": 0, "max": 0, "median": 0 },
    "executive": { "min": 0, "max": 0, "median": 0 }
  },
  "marketInsights": {
    "trend": "increasing|stable|decreasing",
    "demandLevel": "high|medium|low",
    "competitionLevel": "high|medium|low",
    "topPayingIndustries": ["industry1", "industry2"],
    "topPayingCompanies": ["company1", "company2"]
  },
  "benefits": {
    "typical": ["benefit1", "benefit2"],
    "signOnBonus": "Typical range",
    "equity": "Common equity packages"
  },
  "lastUpdated": "2025-01"
}`
  },

  /**
   * MARKET ANALYSIS PROMPTS
   */
  MARKET_ANALYSIS: {
    version: '2.0.0',
    purpose: 'Comprehensive market intelligence',
    system: `You are a labor market economist analyzing job market trends.

Provide comprehensive market analysis including:
- Job market health and trends
- Supply and demand dynamics
- Salary trends and projections
- Industry growth forecasts
- AI/automation impact
- Regional variations
- Skill gap analysis

Use current 2025 data and forward-looking projections. Return ONLY valid JSON.`,
    
    userTemplate: (location: string, industry: string, roleType?: string) => `Analyze the job market for ${roleType ? `"${roleType}" roles in ` : ''}the "${industry}" industry in "${location}".

Return JSON:
{
  "location": "${location}",
  "industry": "${industry}",
  "roleType": "${roleType || 'General'}",
  "marketHealth": {
    "overall": "strong|moderate|weak",
    "trend": "improving|stable|declining",
    "unemployment": "X.X%",
    "jobOpenings": "Estimated number",
    "competitionLevel": "high|medium|low"
  },
  "salaryTrends": {
    "averageIncrease": "X.X% YoY",
    "medianSalary": 0,
    "forecast": "Expected trend for next 2 years"
  },
  "demandForecast": {
    "nextYear": "increasing|stable|decreasing",
    "fiveYear": "Detailed projection",
    "hotSkills": ["skill1", "skill2"],
    "decliningSkills": ["skill1", "skill2"]
  },
  "aiAutomationImpact": {
    "overallRisk": "low|medium|high",
    "affectedRoles": ["role1", "role2"],
    "emergingRoles": ["role1", "role2"],
    "recommendations": ["advice1", "advice2"]
  },
  "topEmployers": [
    {
      "name": "Company Name",
      "openings": "Estimated number",
      "hiringTrend": "increasing|stable|decreasing"
    }
  ],
  "insights": ["Key insight 1", "Key insight 2"],
  "lastUpdated": "2025-01"
}`
  },

  /**
   * JOB MATCHING PROMPTS
   */
  JOB_MATCHING: {
    version: '2.0.0',
    purpose: 'Match resume skills to job requirements',
    system: `You are an AI-powered job matching specialist.

Compare resume skills and experience against job requirements.
Calculate accurate match percentages and identify:
- Matching skills and experience
- Missing skills (gaps)
- Transferable skills
- Overqualifications
- Growth potential

Return ONLY valid JSON.`,
    
    userTemplate: (resumeSkills: string[], jobDescription: string) => `Calculate match score between candidate and job:

Candidate Skills: ${resumeSkills.join(', ')}

Job Description:
${jobDescription}

Return JSON:
{
  "matchScore": 85,
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "transferableSkills": ["skill5"],
  "overqualifications": ["skill6"],
  "growthPotential": "high|medium|low",
  "recommendation": "strong_match|potential_match|poor_match",
  "reasoning": "Detailed explanation",
  "applicationAdvice": "How to position yourself"
}`
  }
} as const

/**
 * Prompt versioning utility
 */
export function getPromptVersion(category: keyof typeof PERPLEXITY_PROMPTS): string {
  return PERPLEXITY_PROMPTS[category].version
}

/**
 * Get all prompt versions
 */
export function getAllPromptVersions(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PERPLEXITY_PROMPTS).map(([key, value]) => [key, value.version])
  )
}

