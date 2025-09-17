import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'
import OpenAI from 'openai'
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs, logAIUsage } from '@/lib/observability'
import { redisGetJSON, redisSetJSON } from '@/lib/redis'
import { webScraper } from '@/lib/web-scraper'
import { AIService } from '@/lib/ai-service'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request.headers)
    const startedAt = now()
    const routeKey = 'company:orchestrate'
    logRequestStart(routeKey, requestId)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = isRateLimited((session.user as any).id, 'company:orchestrate')
    if (rl.limited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const assistantId = process.env.OPENAI_ASSISTANT_COMPANY_SCRAPER
    if (!assistantId) {
      return NextResponse.json({ error: 'OPENAI_ASSISTANT_COMPANY_SCRAPER not set' }, { status: 400 })
    }

    const schema = z.object({
      companyName: z.string().min(2),
      jobPostingUrl: z.string().url().optional(),
      companyWebsite: z.string().url().optional(),
      linkedinCompanyUrl: z.string().url().optional(),
      roleHints: z.array(z.string()).default(['Recruiter','Talent Acquisition','Engineering Manager','Head of People']),
      locationHint: z.string().optional(),
      jobTitle: z.string().optional(),
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyName, jobPostingUrl, companyWebsite, linkedinCompanyUrl, roleHints, locationHint, jobTitle } = parsed.data as any

    // Redis cache: key by companyName+jobPostingUrl
    const cacheKey = `company:orchestrate:${companyName}:${jobPostingUrl || ''}`
    const cached = await redisGetJSON<any>(cacheKey)
    if (cached) {
      logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'hit' })
      return NextResponse.json({ success: true, result: cached, cache: 'hit' })
    }

    const contextMsg = `Company research request.\nCompany: ${companyName}\nJob Title: ${jobTitle || ''}\nPosting: ${jobPostingUrl || ''}\nWebsite: ${companyWebsite || ''}\nLinkedIn: ${linkedinCompanyUrl || ''}\nRole Hints: ${roleHints.join(', ')}\nLocation: ${locationHint || ''}`

    const thread = await openai.beta.threads.create({})
    await openai.beta.threads.messages.create(thread.id, { role: 'user', content: contextMsg })

    let run: any = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistantId })

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls
        const tool_outputs = await Promise.all(toolCalls.map(async (tc: any) => {
          const fn = tc.function
          try {
            const args = JSON.parse(fn.arguments || '{}')
            switch (fn.name) {
              case 'fetch_company_research': {
                const data = await webScraper.scrapeCompanyData(args.companyName || companyName, args.companyWebsite || companyWebsite)
                return { tool_call_id: tc.id, output: JSON.stringify({ success: true, companyData: data }) }
              }
              case 'fetch_reviews_summary': {
                const summary = await webScraper.scrapeGlassdoorReviewsSummary(args.companyName || companyName)
                return { tool_call_id: tc.id, output: JSON.stringify({ success: true, summary }) }
              }
              case 'fetch_contacts': {
                let site = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] }
                if (args.companyWebsite || companyWebsite) {
                  try { site = await webScraper.scrapeContactInfoFromWebsite(args.companyWebsite || companyWebsite) } catch {}
                }
                const people = await webScraper.searchHiringContacts(args.companyName || companyName, args.roleHints || roleHints, args.locationHint || locationHint)
                return { tool_call_id: tc.id, output: JSON.stringify({ success: true, contacts: { site, people } }) }
              }
              case 'generate_company_insights': {
                const insights = await AIService.generateCompanyInsights(args.companyData || {}, args.jobTitle || jobTitle || 'Candidate')
                return { tool_call_id: tc.id, output: JSON.stringify({ success: true, insights }) }
              }
              default:
                return { tool_call_id: tc.id, output: JSON.stringify({ success: false, error: 'Unknown tool' }) }
            }
          } catch (e) {
            return { tool_call_id: tc.id, output: JSON.stringify({ success: false, error: 'Tool failure' }) }
          }
        }))
        run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs })
        continue
      }
      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id)
        const last = messages.data.find((m) => m.role === 'assistant')
        const content = last?.content?.[0]
        const text = (content && 'text' in content) ? (content as any).text.value : undefined
        if (!text) return NextResponse.json({ error: 'No content' }, { status: 500 })
        try {
          const json = JSON.parse(text)
          await redisSetJSON(cacheKey, json, 60 * 30) // 30 minutes
          logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'miss' })
          return NextResponse.json({ success: true, result: json })
        } catch {
          logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { raw: true })
          return NextResponse.json({ success: true, raw: text })
        }
      }
      if ([ 'failed','cancelled','expired' ].includes(run.status)) {
        logRequestEnd(routeKey, requestId, 500, durationMs(startedAt), { status: run.status })
        return NextResponse.json({ error: `Assistant run ${run.status}` }, { status: 500 })
      }
      await new Promise(r => setTimeout(r, 600))
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    }
  } catch (e) {
    console.error('Company orchestrate error:', e)
    return NextResponse.json({ error: 'Failed to orchestrate company research' }, { status: 500 })
  }
}


