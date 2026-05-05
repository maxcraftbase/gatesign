import { type NextRequest, NextResponse } from 'next/server'

function getAccessToken(request: NextRequest): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`

  let raw = request.cookies.get(cookieName)?.value ?? null
  if (!raw) {
    let i = 0, chunks = ''
    while (true) {
      const chunk = request.cookies.get(`${cookieName}.${i}`)?.value
      if (!chunk) break
      chunks += chunk
      i++
    }
    if (chunks) raw = chunks
  }
  if (!raw) return null

  try {
    const json = raw.startsWith('base64-')
      ? Buffer.from(raw.slice(7), 'base64url').toString('utf-8')
      : raw
    return JSON.parse(json).access_token ?? null
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'))
    return !payload.exp || Date.now() / 1000 > payload.exp
  } catch {
    return true
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Site-wide password protection
  const sitePassword = process.env.SITE_PASSWORD
  if (sitePassword && pathname !== '/password') {
    const auth = request.cookies.get('site_auth')?.value
    if (auth !== sitePassword) {
      const url = request.nextUrl.clone()
      url.pathname = '/password'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // Match /[slug]/admin/* but not /[slug]/admin/login
  const adminMatch = pathname.match(/^\/([^/]+)\/admin(\/.*)?$/)
  if (adminMatch) {
    const rest = adminMatch[2] ?? ''
    if (rest === '/login' || rest.startsWith('/login/')) return NextResponse.next()

    const token = getAccessToken(request)
    if (!token || isTokenExpired(token)) {
      const slug = adminMatch[1]
      return NextResponse.redirect(new URL(`/${slug}/admin/login`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
