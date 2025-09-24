import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken from '@/models/OAuthToken'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${(process.env.NEXTAUTH_URL || (req.headers.get('x-forwarded-proto')||'https') + '://' + req.headers.get('x-forwarded-host') || req.headers.get('host'))}/api/oauth/gmail/callback`
    if (!clientId || !clientSecret) return NextResponse.json({ error: 'Missing Google OAuth env' }, { status: 500 })
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
    const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    const json = await res.json() as any
    if (!res.ok) return NextResponse.json({ error: 'Token exchange failed', details: json }, { status: 400 })
    // We do not have session in callback easily; store temp and redirect client to POST /api/oauth/gmail with tokens
    const out = new URL(req.nextUrl)
    out.pathname = '/auth/signin'
    return NextResponse.redirect(out)
  } catch (e) {
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 })
  }
}


