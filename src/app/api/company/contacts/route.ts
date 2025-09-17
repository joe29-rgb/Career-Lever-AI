import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { webScraper } from '@/lib/web-scraper'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = isRateLimited((session.user as any).id, 'company:contacts')
    if (rl.limited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const schema = z.object({
      companyName: z.string().min(2),
      companyWebsite: z.string().url().optional(),
      roleHints: z.array(z.string()).min(1),
      locationHint: z.string().optional()
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyName, companyWebsite, roleHints, locationHint } = parsed.data as any

    // Scrape website contact info (best-effort)
    let siteContacts = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] }
    if (companyWebsite) {
      try { siteContacts = await webScraper.scrapeContactInfoFromWebsite(companyWebsite) } catch {}
    }

    // Find likely hiring contacts via Google→LinkedIn
    const hiring = await webScraper.searchHiringContacts(companyName, roleHints, locationHint)

    return NextResponse.json({ success: true, contacts: { site: siteContacts, people: hiring } })
  } catch (e) {
    console.error('Company contacts error:', e)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}


