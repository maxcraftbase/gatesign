import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashPassword(pw: string) {
  return createHash('sha256').update(pw + 'gs-salt-2025').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const expected = process.env.SUPERADMIN_PASSWORD
    if (!expected) return NextResponse.json({ error: 'Not configured.' }, { status: 500 })
    if (password !== expected) {
      return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 })
    }
    const token = hashPassword(expected)
    const res = NextResponse.json({ success: true })
    res.cookies.set('gs-superadmin', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
