import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  try {
    await connectToDatabase()
    const cursor = await Resume.find({ $or: [{ yearsExperience: { $exists: false } }, { yearsExperience: null }] }).limit(500)
    let updated = 0
    for (const r of cursor) {
      try {
        const text: string = (r as any).extractedText || ''
        let years = 0
        // Heuristic: count year ranges like 2012-2016, 2018–2021, etc.
        const matches = text.match(/(19|20)\d{2}\s*[–-]\s*(19|20)\d{2}/g) || []
        const spans = matches.map(m => {
          const parts = m.split(/[–-]/).map(x => parseInt(x.trim()))
          return Math.max(0, (parts[1] || 0) - (parts[0] || 0))
        })
        const sum = spans.reduce((a, b) => a + b, 0)
        years = Math.max(years, Math.round(sum || 0))
        if (years > 0) {
          await Resume.updateOne({ _id: (r as any)._id }, { $set: { yearsExperience: years } })
          updated++
        }
      } catch {}
    }
    return NextResponse.json({ success: true, updated })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to backfill years' }, { status: 500 })
  }
}


