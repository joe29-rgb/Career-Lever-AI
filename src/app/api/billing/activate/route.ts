import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'

export const dynamic = 'force-dynamic'

/**
 * POST /api/billing/activate
 * Body: { provider: 'stripe'|'google'|'apple'|'microsoft', token: string, plan?: 'pro'|'company' }
 * Verifies receipt/session with the provider and sets plan on the user's Profile.
 * Note: Provider-specific verification is stubbed with TODO hooks – wire credentials in deployment.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const { provider, token, plan } = await request.json()
    if (!provider || !token) return NextResponse.json({ error: 'Missing provider or token' }, { status: 400 })

    let verified = false
    let targetPlan: 'pro' | 'company' = plan === 'company' ? 'company' : 'pro'
    try {
      switch (provider) {
        case 'stripe': {
          // TODO: verify session or subscription id with Stripe API
          verified = true
          break
        }
        case 'google': {
          // TODO: verify Play Billing purchase token
          verified = true
          break
        }
        case 'apple': {
          // TODO: verify App Store receipt
          verified = true
          break
        }
        case 'microsoft': {
          // TODO: verify Microsoft Store receipt
          verified = true
          break
        }
        default:
          return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
      }
    } catch {
      verified = false
    }

    if (!verified) return NextResponse.json({ error: 'Verification failed' }, { status: 400 })

    const prof: any = await Profile.findOne({ userId: (session.user as any).id })
    if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    prof.plan = targetPlan
    await prof.save()

    return NextResponse.json({ success: true, plan: prof.plan })
  } catch (e) {
    return NextResponse.json({ error: 'Activation error' }, { status: 500 })
  }
}


