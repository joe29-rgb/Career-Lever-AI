/**
 * Interview Preparation Generator
 * 
 * Generates company-specific interview questions and prep materials
 */

import { PerplexityService } from './perplexity-service'

export interface InterviewPrep {
  commonQuestions: {
    question: string
    category: 'behavioral' | 'technical' | 'situational' | 'company-specific'
    difficulty: 'easy' | 'medium' | 'hard'
    sampleAnswer: string
    tips: string[]
  }[]
  technicalTopics: string[]
  companySpecificQuestions: string[]
  cultureFitQuestions: string[]
  questionsToAsk: string[]
  preparationChecklist: string[]
  redFlags: string[]
}

export class InterviewPrepGenerator {
  /**
   * Generate comprehensive interview prep
   */
  static async generateInterviewPrep(
    jobTitle: string,
    company: string,
    jobDescription: string
  ): Promise<InterviewPrep> {
    try {
      const client = new PerplexityService()
      
      const prompt = `Generate comprehensive interview preparation for this position:

Job Title: ${jobTitle}
Company: ${company}
Job Description: ${jobDescription.slice(0, 2000)}

Search these sources:
1. Glassdoor interview reviews for ${company}
2. Common interview questions for ${jobTitle}
3. ${company} culture and values
4. Technical requirements from job description

Return ONLY valid JSON:
{
  "commonQuestions": [
    {
      "question": "Tell me about a time you handled a difficult situation",
      "category": "behavioral",
      "difficulty": "medium",
      "sampleAnswer": "Use STAR method: Situation, Task, Action, Result...",
      "tips": ["Be specific", "Quantify results", "Show leadership"]
    }
  ],
  "technicalTopics": ["React", "Node.js", "AWS", "System Design"],
  "companySpecificQuestions": [
    "Why do you want to work at ${company}?",
    "What do you know about ${company}'s products?"
  ],
  "cultureFitQuestions": [
    "How do you handle remote work?",
    "Describe your ideal team environment"
  ],
  "questionsToAsk": [
    "What does success look like in this role?",
    "What are the team's biggest challenges?",
    "What's the onboarding process like?"
  ],
  "preparationChecklist": [
    "Research ${company}'s recent news",
    "Review job description thoroughly",
    "Prepare STAR stories",
    "Test video call setup"
  ],
  "redFlags": [
    "High turnover rate",
    "Unclear job responsibilities",
    "Lack of growth opportunities"
  ]
}

REQUIREMENTS:
- Include 10-15 common interview questions with sample answers
- Extract technical topics from job description
- Research ${company}-specific questions from Glassdoor
- Provide actionable preparation tips
- Include red flags to watch for`

      const response = await client.makeRequest(
        'You are an interview preparation coach. Generate comprehensive, company-specific interview prep materials.',
        prompt,
        {
          temperature: 0.3,
          maxTokens: 4000,
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

      const parsed = JSON.parse(cleanedContent) as InterviewPrep

      return parsed
    } catch (error) {
      console.error('[INTERVIEW_PREP] Failed to generate prep:', error)
      
      // Return fallback
      return {
        commonQuestions: [
          {
            question: 'Tell me about yourself',
            category: 'behavioral',
            difficulty: 'easy',
            sampleAnswer: 'Start with your current role, highlight relevant experience, and explain why you\'re interested in this position.',
            tips: ['Keep it under 2 minutes', 'Focus on relevant experience', 'End with why you want this job']
          },
          {
            question: 'Why do you want to work here?',
            category: 'company-specific',
            difficulty: 'medium',
            sampleAnswer: 'Research the company and mention specific products, values, or initiatives that align with your goals.',
            tips: ['Show you\'ve done research', 'Connect to your career goals', 'Be genuine']
          }
        ],
        technicalTopics: [],
        companySpecificQuestions: [
          `Why ${company}?`,
          `What do you know about ${company}'s products?`
        ],
        cultureFitQuestions: [
          'How do you handle feedback?',
          'Describe your ideal work environment'
        ],
        questionsToAsk: [
          'What does success look like in the first 90 days?',
          'What are the team\'s biggest challenges?',
          'What\'s the career growth path?'
        ],
        preparationChecklist: [
          'Research company thoroughly',
          'Review job description',
          'Prepare 5-7 STAR stories',
          'Practice common questions',
          'Prepare questions to ask',
          'Test video call setup'
        ],
        redFlags: [
          'Vague job description',
          'High turnover mentioned',
          'Lack of clear expectations'
        ]
      }
    }
  }

  /**
   * Generate STAR method answer template
   */
  static generateSTARTemplate(situation: string): string {
    return `**Situation:** ${situation}

**Task:** What was your responsibility or goal?

**Action:** What specific steps did you take?
- Step 1:
- Step 2:
- Step 3:

**Result:** What was the outcome? (Include metrics if possible)
- Quantifiable result:
- Impact on team/company:
- What you learned:`
  }

  /**
   * Get behavioral question categories
   */
  static getBehavioralCategories(): string[] {
    return [
      'Leadership & Management',
      'Problem Solving',
      'Teamwork & Collaboration',
      'Conflict Resolution',
      'Time Management',
      'Adaptability & Change',
      'Communication Skills',
      'Decision Making',
      'Customer Focus',
      'Innovation & Creativity'
    ]
  }
}
