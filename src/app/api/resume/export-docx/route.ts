import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resume, filename = 'resume.docx' } = await req.json()

    if (!resume) {
      return NextResponse.json({ error: 'Resume data required' }, { status: 400 })
    }

    console.log('[DOCX_EXPORT] Generating DOCX for user:', session.user.id)

    // Build DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header with name
          new Paragraph({
            text: resume.personalInfo?.name || 'Your Name',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          // Contact info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: [
                  resume.personalInfo?.email,
                  resume.personalInfo?.phone,
                  resume.personalInfo?.location
                ].filter(Boolean).join(' | ')
              })
            ]
          }),

          // Professional Summary
          ...(resume.personalInfo?.summary ? [
            new Paragraph({
              text: 'PROFESSIONAL SUMMARY',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: resume.personalInfo.summary,
              spacing: { after: 400 }
            })
          ] : []),

          // Experience
          ...(resume.experience?.length ? [
            new Paragraph({
              text: 'EXPERIENCE',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...resume.experience.flatMap((exp: any) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: exp.position || 'Position',
                    bold: true
                  })
                ],
                spacing: { before: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.company || 'Company'} | ${exp.location || ''} | ${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`,
                    italics: true
                  })
                ],
                spacing: { after: 100 }
              }),
              ...(exp.achievements || []).map((achievement: string) => 
                new Paragraph({
                  text: `• ${achievement}`,
                  spacing: { after: 50 }
                })
              )
            ])
          ] : []),

          // Education
          ...(resume.education?.length ? [
            new Paragraph({
              text: 'EDUCATION',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...resume.education.flatMap((edu: any) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.degree || 'Degree'} in ${edu.field || 'Field'}`,
                    bold: true
                  })
                ],
                spacing: { before: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.institution || 'Institution'} | ${edu.graduationDate || ''}`,
                    italics: true
                  })
                ],
                spacing: { after: 200 }
              })
            ])
          ] : []),

          // Skills
          ...(resume.skills?.length ? [
            new Paragraph({
              text: 'SKILLS',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: resume.skills.join(' • '),
              spacing: { after: 200 }
            })
          ] : [])
        ]
      }]
    })

    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc)

    console.log('[DOCX_EXPORT] ✅ DOCX generated successfully')

    // Return DOCX as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('[DOCX_EXPORT] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate DOCX',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
