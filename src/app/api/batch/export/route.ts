import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { batchExportApplications } from '@/lib/batch/operations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/batch/export?format=csv|json|pdf
 * Export all applications in specified format
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'json' | 'pdf'

    if (!['csv', 'json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, json, or pdf' },
        { status: 400 }
      )
    }

    console.log(`[BATCH_EXPORT] User ${session.user.id} exporting as ${format}`)

    const result = await batchExportApplications(session.user.id, format)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Export failed' },
        { status: 500 }
      )
    }

    console.log(`[BATCH_EXPORT] Complete: ${result.recordCount} records exported`)

    // Set appropriate content type and headers
    const contentTypes = {
      csv: 'text/csv',
      json: 'application/json',
      pdf: 'text/plain' // Would be application/pdf with real PDF generation
    }

    const fileExtensions = {
      csv: 'csv',
      json: 'json',
      pdf: 'txt' // Would be pdf with real PDF generation
    }

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': contentTypes[format],
        'Content-Disposition': `attachment; filename="applications.${fileExtensions[format]}"`,
        'X-Record-Count': result.recordCount.toString()
      }
    })
  } catch (error) {
    console.error('[BATCH_EXPORT] Error:', error)
    return NextResponse.json(
      {
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
