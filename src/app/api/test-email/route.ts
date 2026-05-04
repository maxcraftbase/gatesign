import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/brevo'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const to = req.nextUrl.searchParams.get('to') ?? 'ruether2001@gmx.de'
  const senderEmail = process.env.DIGEST_FROM_EMAIL ?? 'gatesign@craft-base.de'

  try {
    await sendEmail({
      to,
      subject: 'GateSign Test-Mail',
      html: '<p>Test erfolgreich!</p>',
    })
    return NextResponse.json({ ok: true, to, senderEmail })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), senderEmail }, { status: 500 })
  }
}
