import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'
import { hashSuperadminToken } from '@/lib/superadmin-auth'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`superadmin-login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Zu viele Versuche. Bitte 15 Minuten warten.' }, { status: 429 })
    }

    const { password } = await req.json()
    const expected = process.env.SUPERADMIN_PASSWORD?.trim()
    if (!expected) return NextResponse.json({ error: 'Serverkonfiguration fehlerhaft.' }, { status: 500 })

    const valid = (() => {
      if (!password) return false
      try {
        const a = Buffer.from(password.trim())
        const b = Buffer.from(expected)
        return a.length === b.length && timingSafeEqual(a, b)
      } catch { return false }
    })()

    if (!valid) {
      console.warn(`[superadmin] Fehlgeschlagener Login-Versuch von ${ip}`)
      return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 })
    }

    const token = hashSuperadminToken(expected)
    const res = NextResponse.json({ success: true })
    res.cookies.set('gs-superadmin', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60,
    })
    console.log(`[superadmin] Erfolgreicher Login von ${ip}`)
    return res
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
