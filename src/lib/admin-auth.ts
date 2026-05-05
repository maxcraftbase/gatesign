import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { getCompanyByOwner } from './company'

async function getImpersonatedContext(): Promise<{
  accessToken: string
  company: { id: string; name: string; slug: string }
} | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('gs-impersonate')?.value
  if (!raw) return null

  const parts = raw.split(':')
  if (parts.length !== 3) return null
  const [companyId, timestampStr, token] = parts
  const timestamp = parseInt(timestampStr)
  if (isNaN(timestamp) || Date.now() / 1000 - timestamp > 3600) return null

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) return null
  const expected = createHmac('sha256', secret).update(`${companyId}:${timestamp}`).digest('hex')
  if (token !== expected) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=id,name,slug&limit=1`,
    { headers: { apikey: secret, Authorization: `Bearer ${secret}` }, cache: 'no-store' }
  )
  const companies = await res.json() as { id: string; name: string; slug: string }[]
  if (!companies?.[0]) return null
  return { accessToken: secret, company: companies[0] }
}

export async function getAdminContext(): Promise<{
  accessToken: string
  company: { id: string; name: string; slug: string }
} | null> {
  const impersonated = await getImpersonatedContext()
  if (impersonated) return impersonated

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (!authCookie) return null

  let accessToken: string | null = null
  try {
    let val = authCookie.value
    // Handle chunked cookies
    if (!val) {
      let chunks = ''
      for (let i = 0; ; i++) {
        const chunk = allCookies.find(c => c.name === `${authCookie.name}.${i}`)?.value
        if (!chunk) break
        chunks += chunk
      }
      val = chunks
    }
    if (val.startsWith('base64-')) val = Buffer.from(val.slice(7), 'base64url').toString('utf-8')
    const session = JSON.parse(val)
    accessToken = session.access_token ?? null
  } catch {
    return null
  }

  if (!accessToken) return null

  // Check token not expired
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf-8'))
    if (!payload.exp || Date.now() / 1000 > payload.exp) return null
  } catch {
    return null
  }

  const company = await getCompanyByOwner(accessToken)
  if (!company) return null

  return { accessToken, company }
}
