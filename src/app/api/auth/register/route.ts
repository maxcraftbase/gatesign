import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyName } = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Direkte REST API — funktioniert mit allen Supabase Key-Formaten
    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    })

    const authData = await authRes.json()

    if (!authRes.ok) {
      return NextResponse.json(
        { error: authData.msg ?? authData.error_description ?? authData.message ?? 'Auth-Fehler' },
        { status: 400 }
      )
    }

    const userId = authData.id

    // Company anlegen via supabase-js (DB, kein Auth)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: companyError } = await supabase.from('companies').insert({
      user_id: userId,
      name: companyName,
      email,
    })

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
