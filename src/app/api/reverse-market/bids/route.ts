import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import EmployerBid from '@/models/EmployerBid'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json()
    const created = await EmployerBid.create(body)
    return NextResponse.json({ success: true, bid: created })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const url = new URL(req.url)
    const showcaseId = url.searchParams.get('showcaseId')
    const filter: any = {}
    if (showcaseId) filter.showcaseId = showcaseId
    const items = await EmployerBid.find(filter).sort({ createdAt: -1 }).limit(100)
    return NextResponse.json({ success: true, bids: items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list bids' }, { status: 500 })
  }
}


