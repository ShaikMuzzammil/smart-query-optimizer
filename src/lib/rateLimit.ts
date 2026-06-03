// Simple in-memory rate limiter for Next.js API routes
// For production, use Upstash Redis or similar

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.keyPrefix || 'rl'}:${identifier}`;
  const now  = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      remaining: config.max - 1,
      resetAt: now + config.windowMs,
      retryAfterMs: 0,
    };
  }

  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
    retryAfterMs: 0,
  };
}

export const OPTIMIZER_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_OPTIMIZER_MAX || '10'),
  keyPrefix: 'opt',
};

export const CONTACT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60_000,
  max: parseInt(process.env.RATE_LIMIT_CONTACT_MAX || '3'),
  keyPrefix: 'contact',
};
