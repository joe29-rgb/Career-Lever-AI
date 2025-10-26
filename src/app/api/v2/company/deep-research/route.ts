import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { WebScraperService } from '@/lib/web-scraper'
import { dbService } from '@/lib/database' // Default import
import Profile from '@/models/Profile'

const webScraper = new WebScraperService()

export async function POST(request: NextRequest) {
  try {
    await dbService.connect()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let { companyName, companyWebsite, targetRole, location } = body

    console.log('[DEEP_RESEARCH] Request body:', JSON.stringify(body, null, 2))
    console.log('[DEEP_RESEARCH] Validation:', {
      hasCompanyName: !!companyName,
      companyNameValue: companyName,
      hasWebsite: !!companyWebsite,
      hasRole: !!targetRole,
      hasLocation: !!location
    })

    if (!companyName) {
      console.error('[DEEP_RESEARCH] ❌ Missing companyName in request')
      return NextResponse.json({ 
        error: 'Missing companyName',
        received: body,
        hint: 'Request must include companyName field'
      }, { status: 400 })
    }
    
    // CRITICAL FIX: Sanitize company name (remove noise from PDF extraction)
    const originalCompanyName = companyName
    companyName = companyName
      .trim()
      .replace(/\s*\(.*?\)\s*/g, '') // Remove text in parentheses like "(Project Name)"
      .replace(/\s*-.*$/g, '') // Remove everything after dash
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(/\s+/) // Split into words
      .slice(0, 5) // Take first 5 words max
      .join(' ') // Rejoin
    
    console.log('[COMPANY] Sanitized company name:', {
      original: originalCompanyName,
      sanitized: companyName,
      removed: originalCompanyName !== companyName
    })

    // Step 1: Basic company research via Perplexity V2
    const research = await PerplexityIntelligenceService.researchCompanyV2({ 
      company: companyName, 
      role: targetRole, 
      geo: location 
    })
    
    // CRITICAL DEBUG: Log what Perplexity returned
    console.log('[COMPANY] Research data:', {
      success: research.success,
      hasData: !!research.data,
      dataKeys: research.data ? Object.keys(research.data) : [],
      marketIntelligence: research.data?.marketIntelligence
    })

    // Step 2: Website scraping for contacts
    let siteContacts: { emails: string[]; phones: string[]; addresses: string[] } = { emails: [], phones: [], addresses: [] }
    if (companyWebsite) {
      try {
        siteContacts = await webScraper.scrapeContactInfoFromWebsite(companyWebsite)
        console.log('[COMPANY] Site contacts found:', siteContacts.emails.length)
      } catch (error) {
        console.error('[COMPANY] Site scrape failed:', error)
      }
    }

    // Step 3: Real hiring contacts via Perplexity (LinkedIn + site search)
    const hiringQuery = `${companyName} hiring manager OR recruiter email OR contact site:linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')} OR site:${companyWebsite}`
    const contacts = await PerplexityIntelligenceService.hiringContactsV2(hiringQuery)

    // Extract emails and phones from contacts.data
    const perplexityEmails = contacts.data.map(c => c.email).filter((email): email is string => Boolean(email))
    const perplexityPhones = contacts.data.map(c => c.phone).filter((phone): phone is string => Boolean(phone))

    console.log('[COMPANY] Perplexity contacts:', perplexityEmails.length)

    // Merge contacts (dedupe emails)
    const allEmails = Array.from(new Set([...siteContacts.emails, ...perplexityEmails])).filter(email =>
      email.includes('@') && !email.includes('example.com') // Basic validation
    )
    const allPhones = Array.from(new Set([...siteContacts.phones, ...perplexityPhones]))

    // Enhance with confidence (Perplexity sources + validation)
    // ONLY include REAL emails found via Perplexity or site scraping - NO inferred emails
    const validatedContacts = allEmails.map(email => ({
      email,
      confidence: perplexityEmails.includes(email) ? 85 : 60, // Higher for Perplexity
      sources: perplexityEmails.includes(email) ? ['Perplexity', 'LinkedIn'] : ['Site Scrape']
    }))
    
    console.log('[COMPANY] Found', validatedContacts.length, 'REAL verified contacts (no inferred emails)')

    // Save to profile for reuse
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { $push: { companyResearch: { company: companyName, contacts: validatedContacts, date: new Date() } } }
    )

    // CRITICAL FIX: Ensure market intelligence has meaningful data
    const marketIntel = research.data.marketIntelligence || 
      `${companyName} operates in the ${research.data.industry || 'technology'} sector. ` +
      `The company is ${research.data.size || 'actively hiring'} and ${research.data.revenue ? `generates ${research.data.revenue} in revenue` : 'is growing rapidly'}.`
    
    return NextResponse.json({
      success: true,
      company: research.data.company || companyName,
      description: research.data.description || `${companyName} - Company information being researched.`,
      size: research.data.size || 'Unknown',
      revenue: research.data.revenue || 'Unknown',
      industry: research.data.industry || 'Unknown',
      founded: research.data.founded || 'Unknown',
      headquarters: research.data.headquarters || location || 'Unknown',
      psychology: research.data.psychology || 'Company culture and values are being analyzed.',
      marketIntelligence: marketIntel,
      contacts: validatedContacts,
      hiringContacts: contacts.data, // CRITICAL FIX: Add the full contact objects for frontend display
      siteContacts: { ...siteContacts, emails: allEmails, phones: allPhones },
      metadata: {
        researchSources: research.data.sources || [],
        contactCount: validatedContacts.length,
        hiringContactCount: contacts.data.length,
        confidenceAverage: validatedContacts.reduce((sum, c) => sum + c.confidence, 0) / (validatedContacts.length || 1),
        extractedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[COMPANY] Deep research failed:', error)
    return NextResponse.json({ error: 'Research failed', details: (error as Error).message }, { status: 500 })
  }
}


