import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { composeEmail } from '@/lib/email-service'
import Application from '@/models/Application' // Assume model exists or create
import { dbService } from '@/lib/database' // Default import

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple text to base64 for PDFs (not using ApplicationPDFComposer to avoid build issues)
function textToBase64PDF(text: string): string {
  const buffer = Buffer.from(text, 'utf-8')
  return buffer.toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    await dbService.connect()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, resumeText, coverText, contacts, company, jobTitle } = body

    if (!jobId || !contacts?.email || !resumeText || !coverText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[OUTREACH] Composing for job:', jobId)

    // Generate subjects/intros via Perplexity (simple call)
    const subjects = [
      `Experienced ${jobTitle} Ready to Drive Results at ${company}`,
      `Tailored Application for ${jobTitle} Opportunity`,
      `Application: ${jobTitle} - ${company}`
    ]
    const intros = [
      "With my background in [key skill from resume], I'm excited about the ${jobTitle} role at ${company}.",
      "Your ${jobTitle} position aligns perfectly with my experience in [industry].",
      "I'm reaching out regarding the ${jobTitle} opening—my track record in [achievement] makes me a strong fit."
    ]

    // Generate real PDFs using pdf-generator service
    const { generateResumePDF } = await import('@/lib/pdf-generator')
    
    const resumePdfBlob = await generateResumePDF({ 
      text: resumeText, 
      name: `${company}_Resume` 
    })
    const coverPdfBlob = await generateResumePDF({ 
      text: coverText, 
      name: `${company}_CoverLetter` 
    })
    
    // Convert blobs to base64
    const resumeBuffer = Buffer.from(await resumePdfBlob.arrayBuffer())
    const coverBuffer = Buffer.from(await coverPdfBlob.arrayBuffer())
    const resumeBase64 = resumeBuffer.toString('base64')
    const coverBase64 = coverBuffer.toString('base64')

    const emailData = await composeEmail({
      recipient: contacts.email,
      subjects,
      intros,
      resumeText,
      coverText,
      company,
      jobTitle
    })

    // Save application tracking
    const application = new Application({
      userId: session.user.id,
      jobId,
      company,
      jobTitle,
      recipient: contacts.email,
      status: 'composed',
      sentAt: new Date(),
      attachments: ['resume.pdf', 'cover-letter.pdf'],
      metadata: { subjects: subjects.length, intros: intros.length }
    })
    await application.save()

    console.log('[OUTREACH] Application tracked:', application._id)

    return NextResponse.json({
      ...emailData,
      resumePDFBase64: resumeBase64,
      coverLetterPDFBase64: coverBase64,
      instructions: "Use the base64 strings to create downloadable PDFs and attach to your email."
    })

  } catch (error) {
    console.error('[OUTREACH] Compose failed:', error)
    return NextResponse.json({ error: 'Composition failed', details: (error as Error).message }, { status: 500 })
  }
}
