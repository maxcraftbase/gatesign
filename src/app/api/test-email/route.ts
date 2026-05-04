import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'BREVO_API_KEY missing' }, { status: 500 })
  }

  const to = req.nextUrl.searchParams.get('to') ?? 'ruether2001@gmx.de'
  const from = process.env.DIGEST_FROM_EMAIL ?? 'ruether2001@gmx.de'

  const body = {
    sender: { email: from, name: 'GateSign' },
    to: [{ email: to }],
    subject: 'GateSign Test-Mail',
    htmlContent: '<p>Test erfolgreich!</p>',
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  return NextResponse.json({ status: res.status, body: text, from, keyPrefix: apiKey.slice(0, 12) })
}
