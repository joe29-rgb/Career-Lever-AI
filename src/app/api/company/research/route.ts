import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()

    const body = await req.json().catch(()=>({})) as any
    let company = (body.company || body.companyName || '').toString().trim()
    if (!company) return NextResponse.json({ error: 'company required' }, { status: 400 })
    
    // CRITICAL FIX: Sanitize company name (remove noise from PDF extraction)
    const originalCompany = company
    company = company
      .replace(/\s*\(.*?\)\s*/g, '') // Remove text in parentheses
      .replace(/\s*-.*$/g, '') // Remove everything after dash
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(/\s+/)
      .slice(0, 5) // Max 5 words
      .join(' ')
    
    console.log('[COMPANY_RESEARCH] Sanitized:', {
      original: originalCompany,
      sanitized: company,
      changed: originalCompany !== company
    })

    const intel = await PerplexityIntelligenceService.researchCompanyV2({ company })
    const contacts = await PerplexityIntelligenceService.hiringContactsV2(company)

    // Normalize contacts with mailto links
    const contactList = (contacts.data || []).map(c => ({
      name: c.name,
      title: c.title,
      department: c.department,
      linkedinUrl: c.linkedinUrl || null,
      email: c.email || null,
      emailType: c.emailType || 'inferred',
      mailto: c.email ? `mailto:${c.email}` : null,
      altEmails: c.alternativeEmails || [],
      source: c.source,
      confidence: c.confidence
    }))

    return NextResponse.json({ success: intel.success && contacts.success, company: intel.data, contacts: contactList, meta: { cached: intel.cached && contacts.cached } })
  } catch (e) {
    return NextResponse.json({ error: 'company research failed' }, { status: 500 })
  }
}

