import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken from '@/models/OAuthToken'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const baseHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    const proto = req.headers.get('x-forwarded-proto') || (baseHost.startsWith('localhost') ? 'http' : 'https')
    const base = (process.env.NEXTAUTH_URL || `${proto}://${baseHost}`).replace(/\/$/, '')
    const redirectUri = `${base}/api/oauth/gmail/callback`
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      const out = new URL(base)
      out.pathname = '/auth/signin'
      return NextResponse.redirect(out)
    }
    await connectToDatabase()
    await OAuthToken.findOneAndUpdate(
      { userId: (session.user as any).id, provider: 'gmail' },
      {
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        scope: json.scope,
        expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined,
      },
      { upsert: true }
    )
    const done = new URL(base)
    done.pathname = '/dashboard'
    return NextResponse.redirect(done)
  } catch (e) {
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 })
  }
}


