import { createHash, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export function hashSuperadminToken(pw: string): string {
  return createHash('sha256').update(pw + 'gs-salt-2025').digest('hex')
}

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
