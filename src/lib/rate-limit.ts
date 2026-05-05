interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, rec] of store) {
    if (now > rec.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)

export function checkRateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000,
): boolean {
  const now = Date.now()
  const rec = store.get(key)

  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (rec.count >= maxAttempts) return false

  rec.count++
  return true
}
