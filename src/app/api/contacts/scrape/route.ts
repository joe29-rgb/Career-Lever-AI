/**
 * Contact Scraper API
 * 
 * Scrapes hiring manager contacts from multiple sources
 * POST /api/contacts/scrape
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { contactScraper } from '@/lib/contact-scraper'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60 // Contact scraping can take time

interface ScrapeRequest {
  companyName: string
  companyWebsite?: string
  linkedinCompanyUrl?: string
  jobTitle?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Rate limiting (max 10 scrapes per hour)
    if (await isRateLimited(session.user.id, 'contact-scrape')) {
      return NextResponse.json({ 
        success: false,
        error: 'Too many scrape requests. Please wait before trying again.' 
      }, { status: 429 })
    }
    
    // Parse request
    const body: ScrapeRequest = await request.json()
    const { companyName, companyWebsite, linkedinCompanyUrl, jobTitle } = body
    
    if (!companyName) {
      return NextResponse.json({ 
        success: false,
        error: 'Company name is required' 
      }, { status: 400 })
    }
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('[CONTACT_SCRAPE] NEW REQUEST')
    console.log('═══════════════════════════════════════════════════════')
    console.log('[CONTACT_SCRAPE] Company:', companyName)
    console.log('[CONTACT_SCRAPE] Website:', companyWebsite || 'N/A')
    console.log('[CONTACT_SCRAPE] LinkedIn:', linkedinCompanyUrl || 'N/A')
    console.log('[CONTACT_SCRAPE] Target Title:', jobTitle || 'Any')
    console.log('─────────────────────────────────────────────────────────')
    
    // Scrape contacts
    const result = await contactScraper.scrapeContacts({
      companyName,
      companyWebsite,
      linkedinCompanyUrl,
      jobTitle
    })
    
    // Enrich contacts with guessed emails if domain available
    if (companyWebsite) {
      try {
        const domain = new URL(companyWebsite).hostname.replace('www.', '')
        result.contacts = result.contacts.map(contact => 
          contactScraper.enrichContact(contact, domain)
        )
      } catch (error) {
        console.error('[CONTACT_SCRAPE] Error enriching contacts:', error)
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log('[CONTACT_SCRAPE] ✅ Complete')
    console.log('[CONTACT_SCRAPE] Found:', result.totalFound, 'contacts')
    console.log('[CONTACT_SCRAPE] Methods:', result.method.join(', '))
    console.log('[CONTACT_SCRAPE] Duration:', duration + 'ms')
    console.log('═══════════════════════════════════════════════════════')
    
    return NextResponse.json({
      ...result,
      metadata: {
        duration,
        userId: session.user.id,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('[CONTACT_SCRAPE] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape contacts',
      details: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        duration: Date.now() - startTime
      }
    }, { status: 500 })
  }
}
