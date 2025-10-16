/**
 * Shared API Handler Utility
 * Provides consistent error handling, validation, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z, ZodSchema } from 'zod'

export interface ApiHandlerOptions<T> {
  requireAuth?: boolean
  validateSchema?: ZodSchema<T>
  handler: (req: NextRequest, body: T, userId?: string) => Promise<any>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Unified API handler with built-in auth, validation, and error handling
 */
export async function apiHandler<T = any>(
  request: NextRequest,
  options: ApiHandlerOptions<T>
): Promise<NextResponse> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    // 1. Authentication check
    let userId: string | undefined
    if (options.requireAuth !== false) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { 
            status: 401,
            headers: { 'x-request-id': requestId }
          }
        )
      }
      userId = session.user.id
    }

    // 2. Parse request body
    let body: T
    try {
      const rawBody = await request.json()
      body = rawBody as T
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: { 'x-request-id': requestId }
        }
      )
    }

    // 3. Validate with Zod schema if provided
    if (options.validateSchema) {
      try {
        body = options.validateSchema.parse(body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: error.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
              }))
            },
            { 
              status: 400,
              headers: { 'x-request-id': requestId }
            }
          )
        }
        throw error
      }
    }

    // 4. Execute handler
    const result = await options.handler(request, body, userId)

    // 5. Format successful response
    const duration = Date.now() - startTime
    console.log(`[API] ${request.method} ${request.url} - ${duration}ms - ${requestId}`)

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      {
        headers: {
          'x-request-id': requestId,
          'x-response-time': `${duration}ms`
        }
      }
    )

  } catch (error) {
    // 6. Handle errors
    const duration = Date.now() - startTime
    console.error(`[API] Error ${request.method} ${request.url} - ${duration}ms - ${requestId}:`, error)

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const statusCode = getErrorStatusCode(error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      {
        status: statusCode,
        headers: {
          'x-request-id': requestId,
          'x-response-time': `${duration}ms`
        }
      }
    )
  }
}

/**
 * Determine HTTP status code from error type
 */
function getErrorStatusCode(error: unknown): number {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 401
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return 403
    }
    if (message.includes('not found')) {
      return 404
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 400
    }
    if (message.includes('rate limit')) {
      return 429
    }
  }
  
  return 500
}

/**
 * Simple API handler for GET requests (no body validation needed)
 */
export async function apiHandlerGet(
  request: NextRequest,
  handler: (req: NextRequest, userId?: string) => Promise<any>,
  requireAuth: boolean = true
): Promise<NextResponse> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    // Authentication check
    let userId: string | undefined
    if (requireAuth) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { 
            status: 401,
            headers: { 'x-request-id': requestId }
          }
        )
      }
      userId = session.user.id
    }

    // Execute handler
    const result = await handler(request, userId)

    // Format response
    const duration = Date.now() - startTime
    console.log(`[API] GET ${request.url} - ${duration}ms - ${requestId}`)

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      {
        headers: {
          'x-request-id': requestId,
          'x-response-time': `${duration}ms`
        }
      }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] Error GET ${request.url} - ${duration}ms - ${requestId}:`, error)

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const statusCode = getErrorStatusCode(error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      {
        status: statusCode,
        headers: {
          'x-request-id': requestId,
          'x-response-time': `${duration}ms`
        }
      }
    )
  }
}
