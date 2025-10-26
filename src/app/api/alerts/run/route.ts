import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase()
    const profiles: any[] = await Profile.find({ 'preferences.alerts': { $exists: true } }).lean()
    const after = new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10)
    const results: any[] = []
    for (const p of profiles) {
      const prefs = p.preferences?.alerts || {}
      if (!prefs.jobTitle) continue
      const found = await webScraper.searchJobsByGoogle({ jobTitle: prefs.jobTitle, location: prefs.location, after, limit: 10 })
      results.push({ userId: p.userId, count: found.length })
      // In production, send email/notification here
    }
    return NextResponse.json({ success: true, sent: results })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to run alerts' }, { status: 500 })
  }
}


