import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const limiter = isRateLimited((session.user as any).id, 'resume:export:pdf')
		if (limiter.limited) {
			return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })
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

		const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
		const browser = await puppeteer.launch({
			headless: true,
			executablePath: executablePath || undefined,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--no-zygote',
				'--disable-gpu',
			],
		})

		const page = await browser.newPage()
		await page.setContent(html, { waitUntil: 'networkidle0' })
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


