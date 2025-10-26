import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(200),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(200)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  title: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  role: z.enum(['job_seeker', 'recruiter', 'admin']).optional().default('job_seeker'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anon'
    const isLimited = await isRateLimited(ip, 'users:signup')
    if (isLimited) {
      return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 })
    }

    // Connect to database
    await connectToDatabase()

    // Parse and validate input
    const raw = await request.json()
    const parsed = signupSchema.safeParse(raw)
    
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: errors 
      }, { status: 400 })
    }

    const { name, email, password, title, location, role } = parsed.data

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    // Hash password with stronger salt rounds
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user with proper defaults
    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      title: title || undefined,
      location: location || undefined,
      role: role || 'job_seeker',
      createdAt: new Date(),
      emailVerified: false,
      profile: {
        onboardingCompleted: false,
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
        }
      }
    })

    await user.save()

    logger.info('User created successfully', { 
      userId: user._id, 
      email: user.email,
      role: user.role 
    })

    // Return success without sensitive data
    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 })

  } catch (error) {
    logger.error('Signup error:', error)
    
    // Handle duplicate key error (MongoDB)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    return NextResponse.json({ 
      error: 'Failed to create account. Please try again.' 
    }, { status: 500 })
  }
}



