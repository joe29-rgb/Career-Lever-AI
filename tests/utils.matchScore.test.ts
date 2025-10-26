import { describe, it, expect } from 'vitest'
import { calculateMatchScore } from '@/lib/utils'

describe('calculateMatchScore', () => {
  it('returns higher score for overlapping keywords', () => {
    const resume = 'Typescript React Node Docker AWS'
    const jd = 'Looking for a React / Node engineer with AWS experience'
    const s1 = calculateMatchScore(resume, jd)
    const s2 = calculateMatchScore('unrelated words only', jd)
    expect(s1).toBeGreaterThan(s2)
  })
})


