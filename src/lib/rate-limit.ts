type Counter = { count: number; resetAt: number };

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000); // 1 hour
const MAX = Number(process.env.RATE_LIMIT_MAX || 20);

const store: Map<string, Counter> = new Map();

export async function isRateLimited(userId: string | undefined, routeKey: string) {
  // Production-ready rate limiting with increased limits for file uploads
  if (!userId) return false;
  
  const key = `${userId}:${routeKey}`;
  const now = Date.now();
  let entry = store.get(key);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  
  entry.count += 1;
  store.set(key, entry);
  
  // Route-specific limits
  const limits: Record<string, number> = {
    'file-upload': 5000,              // 5000 per hour for file uploads
    'resume:upload': 5000,            // 5000 per hour for resume uploads  
    'applications:attach': 5000,      // 5000 per hour for attachments
    'ai-requests': 200,               // 200 per hour for AI
    'api-general': 2000,              // 2000 per hour general API
    'default': 1000                   // 1000 per hour default
  }
  
  const limit = limits[routeKey] || limits['default']
  const limited = entry.count > limit;
  
  return limited;
}


