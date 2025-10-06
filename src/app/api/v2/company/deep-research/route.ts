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
    const { companyName, companyWebsite, targetRole, location } = body

    if (!companyName) {
      return NextResponse.json({ error: 'Missing companyName' }, { status: 400 })
    }

    console.log('[COMPANY] Researching:', companyName)

    // Step 1: Basic company research via Perplexity V2
    const research = await PerplexityIntelligenceService.researchCompanyV2({ 
      company: companyName, 
      role: targetRole, 
      geo: location 
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
    const validatedContacts = allEmails.map(email => ({
      email,
      confidence: perplexityEmails.includes(email) ? 85 : 60, // Higher for Perplexity
      sources: perplexityEmails.includes(email) ? ['Perplexity', 'LinkedIn'] : ['Site Scrape']
    }))

    // Save to profile for reuse
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { $push: { companyResearch: { company: companyName, contacts: validatedContacts, date: new Date() } } }
    )

    return NextResponse.json({
      success: true,
      company: research.data.company,
      description: research.data.description,
      size: research.data.size,
      revenue: research.data.revenue,
      industry: research.data.industry,
      founded: research.data.founded,
      headquarters: research.data.headquarters,
      psychology: research.data.psychology,
      marketIntelligence: research.data.marketIntelligence,
      contacts: validatedContacts,
      siteContacts: { ...siteContacts, emails: allEmails, phones: allPhones },
      metadata: {
        researchSources: research.data.sources,
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


