const store = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfter: 0 };
  }
  if (entry.count >= max) return { ok: false, remaining: 0, retryAfter: entry.resetAt - now };
  entry.count++;
  return { ok: true, remaining: max - entry.count, retryAfter: 0 };
}
