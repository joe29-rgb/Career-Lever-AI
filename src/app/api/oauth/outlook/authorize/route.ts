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
    const clientId = process.env.MS_CLIENT_ID
    const redirectBase = process.env.NEXTAUTH_URL || getOrigin(req)
    if (!clientId || !redirectBase) return NextResponse.json({ error: 'Missing MS_CLIENT_ID or base URL' }, { status: 500 })
    const redirectUri = `${redirectBase.replace(/\/$/, '')}/api/oauth/outlook/callback`
    const scope = encodeURIComponent('https://graph.microsoft.com/Mail.Read offline_access openid email profile')
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}`
    return NextResponse.redirect(url)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to start Outlook OAuth' }, { status: 500 })
  }
}


