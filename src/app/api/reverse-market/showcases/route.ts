import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import CandidateShowcase from '@/models/CandidateShowcase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const body = await req.json()
    const created = await CandidateShowcase.create({ userId: (session.user as any).id, ...body })
    return NextResponse.json({ success: true, showcase: created })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create showcase' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const url = new URL(req.url)
    const anonymous = url.searchParams.get('anonymous')
    const mine = url.searchParams.get('mine')
    const filter: any = {}
    if (anonymous != null) filter.anonymous = anonymous === 'true'
    if (mine === 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      filter.userId = (session.user as any).id
    }
    const items = await CandidateShowcase.find(filter).sort({ createdAt: -1 }).limit(100)
    return NextResponse.json({ success: true, showcases: items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list showcases' }, { status: 500 })
  }
}


