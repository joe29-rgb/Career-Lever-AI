import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { dbService } from '@/lib/database'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover'
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[STRIPE] Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    await dbService.connect()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId || session.client_reference_id

        if (userId) {
          // Update user subscription status
          const { default: Profile } = await import('@/models/Profile')
          await Profile.findOneAndUpdate(
            { userId },
            {
              subscriptionStatus: 'active',
              subscriptionId: session.subscription,
              plan: 'pro',
              subscriptionStartDate: new Date(),
              stripeCustomerId: session.customer
            },
            { upsert: true }
          )

          console.log('[STRIPE] ✅ Subscription activated for user:', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          const { default: Profile } = await import('@/models/Profile')
          await Profile.findOneAndUpdate(
            { userId },
            {
              subscriptionStatus: subscription.status,
              subscriptionId: subscription.id
            }
          )

          console.log('[STRIPE] 📝 Subscription updated for user:', userId, subscription.status)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          const { default: Profile } = await import('@/models/Profile')
          await Profile.findOneAndUpdate(
            { userId },
            {
              subscriptionStatus: 'cancelled',
              plan: 'free',
              subscriptionEndDate: new Date()
            }
          )

          console.log('[STRIPE] ❌ Subscription cancelled for user:', userId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          const { default: Profile } = await import('@/models/Profile')
          await Profile.findOneAndUpdate(
            { subscriptionId },
            {
              subscriptionStatus: 'past_due'
            }
          )

          console.log('[STRIPE] ⚠️ Payment failed for subscription:', subscriptionId)
        }
        break
      }

      default:
        console.log('[STRIPE] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[STRIPE] Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
