import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    const out = new URL(req.nextUrl)
    out.pathname = '/auth/signin'
    return NextResponse.redirect(out)
  } catch (e) {
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 })
  }
}


