/**
 * Tech Stack Analyzer
 * 
 * Analyzes company tech stacks for technical job applications
 */

import { PerplexityService } from './perplexity-service'

export interface TechStack {
  company: string
  technologies: {
    name: string
    category: 'language' | 'framework' | 'database' | 'cloud' | 'tool' | 'platform'
    proficiency_required: 'required' | 'preferred' | 'nice-to-have'
    years_experience?: number
    confidence: number
  }[]
  architecture: string[]
  development_practices: string[]
  tools: string[]
  certifications: string[]
  learning_resources: {
    technology: string
    resources: string[]
  }[]
  skill_gaps: string[]
  recommendations: string[]
}

export class TechStackAnalyzer {
  /**
   * Analyze company tech stack
   */
  static async analyzeTechStack(
    company: string,
    jobDescription: string,
    userSkills: string[]
  ): Promise<TechStack> {
    try {
      const client = new PerplexityService()
      
      const prompt = `Analyze the tech stack for ${company} based on this job description:

${jobDescription}

User's Current Skills: ${userSkills.join(', ')}

Search these sources:
1. Company engineering blog
2. Stackshare.io for ${company}
3. GitHub repositories
4. Job postings for tech mentions
5. Company tech talks/conferences

Return ONLY valid JSON:
{
  "company": "${company}",
  "technologies": [
    {
      "name": "React",
      "category": "framework",
      "proficiency_required": "required",
      "years_experience": 3,
      "confidence": 0.95
    },
    {
      "name": "AWS",
      "category": "cloud",
      "proficiency_required": "preferred",
      "confidence": 0.85
    }
  ],
  "architecture": ["Microservices", "Event-driven", "RESTful APIs"],
  "development_practices": ["Agile/Scrum", "CI/CD", "Test-Driven Development", "Code Reviews"],
  "tools": ["Git", "Docker", "Kubernetes", "Jenkins", "Jira"],
  "certifications": ["AWS Certified Solutions Architect", "Kubernetes Administrator"],
  "learning_resources": [
    {
      "technology": "React",
      "resources": [
        "Official React docs",
        "React course on Udemy",
        "FreeCodeCamp React tutorial"
      ]
    }
  ],
  "skill_gaps": ["Kubernetes", "GraphQL"],
  "recommendations": [
    "Focus on learning Kubernetes - it's heavily used at ${company}",
    "Build a project using React + AWS to demonstrate skills",
    "Get AWS certification to stand out"
  ]
}

REQUIREMENTS:
- Extract ALL technologies mentioned in job description
- Research ${company}'s actual tech stack from public sources
- Categorize by importance (required vs preferred)
- Identify skill gaps based on user's current skills
- Provide specific learning resources
- Give actionable recommendations`

      const response = await client.makeRequest(
        'You are a technical recruiter and software architect. Analyze tech stacks and provide career development guidance.',
        prompt,
        {
          temperature: 0.2,
          maxTokens: 3000,
          model: 'sonar-pro'
        }
      )

      // Parse response
      let cleanedContent = response.content.trim()
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent) as TechStack

      return parsed
    } catch (error) {
      console.error('[TECH_STACK] Failed to analyze:', error)
      
      // Return fallback
      return {
        company,
        technologies: [],
        architecture: [],
        development_practices: [],
        tools: [],
        certifications: [],
        learning_resources: [],
        skill_gaps: [],
        recommendations: []
      }
    }
  }

  /**
   * Calculate tech stack match score
   */
  static calculateMatchScore(techStack: TechStack, userSkills: string[]): {
    score: number
    matched: string[]
    missing: string[]
    recommendations: string[]
  } {
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase())
    const requiredTech = techStack.technologies.filter(t => t.proficiency_required === 'required')
    const preferredTech = techStack.technologies.filter(t => t.proficiency_required === 'preferred')

    const matched: string[] = []
    const missing: string[] = []

    // Check required technologies
    for (const tech of requiredTech) {
      if (normalizedUserSkills.some(skill => 
        skill.includes(tech.name.toLowerCase()) || tech.name.toLowerCase().includes(skill)
      )) {
        matched.push(tech.name)
      } else {
        missing.push(tech.name)
      }
    }

    // Check preferred technologies
    for (const tech of preferredTech) {
      if (normalizedUserSkills.some(skill => 
        skill.includes(tech.name.toLowerCase()) || tech.name.toLowerCase().includes(skill)
      )) {
        matched.push(tech.name)
      }
    }

    // Calculate score
    const requiredScore = requiredTech.length > 0 
      ? (matched.filter(m => requiredTech.some(t => t.name === m)).length / requiredTech.length) * 70
      : 70

    const preferredScore = preferredTech.length > 0
      ? (matched.filter(m => preferredTech.some(t => t.name === m)).length / preferredTech.length) * 30
      : 30

    const score = Math.round(requiredScore + preferredScore)

    // Generate recommendations
    const recommendations: string[] = []
    if (missing.length > 0) {
      recommendations.push(`Learn these required technologies: ${missing.slice(0, 3).join(', ')}`)
    }
    if (score < 70) {
      recommendations.push('Consider taking online courses to fill skill gaps')
      recommendations.push('Build projects demonstrating these technologies')
    }
    if (techStack.certifications.length > 0) {
      recommendations.push(`Consider getting certified: ${techStack.certifications[0]}`)
    }

    return {
      score,
      matched,
      missing,
      recommendations
    }
  }

  /**
   * Generate learning plan
   */
  static generateLearningPlan(techStack: TechStack, userSkills: string[]): {
    priority: 'high' | 'medium' | 'low'
    technology: string
    reason: string
    estimatedTime: string
    resources: string[]
  }[] {
    const plan: any[] = []
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase())

    // High priority: Required technologies user doesn't have
    for (const tech of techStack.technologies) {
      if (tech.proficiency_required === 'required') {
        const hasSkill = normalizedUserSkills.some(skill => 
          skill.includes(tech.name.toLowerCase()) || tech.name.toLowerCase().includes(skill)
        )

        if (!hasSkill) {
          const learningResource = techStack.learning_resources.find(r => r.technology === tech.name)
          plan.push({
            priority: 'high',
            technology: tech.name,
            reason: `Required for the role at ${techStack.company}`,
            estimatedTime: tech.years_experience ? `${tech.years_experience * 3} months` : '3-6 months',
            resources: learningResource?.resources || [`Search for ${tech.name} tutorials`]
          })
        }
      }
    }

    // Medium priority: Preferred technologies
    for (const tech of techStack.technologies) {
      if (tech.proficiency_required === 'preferred') {
        const hasSkill = normalizedUserSkills.some(skill => 
          skill.includes(tech.name.toLowerCase()) || tech.name.toLowerCase().includes(skill)
        )

        if (!hasSkill) {
          const learningResource = techStack.learning_resources.find(r => r.technology === tech.name)
          plan.push({
            priority: 'medium',
            technology: tech.name,
            reason: `Preferred skill at ${techStack.company}`,
            estimatedTime: '1-3 months',
            resources: learningResource?.resources || [`Search for ${tech.name} courses`]
          })
        }
      }
    }

    // Sort by priority
    return plan.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }).slice(0, 5) // Top 5 priorities
  }

  /**
   * Extract technologies from job description
   */
  static extractTechnologies(jobDescription: string): string[] {
    const commonTech = [
      // Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      // Frontend
      'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
      // Backend
      'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Rails',
      // Databases
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
      // Cloud
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CloudFormation',
      // Tools
      'Git', 'GitHub', 'GitLab', 'Jenkins', 'CircleCI', 'Jira', 'Confluence'
    ]

    const found: string[] = []
    const lowerDesc = jobDescription.toLowerCase()

    for (const tech of commonTech) {
      if (lowerDesc.includes(tech.toLowerCase())) {
        found.push(tech)
      }
    }

    return Array.from(new Set(found))
  }
}
