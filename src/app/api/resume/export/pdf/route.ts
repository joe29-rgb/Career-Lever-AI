import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const limiter = await isRateLimited((session.user as any).id, 'resume:export:pdf')
		if (limiter) {
			return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
		}

		const schema = z.object({
			html: z.string().min(30).max(200000),
			filename: z.string().max(100).optional(),
		})
		const raw = await request.json()
		const parsed = schema.safeParse(raw)
		if (!parsed.success) {
			return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
		}
		const { html, filename } = parsed.data

		const sanitizeFilename = (name: string) => {
			const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
			return base.endsWith('.pdf') ? base : `${base || 'resume'}.pdf`
		}

    // Ensure proxy is disabled for PDF generation to avoid ERR_NO_SUPPORTED_PROXIES
    const args = [...chromium.args, '--no-proxy-server', '--proxy-bypass-list=*', '--proxy-server="direct://"']
    process.env.HTTP_PROXY = ''
    process.env.http_proxy = ''
    process.env.HTTPS_PROXY = ''
    process.env.https_proxy = ''
    process.env.ALL_PROXY = ''
    process.env.all_proxy = ''
    process.env.NO_PROXY = '*'
    process.env.no_proxy = '*'
    // Prefer system chromium path in Railway if available, fallback to @sparticuz/chromium
    const execPath = process.env.CHROMIUM_PATH || await chromium.executablePath()
    const browser = await puppeteer.launch({
      args,
      executablePath: execPath,
      headless: true,
    })

		const page = await browser.newPage()
    // Ensure minimal HTML skeleton if the client passed text only
    const safeHtml = /<html|<body|<div|<section/i.test(html) ? html : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111">${html.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`
    await page.setContent(safeHtml, { waitUntil: 'networkidle0' })
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
		})
		await browser.close()

		// Convert Node.js Buffer to ArrayBuffer slice accepted by Web Response API
		const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
		return new NextResponse(arrayBuffer as ArrayBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${sanitizeFilename(filename || 'resume.pdf')}"`,
			},
		})
	} catch (error) {
		console.error('PDF export error:', error)
		return NextResponse.json({ error: 'Failed to export PDF' }, { status: 500 })
	}
}


