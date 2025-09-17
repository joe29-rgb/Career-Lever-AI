import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anon'
    const limiter = isRateLimited(ip, 'users:signup')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().max(200),
      password: z.string().min(8).max(200),
      title: z.string().max(100).optional(),
      location: z.string().max(100).optional(),
    })
    await connectToDatabase()

    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { name, email, password, title, location } = parsed.data

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      title: title || undefined,
      location: location || undefined,
    })
    await user.save()

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }
}


