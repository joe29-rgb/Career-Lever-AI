import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  samples: z.array(z.string().min(50)).min(1).max(5),
  tone: z.string().optional(),
  sentenceLength: z.string().optional(),
  vocabulary: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    await connectToDatabase()
    const { samples, tone, sentenceLength, vocabulary } = parsed.data
    const examples = samples.slice(0, 5)
    await Profile.findOneAndUpdate(
      { userId: (session.user as any).id },
      { $set: { styleProfile: { tone, sentenceLength, vocabulary, examples } } },
      { upsert: true }
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to learn style' }, { status: 500 })
  }
}


