import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'

function hashPassword(pw: string) {
  return createHash('sha256').update(pw + 'gs-salt-2025').digest('hex')
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.SUPERADMIN_PASSWORD?.trim()
  if (!expected) return false
  return req.cookies.get('gs-superadmin')?.value === hashPassword(expected)
}

function generateImpersonateToken(companyId: string, timestamp: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createHmac('sha256', secret).update(`${companyId}:${timestamp}`).digest('hex')
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { companySlug } = await req.json() as { companySlug: string }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?slug=eq.${encodeURIComponent(companySlug)}&select=id,slug&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  )
  const companies = await res.json() as { id: string; slug: string }[]
  if (!companies?.[0]) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const company = companies[0]
  const timestamp = Math.floor(Date.now() / 1000)
  const token = generateImpersonateToken(company.id, timestamp)
  const cookieValue = `${company.id}:${timestamp}:${token}`

  const response = NextResponse.json({ success: true, adminUrl: `/${company.slug}/admin` })
  response.cookies.set('gs-impersonate', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  })
  return response
}
