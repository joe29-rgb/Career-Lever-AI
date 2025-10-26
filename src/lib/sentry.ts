import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export function initSentry() {
  if (!dsn || Sentry.getCurrentHub().getClient()) return
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'production',
    maxBreadcrumbs: 50,
    integrations: [Sentry.browserTracingIntegration?.()].filter(Boolean) as any
  })
}

export function addRequestBreadcrumb(requestId?: string) {
  if (!requestId) return
  Sentry.addBreadcrumb({ category: 'request', level: 'info', message: `requestId=${requestId}` })
}


