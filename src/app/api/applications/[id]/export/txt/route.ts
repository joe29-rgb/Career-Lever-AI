import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import CoverLetter from '@/models/CoverLetter'
import CompanyData from '@/models/CompanyData'
import { AIService } from '@/lib/ai-service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const app: any = await JobApplication.findOne({ _id: params.id, userId: (session.user as any).id }).lean()
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const resumes = await Resume.find({ userId: (session.user as any).id, 'customizedVersions.jobApplicationId': app._id }).lean()
    let resumeText = ''
    if (resumes?.length) {
      const versions = resumes.flatMap((r: any) => (r.customizedVersions || []).filter((v: any) => String(v.jobApplicationId) === String(app._id)))
        .sort((a: any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (versions.length) resumeText = versions[0].customizedText
    }
    let cover = ''
    if (app.coverLetterId) {
      const cl: any = await CoverLetter.findById(app.coverLetterId).lean()
      cover = cl?.content || ''
    }
    let company: any = null
    if (app.companyResearch) company = await CompanyData.findById(app.companyResearch).lean()
    let outreach = { subject: '', body: '' }
    try {
      const days = app.appliedDate ? Math.max(0, Math.round((Date.now() - new Date(app.appliedDate).getTime())/(24*60*60*1000))) : 3
      outreach = await AIService.generateFollowUpEmail(app.jobTitle, app.companyName, days, ['Impact','Culture'], [])
    } catch {}

    const text = [
      `=== ${app.companyName} — ${app.jobTitle} Application Pack (TXT) ===`,
      '',
      '--- Cover Letter ---',
      cover || 'N/A',
      '',
      '--- Tailored Resume ---',
      resumeText || 'N/A',
      '',
      '--- Company Insights (OSINT) ---',
      company ? `Glassdoor: ${company.glassdoorRating || 'N/A'} (${company.glassdoorReviews || 0} reviews)` : 'N/A',
      company?.culture?.length ? `Culture: ${company.culture.join(', ')}` : '',
      company?.recentNews?.length ? `Recent News:\n${company.recentNews.slice(0,5).map((n:any)=> `- ${n.title} (${n.url})`).join('\n')}` : '',
      '',
      '--- Outreach Email ---',
      outreach.subject ? `Subject: ${outreach.subject}\n\n${outreach.body}` : 'N/A'
    ].filter(Boolean).join('\n')

    const buf = Buffer.from(text, 'utf8')
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    return new NextResponse(arrayBuffer as ArrayBuffer, { status: 200, headers: { 'Content-Type': 'text/plain', 'Content-Disposition': `attachment; filename="${app.companyName}_${app.jobTitle}_ApplicationPack.txt"` } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to export TXT pack' }, { status: 500 })
  }
}


