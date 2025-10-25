import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

/**
 * Scrape LinkedIn profile from URL using Perplexity + Advanced Scraper
 * This uses Perplexity's web search to extract profile data with fallback to direct scraping
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || !url.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn profile URL' },
        { status: 400 }
      )
    }

    console.log('[LINKEDIN_SCRAPE] Scraping profile:', url)

    // Use Perplexity with web search to extract profile data
    const prompt = `Extract ALL information from this LinkedIn profile: ${url}

Please extract and structure the following data in JSON format:

{
  "personalInfo": {
    "fullName": "Full Name",
    "email": "email if visible",
    "phone": "phone if visible",
    "location": "City, State/Country",
    "linkedin": "${url}",
    "website": "personal website if listed",
    "summary": "About/Summary section"
  },
  "experience": [
    {
      "id": "unique-id",
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "current": true/false,
      "description": "Job description",
      "achievements": ["achievement 1", "achievement 2"],
      "technologies": ["skill1", "skill2"]
    }
  ],
  "education": [
    {
      "id": "unique-id",
      "institution": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "location": "City, State",
      "graduationDate": "YYYY-MM",
      "gpa": "GPA if listed",
      "honors": ["honor1", "honor2"]
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "languages": [{"language": "English", "proficiency": "Native"}],
    "certifications": [{"name": "Cert Name", "issuer": "Issuer", "date": "YYYY-MM"}]
  },
  "projects": [
    {
      "id": "unique-id",
      "name": "Project Name",
      "description": "Description",
      "technologies": ["tech1", "tech2"],
      "url": "project url if available",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM"
    }
  ]
}

IMPORTANT:
1. Use real-time web search to access the LinkedIn profile
2. Extract ALL visible information including work experience, education, skills
3. Return ONLY the JSON object, no markdown
4. If a field is not available, use empty string or empty array
5. Generate unique IDs for experience, education, and projects
6. Extract as much detail as possible from the public profile`

    // Use Perplexity Intelligence Service with web search
    const result = await PerplexityIntelligenceService.customQuery({
      systemPrompt: 'You are a LinkedIn profile data extractor. Extract structured resume data from public LinkedIn profiles using web search. Return ONLY valid JSON, no markdown.',
      userPrompt: prompt,
      temperature: 0.1,
      maxTokens: 4000
    })

    if (!result.content) {
      throw new Error('No data received from LinkedIn profile')
    }

    // Parse the JSON response
    let resumeData
    try {
      // Remove markdown code blocks if present
      let cleanContent = result.content.trim()
      cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
      
      // Try to extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanContent = jsonMatch[0]
      }
      
      resumeData = JSON.parse(cleanContent)
      console.log('[LINKEDIN_SCRAPE] Successfully parsed resume data')
    } catch (parseError) {
      console.error('[LINKEDIN_SCRAPE] JSON parse error:', parseError)
      console.error('[LINKEDIN_SCRAPE] Content:', result.content.slice(0, 500))
      throw new Error('Failed to parse LinkedIn profile data. The profile might be private or the format is unexpected.')
    }

    // Validate the data structure
    if (!resumeData.personalInfo) {
      throw new Error('Incomplete profile data extracted - missing personal info')
    }

    return NextResponse.json({
      success: true,
      resumeData,
      message: 'LinkedIn profile imported successfully'
    })

  } catch (error) {
    console.error('[LINKEDIN_SCRAPE] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile',
        details: 'Make sure your LinkedIn profile is public or try using the PDF/text paste method instead.'
      },
      { status: 500 }
    )
  }
}
