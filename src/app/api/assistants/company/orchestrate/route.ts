import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import CompanyData from '@/models/CompanyData'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { companyName, jobPostingUrl, companyWebsite } = await request.json()
    if (!companyName || typeof companyName !== 'string') return NextResponse.json({ error: 'companyName required' }, { status: 400 })

    await connectToDatabase()
    const cached = await CompanyData.findOne({ companyName: new RegExp(companyName, 'i'), expiresAt: { $gt: new Date() } })
    if (cached) {
      return NextResponse.json({ success: true, companyData: cached })
    }

    const data = await webScraper.scrapeCompanyData(companyName, companyWebsite)
    const doc = new CompanyData({ ...data, cachedAt: new Date(), expiresAt: new Date(Date.now()+7*24*60*60*1000) })
    await doc.save()
    return NextResponse.json({ success: true, companyData: doc })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to orchestrate company research' }, { status: 500 })
  }
}


