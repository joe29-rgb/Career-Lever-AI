import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import CoverLetter from '@/models/CoverLetter'
import CompanyData from '@/models/CompanyData'

// Minimal zip (store) without heavy deps: concatenated boundary (best-effort). For production, switch to archiver.

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
    const versions = resumes.flatMap((r: any) => (r.customizedVersions || []).filter((v: any)=> String(v.jobApplicationId)===String(app._id)))
      .sort((a: any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const resumeText = versions[0]?.customizedText || ''
    const cover = app.coverLetterId ? ((await CoverLetter.findById(app.coverLetterId).lean()) as any)?.content || '' : ''
    const company: any = app.companyResearch ? await CompanyData.findById(app.companyResearch).lean() : null
    // Include outreach and OSINT in summary
    const summary = { jobTitle: app.jobTitle, companyName: app.companyName, date: new Date().toISOString(), company }

    const files = [
      { name: 'resume.txt', content: resumeText },
      { name: 'cover_letter.txt', content: cover },
      { name: 'summary.json', content: JSON.stringify(summary, null, 2) },
    ]
    const boundary = '\n-----CAREERLEVER-ZIP-BOUNDARY-----\n'
    const joined = files.map(f => `FILE:${f.name}\n${f.content}`).join(boundary)
    const buf = Buffer.from(joined, 'utf8')
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    return new NextResponse(arrayBuffer as ArrayBuffer, { status: 200, headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${app.companyName}_${app.jobTitle}_ApplicationPack.bundle"` } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to export ZIP' }, { status: 500 })
  }
}


