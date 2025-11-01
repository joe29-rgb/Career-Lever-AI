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

    const { strategy, jobTitle, company } = await request.json()

    if (!strategy) {
      return NextResponse.json({ error: 'Missing salary strategy data' }, { status: 400 })
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
              color: #10b981;
              font-size: 32px;
              margin-bottom: 10px;
              border-bottom: 3px solid #10b981;
              padding-bottom: 10px;
            }
            h2 {
              color: #059669;
              font-size: 24px;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 2px solid #ddd;
              padding-bottom: 8px;
            }
            h3 {
              color: #047857;
              font-size: 18px;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 18px;
              margin-bottom: 30px;
            }
            .salary-range {
              background: #f0fdf4;
              border: 2px solid #10b981;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
              text-align: center;
            }
            .salary-number {
              font-size: 32px;
              font-weight: bold;
              color: #059669;
              margin: 10px 0;
            }
            .strategy-box {
              background: #f8fafc;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
            }
            .tip {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
            }
            .warning {
              background: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background: #f0fdf4;
              color: #059669;
              font-weight: bold;
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
          <h1>💰 Salary Negotiation Strategy</h1>
          <div class="subtitle">${jobTitle} at ${company}</div>

          ${strategy.marketData ? `
            <div class="section">
              <h2>📊 Market Data</h2>
              <div class="salary-range">
                <div><strong>Market Range</strong></div>
                <div class="salary-number">${strategy.marketData.range || 'N/A'}</div>
                ${strategy.marketData.median ? `<div>Median: ${strategy.marketData.median}</div>` : ''}
              </div>
              ${strategy.marketData.sources ? `
                <p><strong>Data Sources:</strong> ${strategy.marketData.sources.join(', ')}</p>
              ` : ''}
            </div>
          ` : ''}

          ${strategy.recommendedRange ? `
            <div class="section">
              <h2>🎯 Your Recommended Range</h2>
              <div class="salary-range">
                <div class="salary-number">${strategy.recommendedRange.min} - ${strategy.recommendedRange.max}</div>
                ${strategy.recommendedRange.target ? `<div><strong>Target:</strong> ${strategy.recommendedRange.target}</div>` : ''}
              </div>
              ${strategy.recommendedRange.reasoning ? `
                <div class="strategy-box">
                  <strong>Reasoning:</strong> ${strategy.recommendedRange.reasoning}
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${strategy.negotiationTactics && strategy.negotiationTactics.length > 0 ? `
            <div class="section">
              <h2>🎭 Negotiation Tactics</h2>
              ${strategy.negotiationTactics.map((tactic: any) => `
                <div class="strategy-box">
                  <h3>${tactic.title || tactic.name}</h3>
                  <p>${tactic.description || tactic.tactic}</p>
                  ${tactic.example ? `<p><strong>Example:</strong> "${tactic.example}"</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${strategy.leveragePoints && strategy.leveragePoints.length > 0 ? `
            <div class="section">
              <h2>💪 Your Leverage Points</h2>
              <ul>
                ${strategy.leveragePoints.map((point: string) => `<li>${point}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${strategy.scriptExamples && strategy.scriptExamples.length > 0 ? `
            <div class="section">
              <h2>💬 Negotiation Scripts</h2>
              ${strategy.scriptExamples.map((script: any) => `
                <div class="strategy-box">
                  <h3>${script.scenario}</h3>
                  <p><strong>What to say:</strong></p>
                  <p style="font-style: italic; padding-left: 15px;">"${script.script}"</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${strategy.benefits && strategy.benefits.length > 0 ? `
            <div class="section">
              <h2>🎁 Benefits to Negotiate</h2>
              <table>
                <thead>
                  <tr>
                    <th>Benefit</th>
                    <th>Priority</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${strategy.benefits.map((benefit: any) => `
                    <tr>
                      <td>${benefit.name || benefit.benefit}</td>
                      <td>${benefit.priority || 'Medium'}</td>
                      <td>${benefit.notes || benefit.value || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${strategy.tips && strategy.tips.length > 0 ? `
            <div class="section">
              <h2>💡 Pro Tips</h2>
              ${strategy.tips.map((tip: string) => `
                <div class="tip">${tip}</div>
              `).join('')}
            </div>
          ` : ''}

          ${strategy.redFlags && strategy.redFlags.length > 0 ? `
            <div class="section">
              <h2>🚩 Red Flags to Avoid</h2>
              ${strategy.redFlags.map((flag: string) => `
                <div class="warning">${flag}</div>
              `).join('')}
            </div>
          ` : ''}

          ${strategy.timeline ? `
            <div class="section">
              <h2>⏱️ Negotiation Timeline</h2>
              <div class="strategy-box">
                ${strategy.timeline.initial ? `<p><strong>Initial Offer:</strong> ${strategy.timeline.initial}</p>` : ''}
                ${strategy.timeline.research ? `<p><strong>Research Phase:</strong> ${strategy.timeline.research}</p>` : ''}
                ${strategy.timeline.counter ? `<p><strong>Counter Offer:</strong> ${strategy.timeline.counter}</p>` : ''}
                ${strategy.timeline.decision ? `<p><strong>Decision:</strong> ${strategy.timeline.decision}</p>` : ''}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated by Career Lever AI • ${new Date().toLocaleDateString()}</p>
            <p>Good luck with your negotiation!</p>
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
        'Content-Disposition': `attachment; filename="Salary-Strategy-${jobTitle.replace(/[^a-z0-9]/gi, '-')}.pdf"`
      }
    })

  } catch (error) {
    console.error('[SALARY_PDF] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
