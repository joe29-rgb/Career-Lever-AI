type Counter = { count: number; resetAt: number };

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000); // 1 hour
const MAX = Number(process.env.RATE_LIMIT_MAX || 20);

const store: Map<string, Counter> = new Map();

export function isRateLimited(userId: string | undefined, routeKey: string) {
  if (!userId) return { limited: true, remaining: 0, reset: Date.now() + WINDOW_MS };
  const key = `${userId}:${routeKey}`;
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count += 1;
  store.set(key, entry);
  const limited = entry.count > MAX;
  const remaining = Math.max(0, MAX - entry.count);
  return { limited, remaining, reset: entry.resetAt };
}


