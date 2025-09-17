import crypto from 'crypto'

export function getOrCreateRequestId(headers: Headers): string {
  const existing = headers.get('x-request-id') || headers.get('X-Request-ID')
  return existing || crypto.randomUUID()
}

export function now(): number {
  return Date.now()
}

export function durationMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt)
}

export function logRequestStart(routeKey: string, requestId: string, meta?: Record<string, any>) {
  try { console.info(JSON.stringify({ level: 'info', type: 'request_start', routeKey, requestId, meta: meta || {}, at: new Date().toISOString() })) } catch {}
}

export function logRequestEnd(routeKey: string, requestId: string, status: number, elapsedMs: number, meta?: Record<string, any>) {
  try { console.info(JSON.stringify({ level: 'info', type: 'request_end', routeKey, requestId, status, elapsedMs, meta: meta || {}, at: new Date().toISOString() })) } catch {}
}

export function logAIUsage(label: string, requestId: string | undefined, response: any) {
  try {
    const payload: any = {
      level: 'info',
      type: 'ai_usage',
      label,
      requestId: requestId || null,
      at: new Date().toISOString(),
    }
    if (response?.id) payload.responseId = response.id
    if (response?.model) payload.model = response.model
    if (response?.usage) payload.usage = response.usage
    console.info(JSON.stringify(payload))
  } catch {}
}


