import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyName } = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Create user via admin API
    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })

    const authText = await authRes.text()
    let authData: Record<string, string>
    try {
      authData = JSON.parse(authText)
    } catch {
      return NextResponse.json({ error: `Auth API error: ${authText.slice(0, 200)}` }, { status: 500 })
    }

    if (!authRes.ok) {
      return NextResponse.json(
        { error: authData.msg ?? authData.error_description ?? authData.message ?? 'Auth-Fehler' },
        { status: 400 }
      )
    }

    const userId = authData.id

    // Insert company via direct PostgREST fetch (no SDK)
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ user_id: userId, name: companyName, email }),
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      return NextResponse.json({ error: errText || 'DB-Fehler' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
