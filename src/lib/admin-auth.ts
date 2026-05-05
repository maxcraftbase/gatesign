import { cookies } from 'next/headers'
import { getCompanyByOwner } from './company'

async function refreshSession(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getAdminContext(): Promise<{
  accessToken: string
  company: { id: string; name: string; slug: string }
} | null> {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`

  const authCookie = allCookies.find(c => c.name === cookieName)
    ?? allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (!authCookie) return null

  let session: Record<string, unknown> | null = null
  try {
    let val = authCookie.value
    if (!val) {
      let chunks = ''
      for (let i = 0; ; i++) {
        const chunk = allCookies.find(c => c.name === `${cookieName}.${i}`)?.value
        if (!chunk) break
        chunks += chunk
      }
      val = chunks
    }
    if (val.startsWith('base64-')) val = Buffer.from(val.slice(7), 'base64url').toString('utf-8')
    session = JSON.parse(val)
  } catch {
    return null
  }

  if (!session) return null

  let accessToken = session.access_token as string | null
  if (!accessToken) return null

  // Check if token is expired and try to refresh
  const isExpired = (() => {
    try {
      const payload = JSON.parse(Buffer.from(accessToken!.split('.')[1], 'base64url').toString('utf-8'))
      return !payload.exp || Date.now() / 1000 > payload.exp
    } catch {
      return true
    }
  })()

  if (isExpired) {
    const refreshToken = session.refresh_token as string | null
    if (!refreshToken) return null

    const newSession = await refreshSession(refreshToken)
    if (!newSession) return null

    accessToken = newSession.access_token

    // Update cookie with refreshed session
    const updatedSession = { ...session, ...newSession }
    const encoded = 'base64-' + Buffer.from(JSON.stringify(updatedSession)).toString('base64url')
    const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 400 * 24 * 60 * 60 }
    const CHUNK_SIZE = 3180
    if (encoded.length > CHUNK_SIZE) {
      for (let i = 0; i * CHUNK_SIZE < encoded.length; i++) {
        cookieStore.set(`${cookieName}.${i}`, encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), cookieOpts)
      }
    } else {
      cookieStore.set(cookieName, encoded, cookieOpts)
    }
  }

  const company = await getCompanyByOwner(accessToken)
  if (!company) return null

  return { accessToken, company }
}
