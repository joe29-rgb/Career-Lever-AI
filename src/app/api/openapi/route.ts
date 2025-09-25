import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const spec = {
    openapi: '3.0.0',
    info: { title: 'Career Lever API', version: '1.0.0' },
    paths: {
      '/api/insights/success': { post: { summary: 'Score application', responses: { '200': { description: 'OK' } } } },
      '/api/insights/success-v2': { post: { summary: 'Score application v2', responses: { '200': { description: 'OK' } } } },
      '/api/insights/trajectory': { post: { summary: 'Career trajectory plan', responses: { '200': { description: 'OK' } } } },
      '/api/insights/psychology': { post: { summary: 'Employer psychology profile', responses: { '200': { description: 'OK' } } } },
      '/api/insights/salary': { post: { summary: 'Salary negotiation plan', responses: { '200': { description: 'OK' } } } },
      '/api/v2/company/intel': { post: { summary: 'Market intelligence summary', responses: { '200': { description: 'OK' } } } },
      '/api/reverse-market/showcases': { get: { summary: 'List showcases', responses: { '200': { description: 'OK' } } }, post: { summary: 'Create showcase', responses: { '200': { description: 'OK' } } } },
      '/api/reverse-market/bids': { get: { summary: 'List bids', responses: { '200': { description: 'OK' } } }, post: { summary: 'Create bid', responses: { '200': { description: 'OK' } } } },
      '/api/cron/daily': { get: { summary: 'Run daily jobs', responses: { '200': { description: 'OK' } } } },
      '/api/cron/resume-years-backfill': { post: { summary: 'Backfill yearsExperience', responses: { '200': { description: 'OK' } } } },
      '/api/analytics/ab': { get: { summary: 'Get AB events', responses: { '200': { description: 'OK' } } }, post: { summary: 'Log AB event', responses: { '200': { description: 'OK' } } } },
      '/api/assistants/coach': { post: { summary: 'Emotional career coach', responses: { '200': { description: 'OK' } } } },
    }
  }
  return NextResponse.json(spec)
}
