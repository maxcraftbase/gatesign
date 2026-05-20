/**
 * Tests für @/lib/rate-limit
 *
 * Fokus: die synchrone In-Memory-Variante (checkRateLimit), die in der
 * Check-in-Route benutzt wird. Redis-Pfad wird durch Fehlen der Upstash-Env
 * automatisch umgangen, also reicht ein In-Memory-Test.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('checkRateLimit (in-memory)', () => {
  beforeEach(() => {
    // Jeder Test bekommt eigenen Key — die Map ist modul-global
    vi.useRealTimers()
  })

  it('erlaubt Requests unter dem Limit', () => {
    const key = `test-under-${Math.random()}`
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
  })

  it('blockt sobald Limit erreicht ist', () => {
    const key = `test-block-${Math.random()}`
    checkRateLimit(key, 2, 60_000)
    checkRateLimit(key, 2, 60_000)
    expect(checkRateLimit(key, 2, 60_000)).toBe(false)
  })

  it('isoliert verschiedene Keys', () => {
    const k1 = `iso-1-${Math.random()}`
    const k2 = `iso-2-${Math.random()}`
    checkRateLimit(k1, 1, 60_000)
    expect(checkRateLimit(k1, 1, 60_000)).toBe(false)
    // k2 ist noch jungfräulich
    expect(checkRateLimit(k2, 1, 60_000)).toBe(true)
  })

  it('resettet nach Ablauf des Zeitfensters', () => {
    vi.useFakeTimers()
    const key = `reset-${Math.random()}`
    checkRateLimit(key, 1, 1000)
    expect(checkRateLimit(key, 1, 1000)).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(checkRateLimit(key, 1, 1000)).toBe(true)
    vi.useRealTimers()
  })
})
