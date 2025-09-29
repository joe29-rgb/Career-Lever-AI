import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyName, jobDescription, resumeText, companyData, tone = 'professional', length = 'medium', jobApplicationId } = await request.json()
    if (!jobTitle || !companyName || !jobDescription || !resumeText) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    let mergedCompany = companyData
    try {
      if (jobApplicationId) {
        await connectToDatabase()
        const app = await JobApplication.findOne({ _id: jobApplicationId, userId: (session.user as any).id })
        if (app?.context?.companyData) mergedCompany = { ...(mergedCompany || {}), ...app.context.companyData }
      }
    } catch {}
    const ppx = new PerplexityService()
    const systemPrompt = `You are an expert cover letter writer with access to current company information and hiring trends. Return full letter text only.`
    const userPrompt = `Create a cover letter for ${jobTitle} at ${companyName}.

Job Description:\n${jobDescription}

Resume:\n${resumeText}

Company Data:\n${JSON.stringify(mergedCompany || {}, null, 2)}

Tone: ${tone}, Length: ${length}`
    const result = await ppx.makeRequest(systemPrompt, userPrompt, { maxTokens: 1500, temperature: 0.4 })
    return NextResponse.json({ success: true, coverLetter: (result.content || '').trim() })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}


