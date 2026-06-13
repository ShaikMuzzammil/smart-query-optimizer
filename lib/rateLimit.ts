interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/**
 * Best-effort sliding-window rate limiter. State is held in memory per
 * serverless instance, so limits are approximate under high concurrency /
 * multiple instances - sufficient to prevent accidental hammering of the
 * AI-backed optimizer endpoint without requiring Redis.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0];
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  return { allowed: true, retryAfterSec: 0 };
}
