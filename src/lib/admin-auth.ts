import { cookies } from 'next/headers'

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

export interface AdminContext {
  accessToken: string
  userId: string
  email: string
  name: string | null
  role: 'admin' | 'member'
  company: { id: string; name: string; slug: string }
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
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

  // Decode JWT to get user ID and check expiry
  let userId: string
  const isExpired = (() => {
    try {
      const payload = JSON.parse(Buffer.from(accessToken!.split('.')[1], 'base64url').toString('utf-8'))
      userId = payload.sub as string
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
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf-8'))
      userId = payload.sub as string
    } catch {
      return null
    }
    // Update cookie — only possible in Route Handlers/Server Actions, not Server Components
    try {
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
    } catch {
      // Cookie write not allowed in Server Component context — session refresh still valid for this request
    }
  }

  // Look up company_users by user_id
  const cuRes = await fetch(
    `${supabaseUrl}/rest/v1/company_users?user_id=eq.${userId!}&status=eq.active&select=company_id,role,email,name`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!cuRes.ok) return null
  const cuRows: { company_id: string; role: string; email: string; name: string | null }[] = await cuRes.json()

  // Fallback: look up by owner_id for legacy accounts not yet in company_users
  let companyId: string
  let role: 'admin' | 'member'
  let email: string

  let userName: string | null = null
  if (cuRows.length === 1) {
    companyId = cuRows[0].company_id
    role = cuRows[0].role as 'admin' | 'member'
    email = cuRows[0].email
    userName = cuRows[0].name ?? null
  } else if (cuRows.length > 1) {
    // Multiple active company memberships for one user — data inconsistency, reject
    return null
  } else {
    // Legacy fallback: check companies.owner_id
    const legacyRes = await fetch(
      `${supabaseUrl}/rest/v1/companies?owner_id=eq.${userId!}&select=id,name,slug`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    const legacyRows: { id: string; name: string; slug: string }[] = await legacyRes.json()
    if (!legacyRows.length) return null
    companyId = legacyRows[0].id
    role = 'admin'
    // Get email from auth
    const authUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId!}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store'
    })
    const authUser = await authUserRes.json() as { email?: string }
    email = authUser.email ?? ''
    // Migrate to company_users
    await fetch(`${supabaseUrl}/rest/v1/company_users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ company_id: companyId, user_id: userId!, email, role: 'admin', status: 'active' }),
    })
  }

  // Get company details
  const companyRes = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=id,name,slug`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const companies: { id: string; name: string; slug: string }[] = await companyRes.json()
  if (!companies.length) return null

  return { accessToken, userId: userId!, email, name: userName, role, company: companies[0] }
}
