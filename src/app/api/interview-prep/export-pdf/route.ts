import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prep, jobTitle, company } = await request.json()

    if (!prep) {
      return NextResponse.json({ error: 'Missing interview prep data' }, { status: 400 })
    }

    // Generate HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1 {
              color: #2563eb;
              font-size: 32px;
              margin-bottom: 10px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #1e40af;
              font-size: 24px;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 2px solid #ddd;
              padding-bottom: 8px;
            }
            h3 {
              color: #1e3a8a;
              font-size: 18px;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 18px;
              margin-bottom: 30px;
            }
            .question {
              background: #f8fafc;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
            }
            .question-text {
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
            }
            .answer {
              color: #475569;
              margin-top: 8px;
              padding-left: 10px;
            }
            ul {
              margin: 10px 0;
              padding-left: 25px;
            }
            li {
              margin: 8px 0;
            }
            .section {
              margin-bottom: 30px;
            }
            .tip {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>🎯 Interview Preparation</h1>
          <div class="subtitle">${jobTitle} at ${company}</div>

          ${prep.commonQuestions && prep.commonQuestions.length > 0 ? `
            <div class="section">
              <h2>💬 Common Interview Questions</h2>
              ${prep.commonQuestions.map((q: any) => `
                <div class="question">
                  <div class="question-text">Q: ${q.question}</div>
                  ${q.suggestedAnswer ? `<div class="answer"><strong>Suggested Answer:</strong> ${q.suggestedAnswer}</div>` : ''}
                  ${q.tips ? `<div class="answer"><strong>Tips:</strong> ${q.tips}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${prep.behavioralQuestions && prep.behavioralQuestions.length > 0 ? `
            <div class="section">
              <h2>🧠 Behavioral Questions</h2>
              ${prep.behavioralQuestions.map((q: any) => `
                <div class="question">
                  <div class="question-text">Q: ${q.question}</div>
                  ${q.starFramework ? `
                    <div class="answer">
                      <strong>STAR Framework:</strong>
                      <ul>
                        ${q.starFramework.situation ? `<li><strong>Situation:</strong> ${q.starFramework.situation}</li>` : ''}
                        ${q.starFramework.task ? `<li><strong>Task:</strong> ${q.starFramework.task}</li>` : ''}
                        ${q.starFramework.action ? `<li><strong>Action:</strong> ${q.starFramework.action}</li>` : ''}
                        ${q.starFramework.result ? `<li><strong>Result:</strong> ${q.starFramework.result}</li>` : ''}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${prep.technicalQuestions && prep.technicalQuestions.length > 0 ? `
            <div class="section">
              <h2>💻 Technical Questions</h2>
              ${prep.technicalQuestions.map((q: any) => `
                <div class="question">
                  <div class="question-text">Q: ${q.question}</div>
                  ${q.keyPoints ? `
                    <div class="answer">
                      <strong>Key Points:</strong>
                      <ul>
                        ${q.keyPoints.map((point: string) => `<li>${point}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${prep.companySpecificQuestions && prep.companySpecificQuestions.length > 0 ? `
            <div class="section">
              <h2>🏢 Company-Specific Questions</h2>
              ${prep.companySpecificQuestions.map((q: any) => `
                <div class="question">
                  <div class="question-text">Q: ${q.question}</div>
                  ${q.context ? `<div class="answer"><strong>Context:</strong> ${q.context}</div>` : ''}
                  ${q.suggestedAnswer ? `<div class="answer"><strong>Suggested Answer:</strong> ${q.suggestedAnswer}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${prep.questionsToAsk && prep.questionsToAsk.length > 0 ? `
            <div class="section">
              <h2>❓ Questions to Ask the Interviewer</h2>
              <ul>
                ${prep.questionsToAsk.map((q: string) => `<li>${q}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${prep.interviewTips && prep.interviewTips.length > 0 ? `
            <div class="section">
              <h2>💡 Interview Tips</h2>
              ${prep.interviewTips.map((tip: string) => `
                <div class="tip">${tip}</div>
              `).join('')}
            </div>
          ` : ''}

          ${prep.redFlags && prep.redFlags.length > 0 ? `
            <div class="section">
              <h2>🚩 Red Flags to Watch For</h2>
              <ul>
                ${prep.redFlags.map((flag: string) => `<li>${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated by Career Lever AI • ${new Date().toLocaleDateString()}</p>
            <p>Good luck with your interview!</p>
          </div>
        </body>
      </html>
    `

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })

    await browser.close()

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Interview-Prep-${jobTitle.replace(/[^a-z0-9]/gi, '-')}.pdf"`
      }
    })

  } catch (error) {
    console.error('[INTERVIEW_PDF] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
