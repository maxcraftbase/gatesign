import { cookies } from 'next/headers'
import { getCompanyByOwner } from './company'

export async function getAdminContext(): Promise<{
  accessToken: string
  company: { id: string; name: string; slug: string }
} | null> {
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
