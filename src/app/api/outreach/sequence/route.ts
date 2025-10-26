import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    // Two modes: generate or persist custom cadence
    if (body && body.cadence) {
      const schema = z.object({
        applicationId: z.string().optional(),
        cadence: z.array(z.object({
          channel: z.enum(['email','linkedin','call']),
          offsetDays: z.number().min(0).max(60),
          template: z.string().min(20),
        })).min(1).max(10),
      })
      const parsed = schema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: 'Invalid cadence', details: parsed.error.flatten() }, { status: 400 })
      const { applicationId, cadence } = parsed.data as any
      // Guardrails
      const tooAggressive = cadence.filter((c: any) => c.offsetDays <= 3).length > 2
      if (tooAggressive) return NextResponse.json({ error: 'Cadence too aggressive. Space messages further apart.' }, { status: 400 })
      const impolite = cadence.some((c: any) => /urgent|demand|must|immediately/i.test(c.template))
      if (impolite) return NextResponse.json({ error: 'Templates must remain polite. Remove imperative language.' }, { status: 400 })
      await connectToDatabase()
      if (applicationId) {
        const app = await JobApplication.findOne({ _id: applicationId, userId: (session.user as any).id })
        if (app) { app.context = app.context || {}; app.context.outreachCadence = cadence; await app.save() }
      }
      return NextResponse.json({ success: true, sequence: cadence })
    }
    // Generate default sequence
    const { jobTitle, companyName, daysSinceApplication = 3, talkingPoints = [] } = body
    const follow = await AIService.generateFollowUpEmail(jobTitle, companyName, Number(daysSinceApplication), ['Impact bullets','Culture fit'], talkingPoints)
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


