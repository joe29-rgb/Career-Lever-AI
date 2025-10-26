import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const templates = [
  { id: 'classic', name: 'Classic (ATS Safe)', formats: ['doc','pdf'], description: 'Single-column, bullets, no tables' },
  { id: 'modern', name: 'Modern (ATS Safe)', formats: ['docx','pdf'], description: 'Single-column with section dividers' },
  { id: 'compact', name: 'Compact (ATS Safe)', formats: ['doc','pdf'], description: 'Dense layout for 1 page' },
]

export async function GET() {
  return NextResponse.json({ success: true, templates })
}


