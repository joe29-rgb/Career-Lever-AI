import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import CoverLetter from '@/models/CoverLetter'
import puppeteer from 'puppeteer'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const application: any = await JobApplication.findOne({
      _id: params.id,
      userId: (session.user as any).id,
    }).lean()
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Fetch tailored resume version for this application
    const resumes = await Resume.find({
      userId: (session.user as any).id,
      'customizedVersions.jobApplicationId': application._id,
    }).lean()

    let tailoredResumeText = ''
    if (resumes?.length) {
      const versions = resumes.flatMap((r: any) => (r.customizedVersions || [])
        .filter((v: any) => String(v.jobApplicationId) === String(application._id)))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (versions.length) tailoredResumeText = versions[0].customizedText
    }

    // Fetch cover letter if attached
    let coverLetterText = ''
    if (application.coverLetterId) {
      const cl: any = await CoverLetter.findById(application.coverLetterId).lean()
      if (cl && typeof cl.content === 'string') coverLetterText = cl.content
    }

    const analysis = application.analysis || {}
    const talkingPoints = Array.isArray(analysis.companyCulture) ? analysis.companyCulture : []

    const html = buildPackHtml({
      jobTitle: application.jobTitle,
      companyName: application.companyName,
      tailoredResumeText,
      coverLetterText,
      talkingPoints,
    })

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } })
    await browser.close()

    const arrayBuffer = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength)
    return new NextResponse(arrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${application.companyName}_${application.jobTitle}_ApplicationPack.pdf"`,
      },
    })
  } catch (e) {
    console.error('Export pack error:', e)
    return NextResponse.json({ error: 'Failed to export application pack' }, { status: 500 })
  }
}

function buildPackHtml(params: { jobTitle: string; companyName: string; tailoredResumeText: string; coverLetterText: string; talkingPoints: string[] }) {
  const { jobTitle, companyName, tailoredResumeText, coverLetterText, talkingPoints } = params
  const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${companyName} - ${jobTitle} Pack</title>
  <style>
    body{font-family:Arial, sans-serif; font-size:11pt; color:#333; line-height:1.5;}
    h1{font-size:20pt;margin:0}
    h2{font-size:14pt;margin-top:18px;border-bottom:1px solid #ddd;padding-bottom:4px;color:#0066cc}
    .section{margin-top:16px}
    pre{white-space:pre-wrap}
    ul{margin:6px 0 0 18px}
  </style>
  </head><body>
  <h1>${esc(companyName)} — ${esc(jobTitle)} Application Pack</h1>
  <div class="section">
    <h2>Cover Letter</h2>
    <pre>${esc(coverLetterText || 'No cover letter attached.')}</pre>
  </div>
  <div class="section">
    <h2>Tailored Resume</h2>
    <pre>${esc(tailoredResumeText || 'No tailored resume found for this application.')}</pre>
  </div>
  <div class="section">
    <h2>Talking Points</h2>
    ${talkingPoints && talkingPoints.length ? `<ul>${talkingPoints.map(tp => `<li>${esc(tp)}</li>`).join('')}</ul>` : '<div>No saved talking points.</div>'}
  </div>
  </body></html>`
}


