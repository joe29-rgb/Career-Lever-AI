import { NextRequest, NextResponse } from 'next/server'
import { PerplexityService } from '@/lib/perplexity-service'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-debug-secret') || ''
    const expected = process.env.DEBUG_SECRET || ''
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const checks: Record<string, any> = {}

    // 1) Basic Perplexity connectivity
    try {
      const ppx = new PerplexityService()
      const out = await ppx.makeRequest('You return only JSON.', 'Return {"ok":true,"ts":1}', { maxTokens: 20, temperature: 0 })
      checks.perplexityBasic = { ok: true, content: (out.content || '').slice(0, 80) }
    } catch (e: any) {
      checks.perplexityBasic = { ok: false, error: (e?.message || '').toString() }
    }

    // 2) Intelligence service
    try {
      const intel = await PerplexityIntelligenceService.researchCompanyV2({ company: 'Acme Inc' })
      checks.companyIntel = { ok: true, company: intel.data?.company || 'Acme Inc', sources: intel.data?.sources?.length || 0 }
    } catch (e: any) {
      checks.companyIntel = { ok: false, error: (e?.message || '').toString() }
    }

    // 3) Job analysis (model path)
    try {
      const jd = 'We need a React + TypeScript frontend engineer to build dashboards. Experience with APIs and testing required.'
      const a = await (AIService as any).analyzeJobDescription(jd)
      checks.jobAnalyze = { ok: true, title: a.jobTitle || '', reqs: (a.keyRequirements || []).length }
    } catch (e: any) {
      checks.jobAnalyze = { ok: false, error: (e?.message || '').toString() }
    }

    // 4) Salary plan (model path)
    try {
      const plan = await (AIService as any).generateSalaryNegotiationPlan({ jobTitle: 'Frontend Engineer', companyName: 'Acme', location: 'San Francisco, CA', seniority: 'mid', offer: { base: 'TBD' }, candidateHighlights: 'Built dashboards; improved performance 30%' })
      checks.salaryPlan = { ok: true, hasTargetRange: Boolean(plan?.targetRange?.base) }
    } catch (e: any) {
      checks.salaryPlan = { ok: false, error: (e?.message || '').toString() }
    }

    return NextResponse.json({ success: true, checks })
  } catch (e) {
    return NextResponse.json({ error: 'QA failed' }, { status: 500 })
  }
}


