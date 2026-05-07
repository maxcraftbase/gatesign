import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/brevo'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Company {
  id: string
  name: string
  slug: string
  email: string | null
  subscription_status: string | null
}

interface CheckIn {
  id: string
  created_at: string
  visitor_type: string
  driver_name: string
  company_name: string
  license_plate: string
  trailer_plate: string | null
  phone: string | null
  contact_person: string | null
  language: string
  briefing_accepted: boolean
  briefing_accepted_at: string | null
  has_signature: boolean
  reference_number: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"'
  return str
}

function buildCSV(rows: CheckIn[]): Buffer {
  const headers = ['ID', 'Datum/Zeit', 'Typ', 'Fahrer', 'Firma', 'Kennzeichen', 'Auflieger', 'Telefon', 'Ansprechpartner', 'Sprache', 'Belehrung', 'Belehrung-Zeit', 'Unterschrift', 'Referenz']
  const lines = rows.map(row => [
    escapeCSV(row.id),
    escapeCSV(row.created_at),
    escapeCSV(row.visitor_type),
    escapeCSV(row.driver_name),
    escapeCSV(row.company_name),
    escapeCSV(row.license_plate),
    escapeCSV(row.trailer_plate),
    escapeCSV(row.phone),
    escapeCSV(row.contact_person),
    escapeCSV(row.language),
    escapeCSV(row.briefing_accepted ? 'Ja' : 'Nein'),
    escapeCSV(row.briefing_accepted_at),
    escapeCSV(row.has_signature ? 'Ja' : 'Nein'),
    escapeCSV(row.reference_number),
  ].join(','))
  // BOM so Excel opens it correctly
  return Buffer.from('﻿' + [headers.join(','), ...lines].join('\n'), 'utf-8')
}

function typeLabel(t: string): string {
  if (t === 'truck') return 'LKW'
  if (t === 'visitor') return 'Besucher'
  if (t === 'service') return 'Dienstleister'
  return t
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildHTML(company: Company, rows: CheckIn[], dateLabel: string): string {
  const byType = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.visitor_type] = (acc[r.visitor_type] ?? 0) + 1
    return acc
  }, {})

  const typeRows = Object.entries(byType)
    .map(([type, count]) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${typeLabel(type)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${count}</td>
      </tr>`)
    .join('')

  const entryRows = rows.slice(0, 20).map(r => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;">${formatDate(r.created_at)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;">${typeLabel(r.visitor_type)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;">${escapeHTML(r.driver_name)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;font-family:monospace;">${escapeHTML(r.license_plate)}</td>
    </tr>`).join('')

  const moreNote = rows.length > 20
    ? `<p style="font-size:13px;color:#888;margin:8px 0 0;">… und ${rows.length - 20} weitere Einträge (vollständig im CSV-Anhang)</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>GateSign Tagesbericht</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#18181b;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">GateSign</span>
            <span style="color:#71717a;font-size:13px;margin-left:12px;">Tagesbericht</span>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:28px 32px 0;">
            <h1 style="margin:0;font-size:18px;font-weight:700;color:#18181b;">${escapeHTML(company.name)}</h1>
            <p style="margin:4px 0 0;color:#71717a;font-size:14px;">${dateLabel}</p>
          </td>
        </tr>

        <!-- Summary box -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;overflow:hidden;">
              <tr>
                <td style="padding:10px 12px;background:#f3f4f6;">
                  <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Zusammenfassung</span>
                </td>
                <td style="padding:10px 12px;background:#f3f4f6;text-align:right;">
                  <span style="font-size:12px;font-weight:700;color:#18181b;">${rows.length} Einträge gesamt</span>
                </td>
              </tr>
              ${typeRows}
            </table>
          </td>
        </tr>

        <!-- Entry list -->
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Einträge</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <tr style="background:#f3f4f6;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Zeit</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Typ</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Fahrer</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Kennzeichen</th>
              </tr>
              ${entryRows}
            </table>
            ${moreNote}
          </td>
        </tr>

        <!-- CSV note -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#eff6ff;border-radius:6px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#1d4ed8;">
                📎 <strong>CSV-Datei im Anhang</strong> — alle Einträge vollständig, direkt in Excel öffnen.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              Diese E-Mail wird täglich automatisch von GateSign versendet, wenn Einträge vorliegen.<br>
              Zum Deaktivieren: <a href="mailto:info@gatesign.de" style="color:#9ca3af;">info@gatesign.de</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  // Yesterday: 00:00:00 – 23:59:59 UTC
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const yesterdayUTC = new Date(todayUTC.getTime() - 24 * 60 * 60 * 1000)
  const from = yesterdayUTC.toISOString()
  const to = todayUTC.toISOString()

  const dateLabel = yesterdayUTC.toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Load all companies that have an email and are not inactive
  const companiesRes = await fetch(
    `${supabaseUrl}/rest/v1/companies?select=id,name,slug,email,subscription_status&email=not.is.null`,
    { headers, cache: 'no-store' }
  )
  if (!companiesRes.ok) {
    return NextResponse.json({ error: 'Fehler beim Laden der Unternehmen' }, { status: 500 })
  }
  const companies: Company[] = await companiesRes.json()

  const activeCompanies = companies.filter(c =>
    c.email &&
    c.subscription_status !== 'inactive'
  )

  const results: { company: string; sent: boolean; count: number; error?: string }[] = []

  for (const company of activeCompanies) {
    try {
      // Fetch yesterday's check-ins
      // Supabase REST: multiple filters on same column → duplicate query param
      const url = `${supabaseUrl}/rest/v1/check_ins?company_id=eq.${encodeURIComponent(company.id)}&created_at=gte.${encodeURIComponent(from)}&created_at=lt.${encodeURIComponent(to)}&select=id,created_at,visitor_type,driver_name,company_name,license_plate,trailer_plate,phone,contact_person,language,briefing_accepted,briefing_accepted_at,has_signature,reference_number&order=created_at.asc&limit=10000`

      const checkInsRes = await fetch(url, { headers, cache: 'no-store' })
      if (!checkInsRes.ok) throw new Error(`DB error: ${await checkInsRes.text()}`)

      const checkIns: CheckIn[] = await checkInsRes.json()

      if (checkIns.length === 0) {
        results.push({ company: company.name, sent: false, count: 0 })
        continue
      }

      const csv = buildCSV(checkIns)
      const html = buildHTML(company, checkIns, dateLabel)
      const filename = `gatesign-${company.slug}-${yesterdayUTC.toISOString().slice(0, 10)}.csv`

      await sendEmail({
        to: company.email!,
        subject: `GateSign Tagesbericht – ${company.name} – ${dateLabel}`,
        html,
        attachments: [{ name: filename, content: csv }],
      })

      results.push({ company: company.name, sent: true, count: checkIns.length })
    } catch (err) {
      console.error(`[daily-digest] Fehler bei ${company.name}:`, err)
      results.push({ company: company.name, sent: false, count: 0, error: String(err) })
    }
  }

  const sent = results.filter(r => r.sent).length
  console.log(`[daily-digest] ${dateLabel}: ${sent}/${activeCompanies.length} Mails versendet`)

  return NextResponse.json({ date: dateLabel, results })
}
