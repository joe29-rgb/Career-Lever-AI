import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
	try {
		const { html, filename } = await request.json()
		if (!html || typeof html !== 'string') {
			return NextResponse.json({ error: 'Missing html' }, { status: 400 })
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
				'Content-Disposition': `attachment; filename="${(filename as string) || 'resume.pdf'}"`,
			},
		})
	} catch (error) {
		console.error('PDF export error:', error)
		return NextResponse.json({ error: 'Failed to export PDF' }, { status: 500 })
	}
}


