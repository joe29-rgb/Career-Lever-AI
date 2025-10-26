import Redis from 'ioredis'

type Counter = { count: number; resetAt: number };

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000); // 1 hour

// In-memory fallback store
const store: Map<string, Counter> = new Map();

// Redis client (optional - for distributed rate limiting)
let redisClient: Redis | null = null;
let redisAvailable = false;

// Initialize Redis if REDIS_URL is configured
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });
    
    redisClient.on('ready', () => {
      redisAvailable = true;
      console.log('[RATE_LIMIT] Redis connected - using distributed rate limiting');
    });
    
    redisClient.on('error', (err) => {
      console.warn('[RATE_LIMIT] Redis error, falling back to in-memory:', err.message);
      redisAvailable = false;
    });
    
    // Connect to Redis
    redisClient.connect().catch(() => {
      console.warn('[RATE_LIMIT] Redis connection failed, using in-memory fallback');
      redisAvailable = false;
    });
  } catch (error) {
    console.warn('[RATE_LIMIT] Redis initialization failed, using in-memory fallback');
    redisAvailable = false;
  }
} else {
  console.log('[RATE_LIMIT] REDIS_URL not configured, using in-memory rate limiting');
}

export async function isRateLimited(userId: string | undefined, routeKey: string): Promise<boolean> {
  // Production-ready rate limiting with increased limits for file uploads
  if (!userId) return false;
  
  const key = `ratelimit:${userId}:${routeKey}`;
  
  // Route-specific limits
  const limits: Record<string, number> = {
    'file-upload': 5000,              // 5000 per hour for file uploads
    'resume:upload': 5000,            // 5000 per hour for resume uploads  
    'applications:attach': 5000,      // 5000 per hour for attachments
    'ai-requests': 200,               // 200 per hour for AI
    'cover-letter': 1000,             // 1000 per hour for cover letter generation
    'outreach-send': 5,               // 5 per hour for email sending (strict!)
    'api-general': 2000,              // 2000 per hour general API
    'default': 1000                   // 1000 per hour default
  }
  
  const limit = limits[routeKey] || limits['default'];
  
  // Use Redis if available, otherwise fall back to in-memory
  if (redisAvailable && redisClient) {
    return await isRateLimitedRedis(key, limit);
  } else {
    return isRateLimitedMemory(key, limit);
  }
}

/**
 * Redis-based rate limiting (distributed)
 */
async function isRateLimitedRedis(key: string, limit: number): Promise<boolean> {
  if (!redisClient) return false;
  
  try {
    const ttl = Math.floor(WINDOW_MS / 1000); // Convert to seconds
    
    // Increment counter
    const count = await redisClient.incr(key);
    
    // Set expiry on first request
    if (count === 1) {
      await redisClient.expire(key, ttl);
    }
    
    return count > limit;
  } catch (error) {
    console.error('[RATE_LIMIT] Redis error:', error);
    // Fall back to in-memory on error
    return isRateLimitedMemory(key, limit);
  }
}

/**
 * In-memory rate limiting (fallback)
 */
function isRateLimitedMemory(key: string, limit: number): boolean {
  const now = Date.now();
  let entry = store.get(key);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  
  entry.count += 1;
  store.set(key, entry);
  
  return entry.count > limit;
}


