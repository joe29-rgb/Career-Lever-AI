import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { WebScraperService } from '@/lib/web-scraper'
import connectToDatabase from '@/lib/mongodb' // Default import
import Profile from '@/models/Profile'

const webScraper = new WebScraperService()

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyName, companyWebsite, targetRole, location } = body

    if (!companyName) {
      return NextResponse.json({ error: 'Missing companyName' }, { status: 400 })
    }

    console.log('[COMPANY] Researching:', companyName)

    // Step 1: Basic company research via Perplexity V2
    const research = await PerplexityIntelligenceService.researchCompanyV2(companyName, targetRole, location)
    
    // Step 2: Website scraping for contacts
    let siteContacts = { emails: [], phones: [], addresses: [] }
    if (companyWebsite) {
      try {
        siteContacts = await webScraper.scrapeCompanyWebsite(companyWebsite)
        console.log('[COMPANY] Site contacts found:', siteContacts.emails.length)
      } catch (error) {
        console.error('[COMPANY] Site scrape failed:', error)
      }
    }

    // Step 3: Real hiring contacts via Perplexity (LinkedIn + site search)
    const hiringQuery = `${companyName} hiring manager OR recruiter email OR contact site:linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')} OR site:${companyWebsite}`
    const contacts = await PerplexityIntelligenceService.hiringContactsV2(hiringQuery, companyName)
    
    console.log('[COMPANY] Perplexity contacts:', contacts.emails.length)

    // Merge contacts (dedupe emails)
    const allEmails = [...new Set([...siteContacts.emails, ...contacts.emails])].filter(email => 
      email.includes('@') && !email.includes('example.com') // Basic validation
    )
    const allPhones = [...new Set([...siteContacts.phones, ...contacts.phones])]

    // Enhance with confidence (Perplexity sources + validation)
    const validatedContacts = allEmails.map(email => ({
      email,
      confidence: contacts.emails.includes(email) ? 85 : 60, // Higher for Perplexity
      sources: contacts.emails.includes(email) ? ['Perplexity', 'LinkedIn'] : ['Site Scrape']
    }))

    // Save to profile for reuse
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { $push: { companyResearch: { company: companyName, contacts: validatedContacts, date: new Date() } } }
    )

    return NextResponse.json({
      success: true,
      company: research.company,
      description: research.description,
      size: research.size,
      revenue: research.revenue,
      industry: research.industry,
      founded: research.founded,
      headquarters: research.headquarters,
      psychology: research.psychology,
      marketIntelligence: research.marketIntelligence,
      contacts: validatedContacts,
      siteContacts: { ...siteContacts, emails: allEmails, phones: allPhones },
      metadata: {
        researchSources: research.sources,
        contactCount: validatedContacts.length,
        confidenceAverage: validatedContacts.reduce((sum, c) => sum + c.confidence, 0) / (validatedContacts.length || 1),
        extractedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[COMPANY] Deep research failed:', error)
    return NextResponse.json({ error: 'Research failed', details: (error as Error).message }, { status: 500 })
  }
}


