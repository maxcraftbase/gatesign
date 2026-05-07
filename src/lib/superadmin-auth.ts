import { createHash, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export function hashSuperadminToken(pw: string): string {
  return createHash('sha256').update(pw + 'gs-salt-2025').digest('hex')
}

/** Verifies raw password against SUPERADMIN_PASSWORD env var (timing-safe). */
export function verifySuperadminPassword(password: string): boolean {
  const expected = process.env.SUPERADMIN_PASSWORD?.trim()
  if (!expected || !password) return false
  try {
    const a = Buffer.from(password.trim())
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Verifies the gs-superadmin cookie against SUPERADMIN_PASSWORD env var. */
export function isSuperadminAuthorized(req: NextRequest): boolean {
  const expected = process.env.SUPERADMIN_PASSWORD?.trim()
  if (!expected) return false
  const token = req.cookies.get('gs-superadmin')?.value
  if (!token) return false
  const expectedToken = hashSuperadminToken(expected)
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
  } catch {
    return false
  }
}
