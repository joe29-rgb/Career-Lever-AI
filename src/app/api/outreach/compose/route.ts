import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { composeEmail } from '@/lib/email-service'
import Application from '@/models/Application' // Assume model exists or create
import connectToDatabase from '@/lib/mongodb' // Default import
import { ApplicationPDFComposer } from '@/lib/pdf-composer'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
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

    const pdfComposer = new ApplicationPDFComposer()
    const packageData = await pdfComposer.generateApplicationPackage(resumeText, coverText, { jobId, company, jobTitle })

    // Convert blobs to base64
    const resumeBase64 = await blobToBase64(packageData.resumePDF)
    const coverBase64 = await blobToBase64(packageData.coverLetterPDF)

    // Helper function (add at top)
    function blobToBase64(blob: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

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
      success: true,
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
