import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function serviceHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function visitorLabel(type: string) {
  return type === 'truck' ? 'LKW-Fahrer' : type === 'visitor' ? 'Besucher' : 'Dienstleister'
}

function buildHtml(companyName: string, entries: Record<string, unknown>[], since: string) {
  const rows = entries.map(e => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;white-space:nowrap">${formatDate(e.created_at as string)}</td>
      <td style="padding:10px 12px">${e.driver_name ?? '—'}</td>
      <td style="padding:10px 12px">${e.company_name ?? '—'}</td>
      <td style="padding:10px 12px">${e.license_plate ?? '—'}</td>
      <td style="padding:10px 12px">${e.trailer_plate ?? '—'}</td>
      <td style="padding:10px 12px">${visitorLabel(e.visitor_type as string)}</td>
      <td style="padding:10px 12px">${e.contact_person ?? '—'}</td>
      <td style="padding:10px 12px">${e.phone ?? '—'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
  <div style="max-width:900px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#0f172a;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">GateSign</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${companyName} · Eintrags-Digest</p>
    </div>
    <div style="padding:24px 32px">
      <p style="margin:0 0 20px;color:#475569;font-size:14px">
        Neue Einträge seit <strong>${formatDate(since)}</strong> — insgesamt <strong>${entries.length}</strong>
      </p>
      ${entries.length === 0
        ? '<p style="color:#94a3b8;font-size:14px">Keine neuen Einträge im Berichtszeitraum.</p>'
        : `<div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f8fafc;text-align:left">
                <th style="padding:10px 12px;font-weight:600;color:#64748b;white-space:nowrap">Datum/Zeit</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Name</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Firma</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Kennzeichen</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Anhänger</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Typ</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Ansprechpartner</th>
                <th style="padding:10px 12px;font-weight:600;color:#64748b">Telefon</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      }
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:12px">
        Diese E-Mail wurde automatisch von GateSign generiert. Die vollständigen Daten bleiben sicher in Ihrer Datenbank gespeichert.
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  // Validate cron secret
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  const fromAddress = process.env.DIGEST_FROM_EMAIL ?? 'digest@gatesign.app'
  const results: { company: string; sent: boolean; count: number; error?: string }[] = []

  // Fetch all companies that have an email
  const companiesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?email=not.is.null&select=id,name,email,last_digest_sent_at`,
    { headers: serviceHeaders(), cache: 'no-store' }
  )

  if (!companiesRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }

  const companies: { id: string; name: string; email: string; last_digest_sent_at: string | null }[] =
    await companiesRes.json()

  const now = new Date().toISOString()

  for (const company of companies) {
    const since = company.last_digest_sent_at
      ? company.last_digest_sent_at
      : new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()

    const entriesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/check_ins?company_id=eq.${company.id}&created_at=gt.${encodeURIComponent(since)}` +
        `&select=created_at,driver_name,company_name,license_plate,trailer_plate,visitor_type,contact_person,phone&order=created_at.asc`,
      { headers: serviceHeaders(), cache: 'no-store' }
    )

    if (!entriesRes.ok) {
      results.push({ company: company.name, sent: false, count: 0, error: 'DB fetch failed' })
      continue
    }

    const entries = await entriesRes.json()

    if (entries.length === 0) {
      // Update timestamp anyway so next cycle uses correct window
      await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${company.id}`, {
        method: 'PATCH',
        headers: { ...serviceHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({ last_digest_sent_at: now }),
      })
      results.push({ company: company.name, sent: false, count: 0 })
      continue
    }

    try {
      const { error: sendError } = await resend.emails.send({
        from: fromAddress,
        to: company.email,
        subject: `GateSign: ${entries.length} neue Einträge — ${new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`,
        html: buildHtml(company.name, entries, since),
      })
      if (sendError) throw new Error(sendError.message)

      await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${company.id}`, {
        method: 'PATCH',
        headers: { ...serviceHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({ last_digest_sent_at: now }),
      })

      results.push({ company: company.name, sent: true, count: entries.length })
    } catch (err) {
      results.push({ company: company.name, sent: false, count: entries.length, error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
