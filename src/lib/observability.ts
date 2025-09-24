import { NextRequest } from 'next/server'

export function getOrCreateRequestId(headers?: Headers): string {
  try {
    const h = headers?.get?.('x-request-id') || ''
    return h || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2))
  } catch {
    return String(Date.now()) + Math.random().toString(36).slice(2)
  }
}

export function logRequestStart(routeKey: string, requestId: string) {
  try { console.log(`[start] ${routeKey} rid=${requestId}`) } catch {}
}

export function logRequestEnd(routeKey: string, requestId: string, status: number, durationMs: number) {
  try { console.log(`[end] ${routeKey} rid=${requestId} status=${status} dur=${durationMs}ms`) } catch {}
}

export function now(): number { return Date.now() }
export function durationMs(startedAt: number): number { return Date.now() - startedAt }

export function breadcrumb(category: string, message: string, data?: Record<string, any>) {
  try {
    const S = (globalThis as any).Sentry
    if (S && S.addBreadcrumb) {
      S.addBreadcrumb({ category, message, data, level: 'info' })
    }
  } catch {}
}


