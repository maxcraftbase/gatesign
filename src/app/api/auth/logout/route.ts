import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Clear all sb-* auth cookies
  const response = NextResponse.json({ success: true })
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
      })
    }
  }

  return response
}
