/**
 * Rate limiting — dual-mode:
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set → Upstash Redis (multi-instance safe)
 * - Otherwise → in-memory Map (single-instance, works on Railway with one dyno)
 */

// ─── In-memory fallback ──────────────────────────────────────────────────────

interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

setInterval(() => {
  const now = Date.now()
  for (const [key, rec] of store) {
    if (now > rec.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)

function checkInMemory(key: string, maxAttempts: number, windowMs: number): boolean {
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

// ─── Upstash Redis ───────────────────────────────────────────────────────────

let redisClient: import('@upstash/redis').Redis | null = null

function getRedis(): import('@upstash/redis').Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
    redisClient = new Redis({ url, token })
    return redisClient
  } catch {
    return null
  }
}

async function checkRedis(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return checkInMemory(key, maxAttempts, windowMs)
  try {
    const windowSec = Math.ceil(windowMs / 1000)
    const current = await redis.incr(key)
    if (current === 1) await redis.expire(key, windowSec)
    return current <= maxAttempts
  } catch {
    // Redis unavailable → graceful fallback to in-memory
    return checkInMemory(key, maxAttempts, windowMs)
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Sync check (in-memory). For middleware or non-async contexts. */
export function checkRateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000,
): boolean {
  return checkInMemory(key, maxAttempts, windowMs)
}

/** Async check — uses Redis when available, in-memory otherwise. */
export async function checkRateLimitAsync(
  key: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000,
): Promise<boolean> {
  return checkRedis(key, maxAttempts, windowMs)
}

/** Async admin rate limit keyed by company_id (not IP). */
export async function checkAdminRateLimit(
  companyId: string,
  action: string,
  maxAttempts = 60,
  windowMs = 60 * 1000,
): Promise<boolean> {
  return checkRateLimitAsync(`admin:${companyId}:${action}`, maxAttempts, windowMs)
}
