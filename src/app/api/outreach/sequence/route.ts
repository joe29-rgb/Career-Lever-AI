import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyName, daysSinceApplication = 3, talkingPoints = [] } = await req.json()
    const follow = await AIService.generateFollowUpEmail(jobTitle, companyName, Number(daysSinceApplication), ['Impact bullets','Culture fit'], talkingPoints)
    // Simple 3-step sequence
    const sequence = [
      { day: 0, channel: 'email', subject: follow.subject, body: follow.body },
      { day: 3, channel: 'linkedin', body: `Hi ${companyName} team — following up on ${jobTitle}. ${talkingPoints.slice(0,2).join(' • ')}` },
      { day: 7, channel: 'email', subject: `Re: ${follow.subject}`, body: `Hi again — I remain excited about ${jobTitle} at ${companyName}. Happy to share specifics on ${talkingPoints.slice(0,2).join(', ')}.` }
    ]
    return NextResponse.json({ success: true, sequence })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate outreach sequence' }, { status: 500 })
  }
}


