import { describe, it, expect } from 'vitest'
import { AIService } from '@/lib/ai-service'

describe('AIService helpers', () => {
  it('scores ATS locally without throwing', async () => {
    const jd = 'We need a React TypeScript engineer with API experience and testing.'
    const resume = 'Experienced engineer. React, TypeScript, Node.js, REST APIs, testing with Vitest.'
    const out = await AIService.atsScore(resume, { keyRequirements: ['React', 'TypeScript', 'APIs'], preferredSkills: ['Testing'] }, 'generic')
    expect(out).toBeTruthy()
    expect(typeof out.score).toBe('number')
  })

  it('career trajectory returns a plan shape', async () => {
    const plan = await AIService.careerTrajectoryPredictor({ resumeText: 'Built web apps in React and Node', targetRole: 'Senior Frontend Engineer' })
    expect(plan).toHaveProperty('steps')
    expect(Array.isArray(plan.steps)).toBe(true)
  })
})


