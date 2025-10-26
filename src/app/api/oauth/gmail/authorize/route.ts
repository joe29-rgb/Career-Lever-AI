import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getOrigin(req: NextRequest): string {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
    const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  } catch { return '' }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.redirect(new URL('/auth/signin', getOrigin(req)))
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectBase = process.env.NEXTAUTH_URL || getOrigin(req)
    if (!clientId || !redirectBase) return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID or base URL' }, { status: 500 })
    const redirectUri = `${redirectBase.replace(/\/$/, '')}/api/oauth/gmail/callback`
    const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.modify openid email profile')
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
    return NextResponse.redirect(url)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to start Gmail OAuth' }, { status: 500 })
  }
}


