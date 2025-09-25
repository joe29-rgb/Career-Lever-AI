import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken from '@/models/OAuthToken'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
    const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    const base = (process.env.NEXTAUTH_URL || `${proto}://${host}`).replace(/\/$/, '')
    const clientId = process.env.MS_CLIENT_ID
    const clientSecret = process.env.MS_CLIENT_SECRET
    if (!clientId || !clientSecret) return NextResponse.json({ error: 'Missing Microsoft OAuth env' }, { status: 500 })
    const redirectUri = `${base}/api/oauth/outlook/callback`
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    })
    const tokenJson: any = await tokenRes.json()
    if (!tokenRes.ok) return NextResponse.json({ error: 'Token exchange failed', details: tokenJson }, { status: 400 })
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      await connectToDatabase()
      await OAuthToken.findOneAndUpdate(
        { userId: (session.user as any).id, provider: 'outlook' },
        {
          accessToken: tokenJson.access_token,
          refreshToken: tokenJson.refresh_token,
          scope: tokenJson.scope,
          expiresAt: tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000) : undefined,
        },
        { upsert: true }
      )
      const done = new URL(base)
      done.pathname = '/dashboard'
      return NextResponse.redirect(done)
    } else {
      const signin = new URL(base)
      signin.pathname = '/auth/signin'
      return NextResponse.redirect(signin)
    }
  } catch (e) {
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 })
  }
}


