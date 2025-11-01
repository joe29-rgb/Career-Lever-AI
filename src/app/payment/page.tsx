'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Loader2, CreditCard } from 'lucide-react'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const cancelled = searchParams?.get('payment') === 'cancelled'

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Payment error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            🚀 Career Lever AI Pro
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered career companion
          </p>
        </div>

        {cancelled && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl text-center">
            <p className="text-yellow-800 font-semibold">
              Payment was cancelled. Ready to try again?
            </p>
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-8 border-4 border-blue-500 relative overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-bl-2xl font-bold">
            LAUNCH SPECIAL
          </div>

          <div className="text-center mb-8 mt-4">
            <div className="text-6xl font-bold text-foreground mb-2">
              $4.99
              <span className="text-2xl text-gray-600 font-normal">/week</span>
            </div>
            <p className="text-gray-600">Cancel anytime • No hidden fees</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">What's Included:</h3>
            
            {[
              'AI-Powered Resume Builder with 6 templates',
              'Unlimited Job Search across 25+ boards',
              'AI Interview Prep with company-specific questions',
              'Salary Negotiation Guide with market data',
              'Personalized Cover Letter Generator',
              'Email Outreach to hiring managers',
              'Application Tracking & Analytics',
              'Resume A/B Testing & Optimization',
              'ATS Score Checker',
              'Priority Support'
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                Subscribe Now
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Secure payment powered by Stripe • Cancel anytime
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Money-Back Guarantee</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-card rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Can I cancel anytime?</h4>
              <p className="text-gray-600">Yes! Cancel anytime from your account settings. No questions asked.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-1">Is there a free trial?</h4>
              <p className="text-gray-600">We offer a 7-day money-back guarantee. Try it risk-free!</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-1">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit cards through Stripe's secure payment system.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-1">How does billing work?</h4>
              <p className="text-gray-600">You'll be charged $4.99 every week. You can cancel anytime before your next billing date.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>}>
      <PaymentContent />
    </Suspense>
  )
}
