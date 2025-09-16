import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SalaryAnalysis {
  marketData: {
    role: string
    location: string
    experience: string
    salaryRange: {
      min: number
      median: number
      max: number
      currency: string
    }
    percentiles: {
      p25: number
      p50: number
      p75: number
      p90: number
    }
  }
  negotiationStrategy: {
    targetSalary: number
    openingOffer: number
    counterOffer: number
    reasoning: string[]
  }
  leveragePoints: {
    experience: string[]
    skills: string[]
    marketDemand: string[]
    companyFactors: string[]
  }
  talkingPoints: {
    strengths: string[]
    valueProposition: string
    marketComparison: string
    growthPotential: string
  }
  redFlags: {
    warningSigns: string[]
    alternatives: string[]
    walkAwayPoints: string[]
  }
  preparationSteps: {
    research: string[]
    practice: string[]
    documentation: string[]
    followUp: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobTitle, company, location, experience, currentSalary, resumeId } = body

    if (!jobTitle || !location) {
      return NextResponse.json(
        { error: 'Job title and location are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Generate comprehensive salary analysis
    const analysis = await generateSalaryAnalysis({
      jobTitle,
      company,
      location,
      experience: experience || 'mid',
      currentSalary: currentSalary || 0,
    })

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Salary analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze salary data' },
      { status: 500 }
    )
  }
}

async function generateSalaryAnalysis(params: {
  jobTitle: string
  company?: string
  location: string
  experience: string
  currentSalary: number
}): Promise<SalaryAnalysis> {
  const { jobTitle, company, location, experience, currentSalary } = params

  // Generate market data based on role and location
  const marketData = await generateMarketData(jobTitle, location, experience)

  // Generate negotiation strategy
  const negotiationStrategy = generateNegotiationStrategy(marketData, currentSalary)

  // Generate leverage points
  const leveragePoints = await generateLeveragePoints(jobTitle || '', company || '', experience)

  // Generate talking points
  const talkingPoints = await generateTalkingPoints(jobTitle || '', company || '', marketData)

  // Generate red flags and alternatives
  const redFlags = generateRedFlags(marketData)

  // Generate preparation steps
  const preparationSteps = generatePreparationSteps()

  return {
    marketData,
    negotiationStrategy,
    leveragePoints,
    talkingPoints,
    redFlags,
    preparationSteps
  }
}

async function generateMarketData(jobTitle: string, location: string, experience: string) {
  // In a real implementation, this would integrate with salary data APIs
  // For now, we'll generate realistic data based on common salary ranges

  const baseSalary = getBaseSalary(jobTitle, location, experience)
  const locationMultiplier = getLocationMultiplier(location)
  const experienceMultiplier = getExperienceMultiplier(experience)

  const medianSalary = Math.round(baseSalary * locationMultiplier * experienceMultiplier)

  // Generate salary range with realistic spread
  const rangeSpread = 0.3 // 30% range
  const minSalary = Math.round(medianSalary * (1 - rangeSpread))
  const maxSalary = Math.round(medianSalary * (1 + rangeSpread))

  // Calculate percentiles
  const p25 = Math.round(minSalary + (medianSalary - minSalary) * 0.25)
  const p75 = Math.round(medianSalary + (maxSalary - medianSalary) * 0.5)
  const p90 = Math.round(medianSalary + (maxSalary - medianSalary) * 0.8)

  return {
    role: jobTitle,
    location,
    experience,
    salaryRange: {
      min: minSalary,
      median: medianSalary,
      max: maxSalary,
      currency: 'USD'
    },
    percentiles: {
      p25,
      p50: medianSalary,
      p75,
      p90
    }
  }
}

function getBaseSalary(jobTitle: string, location: string, experience: string): number {
  // Base salaries for common tech roles (simplified)
  const baseSalaries: Record<string, number> = {
    'software engineer': 95000,
    'senior software engineer': 130000,
    'software developer': 85000,
    'full stack developer': 90000,
    'frontend developer': 85000,
    'backend developer': 95000,
    'devops engineer': 105000,
    'data scientist': 110000,
    'product manager': 115000,
    'ux designer': 85000,
    'marketing manager': 75000,
    'sales representative': 55000,
    'accountant': 65000,
    'project manager': 85000,
  }

  const normalizedTitle = jobTitle.toLowerCase()
  const baseSalary = baseSalaries[normalizedTitle] || 70000

  return baseSalary
}

function getLocationMultiplier(location: string): number {
  // Location-based salary multipliers (simplified)
  const locationMultipliers: Record<string, number> = {
    'san francisco': 1.5,
    'new york': 1.3,
    'los angeles': 1.2,
    'seattle': 1.4,
    'austin': 1.1,
    'boston': 1.3,
    'chicago': 1.1,
    'denver': 1.05,
    'miami': 0.95,
    'dallas': 0.9,
  }

  const normalizedLocation = location.toLowerCase()
  const multiplier = locationMultipliers[normalizedLocation] || 1.0

  return multiplier
}

function getExperienceMultiplier(experience: string): number {
  // Experience-based multipliers
  const experienceMultipliers: Record<string, number> = {
    'entry': 0.7,
    'junior': 0.8,
    'mid': 1.0,
    'senior': 1.3,
    'lead': 1.5,
    'principal': 1.7,
    'staff': 1.9,
    'manager': 2.0,
  }

  const multiplier = experienceMultipliers[experience] || 1.0
  return multiplier
}

function generateNegotiationStrategy(marketData: any, currentSalary: number) {
  const { median: medianSalary, p75 } = marketData.salaryRange

  // Target salary should be at 75th percentile or higher
  const targetSalary = Math.max(p75, medianSalary * 1.1)

  // Opening offer should be 10-20% above target
  const openingOffer = Math.round(targetSalary * 1.15)

  // Counter-offer should be 5-10% above target
  const counterOffer = Math.round(targetSalary * 1.08)

  // Generate reasoning
  const reasoning = [
    `Market median for this role is $${medianSalary.toLocaleString()}`,
    `Your target should be at the 75th percentile: $${p75.toLocaleString()}`,
    `With your experience and skills, you're positioned for the higher end of the range`,
    `Opening higher gives room for negotiation while still being reasonable`,
    `Counter-offer leaves room for final concessions while staying above your target`
  ]

  return {
    targetSalary,
    openingOffer,
    counterOffer,
    reasoning
  }
}

async function generateLeveragePoints(jobTitle: string, company: string, experience: string) {
  // Generate leverage points based on role, company, and experience
  const experiencePoints = []
  const skillsPoints = []
  const marketPoints = []
  const companyPoints = []

  // Experience leverage
  if (experience === 'senior' || experience === 'lead') {
    experiencePoints.push('5+ years of proven experience in the field')
    experiencePoints.push('Leadership experience with team management')
    experiencePoints.push('Track record of successful project delivery')
  } else if (experience === 'mid') {
    experiencePoints.push('3+ years of relevant experience')
    experiencePoints.push('Demonstrated ability to work independently')
    experiencePoints.push('Experience with industry-standard tools and technologies')
  }

  // Skills leverage (would be personalized based on resume analysis)
  skillsPoints.push('Expertise in high-demand technical skills')
  skillsPoints.push('Certifications and continuous learning')
  skillsPoints.push('Problem-solving and analytical abilities')

  // Market leverage
  marketPoints.push('Skills are in high demand with talent shortage')
  marketPoints.push('Competition for top talent drives salaries up')
  marketPoints.push('Your unique combination of skills is valuable')

  // Company leverage
  if (company) {
    companyPoints.push(`Specific interest in ${company}'s mission and values`)
    companyPoints.push(`Understanding of ${company}'s industry position`)
    companyPoints.push('Cultural fit and alignment with company goals')
  }

  return {
    experience: experiencePoints,
    skills: skillsPoints,
    marketDemand: marketPoints,
    companyFactors: companyPoints
  }
}

async function generateTalkingPoints(jobTitle: string, company: string, marketData: any) {
  const strengths = [
    'Proven track record of delivering high-quality results',
    'Strong technical skills combined with problem-solving abilities',
    'Experience with industry-leading tools and methodologies',
    'Consistent performance and ability to meet deadlines',
    'Collaborative team player with strong communication skills'
  ]

  const valueProposition = `As a ${jobTitle}, I bring not just technical expertise but also the ability to understand business needs and deliver solutions that drive results. My experience aligns perfectly with market demands, and I'm positioned to contribute immediately while growing with the company.`

  const marketComparison = `The market data shows that professionals with my level of experience and skills typically earn between $${marketData.salaryRange.min.toLocaleString()} and $${marketData.salaryRange.max.toLocaleString()}, with a median of $${marketData.salaryRange.median.toLocaleString()}. My target compensation reflects my market value and the value I can bring to your team.`

  const growthPotential = 'I\'m committed to continuous learning and professional development. I\'m eager to take on new challenges and responsibilities as I grow within the company, making this a long-term investment in a valuable team member.'

  return {
    strengths,
    valueProposition,
    marketComparison,
    growthPotential
  }
}

function generateRedFlags(marketData: any) {
  const warningSigns = [
    'Offer is significantly below market median',
    'Lack of transparency about benefits and perks',
    'Unrealistic expectations or requirements',
    'Toxic work environment indicators',
    'No clear growth or development opportunities'
  ]

  const alternatives = [
    'Research competing offers in the market',
    'Consider equity or other compensation forms',
    'Evaluate work-life balance and company culture',
    'Assess long-term career growth potential',
    'Compare with your current compensation package'
  ]

  const walkAwayPoints = [
    'Offer is more than 20% below your target salary',
    'Company shows no flexibility on key requirements',
    'Red flags in company culture or values',
    'Better opportunities become available',
    'Compensation doesn\'t reflect your market value'
  ]

  return {
    warningSigns,
    alternatives,
    walkAwayPoints
  }
}

function generatePreparationSteps() {
  const research = [
    'Research company salary data from reliable sources',
    'Review your current compensation and benefits',
    'Calculate your target salary based on market data',
    'Prepare your counter-offer strategy',
    'Document your achievements and value proposition'
  ]

  const practice = [
    'Practice explaining your salary expectations',
    'Prepare responses to common salary questions',
    'Role-play negotiation scenarios',
    'Practice confident and professional communication',
    'Prepare questions about compensation structure'
  ]

  const documentation = [
    'Keep records of all salary discussions',
    'Document agreed-upon compensation terms',
    'Save email correspondence about offers',
    'Track negotiation outcomes for future reference',
    'Update your salary expectations based on outcomes'
  ]

  const followUp = [
    'Send thank-you note after negotiations',
    'Document final agreement in writing',
    'Review offer details with HR or legal',
    'Plan your start date and transition',
    'Celebrate your successful negotiation!'
  ]

  return {
    research,
    practice,
    documentation,
    followUp
  }
}
