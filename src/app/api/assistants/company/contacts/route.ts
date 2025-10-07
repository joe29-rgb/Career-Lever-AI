import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'
import { isRateLimited } from '@/lib/rate-limit'
import connectToDatabase from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = await isRateLimited((session.user as any).id, 'assistants:contacts')
    if (rl) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    await connectToDatabase()
    const { companyName, companyWebsite, roleHints = [], locationHint } = await request.json()
    if (!companyName) return NextResponse.json({ error: 'companyName required' }, { status: 400 })
    const contacts = await webScraper.searchHiringContacts(companyName, roleHints, locationHint)
    const contactInfo = companyWebsite ? await webScraper.scrapeContactInfoFromWebsite(companyWebsite) : { emails: [], phones: [], addresses: [] }
    return NextResponse.json({ success: true, contacts, contactInfo })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}


