import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const schema = z.object({
      content: z.string().min(50),
      filename: z.string().optional(),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { content, filename } = parsed.data

    // ATS-friendly: return as .doc for ATS that prefer legacy Word, or .docx if requested
    const name = (filename || 'resume') + ((filename && /\.docx$/i.test(filename)) ? '' : '.doc')
    const blob = Buffer.from(content, 'utf8')
    const arrayBuffer = blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength)
    return new NextResponse(arrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${name}"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to export DOCX' }, { status: 500 })
  }
}


