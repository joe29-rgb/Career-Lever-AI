type Counter = { count: number; resetAt: number };

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000); // 1 hour
const MAX = Number(process.env.RATE_LIMIT_MAX || 20);

const store: Map<string, Counter> = new Map();

export async function isRateLimited(userId: string | undefined, routeKey: string) {
  // EMERGENCY FIX: Drastically increase limits for development
  if (!userId) return false;
  
  const key = `${userId}:${routeKey}`;
  const now = Date.now();
  let entry = store.get(key);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  
  entry.count += 1;
  store.set(key, entry);
  
  // INCREASED: Allow 1000 requests per window instead of 10
  const limited = entry.count > 1000;
  
  return limited;
}


