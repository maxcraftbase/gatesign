/**
 * Tests für @/lib/superadmin-auth
 *
 * Deckt ab:
 *   - hashSuperadminToken (Determinismus, Salt-Empfindlichkeit)
 *   - verifySuperadminPassword (env-Check, timing-safe Vergleich)
 *   - isSuperadminAuthorized (Cookie-Logik gegen Hash)
 */

import { describe, it, expect } from 'vitest'
import type { NextRequest } from 'next/server'
import {
  hashSuperadminToken,
  verifySuperadminPassword,
  isSuperadminAuthorized,
} from '@/lib/superadmin-auth'

// Minimaler NextRequest-Mock: isSuperadminAuthorized braucht nur req.cookies.get(name).value
function makeReq(cookieValue: string | undefined): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name === 'gs-superadmin' && cookieValue !== undefined
          ? { value: cookieValue }
          : undefined,
    },
  } as unknown as NextRequest
}

describe('hashSuperadminToken', () => {
  it('ist deterministisch — gleicher Input → gleicher Hash', () => {
    expect(hashSuperadminToken('hallo')).toBe(hashSuperadminToken('hallo'))
  })

  it('produziert unterschiedliche Hashes für unterschiedliche Inputs', () => {
    expect(hashSuperadminToken('a')).not.toBe(hashSuperadminToken('b'))
  })

  it('liefert einen 64-Zeichen Hex-String (SHA256)', () => {
    const hash = hashSuperadminToken('test')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('ist gesalzen — leerer String produziert nicht den ungesalzenen SHA256', () => {
    // Empty-string SHA256 ohne Salt wäre e3b0c44...; mit Salt muss anders sein
    expect(hashSuperadminToken('')).not.toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })
})

describe('verifySuperadminPassword', () => {
  it('akzeptiert das in setup.ts gesetzte Test-Passwort', () => {
    expect(verifySuperadminPassword('test-superadmin-pw')).toBe(true)
  })

  it('lehnt falsches Passwort ab', () => {
    expect(verifySuperadminPassword('wrong')).toBe(false)
  })

  it('lehnt leeres Passwort ab', () => {
    expect(verifySuperadminPassword('')).toBe(false)
  })

  it('lehnt ab wenn env-Variable nicht gesetzt ist', () => {
    const original = process.env.SUPERADMIN_PASSWORD
    delete process.env.SUPERADMIN_PASSWORD
    try {
      expect(verifySuperadminPassword('anything')).toBe(false)
    } finally {
      process.env.SUPERADMIN_PASSWORD = original
    }
  })

  it('trimmt Whitespace (Railway-Bug: Raw Editor hängt trailing \\n an)', () => {
    expect(verifySuperadminPassword('  test-superadmin-pw  ')).toBe(true)
  })
})

describe('isSuperadminAuthorized', () => {
  it('akzeptiert Cookie mit Hash des korrekten Passworts', () => {
    const token = hashSuperadminToken('test-superadmin-pw')
    expect(isSuperadminAuthorized(makeReq(token))).toBe(true)
  })

  it('lehnt Request ohne Cookie ab', () => {
    expect(isSuperadminAuthorized(makeReq(undefined))).toBe(false)
  })

  it('lehnt Cookie mit falschem Hash ab', () => {
    expect(isSuperadminAuthorized(makeReq('definitely-not-the-hash'))).toBe(
      false,
    )
  })

  it('lehnt Cookie mit rohem (ungehashtem) Passwort ab', () => {
    // Wichtig: nur der Hash darf akzeptiert werden, nie das Plain-Passwort
    expect(isSuperadminAuthorized(makeReq('test-superadmin-pw'))).toBe(false)
  })
})
